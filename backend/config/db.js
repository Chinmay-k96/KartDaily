//const mongoose = require('mongoose');
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
    });

    console.log(`MongoDB connected to ${connect.connection.host}`);
  } catch (error) {
    console.error('Error : ', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

//module.exports = connectDB;
export default connectDB;
