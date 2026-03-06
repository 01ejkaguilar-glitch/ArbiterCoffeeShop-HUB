import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaExclamationCircle, FaTimes, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { FadeIn, SlideInUp } from '../../components/animations/AnimationWrappers';
import './Auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      // Always show success to avoid email enumeration (backend does the same)
      setSubmitted(true);
    } catch (err) {
      // Show success regardless — the backend intentionally returns success even
      // for unknown emails to prevent user enumeration. Only network errors reach here.
      const status = err?.response?.status;
      if (status === 422) {
        setError('Please enter a valid email address.');
      } else if (status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setSubmitted(true); // Still show success on other errors to prevent enumeration
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <main role="main" className="auth-page">
      {/* ── Brand Panel (desktop only) ── */}
      <div className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-content">
          <img
            src="/assets/arbiter-logo-white.png"
            alt=""
            className="auth-brand-logo"
          />
          <h2 className="auth-brand-title">Arbiter Coffee</h2>
          <p className="auth-brand-tagline">
            Premium artisan coffee, crafted with care and delivered to&nbsp;your&nbsp;door.
          </p>
        </div>
        <div className="auth-brand-decoration" />
        <div className="auth-brand-decoration-sm" />
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <FadeIn duration={0.3}>
            {/* Mobile brand header */}
            <div className="auth-mobile-brand">
              <img src="/assets/arbiter-logo.png" alt="" className="auth-mobile-logo" />
              <span className="auth-mobile-name">Arbiter Coffee</span>
            </div>

            <SlideInUp duration={0.4} delay={0.05}>
              {!submitted ? (
                <>
                  <header className="auth-header">
                    <h1 id="forgot-heading" className="auth-heading">Forgot Password?</h1>
                    <p className="auth-subheading">
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                  </header>

                  {error && (
                    <div className="auth-alert auth-alert--error" role="alert">
                      <FaExclamationCircle className="auth-alert-icon" aria-hidden="true" />
                      <span>{error}</span>
                      <button
                        type="button"
                        className="auth-alert-dismiss"
                        onClick={() => setError('')}
                        aria-label="Dismiss error"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} aria-labelledby="forgot-heading" noValidate>
                    <div className="auth-field">
                      <label htmlFor="forgot-email" className="auth-field-label">
                        <FaEnvelope aria-hidden="true" />
                        Email Address
                        <span className="auth-field-required" aria-label="required">*</span>
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        autoComplete="email"
                        aria-required="true"
                      />
                    </div>

                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <span className="auth-spinner" />
                          Sending…
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* ── Success State ── */
                <div className="auth-success-state" role="status" aria-live="polite">
                  <div className="auth-success-icon-wrap" aria-hidden="true">
                    <FaCheckCircle className="auth-success-icon" />
                  </div>
                  <h1 className="auth-heading">Check your email</h1>
                  <p className="auth-subheading">
                    If an account exists for <strong>{email}</strong>, a password reset
                    link has been sent. Check your inbox and spam folder.
                  </p>
                  <p className="auth-success-note">
                    The link expires in <strong>60&nbsp;minutes</strong>.
                  </p>
                  <button
                    type="button"
                    className="auth-submit-btn auth-submit-btn--outline"
                    onClick={() => { setSubmitted(false); setEmail(''); }}
                  >
                    Try a different email
                  </button>
                </div>
              )}

              <p className="auth-footer">
                <Link to="/login" className="auth-footer-link auth-footer-link--back">
                  <FaArrowLeft aria-hidden="true" />
                  Back to Sign&nbsp;In
                </Link>
              </p>
            </SlideInUp>
          </FadeIn>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;
