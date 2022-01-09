import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const sendEmail = (userInfo, event, order) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kartdailyserver@gmail.com',
      pass: process.env.SERVER_PASS,
    },
  });

  var orderList = [];

  if (order) {
    order.orderItems.map((item) => {
      orderList.push(`<li>${item.name}</li>`);
    });
  }

  var mailSubject = '';
  var mailBody = '';

  if (event === 'register') {
    mailSubject = `Registration successfull!! Welcome to kartdaily `;
    mailBody = `
          <h2>Hello ${userInfo.name}!! </h2>
          <p>Shop your way through our kart and get exclusive deals on the best brands and wide variety of products. Our kart is at your service daily</p>
          `;
  } else {
    mailSubject = `Order placed!! Congratulations`;
    mailBody = `
        <h2>Hello ${userInfo.name}!! </h2>
        <h4>Your order has been been placed. Order details -</h4>
        <ul>${orderList}</ul>
        <p>Your order will be delivered at your door step shortly. Please continue shopping at kartDaily</p>
        `;
  }

  var mailOptions = {
    from: 'kartdailyserver@gmail.com',
    to: userInfo.email,
    subject: mailSubject,
    html: mailBody,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

export default sendEmail;
