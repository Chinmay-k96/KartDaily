import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import crypto from 'crypto';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import productRoute from './routes/productRoute.js';
import userRoute from './routes/userRoute.js';
import orderRoute from './routes/orderRoute.js';
import uploadRoute from './routes/uploadRoute.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

connectDB();

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(bodyParser.json());

app.use(express.json());

app.use('/api/products', productRoute);
app.use('/api/users', userRoute);
app.use('/api/orders', orderRoute);
app.use('/api/upload', uploadRoute);

app.post('/verification', (req, res) => {
  // do a validation
  const secret = process.env.RAZORPAY_SECRET;

  console.log(req.body);

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  console.log(digest, req.headers['x-razorpay-signature']);

  if (digest === req.headers['x-razorpay-signature']) {
    console.log('request is legit');
    // process it
    res.status(200).json(req.body);
  } else {
    res.status(400);
    throw new Error('Invalid request');
  }
});

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  5000,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
