import { ObjectID } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

// Retrieving authentication token from the headers
async function getAuthToken(request) {
  const token = request.headers['X-token'];
  return `auth_${token}`;
}

// Finding user ID based on the token passed in the headers
async function findUserIdByToken(request) {
  const key = await getAuthToken(request);
  const userId = await redisClient.get(key);
  return userId || null;
}

// Finding user in the database based on the user ID
async function findUserById(userId) {
  const userExistsArray = await dbClient.users.find(`ObjectId("${userId}")`).toArray();
  return userExistsArray[0] || null;
}

async function getUserById(request) {
  const userId = await findUserIdByToken(request);
  if (userId) {
    const users = dbClient.db.collection('users');
    const objectId = new ObjectID(userId);
    const user = await users.findOne({ _id: objectId });
    return user || null;
  }
  return null;
}

async function getUser(request) {
  const token = request.header('X-Token');
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (userId) {
    const users = dbClient.db.collection('users');
    const idObject = new ObjectID(userId);
    const user = await users.findOne({ _id: idObject });
    return user || null;
  }
  return null;
}

export {
  findUserIdByToken,
  findUserById,
  getUserById,
  getUser,
};
