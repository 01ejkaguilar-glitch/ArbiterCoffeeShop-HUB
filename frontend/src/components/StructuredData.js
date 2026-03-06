import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * StructuredData Component for Schema.org JSON-LD markup
 * Helps search engines understand page content for rich snippets
 */
const StructuredData = ({ data, type }) => {
  // Ensure data has @context and @type
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

StructuredData.propTypes = {
  data: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired
};

/**
 * Organization Schema for Business Information
 */
export const OrganizationSchema = ({ 
  name = 'Arbiter Coffee',
  url,
  logo,
  description,
  address,
  telephone,
  email,
  openingHours,
  priceRange,
  servesCuisine = 'Coffee'
}) => {
  const baseUrl = window.location.origin;
  
  const organizationData = {
    name,
    url: url || baseUrl,
    logo: logo || `${baseUrl}/assets/images/logo.png`,
    description: description || 'Premium artisan coffee shop offering specialty coffee, espresso, and handcrafted beverages.',
    '@type': 'CoffeeShop',
    servesCuisine,
    priceRange: priceRange || '₱₱',
  };

  // Add address if provided
  if (address) {
    organizationData.address = {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      addressLocality: address.city,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country || 'PH'
    };
  }

  // Add contact information
  if (telephone || email) {
    organizationData.contactPoint = {
      '@type': 'ContactPoint',
      telephone: telephone,
      email: email,
      contactType: 'customer service'
    };
  }

  // Add opening hours
  if (openingHours) {
    organizationData.openingHoursSpecification = openingHours.map(hours => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes
    }));
  }

  return <StructuredData data={organizationData} type="CoffeeShop" />;
};

/**
 * Product Schema for Product Pages
 */
export const ProductSchema = ({ product }) => {
  const baseUrl = window.location.origin;
  
  const productData = {
    name: product.name,
    description: product.description,
    image: product.image_url ? `${baseUrl}${product.image_url}` : `${baseUrl}/assets/images/product-placeholder.png`,
    sku: product.id?.toString(),
    brand: {
      '@type': 'Brand',
      name: 'Arbiter Coffee'
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'PHP',
      availability: product.stock_quantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/products/${product.id}`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: 'Arbiter Coffee'
      }
    }
  };

  // Add category if available
  if (product.category) {
    productData.category = product.category.name;
  }

  // Add aggregate rating if available (placeholder for future implementation)
  if (product.rating && product.review_count) {
    productData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
      bestRating: 5,
      worstRating: 1
    };
  }

  return <StructuredData data={productData} type="Product" />;
};

/**
 * BreadcrumbList Schema for Navigation
 */
export const BreadcrumbSchema = ({ items }) => {
  const baseUrl = window.location.origin;
  
  const breadcrumbData = {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${baseUrl}${item.url}` : undefined
    }))
  };

  return <StructuredData data={breadcrumbData} type="BreadcrumbList" />;
};

/**
 * WebSite Schema with Site Search
 */
export const WebSiteSchema = () => {
  const baseUrl = window.location.origin;
  
  const websiteData = {
    url: baseUrl,
    name: 'Arbiter Coffee',
    description: 'Premium artisan coffee shop - Order specialty coffee online for delivery or pickup',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return <StructuredData data={websiteData} type="WebSite" />;
};

/**
 * FAQPage Schema (for future use)
 */
export const FAQSchema = ({ faqs }) => {
  const faqData = {
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return <StructuredData data={faqData} type="FAQPage" />;
};

export default StructuredData;
