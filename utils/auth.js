import { ObjectID } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

// User ID is retrieved from the token in request headers
async function findUserIdByToken(request) {
  const token = request.headers['X-Token'];
  return await redisClient.get(`auth_${token}`) || null;
}

// Finding a user in the database by their ID
async function findUserById(userId) {
  return await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) }) || null;
}

// Combines token retrieval and user lookup into one function
async function getUser(request) {
  const userId = await findUserIdByToken(request);
  return userId ? await findUserById(userId) : null;
}

export {
  findUserIdByToken, findUserById, getUser,
};
