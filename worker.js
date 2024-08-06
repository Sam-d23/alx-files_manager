import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

async function createThumbnails(localPath) {
  const sizes = [500, 250, 100];
  return await Promise.all(sizes.map(async (width) => {
    const thumbnail = await imageThumbnail(localPath, { width });
    const imageName = `${localPath}_${width}`;
    await fs.writeFile(imageName, thumbnail);
  }));
}

fileQueue.process(async (job, done) => {
  try {
    console.log('Processing...');
    const { fileId, userId } = job.data;
    if (!fileId || !userId) throw new Error('Missing fileId or userId');

    console.log(fileId, userId);
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId) });
    if (!file) throw new Error('File not found');

    await createThumbnails(file.localPath);
    done();
  } catch (error) {
    console.error(error);
    done(error);
  }
});

userQueue.process(async (job, done) => {
  try {
    const { userId } = job.data;
    if (!userId) throw new Error('Missing userId');

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });
    if (user) {
      console.log(`Welcome ${user.email}!`);
      done();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(error);
    done(error);
  }
});
