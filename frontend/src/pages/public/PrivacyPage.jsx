import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaShieldAlt, FaDatabase, FaLock, FaUserShield, FaCookieBite, FaEnvelope } from 'react-icons/fa';
import SEO from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/StructuredData';

const sections = [
  {
    icon: FaDatabase,
    title: 'Information We Collect',
    content: 'We collect information you provide when creating an account, placing orders, or contacting us, including your name, email address, phone number, and delivery address. We also collect usage data such as browsing patterns and device information to improve your experience.',
  },
  {
    icon: FaUserShield,
    title: 'How We Use Your Information',
    content: 'Your information is used to process orders, improve our services, send order updates, and communicate promotions (with your consent). We never sell your personal data to third parties.',
  },
  {
    icon: FaLock,
    title: 'Data Protection',
    content: 'We implement industry-standard security measures including encryption and secure servers to protect your personal data. Your payment information is processed securely through trusted payment processors and never stored on our servers.',
  },
  {
    icon: FaCookieBite,
    title: 'Cookies & Tracking',
    content: 'We use essential cookies to maintain your session and preferences. Analytics cookies help us understand how visitors interact with our platform. You can manage cookie preferences through your browser settings.',
  },
  {
    icon: FaShieldAlt,
    title: 'Your Rights',
    content: 'You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent for marketing communications. Contact us to exercise any of these rights.',
  },
  {
    icon: FaEnvelope,
    title: 'Contact Us',
    content: 'If you have questions about this privacy policy or how we handle your data, please reach out through our Contact page or email us at arbitercoffee.ph@gmail.com.',
  },
];

function PrivacyPage() {
  return (
    <main role="main">
      <SEO
        title="Privacy Policy"
        description="Learn how Arbiter Coffee Shop collects, uses, and protects your personal information. Your privacy matters to us."
        url="/privacy"
        canonical={`${window.location.origin}/privacy`}
        type="website"
      />
      <BreadcrumbSchema items={[{ name: 'Home', url: '/' }, { name: 'Privacy Policy', url: '/privacy' }]} />

      <div className="page-header-modern">
        <Container>
          <h1>Privacy Policy</h1>
          <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.</p>
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

export default PrivacyPage;
