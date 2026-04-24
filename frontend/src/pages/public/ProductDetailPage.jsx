import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { FaShoppingCart, FaMinus, FaPlus, FaHeart, FaRegHeart, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { BACKEND_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoadingFallback from '../../components/common/LoadingFallback';
import ProductRecommendations from '../../components/public/ProductRecommendations';
import { useProduct } from '../../hooks/useProducts';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import SwipeableGallery from '../../components/mobile/SwipeableGallery';
import SEO from '../../components/SEO';
import { ProductSchema, BreadcrumbSchema } from '../../components/StructuredData';
import { addToRecentlyViewed, removeFromRecentlyViewed } from '../../components/product/RecentlyViewed';
import { useToast } from '../../components/animations/Toast';
import apiService from '../../services/api.service';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const { data: product, isLoading: loading, isError } = useProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // If the product no longer exists (404), evict it from recently-viewed localStorage
  useEffect(() => {
    if (isError && id) removeFromRecentlyViewed(Number(id));
  }, [isError, id]);

  // Add to recently viewed when product loads
  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
    }
  }, [product]);

  // Check if product is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (user && product) {
        try {
          const response = await apiService.get(API_ENDPOINTS.CUSTOMER.FAVORITES);
          if (response.success && response.data) {
            const isFav = response.data.some(fav => fav.product.id === product.id);
            setIsFavorite(isFav);
          }
        } catch (error) {
          console.error('Error checking favorites:', error);
        }
      }
    };
    checkFavorite();
  }, [user, product]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    try {
      const result = await addToCart(product, quantity, specialInstructions);
      if (result.success) {
        toast.success(`${product.name} added to cart!`);
      } else {
        toast.error(result.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.warning('Please login to add favorites');
      return;
    }

    try {
      const response = await apiService.post(API_ENDPOINTS.CUSTOMER.TOGGLE_FAVORITE, {
        product_id: product.id
      });

      if (response.success) {
        setIsFavorite(response.data.is_favorited);
        if (response.data.is_favorited) {
          toast.success('Added to favorites!');
        } else {
          toast.info('Removed from favorites');
        }
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return <LoadingFallback message="Loading product..." />;
  }

  if (isError || !product) {
    return (
      <Container className="py-5 text-center">
        <h2>Product not found</h2>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/products')}>
          Back to Products
        </button>
      </Container>
    );
  }

  const productImage = product.image_url
    ? `${BACKEND_BASE_URL}${product.image_url}`
    : '/assets/images/product-placeholder.png';

  const isInStock = product.stock_quantity > 0;

  return (
    <main role="main">
      <Container className="py-4 py-md-5">
        {/* SwipeableGallery for product images (mobile) */}
        {product && product.images && product.images.length > 0 && (
          <div className="d-md-none mb-3">
            <SwipeableGallery images={product.images} altPrefix={product.name} />
          </div>
        )}
        <SEO
          title={product.name}
          description={product.description || `${product.name} - Premium product from Arbiter Coffee Hub.`}
          keywords={`${product.name}, coffee, ${product.category?.name || 'coffee product'}, Arbiter Coffee`}
          url={`/products/${product.id}`}
          canonical={`${window.location.origin}/products/${product.id}`}
          type="product"
          image={productImage}
          productPrice={product.price}
          productCurrency="PHP"
          productAvailability={isInStock ? 'in stock' : 'out of stock'}
        />
        <ProductSchema product={product} />
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: '/' },
            { name: 'Products', url: '/products' },
            { name: product.name, url: `/products/${product.id}` },
          ]}
        />

        {/* Main layout */}
        <div className="pdp-layout" itemScope itemType="https://schema.org/Product">

          {/* Image column */}
          <div className="pdp-image-col">
            <div className="pdp-image-wrapper">
              <img
                src={productImage}
                alt={product.name}
                className="pdp-image"
                onError={(e) => { e.target.src = '/assets/images/product-placeholder.png'; }}
              />
            </div>
          </div>

          {/* Info column */}
          <div className="pdp-info">
            {product.category && (
              <span className="pdp-category">{product.category.name}</span>
            )}

            <div className="pdp-title-row">
              <h1 className="pdp-title" itemProp="name">{product.name}</h1>
              <button
                onClick={handleToggleFavorite}
                className={`pdp-favorite-btn${isFavorite ? ' active' : ''}`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
              </button>
            </div>

            <div className="pdp-price" itemProp="price">₱{parseFloat(product.price).toFixed(2)}</div>

            <span className={`pdp-stock-badge ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
              {isInStock
                ? <><FaCheckCircle size={11} /> In Stock</>
                : <><FaTimesCircle size={11} /> Out of Stock</>}
            </span>

            <div className="pdp-divider" />

            {product.description && (
              <p className="pdp-description" itemProp="description">{product.description}</p>
            )}

            {isInStock ? (
              <div className="pdp-purchase-card">
                <div className="pdp-quantity-label">Quantity</div>
                <div className="pdp-quantity-row">
                  <button
                    className="pdp-qty-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <FaMinus size={11} />
                  </button>
                  <span className="pdp-qty-value" aria-live="polite">{quantity}</span>
                  <button
                    className="pdp-qty-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock_quantity}
                    aria-label="Increase quantity"
                  >
                    <FaPlus size={11} />
                  </button>
                </div>
                <div className="pdp-stock-hint">{product.stock_quantity} units available</div>

                <label htmlFor="pdp-instructions" className="pdp-instructions-label">
                  Special Instructions{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
                </label>
                <textarea
                  id="pdp-instructions"
                  rows={2}
                  className="form-control pdp-instructions-input"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for this item?"
                />

                <button
                  className="pdp-add-to-cart"
                  onClick={handleAddToCart}
                  aria-label={`Add ${quantity} ${product.name} to cart`}
                >
                  <FaShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            ) : (
              <div className="pdp-out-of-stock-notice">
                This item is currently unavailable. Check back soon.
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="pdp-recommendations">
          <ProductRecommendations currentProductId={product.id} />
        </div>


      </Container>
      <BottomNavigation />
    </main>
  );
};

export default ProductDetailPage;
