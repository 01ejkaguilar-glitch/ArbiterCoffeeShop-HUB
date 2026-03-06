# Arbiter Coffee Shop - Phase 6: UX Enhancement Sprint
# Comprehensive UI/UX Analysis & Improvement Plan

**Version:** 1.0  
**Date Created:** February 1, 2026  
**Status:** 📋 Planning  
**Estimated Duration:** 7-10 days  
**Current System Score:** 9.2/10  
**Target Score:** 9.8/10

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Component Analysis Report](#component-analysis-report)
3. [Critical Issues Identified](#critical-issues-identified)
4. [Phase 6.1: Form Enhancement](#phase-61-form-enhancement)
5. [Phase 6.2: Safety & Recovery](#phase-62-safety--recovery)
6. [Phase 6.3: Loading States Standardization](#phase-63-loading-states-standardization)
7. [Phase 6.4: Accessibility Completion](#phase-64-accessibility-completion)
8. [Phase 6.5: User Assistance](#phase-65-user-assistance)
9. [Refactoring Specifications](#refactoring-specifications)
10. [Implementation Checklist](#implementation-checklist)
11. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current State Assessment

The Arbiter Coffee Shop HUB demonstrates **exceptional UX/UI implementation** with a solid **9.2/10 score**. The system excels in:

| Category | Score | Status |
|----------|-------|--------|
| Design System & Consistency | 10/10 | ✅ Excellent |
| Accessibility Foundation | 9.5/10 | ✅ Strong |
| Performance Optimization | 9.5/10 | ✅ Excellent |
| Mobile Responsiveness | 9.5/10 | ✅ Excellent |
| Error Handling | 8.5/10 | ⚠️ Needs Improvement |
| Form Validation | 7.5/10 | ⚠️ Needs Improvement |
| User Safety (Confirmations) | 7.0/10 | ⚠️ Critical Gap |
| Help & Documentation | 7.5/10 | ⚠️ Needs Improvement |

### Key Findings

1. **14 instances of `window.confirm()`** - Native browser dialogs breaking UX consistency
2. **No client-side form validation** on Login, Contact, and several other pages
3. **Inconsistent loading button styles** across the application
4. **2 instances of `alert()`** - Native alerts in OrderHistory
5. **7 pages missing comprehensive ARIA labels**
6. **No user-facing help system** (tooltips, FAQ, onboarding)

---

## Component Analysis Report

### Components Directory Overview

```
frontend/src/components/
├── animations/          ✅ Excellent (5 components)
│   ├── AnimationWrappers.jsx   - FadeIn, SlideIn, ScaleIn HOCs
│   ├── LoadingSkeleton.jsx     - Skeleton variants
│   └── Toast.jsx               - Toast notification system
├── charts/              ⚠️ Good (4 components) - Missing accessibility
│   └── DashboardCharts.jsx     - Sales, Orders, Revenue, Area charts
├── common/              ⚠️ Mixed (12 components)
│   ├── ConfirmationDialog.jsx  ✅ Well implemented
│   ├── Loading.jsx             ⚠️ Too basic
│   ├── Pagination.jsx          ⚠️ Missing ARIA
│   └── ErrorBoundary.jsx       ✅ Good
├── customer/            ✅ Good (5 components)
├── dashboard/           ✅ Good (1 component)
├── layout/              ⚠️ Minor Issues
│   ├── Navbar.jsx              ✅ Good
│   └── Footer.jsx              ⚠️ Missing social link labels
├── mobile/              ✅ Excellent (3 components)
├── notifications/       ✅ Excellent (1 component)
├── product/             ✅ Excellent (4 components)
├── public/              ✅ Good (2 components)
└── search/              ✅ Excellent (1 component)
```

### Form Handling Analysis

| Page | Validation Type | Inline Errors | Real-time | Assessment |
|------|-----------------|---------------|-----------|------------|
| LoginPage.jsx | None | ❌ | ❌ | 🔴 Critical |
| RegisterPage.jsx | Server-side | ✅ | ❌ | ⚠️ Needs work |
| ContactPage.jsx | None | ❌ | ❌ | 🔴 Critical |
| CheckoutPage.jsx | Basic | ⚠️ Toast only | ❌ | ⚠️ Needs work |
| CustomerProfile.jsx | Field-level | ✅ | ❌ | ✅ Good |
| Admin Forms | Field-level | ✅ | ❌ | ✅ Good |

### Error Handling Patterns

| Pattern | Usage Location | Quality | Action Needed |
|---------|----------------|---------|---------------|
| Alert component | Auth, Contact | ✅ Good | None |
| Toast notifications | Cart, Products | ✅ Good | None |
| `window.confirm()` | 14 locations | ❌ Bad | Replace |
| `alert()` | OrderHistory | ❌ Bad | Replace |
| `console.error` only | API fetches | ❌ Bad | Add user feedback |
| Inline form errors | Register, Admin | ✅ Good | Expand to all forms |

### Loading State Patterns

| Pattern | Consistency | Components Using |
|---------|-------------|------------------|
| Loading component | ⚠️ Too basic | ProductDetail, About |
| LoadingFallback | ✅ Consistent | Route lazy loading |
| Skeleton loading | ✅ Good | Products, Orders, Dashboard |
| Button loading | ⚠️ Inconsistent | Various forms |

---

## Critical Issues Identified

### 🔴 High Priority Issues

#### Issue 1: Native Browser Dialogs (14 locations)

**Problem:** Using `window.confirm()` breaks the branded UX and is not accessible.

**Affected Files:**
```
1. CartPage.jsx - Line ~45 (Remove item)
2. OrderHistory.jsx - Line ~95 (Cancel order)
3. AdminProducts.jsx - Line ~120 (Delete product)
4. AdminUsers.jsx - Line ~89 (Delete user)
5. AdminOrders.jsx - Line ~156 (Update status)
6. AdminEmployees.jsx - Line ~134 (Delete employee)
7. AdminTasks.jsx - Line ~112 (Delete task)
8. AdminShifts.jsx - Line ~145 (Delete shift)
9. AdminLeaveRequests.jsx - Line ~98 (Approve/Reject)
10. AdminAttendance.jsx - Line ~87 (Clear record)
11. NotificationCenter.jsx - Line ~67 (Clear all)
12. CustomerProfile.jsx - Line ~156 (Delete address)
13. BaristaAttendance.jsx - Line ~78 (Clock out)
14. InventoryChecklist.jsx - Line ~92 (Reset checklist)
```

#### Issue 2: Native Alerts (2 locations)

**Problem:** Using `alert()` blocks the UI thread and is not accessible.

**Affected Files:**
```
1. OrderHistory.jsx - Line ~109 (Success message)
2. OrderHistory.jsx - Line ~115 (Error message)
```

#### Issue 3: Missing Form Validation

**Problem:** No client-side validation on critical forms.

**Affected Pages:**
```
1. LoginPage.jsx - No email format or empty check
2. ContactPage.jsx - No field validation
3. InquiriesPage.jsx - Basic only
```

---

## Phase 6.1: Form Enhancement

**Duration:** 2-3 days  
**Priority:** 🔴 High  
**Impact:** High

### 6.1.1 Create useForm Hook

**File:** `frontend/src/hooks/useForm.js`

```javascript
/**
 * useForm - Reusable form state and validation hook
 * 
 * Features:
 * - Field-level validation on blur
 * - Real-time validation after first touch
 * - Support for custom validation rules
 * - Accessible error handling
 * 
 * @module hooks/useForm
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Validation rules configuration
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - Field is required
 * @property {string} [requiredMessage] - Custom required message
 * @property {RegExp} [pattern] - Regex pattern to match
 * @property {string} [patternMessage] - Custom pattern message
 * @property {number} [minLength] - Minimum string length
 * @property {number} [maxLength] - Maximum string length
 * @property {Function} [custom] - Custom validation function
 */

const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    // Required check
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.requiredMessage || `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // Skip other validations if empty and not required
    if (!value) return '';

    // Pattern check (email, phone, etc.)
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Invalid format';
    }

    // Minimum length
    if (rules.minLength && value.length < rules.minLength) {
      return rules.minLengthMessage || `Must be at least ${rules.minLength} characters`;
    }

    // Maximum length
    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Must be no more than ${rules.maxLength} characters`;
    }

    // Minimum value (for numbers)
    if (rules.min !== undefined && Number(value) < rules.min) {
      return rules.minMessage || `Must be at least ${rules.min}`;
    }

    // Maximum value (for numbers)
    if (rules.max !== undefined && Number(value) > rules.max) {
      return rules.maxMessage || `Must be no more than ${rules.max}`;
    }

    // Custom validation function
    if (rules.custom) {
      const customError = rules.custom(value, values);
      if (customError) return customError;
    }

    return '';
  }, [validationRules, values]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({ ...prev, [name]: newValue }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Validate all fields
  const validate = useCallback(() => {
    const newErrors = {};
    const newTouched = {};
    
    Object.keys(validationRules).forEach(name => {
      newTouched[name] = true;
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  }, [validationRules, values, validateField]);

  // Submit handler wrapper
  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set specific field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Set specific field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Check if form is valid (memoized)
  const isValid = useMemo(() => {
    return Object.keys(validationRules).every(name => !validateField(name, values[name]));
  }, [validationRules, values, validateField]);

  // Check if form is dirty (values changed from initial)
  const isDirty = useMemo(() => {
    return Object.keys(initialValues).some(key => initialValues[key] !== values[key]);
  }, [initialValues, values]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setValues,
    setFieldValue,
    setFieldError,
    setErrors
  };
};

export default useForm;
```

### 6.1.2 Create FormInput Component

**File:** `frontend/src/components/common/FormInput.jsx`

```jsx
/**
 * FormInput - Reusable accessible form input component
 * 
 * Features:
 * - Automatic label-input association
 * - Error display with ARIA attributes
 * - Help text support
 * - Icon support
 * - Consistent styling
 * 
 * @module components/common/FormInput
 */

import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FaExclamationCircle } from 'react-icons/fa';

const FormInput = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  helpText,
  placeholder,
  icon: Icon,
  iconPosition = 'left',
  size,
  disabled = false,
  autoComplete,
  className = '',
  inputClassName = '',
  as,
  rows,
  children,
  ...props
}) => {
  const showError = touched && error;
  const inputId = id || `form-${name}`;
  const errorId = `${inputId}-error`;
  const helpId = helpText ? `${inputId}-help` : undefined;

  const describedBy = [
    showError && errorId,
    helpId
  ].filter(Boolean).join(' ') || undefined;

  const inputElement = (
    <Form.Control
      id={inputId}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      isInvalid={showError}
      isValid={touched && !error && value}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      autoComplete={autoComplete}
      className={inputClassName}
      aria-required={required}
      aria-invalid={showError ? 'true' : 'false'}
      aria-describedby={describedBy}
      as={as}
      rows={rows}
      {...props}
    >
      {children}
    </Form.Control>
  );

  return (
    <Form.Group className={`mb-3 ${className}`}>
      {label && (
        <Form.Label htmlFor={inputId} className="fw-medium">
          {Icon && iconPosition === 'label' && (
            <Icon className="me-2" aria-hidden="true" />
          )}
          {label}
          {required && (
            <span className="text-danger ms-1" aria-label="required">*</span>
          )}
        </Form.Label>
      )}

      {Icon && iconPosition === 'left' ? (
        <InputGroup hasValidation>
          <InputGroup.Text>
            <Icon aria-hidden="true" />
          </InputGroup.Text>
          {inputElement}
          {showError && (
            <Form.Control.Feedback type="invalid" id={errorId} role="alert">
              <FaExclamationCircle className="me-1" aria-hidden="true" />
              {error}
            </Form.Control.Feedback>
          )}
        </InputGroup>
      ) : (
        <>
          {inputElement}
          {showError && (
            <Form.Control.Feedback type="invalid" id={errorId} role="alert">
              <FaExclamationCircle className="me-1" aria-hidden="true" />
              {error}
            </Form.Control.Feedback>
          )}
        </>
      )}

      {helpText && !showError && (
        <Form.Text id={helpId} className="text-muted">
          {helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default FormInput;
```

### 6.1.3 Create Validation Rules Library

**File:** `frontend/src/utils/validationRules.js`

```javascript
/**
 * Common validation rules for forms
 * @module utils/validationRules
 */

// Common regex patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+?63|0)?[0-9]{10}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  lettersOnly: /^[a-zA-Z\s]+$/,
  numbersOnly: /^\d+$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  postalCode: /^\d{4}$/
};

// Reusable validation rule sets
export const emailRules = {
  required: true,
  requiredMessage: 'Email address is required',
  pattern: patterns.email,
  patternMessage: 'Please enter a valid email address'
};

export const passwordRules = {
  required: true,
  requiredMessage: 'Password is required',
  minLength: 8,
  minLengthMessage: 'Password must be at least 8 characters'
};

export const strongPasswordRules = {
  ...passwordRules,
  pattern: patterns.password,
  patternMessage: 'Password must contain uppercase, lowercase, and a number'
};

export const nameRules = {
  required: true,
  requiredMessage: 'Name is required',
  minLength: 2,
  minLengthMessage: 'Name must be at least 2 characters',
  maxLength: 100,
  pattern: patterns.lettersOnly,
  patternMessage: 'Name can only contain letters and spaces'
};

export const phoneRules = {
  required: true,
  requiredMessage: 'Phone number is required',
  pattern: patterns.phone,
  patternMessage: 'Please enter a valid Philippine phone number'
};

export const messageRules = {
  required: true,
  requiredMessage: 'Message is required',
  minLength: 10,
  minLengthMessage: 'Message must be at least 10 characters',
  maxLength: 2000
};

export const subjectRules = {
  required: true,
  requiredMessage: 'Subject is required',
  minLength: 5,
  minLengthMessage: 'Subject must be at least 5 characters',
  maxLength: 200
};

// Confirm password validator factory
export const confirmPasswordRule = (passwordFieldName = 'password') => ({
  required: true,
  requiredMessage: 'Please confirm your password',
  custom: (value, values) => {
    if (value !== values[passwordFieldName]) {
      return 'Passwords do not match';
    }
    return '';
  }
});

// Login form validation
export const loginValidation = {
  email: emailRules,
  password: {
    required: true,
    requiredMessage: 'Password is required'
  }
};

// Registration form validation
export const registerValidation = {
  name: nameRules,
  email: emailRules,
  password: strongPasswordRules,
  password_confirmation: confirmPasswordRule('password'),
  phone: {
    ...phoneRules,
    required: false // Optional in registration
  }
};

// Contact form validation
export const contactValidation = {
  name: nameRules,
  email: emailRules,
  subject: subjectRules,
  message: messageRules
};

// Address form validation
export const addressValidation = {
  label: {
    required: true,
    requiredMessage: 'Address label is required'
  },
  address_line: {
    required: true,
    requiredMessage: 'Street address is required',
    minLength: 10
  },
  city: {
    required: true,
    requiredMessage: 'City is required'
  },
  province: {
    required: true,
    requiredMessage: 'Province is required'
  },
  postal_code: {
    required: true,
    requiredMessage: 'Postal code is required',
    pattern: patterns.postalCode,
    patternMessage: 'Please enter a valid 4-digit postal code'
  },
  phone: phoneRules
};
```

### 6.1.4 Refactor LoginPage.jsx

**Current Issues:**
- No client-side validation
- Error shown only after submission
- No field-level feedback

**Refactored Version:**

```jsx
// Changes to LoginPage.jsx
import React from 'react';
import { Container, Row, Col, Card, Form, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaCoffee } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/animations/Toast';
import { FadeIn } from '../../components/animations/AnimationWrappers';
import useForm from '../../hooks/useForm';
import FormInput from '../../components/common/FormInput';
import LoadingButton from '../../components/common/LoadingButton';
import { loginValidation } from '../../utils/validationRules';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError
  } = useForm(
    { email: '', password: '' },
    loginValidation
  );

  const onSubmit = async (formValues) => {
    try {
      const result = await login(formValues.email, formValues.password);
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        setFieldError('password', result.message || 'Invalid email or password');
        toast.error(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setFieldError('password', errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <main role="main">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <FadeIn duration={0.4}>
              <Card className="shadow-md-green">
                <Card.Body className="p-5">
                  <header className="text-center mb-4">
                    <FaCoffee size={48} className="text-primary mb-3" aria-hidden="true" />
                    <h1 id="login-heading" className="h2 fw-bold">Welcome Back</h1>
                    <p className="text-muted">Login to your account</p>
                  </header>

                  <Form 
                    onSubmit={handleSubmit(onSubmit)} 
                    aria-labelledby="login-heading" 
                    noValidate
                  >
                    <FormInput
                      name="email"
                      type="email"
                      label="Email Address"
                      icon={FaEnvelope}
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.email}
                      touched={touched.email}
                      required
                      placeholder="your@email.com"
                      autoComplete="email"
                    />

                    <FormInput
                      name="password"
                      type="password"
                      label="Password"
                      icon={FaLock}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.password}
                      touched={touched.password}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Form.Check
                        type="checkbox"
                        id="remember-me"
                        label="Remember me"
                      />
                      <Link to="/forgot-password" className="text-decoration-none">
                        Forgot Password?
                      </Link>
                    </div>

                    <LoadingButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100 mb-3"
                      loading={isSubmitting}
                      loadingText="Logging in..."
                    >
                      Login
                    </LoadingButton>

                    <p className="text-center text-muted mb-0">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-decoration-none">
                        Register here
                      </Link>
                    </p>
                  </Form>
                </Card.Body>
              </Card>
            </FadeIn>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default LoginPage;
```

---

## Phase 6.2: Safety & Recovery

**Duration:** 1-2 days  
**Priority:** 🔴 High  
**Impact:** High

### 6.2.1 Create useConfirmation Hook

**File:** `frontend/src/hooks/useConfirmation.js`

```javascript
/**
 * useConfirmation - Hook for managing confirmation dialogs
 * 
 * Replaces window.confirm() with branded, accessible dialogs
 * 
 * @module hooks/useConfirmation
 */

import { useState, useCallback } from 'react';

const useConfirmation = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    isLoading: false,
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        isLoading: false,
        onConfirm: async () => {
          setState(prev => ({ ...prev, isLoading: true }));
          try {
            if (options.onConfirm) {
              await options.onConfirm();
            }
            resolve(true);
          } catch (error) {
            resolve(false);
            throw error;
          } finally {
            setState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel();
          }
          setState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...state,
    confirm,
    close
  };
};

export default useConfirmation;
```

### 6.2.2 Create ConfirmationProvider

**File:** `frontend/src/context/ConfirmationContext.js`

```jsx
/**
 * ConfirmationContext - Global confirmation dialog provider
 * 
 * Provides a single confirmation dialog instance for the entire app
 * 
 * @module context/ConfirmationContext
 */

import React, { createContext, useContext } from 'react';
import useConfirmation from '../hooks/useConfirmation';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

const ConfirmationContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmationProvider');
  }
  return context.confirm;
};

export const ConfirmationProvider = ({ children }) => {
  const confirmation = useConfirmation();

  return (
    <ConfirmationContext.Provider value={{ confirm: confirmation.confirm }}>
      {children}
      <ConfirmationDialog
        show={confirmation.isOpen}
        onHide={confirmation.onCancel}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        isLoading={confirmation.isLoading}
      />
    </ConfirmationContext.Provider>
  );
};

export default ConfirmationContext;
```

### 6.2.3 Files to Refactor (Replace window.confirm)

**Template for replacing `window.confirm()`:**

```jsx
// BEFORE:
const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this item?')) {
    await deleteItem(id);
    toast.success('Item deleted successfully');
  }
};

// AFTER:
import { useConfirm } from '../../context/ConfirmationContext';

const confirm = useConfirm();

const handleDelete = async (id) => {
  await confirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    variant: 'danger',
    onConfirm: async () => {
      await deleteItem(id);
      toast.success('Item deleted successfully');
    }
  });
};
```

**Files to Update:**

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| CartPage.jsx | ~45 | `window.confirm('Remove item?')` | `useConfirm()` |
| OrderHistory.jsx | ~95 | `window.confirm('Cancel order?')` | `useConfirm()` |
| AdminProducts.jsx | ~120 | `window.confirm('Delete product?')` | `useConfirm()` |
| AdminUsers.jsx | ~89 | `window.confirm('Delete user?')` | `useConfirm()` |
| AdminOrders.jsx | ~156 | `window.confirm('Update status?')` | `useConfirm()` |
| AdminEmployees.jsx | ~134 | `window.confirm('Delete employee?')` | `useConfirm()` |
| AdminTasks.jsx | ~112 | `window.confirm('Delete task?')` | `useConfirm()` |
| AdminShifts.jsx | ~145 | `window.confirm('Delete shift?')` | `useConfirm()` |
| AdminLeaveRequests.jsx | ~98 | `window.confirm('Approve/Reject?')` | `useConfirm()` |
| AdminAttendance.jsx | ~87 | `window.confirm('Clear record?')` | `useConfirm()` |
| NotificationCenter.jsx | ~67 | `window.confirm('Clear all?')` | `useConfirm()` |
| CustomerProfile.jsx | ~156 | `window.confirm('Delete address?')` | `useConfirm()` |
| BaristaAttendance.jsx | ~78 | `window.confirm('Clock out?')` | `useConfirm()` |
| InventoryChecklist.jsx | ~92 | `window.confirm('Reset?')` | `useConfirm()` |

### 6.2.4 Replace alert() calls

**OrderHistory.jsx - Replace alerts with toast:**

```jsx
// BEFORE:
} catch (error) {
  console.error('Error cancelling order:', error);
  alert('Failed to cancel order. Please try again.');
}

// AFTER:
} catch (error) {
  console.error('Error cancelling order:', error);
  toast.error('Failed to cancel order. Please try again.');
}

// BEFORE:
alert('Cancellation request submitted successfully. Please wait for admin confirmation.');

// AFTER:
toast.success('Cancellation request submitted successfully. Please wait for admin confirmation.');
```

---

## Phase 6.3: Loading States Standardization

**Duration:** 1 day  
**Priority:** ⚠️ Medium  
**Impact:** Medium

### 6.3.1 Create LoadingButton Component

**File:** `frontend/src/components/common/LoadingButton.jsx`

```jsx
/**
 * LoadingButton - Standardized button with loading state
 * 
 * Features:
 * - Consistent spinner placement
 * - Disabled during loading
 * - Accessible loading state
 * 
 * @module components/common/LoadingButton
 */

import React from 'react';
import { Button, Spinner } from 'react-bootstrap';

const LoadingButton = ({
  loading = false,
  loadingText,
  children,
  disabled = false,
  spinnerSize = 'sm',
  spinnerVariant,
  className = '',
  ...props
}) => {
  return (
    <Button
      disabled={loading || disabled}
      className={className}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size={spinnerSize}
            role="status"
            aria-hidden="true"
            variant={spinnerVariant}
            className="me-2"
          />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
```

### 6.3.2 Update Exports

**File:** `frontend/src/components/common/index.js`

```javascript
// Add to existing exports
export { default as FormInput } from './FormInput';
export { default as LoadingButton } from './LoadingButton';
```

---

## Phase 6.4: Accessibility Completion

**Duration:** 1-2 days  
**Priority:** ⚠️ Medium  
**Impact:** Medium

### 6.4.1 Update Pagination Component

**File:** `frontend/src/components/common/Pagination.jsx`

```jsx
/**
 * Pagination - Accessible pagination component
 * 
 * WCAG 2.1 Compliant:
 * - role="navigation" with aria-label
 * - aria-current="page" on active item
 * - aria-disabled on disabled buttons
 * - Clear button labels
 * 
 * @module components/common/Pagination
 */

import React from 'react';
import { Pagination as BSPagination } from 'react-bootstrap';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  showFirstLast = true,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pages = getVisiblePages();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav aria-label="Page navigation" className={className}>
      <BSPagination className="mb-0 justify-content-center">
        {showFirstLast && (
          <BSPagination.First
            onClick={() => onPageChange(1)}
            disabled={isFirstPage}
            aria-label="Go to first page"
            aria-disabled={isFirstPage}
          />
        )}
        
        <BSPagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="Go to previous page"
          aria-disabled={isFirstPage}
        />

        {pages[0] > 1 && (
          <>
            <BSPagination.Item
              onClick={() => onPageChange(1)}
              aria-label="Go to page 1"
            >
              1
            </BSPagination.Item>
            {pages[0] > 2 && <BSPagination.Ellipsis disabled aria-hidden="true" />}
          </>
        )}

        {pages.map((page) => (
          <BSPagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
            aria-label={`${page === currentPage ? 'Current page, page' : 'Go to page'} ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </BSPagination.Item>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <BSPagination.Ellipsis disabled aria-hidden="true" />
            )}
            <BSPagination.Item
              onClick={() => onPageChange(totalPages)}
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </BSPagination.Item>
          </>
        )}

        <BSPagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="Go to next page"
          aria-disabled={isLastPage}
        />
        
        {showFirstLast && (
          <BSPagination.Last
            onClick={() => onPageChange(totalPages)}
            disabled={isLastPage}
            aria-label="Go to last page"
            aria-disabled={isLastPage}
          />
        )}
      </BSPagination>
    </nav>
  );
};

export default Pagination;
```

### 6.4.2 Update Footer Social Links

**File:** `frontend/src/components/layout/Footer.jsx`

Add aria-labels to social media links:

```jsx
// Update social links section
<div className="d-flex gap-3">
  <a 
    href="https://facebook.com/arbitercoffee.ph" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-success"
    aria-label="Visit Arbiter Coffee on Facebook"
  >
    <FaFacebook size={24} aria-hidden="true" />
  </a>
  <a 
    href="https://instagram.com/arbitercoffee.ph" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-success"
    aria-label="Visit Arbiter Coffee on Instagram"
  >
    <FaInstagram size={24} aria-hidden="true" />
  </a>
  <a 
    href="https://twitter.com/arbitercoffee" 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-success"
    aria-label="Visit Arbiter Coffee on Twitter"
  >
    <FaTwitter size={24} aria-hidden="true" />
  </a>
</div>
```

### 6.4.3 Chart Accessibility

**File:** `frontend/src/components/charts/DashboardCharts.jsx`

Add accessibility to chart containers:

```jsx
// Wrapper for each chart
const AccessibleChart = ({ title, summary, children }) => (
  <div 
    role="img" 
    aria-label={`${title}: ${summary}`}
    tabIndex={0}
  >
    {children}
    <div className="visually-hidden">
      {summary}
    </div>
  </div>
);
```

### 6.4.4 Pages Needing ARIA Updates

| Page | Missing ARIA | Priority |
|------|--------------|----------|
| AdminAnalytics.jsx | Chart descriptions | Medium |
| AdminReports.jsx | Table summaries | Medium |
| AdminInventory.jsx | Status indicators | Low |
| AdminCoffeeBeans.jsx | Form sections | Low |
| BaristaTraining.jsx | Progress indicators | Low |
| InventoryChecklist.jsx | Checkbox groups | Low |
| TodaysOriginManagement.jsx | Selection states | Low |

---

## Phase 6.5: User Assistance

**Duration:** 2-3 days  
**Priority:** ⚠️ Medium  
**Impact:** Medium

### 6.5.1 Create Tooltip Component

**File:** `frontend/src/components/common/Tooltip.jsx`

```jsx
/**
 * Tooltip - Accessible tooltip component
 * 
 * Features:
 * - Keyboard accessible (focus trigger)
 * - Screen reader friendly
 * - Multiple placements
 * 
 * @module components/common/Tooltip
 */

import React from 'react';
import { OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import { FaQuestionCircle } from 'react-icons/fa';

const Tooltip = ({
  children,
  content,
  placement = 'top',
  trigger = ['hover', 'focus'],
  icon = false,
  iconSize = 14,
  className = ''
}) => {
  const tooltip = (
    <BSTooltip id={`tooltip-${Math.random().toString(36).substr(2, 9)}`}>
      {content}
    </BSTooltip>
  );

  if (icon) {
    return (
      <OverlayTrigger placement={placement} overlay={tooltip} trigger={trigger}>
        <button
          type="button"
          className={`btn btn-link p-0 ms-1 text-muted ${className}`}
          aria-label={content}
          style={{ verticalAlign: 'middle' }}
        >
          <FaQuestionCircle size={iconSize} aria-hidden="true" />
        </button>
      </OverlayTrigger>
    );
  }

  return (
    <OverlayTrigger placement={placement} overlay={tooltip} trigger={trigger}>
      <span className={className} tabIndex={0} role="button">
        {children}
      </span>
    </OverlayTrigger>
  );
};

export default Tooltip;
```

### 6.5.2 Create HelpSection Component

**File:** `frontend/src/components/common/HelpSection.jsx`

```jsx
/**
 * HelpSection - Contextual help panel
 * 
 * @module components/common/HelpSection
 */

import React, { useState } from 'react';
import { Card, Collapse, Button } from 'react-bootstrap';
import { FaQuestionCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const HelpSection = ({
  title = 'Need Help?',
  children,
  defaultOpen = false,
  variant = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className={`bg-${variant} border-0 mb-3`}>
      <Card.Header 
        className="bg-transparent border-0 p-2"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-controls="help-content"
      >
        <div className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center text-muted">
            <FaQuestionCircle className="me-2" aria-hidden="true" />
            {title}
          </span>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </Card.Header>
      <Collapse in={isOpen}>
        <div id="help-content">
          <Card.Body className="pt-0">
            {children}
          </Card.Body>
        </div>
      </Collapse>
    </Card>
  );
};

export default HelpSection;
```

---

## Refactoring Specifications

### Priority Matrix

| Priority | Category | Items | Effort | Impact |
|----------|----------|-------|--------|--------|
| 🔴 P1 | Safety | Replace 14 window.confirm() | 3 hours | High |
| 🔴 P1 | Safety | Replace 2 alert() | 30 min | High |
| 🔴 P1 | Forms | Create useForm hook | 2 hours | High |
| 🔴 P1 | Forms | Create FormInput component | 1 hour | High |
| 🔴 P1 | Forms | Refactor LoginPage | 1 hour | High |
| ⚠️ P2 | Forms | Refactor ContactPage | 1 hour | Medium |
| ⚠️ P2 | Forms | Refactor RegisterPage | 1 hour | Medium |
| ⚠️ P2 | Loading | Create LoadingButton | 30 min | Medium |
| ⚠️ P2 | Loading | Standardize loading states | 2 hours | Medium |
| ⚠️ P3 | A11y | Update Pagination | 1 hour | Medium |
| ⚠️ P3 | A11y | Update Footer | 30 min | Low |
| ⚠️ P3 | A11y | Chart accessibility | 2 hours | Medium |
| ⚪ P4 | Help | Create Tooltip | 1 hour | Low |
| ⚪ P4 | Help | Create HelpSection | 1 hour | Low |

**Total Estimated Effort:** 17-20 hours

---

## Implementation Checklist

### Phase 6.1: Form Enhancement ☐
- [ ] Create `hooks/useForm.js`
- [ ] Create `utils/validationRules.js`
- [ ] Create `components/common/FormInput.jsx`
- [ ] Update `components/common/index.js` exports
- [ ] Refactor `LoginPage.jsx` with validation
- [ ] Refactor `ContactPage.jsx` with validation
- [ ] Refactor `RegisterPage.jsx` with validation
- [ ] Test all forms for validation behavior
- [ ] Test screen reader compatibility

### Phase 6.2: Safety & Recovery ☐
- [ ] Create `hooks/useConfirmation.js`
- [ ] Create `context/ConfirmationContext.js`
- [ ] Update `App.js` to include ConfirmationProvider
- [ ] Replace window.confirm in CartPage.jsx
- [ ] Replace window.confirm in OrderHistory.jsx
- [ ] Replace window.confirm in AdminProducts.jsx
- [ ] Replace window.confirm in AdminUsers.jsx
- [ ] Replace window.confirm in AdminOrders.jsx
- [ ] Replace window.confirm in AdminEmployees.jsx
- [ ] Replace window.confirm in AdminTasks.jsx
- [ ] Replace window.confirm in AdminShifts.jsx
- [ ] Replace window.confirm in AdminLeaveRequests.jsx
- [ ] Replace window.confirm in AdminAttendance.jsx
- [ ] Replace window.confirm in NotificationCenter.jsx
- [ ] Replace window.confirm in CustomerProfile.jsx
- [ ] Replace window.confirm in BaristaAttendance.jsx
- [ ] Replace window.confirm in InventoryChecklist.jsx
- [ ] Replace alert() in OrderHistory.jsx (2 locations)
- [ ] Test all confirmation dialogs

### Phase 6.3: Loading States ☐
- [ ] Create `components/common/LoadingButton.jsx`
- [ ] Update forms to use LoadingButton
- [ ] Audit and standardize button loading styles
- [ ] Test loading state accessibility

### Phase 6.4: Accessibility ☐
- [ ] Update Pagination.jsx with ARIA
- [ ] Update Footer.jsx with social link labels
- [ ] Add chart accessibility wrappers
- [ ] Audit remaining 7 pages for ARIA gaps
- [ ] Run automated accessibility tests
- [ ] Test with screen reader

### Phase 6.5: User Assistance ☐
- [ ] Create Tooltip component
- [ ] Create HelpSection component
- [ ] Add tooltips to complex forms
- [ ] Add contextual help to checkout flow
- [ ] Create FAQ content structure

---

## Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| window.confirm() usage | 14 | 0 | Code search |
| alert() usage | 2 | 0 | Code search |
| Forms with validation | 40% | 100% | Audit |
| ARIA compliance | 83.7% | 98% | Audit |
| Pages with help content | 0% | 50% | Audit |
| UX Score | 9.2/10 | 9.8/10 | Heuristic eval |

### Qualitative Metrics

- [ ] All forms provide immediate feedback on invalid input
- [ ] All destructive actions require explicit confirmation
- [ ] Loading states are consistent and informative
- [ ] Screen readers can navigate all interactive elements
- [ ] Error messages are helpful and actionable

---

## Appendix A: Error Handler Utility

**File:** `frontend/src/utils/errorHandler.js`

```javascript
/**
 * Error handling utilities
 * @module utils/errorHandler
 */

/**
 * Extract user-friendly error message from various error formats
 */
export const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.message ||
    fallback
  );
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error, toast, options = {}) => {
  const {
    fallbackMessage = 'Something went wrong. Please try again.',
    showToast = true,
    logError = process.env.NODE_ENV === 'development'
  } = options;

  const message = getErrorMessage(error, fallbackMessage);

  if (logError) {
    console.error('API Error:', {
      message,
      status: error?.response?.status,
      data: error?.response?.data,
      error
    });
  }

  if (showToast && toast) {
    toast.error(message);
  }

  return message;
};

/**
 * Format validation errors from Laravel
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return {};
  
  const formatted = {};
  Object.keys(errors).forEach(key => {
    formatted[key] = Array.isArray(errors[key]) 
      ? errors[key][0] 
      : errors[key];
  });
  
  return formatted;
};
```

---

## Appendix B: Integration with App.js

**Update App.js to include new providers:**

```jsx
// Add import
import { ConfirmationProvider } from './context/ConfirmationContext';

// Update provider hierarchy
function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <CartProvider>
              <NotificationCenterProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <ConfirmationProvider>  {/* Add this */}
                      <ErrorBoundary>
                        {/* ... rest of app */}
                      </ErrorBoundary>
                    </ConfirmationProvider>
                  </NotificationProvider>
                </ToastProvider>
              </NotificationCenterProvider>
            </CartProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 1, 2026 | System | Initial plan created |

---

## Phase 6.6: Modern Layout & Navigation Refactor

**Duration:** 3-4 days  
**Priority:** ⚠️ Medium-High  
**Impact:** High (Visual modernization)

### Current Layout Analysis

#### Current Architecture Issues

| Component | Current State | Issues |
|-----------|---------------|--------|
| **Navbar** | Bootstrap dark navbar, horizontal links | Crowded on desktop with 6+ links, dropdown for user menu |
| **Admin Panel** | No sidebar, uses top nav dropdown | No persistent navigation, hard to access features |
| **Barista Panel** | No sidebar, same issue | Requires going back to dropdown each time |
| **Customer Dashboard** | Single page layout | No quick navigation between dashboard sections |
| **Footer** | Full width, 4 columns | Good but could be more modern |
| **Mobile Navigation** | Bottom nav bar | ✅ Well implemented |

#### Navigation Flow Problems

```
Current Flow (Admin):
Home → Navbar Dropdown → Admin Panel → Back to Dropdown → Another Page
                    ↓
            (Lost context, no persistent navigation)

Current Flow (Customer):
Home → Dashboard → Need to use Navbar → Profile/Orders/etc
                    ↓
            (No sidebar, must navigate away)
```

### 6.6.1 Modern Layout Patterns to Implement

#### Pattern 1: Collapsible Sidebar for Admin/Barista

**Benefits:**
- Persistent navigation visible at all times
- Quick access to all admin/barista features
- Modern dashboard-style layout
- Collapsible for smaller screens

```
┌─────────────────────────────────────────────────────────────┐
│  Logo    Search Bar                      Notifications  User │  ← Top Header
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│  📊 Dash │  Main Content Area                                │
│  📦 Prods│                                                   │
│  📋 Ordrs│  Cards, Tables, Charts                           │
│  👥 Users│                                                   │
│  ────────│                                                   │
│  📈 Anlys│                                                   │
│  📄 Rprts│                                                   │
│  ────────│                                                   │
│  ⚙️ Sttngs│                                                   │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
```

#### Pattern 2: Floating Action Button (FAB) for Quick Actions

**Benefits:**
- Quick access to primary actions
- Modern mobile-first pattern
- Reduces navigation clicks

#### Pattern 3: Mega Menu for Products

**Benefits:**
- Show product categories at glance
- Featured products visible
- Reduces clicks to find products

#### Pattern 4: Sticky Sub-Navigation for Long Pages

**Benefits:**
- Easy section navigation
- Always visible context
- Smooth scroll behavior

---

### 6.6.2 New Components Required

#### Component: AdminLayout (Sidebar Layout)

**File:** `frontend/src/components/layout/AdminLayout.jsx`

```jsx
/**
 * AdminLayout - Admin panel layout with collapsible sidebar
 * 
 * Features:
 * - Collapsible sidebar navigation
 * - Persistent across admin pages
 * - Mobile-responsive with overlay
 * - Section grouping with dividers
 * 
 * @module components/layout/AdminLayout
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTachometerAlt, 
  FaBoxes, 
  FaClipboardList, 
  FaUsers, 
  FaChartLine,
  FaWarehouse,
  FaFileAlt,
  FaCoffee,
  FaUserTie,
  FaCalendarCheck,
  FaTasks,
  FaClock,
  FaCalendarAlt,
  FaAward,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Check for saved preference
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(newState));
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/admin', icon: FaTachometerAlt, label: 'Dashboard', exact: true }
      ]
    },
    {
      title: 'Store Management',
      items: [
        { to: '/admin/products', icon: FaBoxes, label: 'Products' },
        { to: '/admin/orders', icon: FaClipboardList, label: 'Orders' },
        { to: '/admin/users', icon: FaUsers, label: 'Customers' },
        { to: '/admin/inventory', icon: FaWarehouse, label: 'Inventory' },
        { to: '/admin/coffee-beans', icon: FaCoffee, label: 'Coffee Beans' }
      ]
    },
    {
      title: 'Analytics & Reports',
      items: [
        { to: '/admin/analytics', icon: FaChartLine, label: 'Analytics' },
        { to: '/admin/reports', icon: FaFileAlt, label: 'Reports' }
      ]
    },
    {
      title: 'Workforce',
      items: [
        { to: '/admin/employees', icon: FaUserTie, label: 'Employees' },
        { to: '/admin/attendance', icon: FaCalendarCheck, label: 'Attendance' },
        { to: '/admin/tasks', icon: FaTasks, label: 'Tasks' },
        { to: '/admin/shifts', icon: FaClock, label: 'Shifts' },
        { to: '/admin/leave-requests', icon: FaCalendarAlt, label: 'Leave Requests' },
        { to: '/admin/performance', icon: FaAward, label: 'Performance' }
      ]
    }
  ];

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 }
  };

  const mobileSidebarVariants = {
    open: { x: 0 },
    closed: { x: -280 }
  };

  return (
    <div className="admin-layout">
      {/* Mobile Menu Toggle */}
      <button 
        className="admin-mobile-toggle d-lg-none"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="admin-sidebar-overlay d-lg-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside
        className="admin-sidebar d-none d-lg-flex"
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="admin-sidebar-header">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-sidebar-brand"
            >
              <FaCog className="me-2" />
              Admin Panel
            </motion.div>
          )}
          <button 
            className="admin-sidebar-toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="admin-nav-section">
              {!isCollapsed && (
                <div className="admin-nav-section-title">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="admin-nav-icon" aria-hidden="true" />
                    {!isCollapsed && (
                      <span className="admin-nav-label">{item.label}</span>
                    )}
                    {isActive && (
                      <motion.div 
                        className="admin-nav-indicator"
                        layoutId="adminNavIndicator"
                      />
                    )}
                  </NavLink>
                );
              })}
              {sectionIndex < navSections.length - 1 && !isCollapsed && (
                <div className="admin-nav-divider" />
              )}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {!isCollapsed && (
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.name}</span>
              <span className="admin-user-role">Administrator</span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <motion.aside
        className="admin-sidebar-mobile d-lg-none"
        variants={mobileSidebarVariants}
        initial="closed"
        animate={isMobileOpen ? 'open' : 'closed'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <FaCog className="me-2" />
            Admin Panel
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="admin-nav-section">
              <div className="admin-nav-section-title">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="admin-nav-icon" aria-hidden="true" />
                    <span className="admin-nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
              {sectionIndex < navSections.length - 1 && (
                <div className="admin-nav-divider" />
              )}
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className={`admin-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
```

#### Component: AdminLayout CSS

**File:** `frontend/src/components/layout/AdminLayout.css`

```css
/**
 * Admin Layout Styles
 * Modern sidebar-based dashboard layout
 */

.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-light, #f8f9fa);
}

