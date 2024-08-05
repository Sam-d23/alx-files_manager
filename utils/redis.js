import { createClient } from 'redis';
import { promisify } from 'util';

// Class for managing Redis operations
class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.on('error', (err) => {
            console.error(`Redis client not connected to the server: ${err}`);
        });

        // Promisify the Redis client methods for async/await usage
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    // Check if the Redis connection is active
    isAlive() {
        return this.client.connected;
    }

    // Retrieve a value for a given key from Redis
    async get(key) {
        return await this.getAsync(key);
    }

    // Store a key-value pair in Redis with an expiration time
    async set(key, value, duration) {
        await this.setAsync(key, value, 'EX', duration);
    }

    // Delete a key-value pair from Redis
    async del(key) {
        await this.delAsync(key);
    }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
