import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

/**
 * Error Boundary to catch errors in lazy-loaded components
 * Provides graceful error handling and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              We encountered an error while loading this page. Please try reloading or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3">
                <summary>Error details (Development only)</summary>
                <pre className="mt-2">{this.state.error.toString()}</pre>
              </details>
            )}
            <hr />
            <div className="d-flex gap-2">
              <Button onClick={this.handleReload} variant="outline-danger">
                Reload Page
              </Button>
              <Button href="/" variant="outline-secondary">
                Go to Home
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
