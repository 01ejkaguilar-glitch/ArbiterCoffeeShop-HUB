import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
      <p className="mt-3 text-muted">{message}</p>
    </Container>
  );
};

export default Loading;
