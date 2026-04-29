import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ListGroup } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import SEO from '../../components/SEO';
import { BreadcrumbSchema } from '../../components/StructuredData';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiry_type: 'general',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [contactInfo, setContactInfo] = useState(null);
  const [operatingHours, setOperatingHours] = useState(null);

  const formatTime12Hour = (timeValue) => {
    if (!timeValue) return '';

    const [hours, minutes = '00'] = String(timeValue).split(':');
    const parsedHours = Number(hours);

    if (Number.isNaN(parsedHours)) {
      return String(timeValue);
    }

    const period = parsedHours >= 12 ? 'PM' : 'AM';
    const normalizedHours = parsedHours % 12 || 12;

    return `${normalizedHours}:${minutes.padStart(2, '0')} ${period}`;
  };

  useEffect(() => {
    fetchContactInfo();
    fetchOperatingHours();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PUBLIC.CONTACT_INFO);
      if (response.success) {
        setContactInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const fetchOperatingHours = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PUBLIC.OPERATING_HOURS);
      if (response.success) {
        setOperatingHours(response.data);
      }
    } catch (error) {
      console.error('Error fetching operating hours:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiService.post(API_ENDPOINTS.CONTACT.SUBMIT, formData);
      if (response.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main role="main">
    <Container className="py-5">
      <SEO 
        title="Contact Us - Get in Touch"
        description="Have questions about Arbiter Coffee? Contact us for inquiries about our products, services, operating hours, or feedback. We're here to help!"
        keywords="contact Arbiter Coffee, coffee shop location, coffee shop hours, contact us, customer service, coffee inquiries"
        url="/contact"
        canonical={`${window.location.origin}/contact`}
        type="website"
      />
      
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Contact Us', url: '/contact' }
        ]}
      />
      
      <header>
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4 fw-bold mb-3">Contact Us</h1>
          <p className="lead text-muted">
            Have a question or feedback? We'd love to hear from you!
          </p>
        </Col>
      </Row>
      </header>

      <Row className="g-4">
        <Col lg={8}>
          <section aria-labelledby="contact-form-heading">
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 id="contact-form-heading" className="h3 mb-4">Send us a Message</h2>

              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)} dismissible role="alert">
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible role="alert">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} aria-labelledby="contact-form-heading" noValidate>
                <fieldset className="border-0 p-0">
                  <legend className="visually-hidden">Contact Information</legend>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="contact-name">Full Name <span aria-label="required">*</span></Form.Label>
                        <Form.Control
                          id="contact-name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter your name"
                          aria-required="true"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="contact-email">Email Address <span aria-label="required">*</span></Form.Label>
                        <Form.Control
                          id="contact-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="your@email.com"
                          aria-required="true"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="contact-phone">Phone Number</Form.Label>
                        <Form.Control
                          id="contact-phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+63 912 345 6789"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>

                <fieldset className="border-0 p-0">
                  <legend className="visually-hidden">Inquiry Details</legend>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="inquiry-type">Inquiry Type <span aria-label="required">*</span></Form.Label>
                        <Form.Select
                          id="inquiry-type"
                          name="inquiry_type"
                          value={formData.inquiry_type}
                          onChange={handleChange}
                          required
                          aria-required="true"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="catering">Catering Services</option>
                          <option value="training">Barista Training</option>
                          <option value="feedback">Feedback</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="contact-subject">Subject <span aria-label="required">*</span></Form.Label>
                      <Form.Control
                        id="contact-subject"
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this about?"
                        aria-required="true"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label htmlFor="contact-message">Message <span aria-label="required">*</span></Form.Label>
                  <Form.Control
                    id="contact-message"
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us more..."
                    aria-required="true"
                  />
                </Form.Group>
                </fieldset>

                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          </section>
        </Col>

        <Col lg={4}>
          {/* Contact Information */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">
                <FaMapMarkerAlt className="text-primary me-2" />
                Visit Us
              </h5>
              <p className="mb-0">
                {contactInfo ? (
                  <>
                    {contactInfo.address.street}<br />
                    {contactInfo.address.city}, {contactInfo.address.province}<br />
                    {contactInfo.address.postal_code}, {contactInfo.address.country}
                  </>
                ) : (
                  <>
                    123 Coffee Street<br />
                    Manila, Metro Manila<br />
                    1000, Philippines
                  </>
                )}
              </p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">
                <FaPhone className="text-primary me-2" />
                Call Us
              </h5>
              <p className="mb-0">
                <a href={`tel:${contactInfo?.phone || '+639171234567'}`} className="text-decoration-none">
                  {contactInfo?.phone || '+63 917 123 4567'}
                </a>
              </p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">
                <FaEnvelope className="text-primary me-2" />
                Email Us
              </h5>
              <p className="mb-0">
                <a href={`mailto:${contactInfo?.email || 'hello@arbitercoffee.com'}`} className="text-decoration-none">
                  {contactInfo?.email || 'hello@arbitercoffee.com'}
                </a>
              </p>
            </Card.Body>
          </Card>

          {/* Operating Hours */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-3">
                <FaClock className="text-primary me-2" />
                Operating Hours
              </h5>
              {operatingHours ? (
                <ListGroup variant="flush">
                  {Object.entries(operatingHours).map(([day, hours]) => (
                    <ListGroup.Item key={day} className="px-0 d-flex justify-content-between">
                      <span className="text-capitalize fw-bold">{day}</span>
                      <span className={!hours.is_open ? 'text-danger' : ''}>
                        {hours.is_open
                          ? `${formatTime12Hour(hours.open)} - ${formatTime12Hour(hours.close)}`
                          : 'Closed'}
                      </span>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">Loading hours...</p>
              )}
            </Card.Body>
          </Card>

          {/* Social Media */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Follow Us</h5>
              <div className="d-flex gap-3 flex-wrap">
                <a
                  href={contactInfo?.social_media?.facebook || 'https://www.facebook.com/profile.php?id=100085413528378'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary rounded-circle p-2 social-icon"
                  title="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href={contactInfo?.social_media?.instagram || 'https://instagram.com/arbitercoffee.ph'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-danger rounded-circle p-2 social-icon"
                  title="Instagram"
                >
                  <FaInstagram />
                </a>
                {contactInfo?.social_media?.tiktok && (
                  <a
                    href={contactInfo.social_media.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark rounded-circle p-2 social-icon"
                    title="TikTok"
                  >
                    <span className="fw-bold" style={{ fontSize: '1.1rem' }}>&#9834;</span>
                  </a>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Google Map */}
      {contactInfo?.map_coordinates && (
        <Row className="mt-5">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">
                  <FaMapMarkerAlt className="text-primary me-2" />
                  Find Us on the Map
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                <iframe
                  title="Arbiter Coffee Location"
                  src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${contactInfo.map_coordinates.longitude}!3d${contactInfo.map_coordinates.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1`}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </Card.Body>
              <Card.Footer className="bg-white text-center">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${contactInfo.map_coordinates.latitude},${contactInfo.map_coordinates.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <FaMapMarkerAlt className="me-2" />
                  Get Directions
                </a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
    </main>
  );
};

export default ContactPage;
