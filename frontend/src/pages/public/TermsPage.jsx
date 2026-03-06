import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFileContract, FaShoppingCart, FaUserCog, FaUndoAlt, FaBan, FaGavel } from 'react-icons/fa';
import SEO from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/StructuredData';

const sections = [
  {
    icon: FaFileContract,
    title: 'Acceptance of Terms',
    content: 'By accessing or using the Arbiter Coffee Shop platform, you agree to be bound by these terms of service and our privacy policy. If you do not agree, please discontinue use of our services.',
  },
  {
    icon: FaShoppingCart,
    title: 'Orders & Payments',
    content: 'All orders are subject to availability. Prices are displayed in Philippine Pesos (PHP) and include applicable taxes. Payment must be completed at the time of order. We reserve the right to refuse or cancel orders at our discretion.',
  },
  {
    icon: FaUserCog,
    title: 'Account Responsibilities',
    content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.',
  },
  {
    icon: FaUndoAlt,
    title: 'Cancellation & Refunds',
    content: 'Orders may be cancelled before preparation begins. Refund policies apply based on order status at the time of cancellation request. Completed or in-progress orders may not be eligible for a full refund.',
  },
  {
    icon: FaBan,
    title: 'Prohibited Conduct',
    content: 'Users may not misuse the platform, attempt unauthorized access, or engage in fraudulent activity. Violation of these terms may result in account suspension or termination.',
  },
  {
    icon: FaGavel,
    title: 'Governing Law',
    content: 'These terms are governed by the laws of the Republic of the Philippines. For questions regarding these terms, please reach out through our Contact page or email arbitercoffee.ph@gmail.com.',
  },
];

function TermsPage() {
  return (
    <main role="main">
      <SEO
        title="Terms of Service"
        description="Read the terms of service for using the Arbiter Coffee Shop platform, including orders, payments, and account policies."
        url="/terms"
        canonical={`${window.location.origin}/terms`}
        type="website"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Terms of Service', url: '/terms' }]} />

      <div className="page-header-modern">
        <Container>
          <h1>Terms of Service</h1>
          <p>Please read these terms carefully before using the Arbiter Coffee Shop platform.</p>
        </Container>
      </div>

      <section className="section-modern">
        <Container>
          <Row className="g-4">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <Col md={6} key={i}>
                  <div className="feature-card h-100" style={{ textAlign: 'left' }}>
                    <div className="feature-icon" aria-hidden="true" style={{ margin: '0 0 var(--spacing-4)' }}>
                      <Icon />
                    </div>
                    <h3 className="h5 fw-semibold mb-2">{s.title}</h3>
                    <p className="mb-0 text-muted" style={{ fontSize: 'var(--font-size-sm)' }}>{s.content}</p>
                  </div>
                </Col>
              );
            })}
          </Row>
          <p className="text-center text-muted mt-5" style={{ fontSize: 'var(--font-size-sm)' }}>
            Last updated: January 2026
          </p>
        </Container>
      </section>
    </main>
  );
}

export default TermsPage;
