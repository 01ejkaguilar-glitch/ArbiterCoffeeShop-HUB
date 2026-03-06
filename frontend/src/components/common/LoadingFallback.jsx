import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

/**
 * Loading fallback component for lazy-loaded routes
 * Shows a centered spinner with skeleton screen effect
 */
const LoadingFallback = ({ fullScreen = true, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-h-70vh">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" className="spinner-lg">
            <span className="visually-hidden">{message}</span>
          </Spinner>
          <p className="mt-3 text-muted">{message}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center p-4">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default LoadingFallback;
