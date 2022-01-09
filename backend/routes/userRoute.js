import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
const router = express.Router();
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';

//login  - public
router.post(
  '/login',
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  })
);

//register user - public
router.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      sendEmail(user, 'register', null);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  })
);

//get user profile - private
router.get(
  '/profile',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const profile = await User.findById(req.user._id).select('-password');

    if (profile) {
      res.json(profile);
    } else {
      res.status(404);
      throw new Error('Profile not found');
    }
  })
);

//update proifle - private
router.put(
  '/profile',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const profile = await User.findById(req.user._id);

    if (profile) {
      profile.name = req.body.name || profile.name;
      profile.email = req.body.email || profile.email;
      if (req.body.password) {
        profile.password = req.body.password;
      }

      const updatedProfile = await profile.save();

      res.json({
        _id: updatedProfile._id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        isAdmin: updatedProfile.isAdmin,
        token: generateToken(updatedProfile._id),
      });
    } else {
      res.status(404);
      throw new Error('Profile not found');
    }
  })
);

//get all users - private/admin
router.get(
  '/',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
  })
);

//delete a user - private/admin
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    await Order.deleteMany({ user: req.params.id });

    if (user) {
      await user.remove();
      res.json({ message: 'User deleted' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

//get user by id - private/admin
router.get(
  '/:id',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('Profile not found');
    }
  })
);

//update user - private/admin
router.put(
  '/:id',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = req.body.isAdmin || user.isAdmin;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
);

export default router;
