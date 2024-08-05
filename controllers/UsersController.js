import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ error: !email ? 'Missing email' : 'Missing password' });
    }

    try {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ email });

      if (user) {
        return response.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = sha1(password);
      const result = await users.insertOne({ email, password: hashedPassword });

      response.status(201).json({ id: result.insertedId, email });
      userQueue.add({ userId: result.insertedId });
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(request, response) {
    const token = request.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      console.log('Unauthorized access attempt!');
      return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const users = dbClient.db.collection('users');
      const user = await users.findOne({ _id: new ObjectID(userId) });

      if (user) {
        return response.status(200).json({ id: userId, email: user.email });
      } else {
        return response.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
