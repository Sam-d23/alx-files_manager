import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

router
  .get('/status', AppController.getStatus)
  .get('/stats', AppController.getStats)
  .post('/users', UsersController.postNew)
  .get('/connect', AuthController.getConnect)
  .get('/disconnect', AuthController.getDisconnect)
  .get('/users/me', UsersController.getMe)
  .post('/files', FilesController.postUpload)
  .get('/files/:id', FilesController.getShow)
  .get('/files', FilesController.getIndex)
  .put('/files/:id/publish', FilesController.putPublish)
  .put('/files/:id/unpublish', FilesController.putUnpublish)
  .get('/files/:id/data', FilesController.getFile);

export default router;
