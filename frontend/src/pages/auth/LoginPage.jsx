import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/animations/Toast';
import { FadeIn, SlideInUp } from '../../components/animations/AnimationWrappers';
import './Auth.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const returnUrl = location.state?.from || '/dashboard';

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password, rememberMe);
      if (result.success) {
        toast.success('Welcome back!');
        navigate(returnUrl);
      } else {
        const msg = result.message || 'Login failed. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, login, toast, navigate, returnUrl]);

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
                <h1 id="login-heading" className="auth-heading">Welcome Back</h1>
                <p className="auth-subheading">Sign in to your account to continue</p>
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

              <form onSubmit={handleSubmit} aria-labelledby="login-heading" noValidate>
                {/* Email */}
                <div className="auth-field">
                  <label htmlFor="login-email" className="auth-field-label">
                    <FaEnvelope aria-hidden="true" />
                    Email Address
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                  />
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label htmlFor="login-password" className="auth-field-label">
                    <FaLock aria-hidden="true" />
                    Password
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
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
                </div>

                {/* Remember me / Forgot */}
                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      className="auth-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="auth-footer">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="auth-footer-link">
                  Create one
                </Link>
              </p>
            </SlideInUp>
          </FadeIn>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
