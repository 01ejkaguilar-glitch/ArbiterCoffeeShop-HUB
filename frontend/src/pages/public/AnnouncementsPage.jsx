import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Button, Form, Badge, Pagination } from 'react-bootstrap';
import { FaFacebookF, FaInstagram, FaSearch, FaCalendar } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import LoadingFallback from '../../components/common/LoadingFallback';
import SEO from '../../components/SEO';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'promo', label: 'Promotions' },
    { value: 'event', label: 'Events' },
    { value: 'news', label: 'News' },
    { value: 'update', label: 'Updates' }
  ];

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, debouncedSearch, currentPage]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

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
        params.search = debouncedSearch;
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
      setInitialLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // useEffect on [searchTerm, currentPage] will trigger the fetch automatically
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
    const url = encodeURIComponent(window.location.origin + '/announcements/' + announcement.id);
    const text = encodeURIComponent(announcement.title + ' - Arbiter Coffee Shop');
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      tiktok: `https://www.tiktok.com/@arbitercoffee.ph`,
      instagram: `https://www.instagram.com/arbitercoffee.ph`
    };

    // For platforms that don't support direct sharing, copy to clipboard instead
    if (platform === 'instagram') {
      navigator.clipboard?.writeText(decodeURIComponent(url))
        .then(() => alert('Link copied! Share it on Instagram.'))
        .catch(() => window.open(shareUrls[platform], '_blank', 'width=600,height=400'));
      return;
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (initialLoading) {
    return <LoadingFallback message="Loading announcements..." />;
  }

  return (
    <main role="main">
      <SEO 
        title="Announcements - Latest News & Promotions"
        description="Stay updated with the latest news, promotions, events, and updates from Arbiter Coffee Shop. Don't miss out on special offers and exciting news!"
        keywords="coffee shop announcements, coffee promotions, coffee events, coffee news, Arbiter Coffee updates, special offers"
        url="/announcements"
        canonical={`${window.location.origin}/announcements`}
        type="website"
      />
      
      {/* Hero Section */}
      <section aria-labelledby="announcements-hero-heading" className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <span className="hero-eyebrow">Stay Updated</span>
              <h1 id="announcements-hero-heading" className="hero-title">Announcements</h1>
              <p className="hero-subtitle">
                Stay updated with our latest news, promotions, and events
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        {/* Filters and Search */}
        <Row className="mb-5">
          <Col md={6} className="mb-3">
            <Form onSubmit={handleSearch} role="search" aria-label="Search announcements">
              <Form.Group className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search announcements by keyword"
                  className="border-end-0"
                />
                <Button type="submit" variant="primary" aria-label="Submit search">
                  <FaSearch aria-hidden="true" />
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
              aria-label="Filter by category"
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
        <section aria-labelledby="announcements-list-heading">
          <h2 id="announcements-list-heading" className="visually-hidden">Announcements List</h2>
          <Row className="g-4 mb-5" role="list">
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <Col key={announcement.id} md={6} lg={4} role="listitem">
                  <article className="announcement-card">
                    {announcement.featured_image && (
                      <img
                        className="announcement-img"
                        src={announcement.featured_image}
                        alt={`${announcement.title}${announcement.category ? ` - ${announcement.category} announcement` : ''}`}
                        loading="lazy"
                      />
                    )}
                    <div className="announcement-body">
                      <div className="announcement-meta">
                        <Badge bg={getCategoryBadge(announcement.category)}>
                          {announcement.category}
                        </Badge>
                        <span>
                          <FaCalendar className="me-1" aria-hidden="true" />
                          <time dateTime={announcement.published_at || announcement.created_at}>
                            {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
                          </time>
                        </span>
                      </div>
                      <h3>{announcement.title}</h3>
                      <p className="announcement-excerpt">
                        {(announcement.content || '').substring(0, 150)}...
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-auto pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Button as={Link} to={`/announcements/${announcement.id}`} variant="outline-primary" size="sm">
                          Read More
                        </Button>
                        <div className="d-flex gap-1">
                          <button
                            className="social-share-btn"
                            onClick={() => shareOnSocial('facebook', announcement)}
                            title="Share on Facebook"
                            aria-label="Share this announcement on Facebook"
                          >
                            <FaFacebookF />
                          </button>
                          <button
                            className="social-share-btn"
                            onClick={() => shareOnSocial('tiktok', announcement)}
                            title="Share on TikTok"
                            aria-label="Visit our TikTok page"
                          >
                            <FaTiktok />
                          </button>
                          <button
                            className="social-share-btn"
                            onClick={() => shareOnSocial('instagram', announcement)}
                            title="Share on Instagram"
                            aria-label="Share this announcement on Instagram"
                          >
                            <FaInstagram />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </Col>
              ))
            ) : (
              <Col>
                <div className="text-center py-5">
                  <h4 className="text-muted mb-2">No announcements found</h4>
                  <p className="text-muted">Check back later for updates!</p>
                </div>
              </Col>
            )}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <Row>
              <Col className="d-flex justify-content-center">
                <Pagination aria-label="Announcement pages navigation">
                  <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} aria-label="Go to first page" />
                  <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Go to previous page" />
                  
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                    if (start > 1) pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <Pagination.Item key={i} active={currentPage === i} onClick={() => setCurrentPage(i)}>
                          {i}
                        </Pagination.Item>
                      );
                    }
                    if (end < totalPages) pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
                    return pages;
                  })()}

                  <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Go to next page" />
                  <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} aria-label="Go to last page" />
                </Pagination>
              </Col>
            </Row>
          )}
        </section>
      </Container>
    </main>
  );
};

export default AnnouncementsPage;
