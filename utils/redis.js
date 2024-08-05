import { createClient } from 'redis';
import { promisify } from 'util';

// Class defining methods for common Redis commands
class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.error(`Redis client not connected to server: ${error}`);
    });
  }

  // Check and report connection status
  isAlive() {
    return this.client.connected;
  }

  // Get value for the specified key from Redis server
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }

  // Set key-value pair in Redis server with expiration time
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, time);
  }

  // Delete key-value pair from Redis server
  async del(key) {
    const redisDel = promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
