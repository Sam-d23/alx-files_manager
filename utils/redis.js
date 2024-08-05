import { createClient } from 'redis';
import { promisify } from 'util';

// Class defining methods for commonly used Redis commands
class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.error(`Redis client not connected to server: ${error}`);
    });
  }

  // Check if the Redis client is connected
  isAlive() {
    return this.client.connected;
  }

  // Get the value for a given key from Redis server
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }

  // Set a key-value pair in Redis server with expiration time
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await promisify(this.client.expire).bind(this.client)(key, time);
  }

  // Delete a key-value pair from Redis server
  async del(key) {
    const redisDel = promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
