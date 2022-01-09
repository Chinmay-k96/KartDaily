import express from 'express';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import expressAsyncHandler from 'express-async-handler';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
const router = express.Router();
//import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import sendEmail from '../utils/sendEmail.js';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

//create new order - private
router.post(
  '/',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!(orderItems && orderItems.length > 0)) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });

      const createdOrder = await order.save();

      sendEmail(req.user, 'order', createdOrder);

      res.status(201).json(createdOrder);
    }
  })
);

//get all orders for a user - private
router.get(
  '/me',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  })
);

//get order details by id - private
router.get(
  '/:id',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  })
);

//get all orders for admin - private/admin
router.get(
  '/',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
  })
);

//create razorpay request
router.post(
  '/razorpay',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const payment_capture = 1;
    const amount =
      req.body.amount * 100 > 4000000 ? 4000000 : req.body.amount * 100;
    const currency = req.body.currency;
    const orderId = req.body.orderId;

    const options = {
      amount: amount,
      currency,
      receipt: orderId,
      payment_capture,
    };

    console.log(options);
    try {
      const response = await razorpay.orders.create(options);
      console.log(response);
      res.json({
        id: response.id,
        receipt: response.receipt,
        created_at: response.created_at,
        amount: response.amount,
        currency: response.currency,
      });
    } catch (error) {
      console.log(error);
      res.status(error.statusCode).json(error);
    }
  })
);

//update order payment status - private
router.put(
  '/:id/pay',
  authenticate,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    console.log(req.body);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        razorpay_payment_id: req.body.razorpay_payment_id,
        razorpay_order_id: req.body.razorpay_order_id,
        receipt: req.body.razorpay_signature,
      };

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  })
);

//update order status to delivered - private/admin
router.put(
  '/:id/deliver',
  authenticate,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDeliverd = true;
      order.deliverdAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  })
);

export default router;
