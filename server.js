import express from 'express';
import router from './routes/index.js';

const app = express();
const port = parseInt(process.env.PORT, 10) || 5000;

app.use(express.json());
app.use('/', router);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
