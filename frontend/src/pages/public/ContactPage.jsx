import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ListGroup } from 'react-bootstrap';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

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
    <Container className="py-5">
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4 fw-bold mb-3">Contact Us</h1>
          <p className="lead text-muted">
            Have a question or feedback? We'd love to hear from you!
          </p>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h3 className="mb-4">Send us a Message</h3>

              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                  Thank you for your message! We'll get back to you soon.
                </Alert>
              )}

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+63 912 345 6789"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Inquiry Type *</Form.Label>
                      <Form.Select
                        name="inquiry_type"
                        value={formData.inquiry_type}
                        onChange={handleChange}
                        required
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
                      <Form.Label>Subject *</Form.Label>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        placeholder="What is this about?"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Message *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us more..."
                  />
                </Form.Group>

                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
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
                        {hours.is_open ? `${hours.open} - ${hours.close}` : 'Closed'}
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
                  className="btn btn-outline-primary rounded-circle p-2"
                  style={{ width: '40px', height: '40px' }}
                  title="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href={contactInfo?.social_media?.instagram || 'https://instagram.com/arbitercoffee.ph'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-danger rounded-circle p-2"
                  style={{ width: '40px', height: '40px' }}
                  title="Instagram"
                >
                  <FaInstagram />
                </a>
                {contactInfo?.social_media?.tiktok && (
                  <a
                    href={contactInfo.social_media.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark rounded-circle p-2"
                    style={{ width: '40px', height: '40px' }}
                    title="TikTok"
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>♪</span>
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
              <Card.Body className="p-0">
                <iframe
                  title="Arbiter Coffee Location"
                  src={`https://www.google.com/maps?q=${contactInfo.map_coordinates.latitude},${contactInfo.map_coordinates.longitude}&hl=es;z=14&output=embed`}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ContactPage;
