import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaCoffee, FaLeaf, FaTruck, FaAward, FaArrowRight,
  FaSearch, FaMugHot, FaBoxOpen, FaSmile,
  FaSeedling, FaHandshake, FaHeart, FaUsers
} from 'react-icons/fa';
import HomepageRecommendations from '../../components/public/HomepageRecommendations';
import SEO from '../../components/SEO';
import { OrganizationSchema, WebSiteSchema } from '../../components/StructuredData';

const features = [
  {
    icon: FaCoffee,
    title: 'Premium Quality',
    text: 'Every cup starts with carefully selected beans from the world\'s finest coffee-growing regions, roasted in small batches to perfection.'
  },
  {
    icon: FaLeaf,
    title: 'Sustainably Sourced',
    text: 'We partner directly with farmers who practice eco-friendly agriculture, ensuring fair prices and a healthier planet.'
  },
  {
    icon: FaTruck,
    title: 'Fast Delivery',
    text: 'From our roastery to your cup — enjoy swift, reliable delivery so you never miss your daily ritual.'
  },
  {
    icon: FaAward,
    title: 'Award Winning',
    text: 'Recognized nationally for excellence in craft coffee, blending tradition with innovation since day one.'
  },
];

const steps = [
  { icon: FaSearch, title: 'Browse & Choose', text: 'Explore our curated selection of specialty coffees, beans, and equipment.' },
  { icon: FaMugHot, title: 'Freshly Prepared', text: 'Every order is roasted and packed fresh, never pre-made or sitting on shelves.' },
  { icon: FaBoxOpen, title: 'Carefully Packed', text: 'Sealed for freshness with eco-friendly packaging that keeps flavor locked in.' },
  { icon: FaSmile, title: 'Enjoy at Home', text: 'Delivered to your door — brew your perfect cup whenever the moment calls.' },
];

const values = [
  { icon: FaSeedling, title: 'Farm-to-Cup', text: 'Direct trade relationships with coffee farmers across Southeast Asia and beyond.' },
  { icon: FaHandshake, title: 'Community First', text: 'Supporting local communities through fair employment and educational programs.' },
  { icon: FaHeart, title: 'Crafted with Love', text: 'Every blend is a labor of passion, perfected by experienced roasters and baristas.' },
  { icon: FaUsers, title: 'Growing Together', text: 'From barista training to Arbiter Express, we help you bring great coffee anywhere.' },
];

const stats = [
  { value: '10K+', label: 'Cups Served Monthly' },
  { value: '50+', label: 'Coffee Varieties' },
  { value: '100%', label: 'Arabica Beans' },
  { value: '4.9★', label: 'Customer Rating' },
];

