import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination } from 'react-bootstrap';
import { FaFacebookF, FaTwitter, FaInstagram, FaSearch, FaCalendar } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import Loading from '../../components/common/Loading';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'promo', label: 'Promotions' },
    { value: 'event', label: 'Events' },
    { value: 'news', label: 'News' },
    { value: 'update', label: 'Updates' }
  ];

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedCategory, searchTerm, currentPage]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 9
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiService.get(API_ENDPOINTS.ANNOUNCEMENTS.LIST, params);
      if (response.success) {
        const data = response.data.data || response.data;
        setAnnouncements(Array.isArray(data) ? data : []);
        setTotalPages(response.data.last_page || 1);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAnnouncements();
  };

  const getCategoryBadge = (category) => {
    const badgeColors = {
      promo: 'success',
      event: 'primary',
      news: 'info',
      update: 'warning'
    };
    return badgeColors[category] || 'secondary';
  };

  const shareOnSocial = (platform, announcement) => {
    const url = encodeURIComponent(window.location.href + '/' + announcement.id);
    const text = encodeURIComponent(announcement.title);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      instagram: `https://www.instagram.com/` // Instagram doesn't support direct sharing via URL
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return <Loading message="Loading announcements..." />;
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="hero-title">Announcements</h1>
              <p className="hero-subtitle">
                Stay updated with our latest news, promotions, and events
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        {/* Filters and Search */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Form onSubmit={handleSearch}>
              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="primary" className="ms-2">
                  <FaSearch />
                </Button>
              </Form.Group>
            </Form>
          </Col>
          <Col md={6} className="mb-3">
            <Form.Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Announcements Grid */}
        <Row className="g-4 mb-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Col key={announcement.id} md={6} lg={4}>
                <Card className="h-100 shadow-sm hover-shadow">
                  {announcement.featured_image && (
                    <Card.Img
                      variant="top"
                      src={announcement.featured_image}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="mb-2">
                      <Badge bg={getCategoryBadge(announcement.category)} className="me-2">
                        {announcement.category}
                      </Badge>
                      <small className="text-muted">
                        <FaCalendar className="me-1" />
                        {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <Card.Title>{announcement.title}</Card.Title>
                    <Card.Text className="flex-grow-1">
                      {announcement.content.substring(0, 150)}...
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <Button variant="outline-primary" size="sm">
                        Read More
                      </Button>
                      <div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1"
                          onClick={() => shareOnSocial('facebook', announcement)}
                          title="Share on Facebook"
                        >
                          <FaFacebookF />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1"
                          onClick={() => shareOnSocial('twitter', announcement)}
                          title="Share on Twitter"
                        >
                          <FaTwitter />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-1"
                          onClick={() => shareOnSocial('instagram', announcement)}
                          title="Share on Instagram"
                        >
                          <FaInstagram />
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Card className="text-center py-5">
                <Card.Body>
                  <h4 className="text-muted">No announcements found</h4>
                  <p className="text-muted">Check back later for updates!</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>

        {/* Pagination */}
        {totalPages > 1 && (
          <Row>
            <Col className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={currentPage === index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default AnnouncementsPage;
