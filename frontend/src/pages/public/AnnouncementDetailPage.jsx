import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Badge, Button } from 'react-bootstrap';
import { FaCalendar, FaArrowLeft, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import LoadingFallback from '../../components/common/LoadingFallback';
import SEO from '../../components/SEO';

const getCategoryBadge = (category) => {
  const map = {
    promo: 'success',
    event: 'primary',
    news: 'info',
    update: 'warning',
  };
  return map[category] || 'secondary';
};

const AnnouncementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await apiService.get(API_ENDPOINTS.ANNOUNCEMENTS.DETAIL(id));
        if (response.success && response.data) {
          setAnnouncement(response.data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching announcement:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent((announcement?.title || '') + ' - Arbiter Coffee Shop');

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      tiktok: `https://www.tiktok.com/@arbitercoffee.ph`,
      instagram: `https://www.instagram.com/arbitercoffee.ph`,
    };

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

  if (loading) {
    return <LoadingFallback message="Loading announcement..." />;
  }

  if (notFound || !announcement) {
    return (
      <main role="main">
        <Container className="py-5 text-center">
          <h2 className="mb-3">Announcement Not Found</h2>
          <p className="text-muted mb-4">This announcement may have been removed or is no longer available.</p>
          <Button as={Link} to="/announcements" variant="primary">
            <FaArrowLeft className="me-2" /> Back to Announcements
          </Button>
        </Container>
      </main>
    );
  }

  const publishedDate = new Date(announcement.published_at || announcement.created_at);

  return (
    <main role="main">
      <SEO
        title={`${announcement.title} - Arbiter Coffee Shop`}
        description={(announcement.content || '').substring(0, 160)}
        url={`/announcements/${id}`}
        canonical={`${window.location.origin}/announcements/${id}`}
        type="article"
      />

      {/* Hero */}
      <section className="hero-section" aria-labelledby="announcement-detail-heading">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <span className="hero-eyebrow">
                <Badge bg={getCategoryBadge(announcement.category)} className="text-capitalize">
                  {announcement.category}
                </Badge>
              </span>
              <h1 id="announcement-detail-heading" className="hero-title mt-2">
                {announcement.title}
              </h1>
              <p className="hero-subtitle d-flex align-items-center justify-content-center gap-2">
                <FaCalendar aria-hidden="true" />
                <time dateTime={announcement.published_at || announcement.created_at}>
                  {publishedDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        {/* Back link */}
        <Row className="mb-4">
          <Col>
            <Button
              variant="link"
              className="p-0 text-muted d-flex align-items-center gap-2"
              onClick={() => navigate(-1)}
              style={{ textDecoration: 'none' }}
            >
              <FaArrowLeft /> Back to Announcements
            </Button>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={8}>
            <article className="announcement-card" style={{ border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              {/* Featured image */}
              {announcement.featured_image && (
                <img
                  className="announcement-img"
                  src={announcement.featured_image}
                  alt={announcement.title}
                  style={{ maxHeight: '420px', objectFit: 'cover' }}
                />
              )}

              <div className="announcement-body" style={{ padding: '2rem' }}>
                {/* Full content */}
                <div
                  style={{ lineHeight: 1.85, color: 'var(--color-text, #333)', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}
                >
                  {announcement.content}
                </div>

                {/* Share row */}
                <div
                  className="d-flex justify-content-between align-items-center mt-4 pt-3"
                  style={{ borderTop: '1px solid var(--color-border, #eee)' }}
                >
                  <span className="text-muted" style={{ fontSize: '0.875rem' }}>Share this announcement</span>
                  <div className="d-flex gap-2">
                    <button
                      className="social-share-btn"
                      onClick={() => shareOnSocial('facebook')}
                      title="Share on Facebook"
                      aria-label="Share on Facebook"
                    >
                      <FaFacebookF />
                    </button>
                    <button
                      className="social-share-btn"
                      onClick={() => shareOnSocial('tiktok')}
                      title="Share on TikTok"
                      aria-label="Visit our TikTok page"
                    >
                      <FaTiktok />
                    </button>
                    <button
                      className="social-share-btn"
                      onClick={() => shareOnSocial('instagram')}
                      title="Share on Instagram"
                      aria-label="Share on Instagram"
                    >
                      <FaInstagram />
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Back button */}
            <div className="mt-4 text-center">
              <Button as={Link} to="/announcements" variant="outline-primary">
                <FaArrowLeft className="me-2" /> All Announcements
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default AnnouncementDetailPage;
