import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap';
import { FaHeart, FaCoffee, FaStar } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';

const ProductAffinityCard = () => {
  const [affinityData, setAffinityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductAffinity();
  }, []);

  const fetchProductAffinity = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(API_ENDPOINTS.CUSTOMER_INSIGHTS.PRODUCT_AFFINITY);
      if (response.success) {
        setAffinityData(response.data);
      } else {
        setError('Failed to load product affinity');
      }
    } catch (err) {
      setError('Failed to load product affinity');
      console.error('Product affinity fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-100">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading product affinity...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-100">
        <Card.Body>
          <Alert variant="danger" className="mb-0">
            <small>{error}</small>
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  const favoriteProducts = affinityData?.favorite_products || [];
  const favoriteCategories = affinityData?.favorite_categories || [];

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <FaHeart className="text-danger me-2" size={20} />
          <h6 className="mb-0 fw-bold">Your Favorites</h6>
        </div>

        {favoriteProducts.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-2">Top Products</small>
            <ListGroup variant="flush" className="small">
              {favoriteProducts.slice(0, 3).map((product, index) => (
                <ListGroup.Item key={product.id || index} className="px-0 py-2 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaCoffee className="text-primary me-2" size={12} />
                    <span className="fw-medium">{product.name}</span>
                  </div>
                  <Badge bg="light" text="dark" className="fs-6">
                    {product.order_count}x
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {favoriteCategories.length > 0 && (
          <div>
            <small className="text-muted d-block mb-2">Preferred Categories</small>
            <div className="d-flex flex-wrap gap-1">
              {favoriteCategories.slice(0, 4).map((category, index) => (
                <Badge key={index} bg="outline-primary" className="fs-6">
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {favoriteProducts.length === 0 && favoriteCategories.length === 0 && (
          <div className="text-center py-3">
            <FaStar className="text-muted mb-2" size={24} />
            <small className="text-muted">No favorites yet. Start ordering to see your preferences!</small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductAffinityCard;