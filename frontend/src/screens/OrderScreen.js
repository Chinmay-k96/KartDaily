import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from '../actions/orderActions';
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants';

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id;

  const [sdkReady, setSdkReady] = useState(false);

  function loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        setSdkReady(true);
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  const dispatch = useDispatch();

  const orderDetails = useSelector((state) => state.orderDetails);
  const { order, loading, error } = orderDetails;

  const orderPay = useSelector((state) => state.orderPay);
  const { loading: loadingPay, success: successPay } = orderPay;

  const orderDeliver = useSelector((state) => state.orderDeliver);
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  if (!loading) {
    //   Calculate prices
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2);
    };

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    );
  }

  async function displayRazorpay() {
    const res = await loadScript(
      'https://checkout.razorpay.com/v1/checkout.js'
    );

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          JSON.parse(localStorage.getItem('userInfo')).token
        }`,
      },
    };

    const price = {
      amount: order.totalPrice,
      currency: 'INR',
      orderId: order._id,
    };

    const { data } = await axios.post('/api/orders/razorpay', price, config);
    console.log(data);

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      currency: data.currency,
      amount: data.amount,
      order_id: data.id,
      name: 'Payment',
      description:
        'Thank you for placing your order. please pay and continue shopping',
      //image: 'http://localhost:1337/logo.svg',
      handler: function (response) {
        // alert(response.razorpay_payment_id)
        // alert(response.razorpay_order_id)
        // alert(response.razorpay_signature)
        console.log(response);
        dispatch(payOrder(orderId, response));
      },
      prefill: {
        name: order.user.name,
        email: order.user.email,
        phone_number: '9879346758',
      },
    };
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login');
    }

    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET });
      dispatch({ type: ORDER_DELIVER_RESET });
      dispatch(getOrderDetails(orderId));
    }
  }, [dispatch, orderId, successPay, successDeliver, order]);

  const deliverHandler = () => {
    dispatch(deliverOrder(order));
  };

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong>
                {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDeliverd ? (
                <Message variant='success'>
                  Delivered on {order.deliverdAt}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant='success'>Paid on {order.paidAt}</Message>
              ) : (
                <Message variant='danger'>Not Paid</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x <i className='fa fa-inr' />
                          {item.price} ={' '}
                          <i className='fa fa-inr'>{item.qty * item.price}</i>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>
                    <i className='fa fa-inr' />
                    {order.itemsPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>
                    <i className='fa fa-inr' />
                    {order.shippingPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>
                    <i className='fa fa-inr' />
                    {order.taxPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>
                    <i className='fa fa-inr' />
                    {order.totalPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && !userInfo.isAdmin && (
                <ListGroup.Item>
                  {loadingPay && <Loader />}
                  <Button
                    onClick={displayRazorpay}
                    style={{ width: '100%', backgroundColor: '#2e3345' }}
                  >
                    <img
                      src='https://cdn.razorpay.com/logo_invert.svg'
                      style={{ width: '130px' }}
                    />
                  </Button>
                </ListGroup.Item>
              )}
              {loadingDeliver && <Loader />}
              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDeliverd && (
                  <ListGroup.Item>
                    <Button
                      type='button'
                      className='btn btn-block'
                      onClick={deliverHandler}
                    >
                      Mark As Delivered
                    </Button>
                  </ListGroup.Item>
                )}
            </ListGroup>
            {!order.isPaid && !userInfo.isAdmin && (
              <div
                style={{ padding: '10px', color: 'red', textAlign: 'center' }}
              >
                <div>Use fake details as this is a test app</div>
                <div>Use sample card : 5267 3181 8797 5449, Any future expiry date and any CVV</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
