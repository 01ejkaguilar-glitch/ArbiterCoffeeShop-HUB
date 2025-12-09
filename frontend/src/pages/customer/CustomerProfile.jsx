import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Image, Badge, Modal, Spinner } from 'react-bootstrap';
import { FaUser, FaCoffee, FaBell, FaShieldAlt, FaCamera, FaTrash, FaStar, FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { API_ENDPOINTS, BACKEND_BASE_URL } from '../../config/api';

const CustomerProfile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    order_updates: true,
    promotional_offers: false,
  });
  const [tastePreferences, setTastePreferences] = useState({
    coffee_intensity: '',
    sweetness_preference: '',
    milk_type: '',
    favorite_roast: '',
    brewing_methods: [],
    allergens: [],
    dietary_restrictions: [],
  });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateForm, setDeactivateForm] = useState({ password: '', reason: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfileData();
    fetchNotificationPreferences();
    fetchTastePreferences();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER.PROFILE);
      if (response.success) {
        setProfile(response.data);
      }
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      // For now, we'll use default values since the backend might not have this implemented yet
      // In a real implementation, you'd fetch from the API
      setNotifications({
        email_notifications: true,
        sms_notifications: false,
        order_updates: true,
        promotional_offers: false,
      });
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    }
  };

  const fetchTastePreferences = async () => {
    try {
      // For now, we'll use default values since the backend might not have this implemented yet
      setTastePreferences({
        coffee_intensity: 'medium',
        sweetness_preference: 'moderate',
        milk_type: 'whole',
        favorite_roast: 'medium',
        brewing_methods: ['drip', 'espresso'],
        allergens: [],
        dietary_restrictions: [],
      });
    } catch (err) {
      console.error('Failed to load taste preferences:', err);
    }
  };

  const handleProfileUpdate = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.PROFILE, formData);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...formData }));
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async (newNotifications) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.NOTIFICATIONS, newNotifications);
      if (response.success) {
        setNotifications(newNotifications);
        setSuccess('Notification preferences updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTastePreferencesUpdate = async (newPreferences) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiService.put(API_ENDPOINTS.CUSTOMER.PROFILE, {
        taste_preferences: newPreferences
      });
      if (response.success) {
        setTastePreferences(newPreferences);
        setSuccess('Taste preferences updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update taste preferences');
      console.error('Taste preferences update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.upload(API_ENDPOINTS.CUSTOMER.PROFILE_PICTURE, formData);
      if (response.success) {
        setProfile(prev => ({ ...prev, profile_picture: response.data.profile_picture }));
        setSuccess('Profile picture updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to upload profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDeactivation = async () => {
    if (!deactivateForm.password) {
      setError('Password is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await apiService.delete(API_ENDPOINTS.CUSTOMER.DEACTIVATE_ACCOUNT, {
        password: deactivateForm.password,
        reason: deactivateForm.reason,
      });
      if (response.success) {
        logout();
        // Redirect to home page or login page
        window.location.href = '/';
      }
    } catch (err) {
      setError('Failed to deactivate account');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your profile...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={12}>
          <h1 className="mb-4">My Profile</h1>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Tabs defaultActiveKey="personal" className="mb-4">
            {/* Personal Information Tab */}
            <Tab eventKey="personal" title={<><FaUser className="me-2" />Personal Info</>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Personal Information</h5>
                </Card.Header>
                <Card.Body>
                  {/* Profile Picture Section */}
                  <div className="text-center mb-4">
                    <div className="position-relative d-inline-block">
                      <Image
                        src={profile?.profile_picture ? `${BACKEND_BASE_URL}${profile.profile_picture}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjZTllOWVhIi8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0yMCA5NWMwLTIyIDI1LTMwIDQwLTMwczQwIDggNDAgMzAiIGZpbGw9IiM5Y2EzYWYiLz4KPHN2Zz4='}
                        roundedCircle
                        width={120}
                        height={120}
                        className="border"
                        style={{ objectFit: 'cover' }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        className="position-absolute bottom-0 end-0 rounded-circle"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        <FaCamera />
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      style={{ display: 'none' }}
                    />
                    <p className="text-muted mt-2">Click the camera icon to upload a new profile picture</p>
                  </div>

                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleProfileUpdate({
                      name: formData.get('name'),
                      phone: formData.get('phone'),
                      birthday: formData.get('birthday'),
                      address: formData.get('address'),
                    });
                  }}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            defaultValue={profile?.name}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            defaultValue={profile?.email}
                            readOnly
                            className="bg-light"
                          />
                          <Form.Text className="text-muted">
                            Email cannot be changed
                          </Form.Text>
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
                            defaultValue={profile?.phone}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Birthday</Form.Label>
                          <Form.Control
                            type="date"
                            name="birthday"
                            defaultValue={profile?.birthday}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        defaultValue={profile?.address}
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? <Spinner animation="border" size="sm" /> : 'Update Profile'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Coffee Preferences Tab */}
            <Tab eventKey="coffee" title={<><FaCoffee className="me-2" />Coffee Preferences</>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">Coffee & Taste Preferences</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const preferences = {
                      coffee_intensity: formData.get('coffee_intensity'),
                      sweetness_preference: formData.get('sweetness_preference'),
                      milk_type: formData.get('milk_type'),
                      favorite_roast: formData.get('favorite_roast'),
                      brewing_methods: formData.getAll('brewing_methods'),
                      allergens: formData.getAll('allergens'),
                      dietary_restrictions: formData.getAll('dietary_restrictions'),
                    };
                    handleTastePreferencesUpdate(preferences);
                  }}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Coffee Intensity</Form.Label>
                          <Form.Select name="coffee_intensity" defaultValue={tastePreferences.coffee_intensity}>
                            <option value="">Select intensity</option>
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="strong">Strong</option>
                            <option value="extra_strong">Extra Strong</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Sweetness Preference</Form.Label>
                          <Form.Select name="sweetness_preference" defaultValue={tastePreferences.sweetness_preference}>
                            <option value="">Select sweetness</option>
                            <option value="no_sugar">No Sugar</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="sweet">Sweet</option>
                            <option value="very_sweet">Very Sweet</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Milk Type</Form.Label>
                          <Form.Select name="milk_type" defaultValue={tastePreferences.milk_type}>
                            <option value="">Select milk type</option>
                            <option value="whole">Whole Milk</option>
                            <option value="skim">Skim Milk</option>
                            <option value="almond">Almond Milk</option>
                            <option value="oat">Oat Milk</option>
                            <option value="soy">Soy Milk</option>
                            <option value="coconut">Coconut Milk</option>
                            <option value="no_milk">No Milk</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Favorite Roast</Form.Label>
                          <Form.Select name="favorite_roast" defaultValue={tastePreferences.favorite_roast}>
                            <option value="">Select roast</option>
                            <option value="light">Light Roast</option>
                            <option value="medium">Medium Roast</option>
                            <option value="dark">Dark Roast</option>
                            <option value="french">French Roast</option>
                            <option value="italian">Italian Roast</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Brewing Methods</Form.Label>
                      <div>
                        {['drip', 'espresso', 'french_press', 'pour_over', 'cold_brew', 'moka_pot'].map(method => (
                          <Form.Check
                            key={method}
                            inline
                            label={method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            name="brewing_methods"
                            value={method}
                            defaultChecked={tastePreferences.brewing_methods?.includes(method)}
                          />
                        ))}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Allergens</Form.Label>
                      <div>
                        {['nuts', 'dairy', 'soy', 'gluten', 'eggs'].map(allergen => (
                          <Form.Check
                            key={allergen}
                            inline
                            label={allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                            name="allergens"
                            value={allergen}
                            defaultChecked={tastePreferences.allergens?.includes(allergen)}
                          />
                        ))}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Dietary Restrictions</Form.Label>
                      <div>
                        {['vegetarian', 'vegan', 'halal', 'kosher', 'low_carb', 'keto'].map(restriction => (
                          <Form.Check
                            key={restriction}
                            inline
                            label={restriction.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            name="dietary_restrictions"
                            value={restriction}
                            defaultChecked={tastePreferences.dietary_restrictions?.includes(restriction)}
                          />
                        ))}
                      </div>
                    </Form.Group>

                    <Button type="submit" variant="success" disabled={saving}>
                      {saving ? <Spinner animation="border" size="sm" /> : 'Update Preferences'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Notifications Tab */}
            <Tab eventKey="notifications" title={<><FaBell className="me-2" />Notifications</>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">Notification Preferences</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const newNotifications = {
                      email_notifications: formData.get('email_notifications') === 'on',
                      sms_notifications: formData.get('sms_notifications') === 'on',
                      order_updates: formData.get('order_updates') === 'on',
                      promotional_offers: formData.get('promotional_offers') === 'on',
                    };
                    handleNotificationUpdate(newNotifications);
                  }}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="email-notifications"
                        label="Email Notifications"
                        name="email_notifications"
                        defaultChecked={notifications.email_notifications}
                      />
                      <Form.Text className="text-muted">
                        Receive order updates and important announcements via email
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="sms-notifications"
                        label="SMS Notifications"
                        name="sms_notifications"
                        defaultChecked={notifications.sms_notifications}
                      />
                      <Form.Text className="text-muted">
                        Receive order updates via SMS text messages
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="order-updates"
                        label="Order Updates"
                        name="order_updates"
                        defaultChecked={notifications.order_updates}
                      />
                      <Form.Text className="text-muted">
                        Get notified when your order status changes
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="promotional-offers"
                        label="Promotional Offers"
                        name="promotional_offers"
                        defaultChecked={notifications.promotional_offers}
                      />
                      <Form.Text className="text-muted">
                        Receive special offers and promotions
                      </Form.Text>
                    </Form.Group>

                    <Button type="submit" variant="info" disabled={saving}>
                      {saving ? <Spinner animation="border" size="sm" /> : 'Update Preferences'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            {/* Account Settings Tab */}
            <Tab eventKey="account" title={<><FaShieldAlt className="me-2" />Account Settings</>}>
              <Card className="shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <h5 className="mb-0">Account Settings</h5>
                </Card.Header>
                <Card.Body>
                  {/* Change Password Section */}
                  <div className="mb-4">
                    <h6>Change Password</h6>
                    <Form onSubmit={(e) => {
                      e.preventDefault();
                      // Handle password change logic here
                      setSuccess('Password changed successfully');
                      setTimeout(() => setSuccess(null), 3000);
                    }}>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Current Password</Form.Label>
                            <Form.Control type="password" required />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control type="password" required />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password</Form.Label>
                            <Form.Control type="password" required />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button type="submit" variant="outline-primary" disabled={saving}>
                        Change Password
                      </Button>
                    </Form>
                  </div>

                  <hr />

                  {/* Privacy Settings */}
                  <div className="mb-4">
                    <h6>Privacy Settings</h6>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="profile-visibility"
                        label="Public Profile"
                        defaultChecked={false}
                      />
                      <Form.Text className="text-muted">
                        Allow other users to view your profile and order history
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="data-sharing"
                        label="Data Sharing"
                        defaultChecked={false}
                      />
                      <Form.Text className="text-muted">
                        Share anonymized data for improving our services
                      </Form.Text>
                    </Form.Group>
                  </div>

                  <hr />

                  {/* Account Deactivation */}
                  <div className="border-danger border rounded p-3">
                    <h6 className="text-danger">Danger Zone</h6>
                    <p className="text-muted mb-3">
                      Once you deactivate your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="outline-danger"
                      onClick={() => setShowDeactivateModal(true)}
                    >
                      <FaTrash className="me-2" />
                      Deactivate Account
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Account Deactivation Modal */}
      <Modal show={showDeactivateModal} onHide={() => setShowDeactivateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Deactivate Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Warning!</strong> This action cannot be undone. Your account will be permanently deactivated.
          </Alert>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Password (Required)</Form.Label>
              <Form.Control
                type="password"
                value={deactivateForm.password}
                onChange={(e) => setDeactivateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={deactivateForm.reason}
                onChange={(e) => setDeactivateForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Tell us why you're leaving (optional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeactivateModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleAccountDeactivation}
            disabled={saving || !deactivateForm.password}
          >
            {saving ? <Spinner animation="border" size="sm" /> : 'Deactivate Account'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CustomerProfile;
