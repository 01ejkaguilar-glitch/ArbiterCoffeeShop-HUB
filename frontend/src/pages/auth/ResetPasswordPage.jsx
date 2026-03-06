import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaLock, FaEye, FaEyeSlash, FaExclamationCircle,
  FaTimes, FaCheck, FaCircle, FaArrowLeft,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import { useToast } from '../../components/animations/Toast';
import { FadeIn, SlideInUp } from '../../components/animations/AnimationWrappers';
import './Auth.css';

/* ── Password strength helper (same as RegisterPage) ── */
const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const toast = useToast();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const pwReqs = useMemo(() => ({
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  }), [password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!token || !emailFromUrl) {
      setError('This reset link is invalid or has expired. Please request a new one.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        email: emailFromUrl,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 422 && data?.errors) {
        setFieldErrors(data.errors);
        setError(data.message || 'Please fix the errors below.');
      } else if (status === 400) {
        // Expired or invalid token
        setError(
          data?.message ||
          'This reset link has expired or is invalid. Please request a new one.'
        );
      } else if (status === 429) {
        setError('Too many attempts. Please wait before trying again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, emailFromUrl, password, passwordConfirmation, toast, navigate]);

  const ReqItem = ({ met, children }) => (
    <span className={`auth-req-item${met ? ' met' : ''}`}>
      {met
        ? <FaCheck className="auth-req-icon" aria-hidden="true" />
        : <FaCircle className="auth-req-icon" aria-hidden="true" />
      }
      {children}
    </span>
  );

  /* Invalid link — no token in URL */
  if (!token || !emailFromUrl) {
    return (
      <main role="main" className="auth-page">
        <div className="auth-brand-panel" aria-hidden="true">
          <div className="auth-brand-content">
            <img src="/assets/arbiter-logo-white.png" alt="" className="auth-brand-logo" />
            <h2 className="auth-brand-title">Arbiter Coffee</h2>
            <p className="auth-brand-tagline">
              Premium artisan coffee, crafted with care and delivered to&nbsp;your&nbsp;door.
            </p>
          </div>
          <div className="auth-brand-decoration" />
          <div className="auth-brand-decoration-sm" />
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-container">
            <FadeIn duration={0.3}>
              <div className="auth-mobile-brand">
                <img src="/assets/arbiter-logo.png" alt="" className="auth-mobile-logo" />
                <span className="auth-mobile-name">Arbiter Coffee</span>
              </div>
              <div className="auth-success-state">
                <div className="auth-alert auth-alert--error" role="alert" style={{ marginBottom: 'var(--spacing-6)' }}>
                  <FaExclamationCircle className="auth-alert-icon" aria-hidden="true" />
                  <span>This reset link is invalid or missing. Please request a new one.</span>
                </div>
                <Link to="/forgot-password" className="auth-submit-btn" style={{ textDecoration: 'none', display: 'flex' }}>
                  Request New Link
                </Link>
              </div>
              <p className="auth-footer">
                <Link to="/login" className="auth-footer-link auth-footer-link--back">
                  <FaArrowLeft aria-hidden="true" />
                  Back to Sign In
                </Link>
              </p>
            </FadeIn>
          </div>
        </div>
      </main>
    );
  }

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
              <header className="auth-header">
                <h1 id="reset-heading" className="auth-heading">Set New Password</h1>
                <p className="auth-subheading">
                  Resetting password for <strong>{emailFromUrl}</strong>
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

              <form onSubmit={handleSubmit} aria-labelledby="reset-heading" noValidate>
                {/* New Password */}
                <div className="auth-field">
                  <label htmlFor="reset-password" className="auth-field-label">
                    <FaLock aria-hidden="true" />
                    New Password
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`auth-input${fieldErrors.password ? ' is-invalid' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={fieldErrors.password ? 'true' : 'false'}
                      aria-describedby="reset-pw-reqs"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="auth-field-error" role="alert">{fieldErrors.password[0]}</span>
                  )}

                  {/* Strength meter */}
                  {password && (
                    <div className="auth-password-strength" aria-live="polite">
                      <div className="auth-strength-bar-track">
                        <div className="auth-strength-bar-fill" data-strength={strength.score} />
                      </div>
                      <div className="auth-strength-label" data-strength={strength.score}>
                        {strength.label}
                      </div>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  <div className="auth-password-reqs" id="reset-pw-reqs">
                    <ReqItem met={pwReqs.length}>8+ characters</ReqItem>
                    <ReqItem met={pwReqs.lower}>Lowercase letter</ReqItem>
                    <ReqItem met={pwReqs.upper}>Uppercase letter</ReqItem>
                    <ReqItem met={pwReqs.digit}>Number</ReqItem>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label htmlFor="reset-password-confirm" className="auth-field-label">
                    <FaLock aria-hidden="true" />
                    Confirm New Password
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="reset-password-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className={`auth-input${
                        passwordConfirmation && passwordConfirmation !== password
                          ? ' is-invalid'
                          : ''
                      }`}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordConfirmation && passwordConfirmation !== password && (
                    <span className="auth-field-error" role="alert">Passwords do not match</span>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={
                    loading ||
                    !password ||
                    !passwordConfirmation ||
                    password !== passwordConfirmation ||
                    strength.score < 3
                  }
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Resetting password…
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

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

export default ResetPasswordPage;
