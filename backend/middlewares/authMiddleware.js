import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import expressAsyncHandler from 'express-async-handler';

export const authenticate = expressAsyncHandler(async (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith('Bearer')) {
    try {
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorised!! token failed');
    }
  } else {
    res.status(404);
    throw new Error('Token not found');
  }
});

export const isAdmin = expressAsyncHandler(async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorised as an Admin');
  }
});

//export { authenticate, isAdmin };