const HomePage = () => {
  return (
    <main role="main">
      <SEO
        title="Premium Artisan Coffee Shop"
        description="Experience the finest artisan coffee, crafted with passion and served with excellence. Order online for delivery or pickup from Arbiter Coffee Shop."
        keywords="coffee shop, artisan coffee, premium coffee, coffee delivery, specialty coffee, Arbiter Coffee"
        url="/"
        canonical={`${window.location.origin}/`}
        type="website"
      />

      <OrganizationSchema
        name="Arbiter Coffee"
        description="Premium artisan coffee shop offering specialty coffee, espresso drinks, and handcrafted beverages made with passion and expertise."
        address={{
          streetAddress: "123 Coffee Street",
          city: "Manila",
          region: "Metro Manila",
          postalCode: "1000",
          country: "PH"
        }}
        telephone="+63-2-1234-5678"
        email="contact@arbitercoffee.com"
        openingHours={[
          { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "22:00" },
          { dayOfWeek: ["Saturday", "Sunday"], opens: "09:00", closes: "23:00" }
        ]}
        priceRange="₱₱"
      />

      <WebSiteSchema />

      {/* ── Hero Section ── */}
      <section aria-labelledby="hero-heading" className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <span className="hero-eyebrow">Specialty Coffee Experience</span>
              <h1 id="hero-heading" className="hero-title fade-in">
                Welcome to<br />Arbiter Coffee
              </h1>
              <p className="hero-subtitle fade-in">
                From farm to cup, we craft every blend with precision and passion.
                Discover specialty coffees that awaken your senses and fuel your day.
              </p>
              <div className="mt-4 d-flex gap-3 justify-content-center flex-wrap">
                <Button as={Link} to="/products" variant="light" size="lg" aria-label="Browse our coffee products">
                  <FaCoffee className="me-2" aria-hidden="true" />
                  Browse Products
                </Button>
                <Button as={Link} to="/about" variant="outline-light" size="lg" aria-label="Learn more about Arbiter Coffee">
                  Our Story
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar" aria-label="Key statistics">
        <Container>
          <Row className="g-0 text-center">
            {stats.map((stat, i) => (
              <Col xs={6} md={3} key={i} className="stats-bar-item">
                <span className="stats-bar-value">{stat.value}</span>
                <span className="stats-bar-label">{stat.label}</span>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Why Choose Us ── */}
      <section aria-labelledby="features-heading" className="section-modern">
        <Container>
          <div className="section-header">
            <h2 id="features-heading">Why Choose Arbiter Coffee</h2>
            <div className="section-divider" />
            <p>We bring you the best coffee experience through quality, sustainability, and craft</p>
          </div>
          <Row className="g-4" role="list">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <Col md={6} lg={3} key={i} role="listitem">
                  <article className="feature-card">
                    <div className="feature-icon" aria-hidden="true">
                      <Icon />
                    </div>
                    <h3>{feat.title}</h3>
                    <p>{feat.text}</p>
                  </article>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* ── How It Works ── */}
      <section aria-labelledby="process-heading" className="section-modern" style={{ background: 'var(--color-off-white, #f9fafb)' }}>
        <Container>
          <div className="section-header">
            <h2 id="process-heading">How It Works</h2>
            <div className="section-divider" />
            <p>From your first click to your first sip — it's effortless</p>
          </div>
          <Row className="g-4 justify-content-center">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Col sm={6} lg={3} key={i}>
                  <div className="process-step">
                    <div className="process-step-number">{i + 1}</div>
                    <div className="process-step-icon" aria-hidden="true">
                      <Icon />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* ── Featured Products / Recommendations ── */}
      <section aria-labelledby="recommendations-heading" className="section-modern">
        <Container>
          <div className="section-header">
            <h2 id="recommendations-heading">Featured Products</h2>
            <div className="section-divider" />
            <p>Handpicked selections from our premium collection</p>
          </div>
          <HomepageRecommendations />
        </Container>
      </section>

      {/* ── Our Values ── */}
      <section aria-labelledby="values-heading" className="section-modern" style={{ background: 'var(--color-off-white, #f9fafb)' }}>
        <Container>
          <div className="section-header">
            <h2 id="values-heading">What We Stand For</h2>
            <div className="section-divider" />
            <p>More than coffee — we're building a community rooted in quality and care</p>
          </div>
          <Row className="g-4" role="list">
            {values.map((val, i) => {
              const Icon = val.icon;
              return (
                <Col md={6} lg={3} key={i} role="listitem">
                  <article className="feature-card">
                    <div className="feature-icon" aria-hidden="true">
                      <Icon />
                    </div>
                    <h3>{val.title}</h3>
                    <p>{val.text}</p>
                  </article>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>

      {/* ── Call to Action ── */}
      <section aria-labelledby="cta-heading" className="cta-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={7}>
              <h2 id="cta-heading">Start Your Coffee Journey Today</h2>
              <p className="lead mb-lg-0">
                Join thousands of satisfied coffee lovers enjoying premium, freshly-roasted
                coffee delivered right to their door. Sign up and get exclusive offers.
              </p>
            </Col>
            <Col lg={5} className="text-lg-end mt-4 mt-lg-0 d-flex gap-3 justify-content-lg-end justify-content-center flex-wrap">
              <Button as={Link} to="/register" variant="light" size="lg" aria-label="Sign up for an Arbiter Coffee account">
                Sign Up Free <FaArrowRight className="ms-2" aria-hidden="true" />
              </Button>
              <Button as={Link} to="/products" variant="outline-light" size="lg" aria-label="Browse products">
                Shop Now
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
};

export default HomePage;