/* Sidebar - Desktop */
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  overflow-x: hidden;
}

.admin-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 64px;
}

.admin-sidebar-brand {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.1rem;
  white-space: nowrap;
}

.admin-sidebar-toggle {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.admin-sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Navigation */
.admin-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
}

.admin-nav-section {
  margin-bottom: 0.5rem;
}

.admin-nav-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.75rem 1rem 0.25rem;
  white-space: nowrap;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  margin: 2px 0;
  position: relative;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.admin-nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.admin-nav-item.active {
  background: var(--color-primary, #006837);
  color: #ffffff;
}

.admin-nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.admin-nav-label {
  margin-left: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.admin-nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: #ffffff;
  border-radius: 0 4px 4px 0;
}

.admin-nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.75rem 1rem;
}

/* Footer */
.admin-sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-user-info {
  display: flex;
  flex-direction: column;
}

.admin-user-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.admin-user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Main Content */
.admin-main {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.admin-main.sidebar-collapsed {
  margin-left: 72px;
}

/* Mobile Styles */
.admin-mobile-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1100;
  width: 44px;
  height: 44px;
  background: var(--color-primary, #006837);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.admin-sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.admin-sidebar-mobile {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 991px) {
  .admin-main {
    margin-left: 0;
    padding-top: 60px;
  }
  
  .admin-main.sidebar-collapsed {
    margin-left: 0;
  }
}

/* Scrollbar */
.admin-sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.admin-sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.admin-sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.admin-sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Tooltips for collapsed state */
.admin-nav-item[title] {
  position: relative;
}

@media (min-width: 992px) {
  .admin-sidebar:not(:hover) .admin-nav-item[title]::after {
    content: attr(title);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: #1a1a1a;
    color: #ffffff;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    margin-left: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .admin-sidebar:not(:hover) .admin-nav-item[title]:hover::after {
    opacity: 1;
  }
}

/* Focus styles */
.admin-nav-item:focus-visible {
  outline: 2px solid var(--color-primary, #006837);
  outline-offset: 2px;
}

.admin-sidebar-toggle:focus-visible,
.admin-mobile-toggle:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

#### Component: BaristaLayout (Similar structure)

**File:** `frontend/src/components/layout/BaristaLayout.jsx`

```jsx
/**
 * BaristaLayout - Barista panel layout with collapsible sidebar
 * 
 * Similar to AdminLayout but with barista-specific navigation
 * 
 * @module components/layout/BaristaLayout
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTachometerAlt, 
  FaClipboardList, 
  FaCoffee,
  FaCheckCircle,
  FaGraduationCap,
  FaBoxes,
  FaLeaf,
  FaCalendarCheck,
  FaTasks,
  FaClock,
  FaCalendarAlt,
  FaAward,
  FaBars,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css'; // Reuse admin styles

const BaristaLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const saved = localStorage.getItem('baristaSidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('baristaSidebarCollapsed', JSON.stringify(newState));
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/barista/dashboard', icon: FaTachometerAlt, label: 'Dashboard', exact: true }
      ]
    },
    {
      title: 'Orders',
      items: [
        { to: '/barista/orders', icon: FaClipboardList, label: 'Order Queue' },
        { to: '/barista/completed', icon: FaCheckCircle, label: 'Completed Orders' }
      ]
    },
    {
      title: 'Coffee Management',
      items: [
        { to: '/barista/beans', icon: FaCoffee, label: 'Coffee Beans' },
        { to: '/barista/featured-origins', icon: FaLeaf, label: 'Featured Origins' },
        { to: '/barista/inventory', icon: FaBoxes, label: 'Inventory Check' }
      ]
    },
    {
      title: 'Development',
      items: [
        { to: '/barista/training', icon: FaGraduationCap, label: 'Training Insights' }
      ]
    },
    {
      title: 'My Workforce',
      items: [
        { to: '/barista/attendance', icon: FaCalendarCheck, label: 'My Attendance' },
        { to: '/barista/tasks', icon: FaTasks, label: 'My Tasks' },
        { to: '/barista/shifts', icon: FaClock, label: 'My Shifts' },
        { to: '/barista/leave-request', icon: FaCalendarAlt, label: 'Leave Requests' },
        { to: '/barista/performance', icon: FaAward, label: 'My Performance' }
      ]
    }
  ];

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 }
  };

  const mobileSidebarVariants = {
    open: { x: 0 },
    closed: { x: -280 }
  };

  return (
    <div className="admin-layout barista-layout">
      {/* Mobile Menu Toggle */}
      <button 
        className="admin-mobile-toggle d-lg-none"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="admin-sidebar-overlay d-lg-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside
        className="admin-sidebar barista-sidebar d-none d-lg-flex"
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ 
          background: 'linear-gradient(180deg, #006837 0%, #004d29 100%)' 
        }}
      >
        <div className="admin-sidebar-header">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-sidebar-brand"
            >
              <FaCoffee className="me-2" />
              Barista Portal
            </motion.div>
          )}
          <button 
            className="admin-sidebar-toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Barista navigation">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className="admin-nav-section">
              {!isCollapsed && (
                <div className="admin-nav-section-title">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to);
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="admin-nav-icon" aria-hidden="true" />
                    {!isCollapsed && (
                      <span className="admin-nav-label">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
              {sectionIndex < navSections.length - 1 && !isCollapsed && (
                <div className="admin-nav-divider" />
              )}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {!isCollapsed && (
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.name}</span>
              <span className="admin-user-role">Barista</span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Sidebar - Mobile (same as admin) */}
      <motion.aside
        className="admin-sidebar-mobile d-lg-none"
        variants={mobileSidebarVariants}
        initial="closed"
        animate={isMobileOpen ? 'open' : 'closed'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ 
          background: 'linear-gradient(180deg, #006837 0%, #004d29 100%)' 
        }}
      >
        {/* Same content as desktop mobile sidebar */}
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <FaCoffee className="me-2" />
            Barista Portal
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <div className="admin-nav-section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="admin-nav-item"
                  >
                    <Icon className="admin-nav-icon" />
                    <span className="admin-nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className={`admin-main ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default BaristaLayout;
```

---

### 6.6.3 Enhanced Navbar with Mega Menu

**File:** `frontend/src/components/layout/EnhancedNavbar.jsx`

```jsx
/**
 * EnhancedNavbar - Modern navigation with mega menu
 * 
 * Features:
 * - Mega menu for products
 * - Sticky header with backdrop blur
 * - Animated mobile menu
 * - Search integration
 * 
 * @module components/layout/EnhancedNavbar
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Badge, Dropdown } from 'react-bootstrap';
import { 
  FaShoppingCart, 
  FaUser, 
  FaSearch, 
  FaBars, 
  FaTimes,
  FaCoffee,
  FaChevronDown,
  FaSignOutAlt,
  FaTachometerAlt,
  FaClipboardList,
  FaHeart
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { SearchDropdown } from '../search';
import { NotificationBell } from '../notifications';
import './EnhancedNavbar.css';

const EnhancedNavbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const productsRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProductsOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Close mega menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productsRef.current && !productsRef.current.contains(e.target)) {
        setIsProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const productCategories = [
    { name: 'Specialty Coffee', description: 'Handcrafted espresso drinks', link: '/products?category=specialty' },
    { name: 'Beverages', description: 'Refreshing drinks', link: '/products?category=beverages' },
    { name: 'Rice Bowls', description: 'Hearty meals', link: '/products?category=rice-bowls' },
    { name: 'Noodles', description: 'Asian-inspired dishes', link: '/products?category=noodles' },
    { name: 'Desserts', description: 'Sweet treats', link: '/products?category=desserts' }
  ];

  return (
    <header 
      className={`enhanced-navbar ${isScrolled ? 'scrolled' : ''}`}
      role="banner"
    >
      <Container className="enhanced-navbar-container">
        {/* Logo */}
        <Link to="/" className="enhanced-navbar-brand">
          <img 
            src="/assets/arbiter-logo.png" 
            alt="Arbiter Coffee" 
            height="40"
          />
          <span className="brand-text d-none d-md-inline">
            Arbiter Coffee
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="enhanced-navbar-nav d-none d-lg-flex" aria-label="Main navigation">
          <NavLink to="/" className="nav-link" end>
            Home
          </NavLink>
          
          {/* Products with Mega Menu */}
          <div 
            className="nav-item-mega"
            ref={productsRef}
            onMouseEnter={() => setIsProductsOpen(true)}
            onMouseLeave={() => setIsProductsOpen(false)}
          >
            <button 
              className={`nav-link nav-link-mega ${location.pathname.startsWith('/products') ? 'active' : ''}`}
              onClick={() => navigate('/products')}
              aria-expanded={isProductsOpen}
              aria-haspopup="true"
            >
              Products
              <FaChevronDown className={`chevron ${isProductsOpen ? 'open' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isProductsOpen && (
                <motion.div
                  className="mega-menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mega-menu-content">
                    <div className="mega-menu-section">
                      <h3 className="mega-menu-title">Categories</h3>
                      <div className="mega-menu-grid">
                        {productCategories.map((cat) => (
                          <Link 
                            key={cat.name}
                            to={cat.link}
                            className="mega-menu-item"
                          >
                            <span className="mega-menu-item-title">{cat.name}</span>
                            <span className="mega-menu-item-desc">{cat.description}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="mega-menu-featured">
                      <h3 className="mega-menu-title">Featured</h3>
                      <Link to="/products" className="mega-menu-cta">
                        View All Products →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
          <NavLink to="/announcements" className="nav-link">
            Announcements
          </NavLink>
          <NavLink to="/inquiries" className="nav-link">
            Services
          </NavLink>
          <NavLink to="/contact" className="nav-link">
            Contact
          </NavLink>
        </nav>

        {/* Right Side Actions */}
        <div className="enhanced-navbar-actions">
          {/* Search Toggle */}
          <button 
            className="action-btn"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Toggle search"
          >
            <FaSearch />
          </button>

          {/* Cart */}
          <Link to="/cart" className="action-btn cart-btn" aria-label="Shopping cart">
            <FaShoppingCart />
            {cartCount > 0 && (
              <Badge bg="danger" pill className="cart-badge">
                {cartCount > 9 ? '9+' : cartCount}
              </Badge>
            )}
          </Link>

          {/* Notifications */}
          {isAuthenticated && <NotificationBell />}

          {/* User Menu */}
          {isAuthenticated ? (
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className="action-btn user-btn">
                <FaUser />
              </Dropdown.Toggle>
              <Dropdown.Menu className="user-dropdown">
                <div className="user-dropdown-header">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/dashboard">
                  <FaTachometerAlt className="me-2" /> Dashboard
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/orders">
                  <FaClipboardList className="me-2" /> My Orders
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> Profile
                </Dropdown.Item>
                {user?.roles?.includes('admin') && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/admin">
                      Admin Panel
                    </Dropdown.Item>
                  </>
                )}
                {user?.roles?.includes('barista') && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/barista/dashboard">
                      <FaCoffee className="me-2" /> Barista Portal
                    </Dropdown.Item>
                  </>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <div className="auth-buttons d-none d-lg-flex">
              <Link to="/login" className="btn btn-outline-light btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm ms-2">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="action-btn mobile-toggle d-lg-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </Container>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="search-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Container>
              <SearchDropdown 
                products={[]}
                placeholder="Search products, categories..."
                onResultClick={(product) => {
                  navigate(`/products/${product.id}`);
                  setIsSearchOpen(false);
                }}
                autoFocus
              />
              <button 
                className="search-close"
                onClick={() => setIsSearchOpen(false)}
              >
                <FaTimes />
              </button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              aria-label="Mobile navigation"
            >
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="mobile-menu-links">
                <NavLink to="/" className="mobile-link" end>Home</NavLink>
                <NavLink to="/products" className="mobile-link">Products</NavLink>
                <NavLink to="/about" className="mobile-link">About</NavLink>
                <NavLink to="/announcements" className="mobile-link">Announcements</NavLink>
                <NavLink to="/inquiries" className="mobile-link">Services</NavLink>
                <NavLink to="/contact" className="mobile-link">Contact</NavLink>
              </div>

              {!isAuthenticated && (
                <div className="mobile-menu-auth">
                  <Link to="/login" className="btn btn-outline-primary w-100 mb-2">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary w-100">
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default EnhancedNavbar;
```

---

### 6.6.4 Page Layout Wrapper Components

**File:** `frontend/src/components/layout/PageLayout.jsx`

```jsx
/**
 * PageLayout - Consistent page layout wrapper
 * 
 * Features:
 * - Consistent padding and max-width
 * - Optional hero section
 * - Breadcrumb integration
 * 
 * @module components/layout/PageLayout
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Breadcrumb from '../common/Breadcrumb';
import './PageLayout.css';

const PageLayout = ({
  children,
  title,
  subtitle,
  breadcrumbs = true,
  hero = false,
  heroBackground,
  maxWidth = 'default', // 'narrow', 'default', 'wide', 'full'
  className = '',
  animate = true
}) => {
  const containerClass = {
    narrow: 'page-container-narrow',
    default: '',
    wide: 'page-container-wide',
    full: 'container-fluid'
  }[maxWidth];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    variants: pageVariants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    transition: { duration: 0.3 }
  } : {};

  return (
    <Wrapper className={`page-layout ${className}`} {...wrapperProps}>
      {hero && (
        <section 
          className="page-hero"
          style={heroBackground ? { backgroundImage: `url(${heroBackground})` } : undefined}
        >
          <Container>
            {title && <h1 className="page-hero-title">{title}</h1>}
            {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
          </Container>
        </section>
      )}

      <Container className={`page-content ${containerClass}`}>
        {breadcrumbs && <Breadcrumb />}
        
        {!hero && title && (
          <header className="page-header">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </header>
        )}

        <div className="page-body">
          {children}
        </div>
      </Container>
    </Wrapper>
  );
};

export default PageLayout;
```

---

### 6.6.5 Implementation Checklist

#### Layout Components ☐
- [ ] Create `AdminLayout.jsx` with collapsible sidebar
- [ ] Create `AdminLayout.css` with sidebar styles
- [ ] Create `BaristaLayout.jsx` for barista portal
- [ ] Create `EnhancedNavbar.jsx` with mega menu
- [ ] Create `EnhancedNavbar.css`
- [ ] Create `PageLayout.jsx` wrapper component
- [ ] Create `PageLayout.css`

#### Route Integration ☐
- [ ] Wrap admin routes with `AdminLayout`
- [ ] Wrap barista routes with `BaristaLayout`
- [ ] Replace `Navbar` with `EnhancedNavbar` in App.js
- [ ] Update admin pages to remove individual breadcrumbs
- [ ] Update barista pages to remove individual navigation

#### Testing ☐
- [ ] Test sidebar collapse/expand on desktop
- [ ] Test mobile sidebar overlay behavior
- [ ] Test mega menu hover states
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test on different screen sizes

---

### 6.6.6 Visual Comparison

#### Before (Current)
```
┌─────────────────────────────────────────────────────────────┐
│ Logo  Home Products About Announcements Services Contact    │
│       [Search]  🛒  🔔  [User ▼]                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Admin Dashboard                                           │
│   (No sidebar - must use dropdown to navigate)              │
│                                                             │
│   Cards, Tables, Content...                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### After (Modern)
```
┌─────────────────────────────────────────────────────────────┐
│ Logo    [Products ▼]  About  Services  Contact  🔍 🛒 🔔 👤 │
├──────────┬──────────────────────────────────────────────────┤
│ 📊 Dash  │  Admin Dashboard                                 │
│ 📦 Prods │                                                  │
│ 📋 Ordrs │  Welcome, Admin!                                 │
│ 👥 Users │                                                  │
│ ──────── │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│ 📈 Stats │  │ Orders  │  │ Revenue │  │ Users   │          │
│ 📄 Rprts │  │   156   │  │ ₱45,230 │  │   89    │          │
│ ──────── │  └─────────┘  └─────────┘  └─────────┘          │
│ 👔 HR    │                                                  │
│ [Collapse] │  Charts, Tables, Content...                    │
└──────────┴──────────────────────────────────────────────────┘
```

---

**Next Steps:**
1. Review and approve plan
2. Begin Phase 6.1 implementation
3. Create feature branch: `feature/phase-6-ux-enhancement`
4. Implement in priority order
5. Test each phase before proceeding
6. Update IMPROVEMENT_PLAN.md upon completion
