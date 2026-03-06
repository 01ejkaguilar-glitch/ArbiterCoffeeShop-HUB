import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component for managing page meta tags
 * Supports Open Graph and Twitter Card tags
 */
const SEO = ({
  title,
  description,
  type = 'website',
  image,
  url,
  canonical,
  keywords,
  author = 'Arbiter Coffee Shop',
  publishedTime,
  modifiedTime,
  productPrice,
  productCurrency = 'PHP',
  productAvailability = 'in stock'
}) => {
  // Base URL for the application
  const baseUrl = window.location.origin;
  
  // Default values
  const defaultTitle = 'Arbiter Coffee - Premium Artisan Coffee Shop';
  const defaultDescription = 'Experience the finest artisan coffee, crafted with passion. Order online for delivery or pickup from Arbiter Coffee Shop.';
  const defaultImage = `${baseUrl}/assets/images/logo.png`;
  
  // Full title with site name
  const fullTitle = title ? `${title} | Arbiter Coffee` : defaultTitle;
  
  // Full URL (use canonical if provided, otherwise url, otherwise current page)
  const fullUrl = canonical || (url ? `${baseUrl}${url}` : window.location.href);
  
  // Full image URL
  const fullImage = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : defaultImage;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Tags (Facebook, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Arbiter Coffee" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Product specific tags */}
      {type === 'product' && productPrice && (
        <>
          <meta property="product:price:amount" content={productPrice} />
          <meta property="product:price:currency" content={productCurrency} />
          <meta property="product:availability" content={productAvailability} />
        </>
      )}
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || defaultTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@ArbiterCoffee" />
      <meta name="twitter:creator" content="@ArbiterCoffee" />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  type: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  canonical: PropTypes.string,
  keywords: PropTypes.string,
  author: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  productPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  productCurrency: PropTypes.string,
  productAvailability: PropTypes.string
};

export default SEO;
