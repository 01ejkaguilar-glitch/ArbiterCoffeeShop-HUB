import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaCoffee, FaTruck } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import SEO from '../../components/SEO';

const InquiriesPage = () => {
  const [activeTab, setActiveTab] = useState('barista');
  const [baristaLoading, setBaristaLoading] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);
  const [baristaAlert, setBaristaAlert] = useState({ show: false, type: '', message: '' });
  const [expressAlert, setExpressAlert] = useState({ show: false, type: '', message: '' });

  // Barista Training Form
  const [baristaForm, setBaristaForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    experience_level: '',
    preferred_schedule: '',
    background: '',
    motivation: ''
  });

  // Arbiter Express Form
  const [expressForm, setExpressForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    event_date: '',
    event_time: '',
    location: '',
    guest_count: '',
    service_type: '',
    menu_preferences: '',
    budget_range: '',
    special_requests: ''
  });

  const handleBaristaChange = (e) => {
    setBaristaForm({
      ...baristaForm,
      [e.target.name]: e.target.value
    });
  };

  const handleExpressChange = (e) => {
    setExpressForm({
      ...expressForm,
      [e.target.name]: e.target.value
    });
  };

  const handleBaristaSubmit = async (e) => {
    e.preventDefault();
    setBaristaLoading(true);
    setBaristaAlert({ show: false, type: '', message: '' });

    try {
      const response = await apiService.post(
        API_ENDPOINTS.PUBLIC.BARISTA_TRAINING,
        baristaForm
      );

      if (response.success) {
        setBaristaAlert({
          show: true,
          type: 'success',
          message: response.message || 'Your training inquiry has been submitted successfully! We will contact you soon.'
        });
        setBaristaForm({
          full_name: '',
          email: '',
          phone: '',
          experience_level: '',
          preferred_schedule: '',
          background: '',
          motivation: ''
        });
      }
    } catch (error) {
      setBaristaAlert({
        show: true,
        type: 'danger',
        message: error.response?.data?.message || 'Failed to submit inquiry. Please try again.'
      });
    } finally {
      setBaristaLoading(false);
    }
  };

  const handleExpressSubmit = async (e) => {
    e.preventDefault();
    setExpressLoading(true);
    setExpressAlert({ show: false, type: '', message: '' });

    try {
      const response = await apiService.post(
        API_ENDPOINTS.PUBLIC.ARBITER_EXPRESS,
        expressForm
      );

      if (response.success) {
        setExpressAlert({
          show: true,
          type: 'success',
          message: response.message || 'Your mobile coffee service inquiry has been submitted successfully! We will contact you soon.'
        });
        setExpressForm({
          full_name: '',
          email: '',
          phone: '',
          event_date: '',
          event_time: '',
          location: '',
          guest_count: '',
          service_type: '',
          menu_preferences: '',
          budget_range: '',
          special_requests: ''
        });
      }
    } catch (error) {
      setExpressAlert({
        show: true,
        type: 'danger',
        message: error.response?.data?.message || 'Failed to submit inquiry. Please try again.'
      });
    } finally {
      setExpressLoading(false);
    }
  };

  return (
    <main role="main">
      <SEO 
        title="Special Services - Barista Training & Mobile Coffee"
        description="Join Arbiter Coffee's professional barista training program or book our Arbiter Express mobile coffee service for your events. Quality coffee education and catering."
        keywords="barista training, coffee training, mobile coffee service, coffee catering, Arbiter Express, coffee events, barista certification"
        url="/inquiries"
        canonical={`${window.location.origin}/inquiries`}
        type="website"
      />
      
      {/* Hero Section */}
      <section aria-labelledby="inquiries-hero-heading" className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 id="inquiries-hero-heading" className="hero-title">Special Services</h1>
              <p className="hero-subtitle">
                Join our training program or book our mobile coffee service
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        {baristaAlert.show && activeTab === 'barista' && (
          <Alert 
            variant={baristaAlert.type} 
            onClose={() => setBaristaAlert({ show: false, type: '', message: '' })} 
            dismissible
            className="mb-4"
          >
            {baristaAlert.message}
          </Alert>
        )}

        {expressAlert.show && activeTab === 'express' && (
          <Alert 
            variant={expressAlert.type} 
            onClose={() => setExpressAlert({ show: false, type: '', message: '' })} 
            dismissible
            className="mb-4"
          >
            {expressAlert.message}
          </Alert>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4"
          fill
          role="tablist"
          aria-label="Service inquiry forms"
        >
          {/* Be A Barista Tab */}
          <Tab
            eventKey="barista"
            title={
              <span>
                <FaCoffee className="me-2" />
                Be A Barista
              </span>
            }
          >
            <section aria-labelledby="barista-form-heading">
            <div className="contact-form-card">
                <h2 id="barista-form-heading" className="h3 mb-1">Barista Training Inquiry</h2>
                <p className="form-subtitle">
                  Interested in becoming a barista? Fill out this form and we'll get back to you with training details.
                </p>

                <Form onSubmit={handleBaristaSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="barista-name">Full Name *</Form.Label>
                        <Form.Control
                          id="barista-name"
                          type="text"
                          name="full_name"
                          value={baristaForm.full_name}
                          onChange={handleBaristaChange}
                          required
                          placeholder="Enter your full name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={baristaForm.email}
                          onChange={handleBaristaChange}
                          required
                          placeholder="your.email@example.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={baristaForm.phone}
                          onChange={handleBaristaChange}
                          required
                          placeholder="+63 917 123 4567"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Experience Level *</Form.Label>
                        <Form.Select
                          name="experience_level"
                          value={baristaForm.experience_level}
                          onChange={handleBaristaChange}
                          required
                        >
                          <option value="">Select experience level</option>
                          <option value="beginner">Beginner - No experience</option>
                          <option value="intermediate">Intermediate - Some experience</option>
                          <option value="advanced">Advanced - Professional experience</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Preferred Training Schedule *</Form.Label>
                    <Form.Control
                      type="text"
                      name="preferred_schedule"
                      value={baristaForm.preferred_schedule}
                      onChange={handleBaristaChange}
                      required
                      placeholder="e.g., Weekdays, Weekends, Morning, Afternoon"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Background Information</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="background"
                      value={baristaForm.background}
                      onChange={handleBaristaChange}
                      placeholder="Tell us about your background and experience with coffee"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Why do you want to become a barista?</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="motivation"
                      value={baristaForm.motivation}
                      onChange={handleBaristaChange}
                      placeholder="Share your motivation and goals"
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    disabled={baristaLoading}
                    className="w-100"
                    aria-label="Submit barista training inquiry"
                  >
                    {baristaLoading ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                </Form>
            </div>
            </section>
          </Tab>

          {/* Arbiter Express Tab */}
          <Tab
            eventKey="express"
            title={
              <span>
                <FaTruck className="me-2" />
                Arbiter Express
              </span>
            }
          >
            <section aria-labelledby="express-form-heading">
            <div className="contact-form-card">
                <h2 id="express-form-heading" className="h3 mb-1">Mobile Coffee Service Booking</h2>
                <p className="form-subtitle">
                  Book our mobile coffee setup for your event. We bring the coffee shop experience to you!
                </p>

                <Form onSubmit={handleExpressSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="express-name">Full Name *</Form.Label>
                        <Form.Control
                          id="express-name"
                          type="text"
                          name="full_name"
                          value={expressForm.full_name}
                          onChange={handleExpressChange}
                          required
                          placeholder="Enter your full name"
                          aria-required="true"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label htmlFor="express-email">Email Address *</Form.Label>
                        <Form.Control
                          id="express-email"
                          type="email"
                          name="email"
                          value={expressForm.email}
                          onChange={handleExpressChange}
                          required
                          placeholder="your.email@example.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={expressForm.phone}
                          onChange={handleExpressChange}
                          required
                          placeholder="+63 917 123 4567"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Event Date *</Form.Label>
                        <Form.Control
                          type="date"
                          name="event_date"
                          value={expressForm.event_date}
                          onChange={handleExpressChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Event Time *</Form.Label>
                        <Form.Control
                          type="time"
                          name="event_time"
                          value={expressForm.event_time}
                          onChange={handleExpressChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number of Guests *</Form.Label>
                        <Form.Control
                          type="number"
                          name="guest_count"
                          value={expressForm.guest_count}
                          onChange={handleExpressChange}
                          required
                          min="1"
                          placeholder="Expected number of guests"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Event Location *</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={expressForm.location}
                      onChange={handleExpressChange}
                      required
                      placeholder="Full address or venue name"
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Service Type *</Form.Label>
                        <Form.Select
                          name="service_type"
                          value={expressForm.service_type}
                          onChange={handleExpressChange}
                          required
                        >
                          <option value="">Select service type</option>
                          <option value="basic">Basic - Coffee Bar Setup</option>
                          <option value="premium">Premium - Full Service with Barista</option>
                          <option value="custom">Custom - Tailored Package</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Budget Range</Form.Label>
                        <Form.Select
                          name="budget_range"
                          value={expressForm.budget_range}
                          onChange={handleExpressChange}
                        >
                          <option value="">Select budget range</option>
                          <option value="5000-10000">₱5,000 - ₱10,000</option>
                          <option value="10000-20000">₱10,000 - ₱20,000</option>
                          <option value="20000-50000">₱20,000 - ₱50,000</option>
                          <option value="50000+">₱50,000+</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Menu Preferences</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="menu_preferences"
                      value={expressForm.menu_preferences}
                      onChange={handleExpressChange}
                      placeholder="Any specific coffee or menu items you'd like to include?"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Special Requests</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="special_requests"
                      value={expressForm.special_requests}
                      onChange={handleExpressChange}
                      placeholder="Any special requirements or additional information"
                    />
                  </Form.Group>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    disabled={expressLoading}
                    className="w-100"
                    aria-label="Submit mobile coffee service booking request"
                  >
                    {expressLoading ? 'Submitting...' : 'Submit Booking Request'}
                  </Button>
                </Form>
            </div>
            </section>
          </Tab>
        </Tabs>
      </Container>
    </main>
  );
};

export default InquiriesPage;
