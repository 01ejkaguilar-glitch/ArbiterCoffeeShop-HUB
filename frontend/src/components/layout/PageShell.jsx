import React from 'react';
import { Container, Row, Col, Alert, Button, Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaRedo, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Shared page shell component that provides consistent layout
 * across all pages: Container + heading + optional breadcrumbs +
 * loading/error states.
 *
 * @param {Object} props
 * @param {string} props.title - Page title (h1)
 * @param {string} [props.subtitle] - Subtitle text below title
 * @param {Array<{label: string, to?: string}>} [props.breadcrumbs] - Breadcrumb items
 * @param {React.ReactNode} [props.headerRight] - Content to render on the right side of the header
 * @param {boolean} [props.loading] - Show loading skeleton for page header
 * @param {string|null} [props.error] - Error message to display
 * @param {Function} [props.onRetry] - Retry callback when error occurs
 * @param {string} [props.className] - Additional container class
 * @param {React.ReactNode} props.children - Page content
 */
function PageShell({
  title,
  subtitle,
  breadcrumbs,
  headerRight,
  loading = false,
  error = null,
  onRetry,
  className = '',
  children,
}) {
  return (
    <main role="main">
      <Container className={`py-4 ${className}`.trim()}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-3">
            {breadcrumbs.map((crumb, idx) => (
              <Breadcrumb.Item
                key={idx}
                active={idx === breadcrumbs.length - 1}
                linkAs={crumb.to ? Link : undefined}
                linkProps={crumb.to ? { to: crumb.to } : undefined}
              >
                {crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}

        {/* Page Header */}
        <Row className="mb-4">
          <Col>
            <header className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                {loading ? (
                  <>
                    <div className="placeholder-glow">
                      <span className="placeholder col-6" style={{ height: '2rem', display: 'block', width: '200px' }} />
                    </div>
                    {subtitle && (
                      <div className="placeholder-glow mt-2">
                        <span className="placeholder col-4" style={{ height: '1rem', display: 'block', width: '150px' }} />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className="display-5 fw-bold mb-1">{title}</h1>
                    {subtitle && <p className="lead text-muted mb-0">{subtitle}</p>}
                  </>
                )}
              </div>
              {headerRight && <div className="d-flex align-items-center gap-3">{headerRight}</div>}
            </header>
          </Col>
        </Row>

        {/* Error State */}
        {error && (
          <Alert variant="danger" className="mb-4">
            <div className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              <div className="flex-grow-1">{error}</div>
              {onRetry && (
                <Button variant="outline-danger" size="sm" onClick={onRetry}>
                  <FaRedo className="me-1" /> Retry
                </Button>
              )}
            </div>
          </Alert>
        )}

        {/* Page Content */}
        {children}
      </Container>
    </main>
  );
}

export default PageShell;
