import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {
  static async getUser(request) {
    const token = request.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (userId) {
      const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });
      return user || null;
    }
    return null;
  }

  static async postUpload(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId, isPublic = false, data } = request.body;
    if (!name) return response.status(400).json({ error: 'Missing name' });
    if (!type) return response.status(400).json({ error: 'Missing type' });
    if (type !== 'folder' && !data) return response.status(400).json({ error: 'Missing data' });

    const files = dbClient.db.collection('files');
    if (parentId) {
      const parent = await files.findOne({ _id: new ObjectID(parentId), userId: user._id });
      if (!parent || parent.type !== 'folder') return response.status(400).json({ error: 'Invalid parent' });
    }

    if (type === 'folder') {
      const result = await files.insertOne({ userId: user._id, name, type, parentId: parentId || 0, isPublic });
      return response.status(201).json({ id: result.insertedId, userId: user._id, name, type, isPublic, parentId: parentId || 0 });
    } else {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');
      await fs.mkdir(filePath, { recursive: true });
      await fs.writeFile(fileName, buff);

      const result = await files.insertOne({ userId: user._id, name, type, isPublic, parentId: parentId || 0, localPath: fileName });
      response.status(201).json({ id: result.insertedId, userId: user._id, name, type, isPublic, parentId: parentId || 0 });

      if (type === 'image') fileQueue.add({ userId: user._id, fileId: result.insertedId });
    }
  }

  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(request.params.id), userId: user._id });
    if (!file) return response.status(404).json({ error: 'Not found' });

    response.status(200).json(file);
  }

  static async getIndex(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const { parentId, page = 0 } = request.query;
    const query = { userId: user._id, ...(parentId && { parentId: new ObjectID(parentId) }) };
    const files = await dbClient.db.collection('files').aggregate([
      { $match: query },
      { $sort: { _id: -1 } },
      { $facet: { metadata: [{ $count: 'total' }, { $addFields: { page: parseInt(page, 10) } }], data: [{ $skip: 20 * parseInt(page, 10) }, { $limit: 20 }] } },
    ]).toArray();

    const result = files[0].data.map(file => ({ ...file, id: file._id, _id: undefined, localPath: undefined }));
    response.status(200).json(result);
  }

  static async putPublish(request, response) {
    return FilesController.updateFilePublishStatus(request, response, true);
  }

  static async putUnpublish(request, response) {
    return FilesController.updateFilePublishStatus(request, response, false);
  }

  static async updateFilePublishStatus(request, response, isPublic) {
    const user = await FilesController.getUser(request);
    if (!user) return response.status(401).json({ error: 'Unauthorized' });

    const result = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectID(request.params.id), userId: user._id },
      { $set: { isPublic } },
      { returnOriginal: false }
    );

    if (!result.lastErrorObject.updatedExisting) return response.status(404).json({ error: 'Not found' });
    response.status(200).json(result.value);
  }

  static async getFile(request, response) {
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(request.params.id) });
    if (!file) return response.status(404).json({ error: 'Not found' });

    if (!file.isPublic) {
      const user = await FilesController.getUser(request);
      if (!user || file.userId.toString() !== user._id.toString()) return response.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') return response.status(400).json({ error: "A folder doesn't have content" });

    const fileName = request.param('size') ? `${file.localPath}_${request.param('size')}` : file.localPath;
    try {
      const data = await fs.readFile(fileName);
      const contentType = mime.contentType(file.name);
      response.header('Content-Type', contentType).status(200).send(data);
    } catch {
      response.status(404).json({ error: 'Not found' });
    }
  }
}

module.exports = FilesController;
