import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer>
      <Container>
        <Row>
          <Col className='text-center py-3' style={{ color: '#f2f2f2' }}>
            Copyright &copy; KartDaily
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
