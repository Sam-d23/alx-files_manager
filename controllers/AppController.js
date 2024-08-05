import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(request, response) {
    response.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(request, response) {
    const users_num = await dbClient.nbUsers();
    const files_num = await dbClient.nbFiles();
    response.status(200).json({ users: users_num, files: files_num });
  }
}

module.exports = AppController;
