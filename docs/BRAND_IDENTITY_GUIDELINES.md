# Arbiter Coffee Shop - Brand Identity & Design System Guidelines
# Phase 4.1: Design System & Branding

**Version:** 1.0  
**Date:** February 1, 2026  
**Status:** ✅ Complete  

---

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Library](#component-library)
6. [Design Patterns](#design-patterns)
7. [Usage Guidelines](#usage-guidelines)
8. [Implementation Guide](#implementation-guide)

---

## Brand Overview

### Brand Identity

**Arbiter Coffee Shop** is a premium coffee brand that embodies:
- **Quality & Craftsmanship:** Every cup is carefully crafted with attention to detail
- **Sustainability:** Environmentally conscious sourcing and operations
- **Community:** A welcoming space for coffee lovers to connect
- **Innovation:** Modern technology meets traditional coffee-making expertise

### Brand Personality

- **Sophisticated yet Approachable:** Premium quality without pretension
- **Warm & Inviting:** Like the perfect cup of coffee
- **Professional & Reliable:** Consistent excellence in every interaction
- **Modern & Tech-Savvy:** Digital-first experience with human touch

### Visual Style

- **Clean & Modern:** Minimalist design with purposeful elements
- **Natural & Organic:** Earth tones inspired by coffee and nature
- **Balanced & Harmonious:** Proper spacing and visual hierarchy
- **Accessible & Inclusive:** WCAG 2.1 Level AA compliance throughout

---

## Color System

Our color system is built on a foundation of WCAG AA-compliant colors that meet accessibility standards while maintaining brand identity.

### Primary Colors

#### Dark Green - Brand Primary
```css
--color-dark-green: #006837;
```
- **Usage:** Primary buttons, headers, key CTAs
- **Contrast:** 4.86:1 on white (WCAG AA)
- **Psychology:** Trust, growth, stability
- **DO:** Use for primary actions, brand elements
- **DON'T:** Use for backgrounds or large text areas

#### Medium Green - Brand Secondary
```css
--color-medium-green: #009245;
```
- **Usage:** Secondary buttons, accents, highlights
- **Contrast:** 3.68:1 on white (large text only)
- **Psychology:** Energy, freshness, vitality
- **DO:** Use for secondary actions, hover states
- **DON'T:** Use for small text on white backgrounds

#### Black - Text Primary
```css
--color-primary-black: #1A1A1A;
```
- **Usage:** Body text, headings, high-emphasis text
- **Contrast:** 16.94:1 on white (WCAG AAA)
- **Psychology:** Authority, clarity, professionalism
- **DO:** Use for all primary text content
- **DON'T:** Use pure black (#000000) - too harsh

#### White - Background
```css
--color-white: #FFFFFF;
```
- **Usage:** Primary background, cards, modals
- **Psychology:** Clean, pure, spacious
- **DO:** Use for main content areas
- **DON'T:** Use off-white unless for subtle differentiation

### Text Colors

| Color | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| Primary | `#1A1A1A` | 16.94:1 | Body text, headings |
| Secondary | `#4A4A4A` | 7.59:1 | Supporting text, labels |
| Muted | `#666666` | 5.74:1 | Placeholders, hints |
| On Dark | `#FFFFFF` | 16.94:1 | Text on dark backgrounds |

**Code Example:**
```css
/* Primary heading */
h1 {
  color: var(--color-text-primary);
}

/* Secondary description */
.description {
  color: var(--color-text-secondary);
}

/* Muted hint */
.hint-text {
  color: var(--color-text-muted);
}
```

### Link Colors

| State | Hex | Contrast | Usage |
|-------|-----|----------|-------|
| Default | `#005A29` | 5.25:1 | Standard link color |
| Hover | `#003D1A` | 7.21:1 | Hover/focus state |
| Visited | `#6B4FA0` | 5.12:1 | Visited links |
| Active | `#006837` | 4.86:1 | Click/active state |

**Code Example:**
```css
/* Standard link */
a {
  color: var(--color-link-default);
}

a:hover {
  color: var(--color-link-hover);
}
```

### Status/Semantic Colors

All status colors include icons to meet WCAG SC 1.4.1 (Use of Color).

#### Success
```css
--color-success: #2D7A2F;        /* 4.52:1 */
--color-success-bg: #E8F5E9;
--color-success-border: #4CAF50;
```
**Usage:** Success messages, completed states, in-stock indicators  
**Icon:** FaCheckCircle

#### Danger/Error
```css
--color-danger: #C41E3A;         /* 5.51:1 */
--color-danger-bg: #FFEBEE;
--color-danger-border: #E53935;
```
**Usage:** Error messages, destructive actions, out-of-stock  
**Icon:** FaTimesCircle, FaExclamationTriangle

#### Warning
```css
--color-warning: #9B6B00;        /* 4.61:1 */
--color-warning-bg: #FFF9E6;
--color-warning-border: #FFA000;
```
**Usage:** Warning messages, cautionary states, low stock  
**Icon:** FaExclamationTriangle

#### Info
```css
--color-info: #0D5F8F;          /* 4.58:1 */
--color-info-bg: #E3F2FD;
--color-info-border: #2196F3;
```
**Usage:** Informational messages, tips, updates  
**Icon:** FaInfoCircle

**Code Example:**
```jsx
/* Success badge with icon */
<Badge bg="success">
  <FaCheckCircle className="me-1" aria-hidden="true" />
  In Stock
</Badge>

/* Danger badge with icon */
<Badge bg="danger">
  <FaTimesCircle className="me-1" aria-hidden="true" />
  Out of Stock
</Badge>
```

### Background Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Light | `#F8F9FA` | Subtle backgrounds, cards, sections |
| Medium | `#E9ECEF` | Hover states, disabled states |
| Dark | `#1A1A1A` | Dark mode, headers, footers |

### Border Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Light | `#E0E0E0` | Default borders, dividers |
| Medium | `#CCCCCC` | Hover borders |
| Dark | `#999999` | Active borders |
| Focus | `#003D1A` | Focus indicators (7.5:1 contrast) |

---

## Typography

Our typography system uses a modular scale (1.250 - Major Third) for consistent sizing and a clear visual hierarchy.

### Font Families

#### Headings - Playfair Display
```css
--font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
```
- **Character:** Elegant, sophisticated, classic
- **Usage:** H1-H6, brand name, key titles
- **Weights:** 400 (Regular), 700 (Bold), 800 (Extra Bold)
- **Fallback:** Georgia, Times New Roman, serif

**Why Playfair Display?**
- Premium feel that matches coffee culture
- Excellent readability in large sizes
- Strong brand presence
- Good web font performance

#### Body - Inter
```css
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```
- **Character:** Modern, clean, highly readable
- **Usage:** Body text, UI elements, data
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Fallback:** System fonts for performance

**Why Inter?**
- Designed for screens and UI
- Excellent legibility at all sizes
- Wide character set
- Variable font support

#### Monospace - Fira Code
```css
--font-mono: 'Fira Code', 'Courier New', Consolas, Monaco, monospace;
```
- **Character:** Technical, precise
- **Usage:** Code snippets, order IDs, SKUs
- **Features:** Ligatures for code

### Font Sizes

Modular scale (1.250 ratio) for harmonious sizing:

| Name | Size | Pixels | Usage |
|------|------|--------|-------|
| xs | `0.64rem` | 10.24px | Fine print, timestamps |
| sm | `0.8rem` | 12.8px | Small text, captions |
| base | `1rem` | 16px | Body text (default) |
| md | `1.25rem` | 20px | Subheadings, emphasis |
| lg | `1.563rem` | 25px | H5 |
| xl | `1.953rem` | 31.25px | H4, section titles |
| 2xl | `2.441rem` | 39.06px | H3 |
| 3xl | `3.052rem` | 48.83px | H2 |
| 4xl | `3.815rem` | 61.04px | H1, hero text |

**Code Example:**
```css
/* Page heading */
h1 {
  font-size: var(--font-size-4xl);  /* 61.04px */
  font-family: var(--font-heading);
}

/* Section heading */
h2 {
  font-size: var(--font-size-3xl);  /* 48.83px */
}

/* Body text */
p {
  font-size: var(--font-size-base);  /* 16px */
  font-family: var(--font-body);
}
```

### Font Weights

| Name | Value | Usage |
|------|-------|-------|
| Light | 300 | Subtle text, decorative |
| Normal | 400 | Body text, paragraphs |
| Medium | 500 | Labels, UI text |
| Semibold | 600 | Subheadings, emphasis |
| Bold | 700 | Headings, strong emphasis |
| Extra Bold | 800 | Headings (Playfair only) |

### Line Heights

| Name | Value | Usage |
|------|-------|-------|
| Tight | 1.2 | Headings, large text |
| Snug | 1.375 | Short paragraphs |
| Normal | 1.5 | Body text (default) |
| Relaxed | 1.625 | Long-form content |
| Loose | 2 | Poems, special content |

### Typography Examples

```css
/* Hero Heading */
.hero-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

/* Section Heading */
.section-heading {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  margin-bottom: var(--spacing-6);
}

/* Body Text */
.body-text {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* Small Text */
.small-text {
  font-family: var(--font-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-snug);
  color: var(--color-text-secondary);
}
```

---

## Spacing System

8px base unit for consistent rhythm and alignment.

### Spacing Scale

| Name | Value | Pixels | Usage |
|------|-------|--------|-------|
| 0 | `0` | 0px | No spacing |
| 1 | `0.25rem` | 4px | Tight spacing, inline elements |
| 2 | `0.5rem` | 8px | Base unit, default spacing |
| 3 | `0.75rem` | 12px | Comfortable spacing |
| 4 | `1rem` | 16px | Component spacing |
| 5 | `1.25rem` | 20px | Card padding |
| 6 | `1.5rem` | 24px | Section spacing |
| 8 | `2rem` | 32px | Large spacing |
| 10 | `2.5rem` | 40px | Extra large spacing |
| 12 | `3rem` | 48px | Section gaps |
| 16 | `4rem` | 64px | Major sections |
| 20 | `5rem` | 80px | Page sections |
| 24 | `6rem` | 96px | Page padding |

### Semantic Spacing

```css
--spacing-component-gap: var(--spacing-4);  /* 16px between components */
--spacing-section-gap: var(--spacing-12);   /* 48px between sections */
--spacing-page-padding: var(--spacing-8);   /* 32px page padding */
```

### Spacing Examples

```css
/* Card with proper padding */
.card {
  padding: var(--spacing-6);          /* 24px */
  margin-bottom: var(--spacing-4);    /* 16px */
}

/* Button with balanced padding */
.button {
  padding: var(--spacing-3) var(--spacing-6);  /* 12px 24px */
}

/* Section with generous spacing */
.section {
  padding: var(--spacing-12) 0;      /* 48px vertical */
  margin-bottom: var(--spacing-16);   /* 64px between sections */
}

/* Tight element spacing */
.icon-text {
  gap: var(--spacing-2);              /* 8px between icon and text */
}
```

---

## Component Library

### Buttons

#### Primary Button
```jsx
<Button variant="primary" size="lg">
  Order Now
</Button>
```

**Specs:**
- Background: `--color-dark-green` (#006837)
- Text: `--color-white`
- Padding: `12px 24px` (default)
- Border radius: `6px`
- Font weight: 600 (semibold)
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Hover: Darker green, lift effect, larger shadow
- Disabled: Gray background, reduced opacity

**States:**
```css
/* Default */
.btn-primary {
  background: #006837;
  transform: translateY(0);
}

/* Hover */
.btn-primary:hover {
  background: #005028;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Active */
.btn-primary:active {
  transform: translateY(0);
}

/* Disabled */
.btn-primary:disabled {
  background: #E0E0E0;
  color: #999999;
  cursor: not-allowed;
}
```

#### Button Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| Small | `8px 16px` | 12.8px | Compact actions, tables |
| Default | `12px 24px` | 16px | Standard actions |
| Large | `16px 32px` | 20px | Primary CTAs, hero sections |

### Cards

#### Product Card
```jsx
<Card className="product-card">
  <Card.Img variant="top" src={product.image} />
  <Card.Body>
    <Card.Title>{product.name}</Card.Title>
    <Card.Text>{product.description}</Card.Text>
    <Button variant="primary">View Details</Button>
  </Card.Body>
</Card>
```

**Specs:**
- Border: `1px solid #E0E0E0`
- Border radius: `8px`
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Padding: `24px`
- Hover: Lift effect (`translateY(-2px)`), larger shadow

**States:**
```css
/* Default */
.card {
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease-out;
}

/* Hover */
.card:hover {
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### Forms

#### Text Input
```jsx
<Form.Group>
  <Form.Label htmlFor="email">
    Email <span aria-label="required">*</span>
  </Form.Label>
  <Form.Control
    id="email"
    type="email"
    placeholder="your@email.com"
    aria-required="true"
  />
</Form.Group>
```

**Specs:**
- Height: `40px` (default)
- Padding: `8px 16px`
- Border: `1px solid #E0E0E0`
- Border radius: `6px`
- Focus: `2px solid #003D1A`, green shadow

**States:**
```css
/* Default */
.form-control {
  height: 40px;
  padding: 8px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
}

/* Focus */
.form-control:focus {
  border: 2px solid #003D1A;
  box-shadow: 0 0 0 3px rgba(0, 104, 55, 0.1);
  outline: none;
}

/* Error */
.form-control.is-invalid {
  border-color: #C41E3A;
}
```

### Badges

#### Status Badge
```jsx
<Badge bg="success">
  <FaCheckCircle className="me-1" aria-hidden="true" />
  In Stock
</Badge>
```

**Specs:**
- Padding: `4px 12px`
- Border radius: `9999px` (pill shape)
- Font size: `12.8px`
- Font weight: 600 (semibold)
- Icon + text pattern (WCAG SC 1.4.1)

### Modals

```jsx
<Modal show={show} onHide={handleClose}>
  <Modal.Header closeButton>
    <Modal.Title>Modal Title</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Content goes here
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSave}>
      Save Changes
    </Button>
  </Modal.Footer>
</Modal>
```

**Specs:**
- Border radius: `16px`
- Shadow: `0 35px 60px rgba(0, 0, 0, 0.3)`
- Max width: `672px`
- Padding: `24px`
- Backdrop: `rgba(0, 0, 0, 0.5)`
- Animation: Fade in + scale in

---

## Design Patterns

### Product Display Pattern

```jsx
<div className="product-grid">
  {products.map(product => (
    <Card key={product.id} className="product-card">
      <div className="product-image-wrapper">
        <Card.Img 
          variant="top" 
          src={product.image_url} 
          alt={`${product.name} - ${product.category.name}`}
          loading="lazy"
        />
        <Badge bg={product.stock_quantity > 0 ? "success" : "danger"} 
               className="stock-badge">
          {product.stock_quantity > 0 ? (
            <><FaCheckCircle aria-hidden="true" /> In Stock</>
          ) : (
            <><FaTimesCircle aria-hidden="true" /> Out of Stock</>
          )}
        </Badge>
      </div>
      <Card.Body>
        <Card.Title as="h3">{product.name}</Card.Title>
        <p className="text-muted small">{product.category.name}</p>
        <Card.Text className="product-description">
          {product.description}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <span className="price">₱{parseFloat(product.price).toFixed(2)}</span>
          <Button variant="primary" size="sm">
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  ))}
</div>
```

### Data Table Pattern

```jsx
<Table striped hover responsive>
  <thead>
    <tr>
      <th>Order ID</th>
      <th>Customer</th>
      <th>Total</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {orders.map(order => (
      <tr key={order.id}>
        <td><code>{order.id}</code></td>
        <td>{order.customer.name}</td>
        <td>₱{parseFloat(order.total_amount).toFixed(2)}</td>
        <td>{getStatusBadge(order.status)}</td>
        <td>
          <Button variant="link" size="sm" aria-label={`View order ${order.id}`}>
            <FaEye />
          </Button>
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

### Form Pattern

```jsx
<Form onSubmit={handleSubmit} aria-labelledby="form-title" noValidate>
  <h2 id="form-title">Contact Us</h2>
  
  <Form.Group className="mb-3">
    <Form.Label htmlFor="name">
      Name <span aria-label="required">*</span>
    </Form.Label>
    <Form.Control
      id="name"
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      required
      aria-required="true"
      aria-invalid={errors.name ? "true" : "false"}
      aria-describedby={errors.name ? "name-error" : undefined}
    />
    {errors.name && (
      <Form.Text id="name-error" className="text-danger" role="alert">
        {errors.name}
      </Form.Text>
    )}
  </Form.Group>
  
  <Button type="submit" variant="primary" disabled={loading}>
    {loading ? 'Sending...' : 'Send Message'}
  </Button>
</Form>
```

---

## Usage Guidelines

### DO's and DON'Ts

#### Colors

**✅ DO:**
- Use primary green for main CTAs and brand elements
- Always pair status colors with icons
- Ensure all color combinations meet WCAG AA (4.5:1 minimum)
- Use semantic colors for their intended purpose (success = green, danger = red)

**❌ DON'T:**
- Don't use pure black (#000000) - use #1A1A1A
- Don't rely on color alone to convey information
- Don't use green for error messages or red for success
- Don't create custom colors without checking contrast ratios

#### Typography

**✅ DO:**
- Use Playfair Display for headings only
- Use Inter for all body text and UI
- Maintain the modular scale for font sizing
- Use proper line heights (1.5 for body, 1.2 for headings)

**❌ DON'T:**
- Don't use Playfair Display for body text
- Don't create custom font sizes outside the scale
- Don't use font weights not defined in the system
- Don't mix more than 2 font families on a page

#### Spacing

**✅ DO:**
- Use the 8px base unit for all spacing
- Be consistent with component spacing (var(--spacing-4))
- Use generous whitespace for breathing room
- Maintain vertical rhythm with consistent spacing

**❌ DON'T:**
- Don't use arbitrary pixel values (use tokens)
- Don't pack elements too tightly
- Don't mix spacing scales
- Don't forget responsive spacing adjustments

#### Components

**✅ DO:**
- Use Bootstrap components with our custom theme
- Follow established patterns for common elements
- Include ARIA attributes for accessibility
- Test components in all states (hover, focus, disabled)

**❌ DON'T:**
- Don't create custom components without design review
- Don't override Bootstrap with !important unless necessary
- Don't forget mobile responsive behavior
- Don't skip accessibility attributes

---

## Implementation Guide

### Getting Started

1. **Import CSS in correct order:**
```javascript
// index.js or App.js
import 'bootstrap/dist/css/bootstrap.min.css';  // Bootstrap base
import './styles/colors.css';                    // Color tokens (Phase 3.3)
import './styles/design-system.css';            // Design system tokens
import './styles/theme.css';                     // Legacy theme
import './styles/bootstrap-theme.css';           // Bootstrap overrides
import './index.css';                            // App-specific styles
import './App.css';                              // Component styles
```

2. **Use design tokens in components:**
```css
/* Component CSS */
.my-component {
  padding: var(--spacing-6);
  background-color: var(--color-white);
  border: var(--border-width-thin) solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
}

.my-component:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

3. **Apply utility classes:**
```jsx
<div className="p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-4">Heading</h2>
  <p className="text-base text-secondary">Content</p>
</div>
```

### Migration from Legacy Code

**Before:**
```css
.button {
  padding: 12px 24px;
  background-color: #006837;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}
```

**After:**
```css
.button {
  padding: var(--button-padding-y) var(--button-padding-x);
  background-color: var(--color-button-primary-bg);
  border-radius: var(--button-radius);
  box-shadow: var(--button-shadow);
  transition: var(--transition-base);
}
```

### Component Refactoring Checklist

When updating a component to use the design system:

- [ ] Replace hard-coded colors with CSS variables
- [ ] Replace hard-coded spacing with spacing tokens
- [ ] Replace hard-coded font sizes with typography scale
- [ ] Replace hard-coded shadows with shadow tokens
- [ ] Replace hard-coded transitions with transition tokens
- [ ] Add proper ARIA attributes if missing
- [ ] Test in all states (default, hover, focus, active, disabled)
- [ ] Test responsive behavior
- [ ] Verify WCAG AA compliance
- [ ] Document any new patterns

---

## File Structure

```
frontend/src/styles/
├── colors.css              # WCAG AA color tokens (Phase 3.3)
├── design-system.css       # Comprehensive design tokens (Phase 4.1)
├── bootstrap-theme.css     # Bootstrap overrides (Phase 4.1)
├── theme.css               # Legacy theme (deprecated - to be merged)
├── index.css               # Global styles
└── App.css                 # Component-specific styles
```

---

## Tools & Resources

### Design Tools
- **Figma:** Design mockups and prototypes
- **Color Contrast Analyzer:** Verify WCAG compliance
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

### Development Tools
- **VS Code Extensions:**
  - CSS Variable Autocomplete
  - Color Picker
  - stylelint (CSS linting)

### Testing Tools
- **Lighthouse:** Performance and accessibility audits
- **axe DevTools:** Accessibility testing
- **BrowserStack:** Cross-browser testing

### Font Resources
- **Google Fonts:** Playfair Display, Inter
- **Font Awesome / React Icons:** Icon library

---

## Maintenance

### Regular Updates
- Review color contrast ratios quarterly
- Test new components for accessibility
- Update documentation when adding patterns
- Monitor user feedback on design

### Version Control
- Semantic versioning for design system changes
- Document breaking changes
- Maintain changelog
- Review with team before major updates

---

## Support

For questions or suggestions about the design system:
- **Technical Lead:** [Name]
- **Design Lead:** [Name]
- **Slack Channel:** #design-system
- **Documentation:** This file + inline CSS comments

---

**Version History:**
- v1.0 - February 1, 2026 - Initial design system creation (Phase 4.1)
