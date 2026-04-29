import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import { FaCoffee, FaAward, FaUsers, FaLeaf } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';
// Loading removed — static content renders immediately
import SEO from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/StructuredData';

const coreValues = [
  { icon: FaCoffee, title: 'Premium Quality', text: 'Hand-selected beans from the world\'s finest coffee regions' },
  { icon: FaLeaf, title: 'Sustainability', text: 'Committed to ethical sourcing and environmental responsibility' },
  { icon: FaAward, title: 'Excellence', text: 'Award-winning roasts and brewing techniques' },
  { icon: FaUsers, title: 'Community', text: 'Building connections one cup at a time' },
];

const detailedValues = [
  { title: 'Quality First', text: 'We never compromise on quality. Every cup of coffee we serve meets our highest standards of excellence.' },
  { title: 'Sustainability', text: 'We partner with farms that practice sustainable agriculture and fair trade, ensuring a better future for all.' },
  { title: 'Community', text: 'We\'re more than a coffee shop – we\'re a gathering place where relationships are built and memories are made.' },
];

const AboutPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const [teamResponse, timelineResponse] = await Promise.all([
        apiService.get(API_ENDPOINTS.PUBLIC.TEAM_MEMBERS),
        apiService.get(API_ENDPOINTS.PUBLIC.TIMELINE)
      ]);

      if (teamResponse.success) {
        setTeamMembers(teamResponse.data || []);
      }

      if (timelineResponse.success) {
        setTimeline(timelineResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // Don't block static content — show a subtle inline spinner in dynamic sections instead
  }

  return (
    <main role="main">
      <SEO 
        title="About Us - Our Story and Team"
        description="Learn about Arbiter Coffee Shop's journey, mission, and the passionate team behind your favorite artisan coffee. Discover our commitment to quality and sustainability."
        keywords="about Arbiter Coffee, coffee shop story, coffee team, artisan coffee, sustainable coffee, coffee mission"
        url="/about"
        canonical={`${window.location.origin}/about`}
        type="website"
      />
      
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: '/' },
          { name: 'About Us', url: '/about' }
        ]}
      />
      
      {/* Hero */}
      <section aria-labelledby="about-hero-heading" className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <span className="hero-eyebrow">Our Story</span>
              <h1 id="about-hero-heading" className="hero-title">About Arbiter Coffee</h1>
              <p className="hero-subtitle">
                Crafting exceptional coffee experiences since our founding
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Story */}
      <section aria-labelledby="story-heading" className="section-modern">
        <Container>
          <div className="section-header">
            <h2 id="story-heading">Our Story</h2>
            <div className="section-divider" />
          </div>
          <Row>
            <Col lg={8} className="mx-auto">
              <p className="lead text-center" style={{ lineHeight: 'var(--line-height-relaxed)' }}>
                Arbiter Coffee began with a simple mission: to bring the finest coffee experience to 
                our community. What started as a small passion project has grown into a thriving business 
                dedicated to sourcing, roasting, and serving exceptional coffee.
              </p>
              <p className="text-center text-muted">
                We believe that great coffee brings people together. Every bean is carefully selected 
                from sustainable farms around the world, roasted to perfection, and served with care. 
                Our commitment to quality and sustainability drives everything we do.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Core Values Cards */}
      <section aria-labelledby="values-heading" className="section-modern" style={{ background: 'var(--color-off-white)' }}>
        <Container>
          <div className="section-header">
            <h2 id="values-heading">What Drives Us</h2>
            <div className="section-divider" />
            <p>The principles behind every cup we craft</p>
          </div>
          <Row className="g-4" role="list">
            {coreValues.map((val, i) => {
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

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <section aria-labelledby="team-heading" className="section-modern">
          <Container>
            <div className="section-header">
              <h2 id="team-heading">Meet Our Team</h2>
              <div className="section-divider" />
              <p>Passionate coffee professionals dedicated to your experience</p>
            </div>
            <Row className="g-4">
              {teamMembers.map((member) => (
                <Col key={member.id} md={6} lg={4}>
                  <article className="team-card">
                    {member.photo_url && (
                      <img 
                        className="team-photo" 
                        src={member.photo_url.startsWith('http') ? member.photo_url : `${BACKEND_BASE_URL}${member.photo_url}`}
                        alt={`${member.name}, ${member.position}`}
                        width="520"
                        height="260"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="team-body">
                      <h3>{member.name}</h3>
                      <span className="team-role">{member.position}</span>
                      <p className="team-bio">{member.bio}</p>
                      {member.specialties && member.specialties.length > 0 && (
                        <div className="mt-2">
                          {member.specialties.map((specialty, idx) => (
                            <Badge key={idx} bg="secondary" className="me-1 mb-1">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <section aria-labelledby="journey-heading" className="section-modern" style={{ background: 'var(--color-off-white)' }}>
          <Container>
            <div className="section-header">
              <h2 id="journey-heading">Our Journey</h2>
              <div className="section-divider" />
              <p>Milestones that shaped Arbiter Coffee</p>
            </div>
            <Row>
              <Col lg={10} className="mx-auto">
                <div className="timeline-modern">
                  {timeline.map((event) => (
                    <article key={event.id} className="timeline-item">
                      <div className="timeline-card">
                        <span className="timeline-year">
                          <time dateTime={event.year}>{event.year}</time>
                        </span>
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Detailed Values */}
      <section aria-labelledby="detailed-values-heading" className="section-modern">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto">
              <div className="values-grid">
                <div className="section-header">
                  <h2 id="detailed-values-heading">Our Values</h2>
                  <div className="section-divider" />
                </div>
                <Row className="g-4">
                  {detailedValues.map((val, i) => (
                    <Col md={4} key={i}>
                      <article>
                        <h3 className="h5 fw-semibold mb-2" style={{ color: 'var(--color-dark-green)' }}>{val.title}</h3>
                        <p className="mb-0 text-muted">{val.text}</p>
                      </article>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
};

export default AboutPage;
