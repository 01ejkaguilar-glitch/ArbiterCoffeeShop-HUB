import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash,
  FaExclamationCircle, FaTimes, FaCheck, FaCircle,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/animations/Toast';
import { FadeIn, SlideInUp } from '../../components/animations/AnimationWrappers';
import './Auth.css';

/* ── Password strength helper ── */
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

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  /* Password requirement flags */
  const pwReqs = useMemo(() => ({
    length: formData.password.length >= 8,
    lower: /[a-z]/.test(formData.password),
    upper: /[A-Z]/.test(formData.password),
    digit: /\d/.test(formData.password),
  }), [formData.password]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (!agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Account created successfully! Welcome to Arbiter Coffee.');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        if (result.errors) setErrors(result.errors);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, agreeToTerms, register, toast, navigate]);

  const ReqItem = ({ met, children }) => (
    <span className={`auth-req-item${met ? ' met' : ''}`}>
      {met
        ? <FaCheck className="auth-req-icon" aria-hidden="true" />
        : <FaCircle className="auth-req-icon" aria-hidden="true" />
      }
      {children}
    </span>
  );

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
            Join our community of coffee lovers and experience artisan brews like never&nbsp;before.
          </p>
        </div>
        <div className="auth-brand-decoration" />
        <div className="auth-brand-decoration-sm" />
      </div>

      {/* ── Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-container auth-form-container--wide">
          <FadeIn duration={0.3}>
            {/* Mobile brand header */}
            <div className="auth-mobile-brand">
              <img src="/assets/arbiter-logo.png" alt="" className="auth-mobile-logo" />
              <span className="auth-mobile-name">Arbiter Coffee</span>
            </div>

            <SlideInUp duration={0.4} delay={0.05}>
              <header className="auth-header">
                <h1 id="register-heading" className="auth-heading">Create Account</h1>
                <p className="auth-subheading">Join Arbiter Coffee today</p>
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

              <form onSubmit={handleSubmit} aria-labelledby="register-heading" noValidate>
                {/* Full Name */}
                <div className="auth-field">
                  <label htmlFor="register-name" className="auth-field-label">
                    <FaUser aria-hidden="true" />
                    Full Name
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    className={`auth-input${errors.name ? ' is-invalid' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <span className="auth-field-error" id="name-error" role="alert">{errors.name[0]}</span>
                  )}
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label htmlFor="register-email" className="auth-field-label">
                    <FaEnvelope aria-hidden="true" />
                    Email Address
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    className={`auth-input${errors.email ? ' is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <span className="auth-field-error" id="email-error" role="alert">{errors.email[0]}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="auth-field">
                  <label htmlFor="register-phone" className="auth-field-label">
                    <FaPhone aria-hidden="true" />
                    Phone Number
                  </label>
                  <input
                    id="register-phone"
                    type="tel"
                    name="phone"
                    className={`auth-input${errors.phone ? ' is-invalid' : ''}`}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+63 912 345 6789"
                    autoComplete="tel"
                    aria-invalid={errors.phone ? 'true' : 'false'}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />
                  {errors.phone && (
                    <span className="auth-field-error" id="phone-error" role="alert">{errors.phone[0]}</span>
                  )}
                </div>

                {/* Password */}
                <div className="auth-field">
                  <label htmlFor="register-password" className="auth-field-label">
                    <FaLock aria-hidden="true" />
                    Password
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`auth-input${errors.password ? ' is-invalid' : ''}`}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby="pw-reqs password-error"
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
                  {errors.password && (
                    <span className="auth-field-error" id="password-error" role="alert">{errors.password[0]}</span>
                  )}

                  {/* Strength meter */}
                  {formData.password && (
                    <div className="auth-password-strength" aria-live="polite">
                      <div className="auth-strength-bar-track">
                        <div
                          className="auth-strength-bar-fill"
                          data-strength={strength.score}
                        />
                      </div>
                      <div className="auth-strength-label" data-strength={strength.score}>
                        {strength.label}
                      </div>
                    </div>
                  )}

                  {/* Requirement checklist */}
                  <div className="auth-password-reqs" id="pw-reqs">
                    <ReqItem met={pwReqs.length}>8+ characters</ReqItem>
                    <ReqItem met={pwReqs.lower}>Lowercase letter</ReqItem>
                    <ReqItem met={pwReqs.upper}>Uppercase letter</ReqItem>
                    <ReqItem met={pwReqs.digit}>Number</ReqItem>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label htmlFor="register-password-confirm" className="auth-field-label">
                    <FaLock aria-hidden="true" />
                    Confirm Password
                    <span className="auth-field-required" aria-label="required">*</span>
                  </label>
                  <div className="auth-password-wrapper">
                    <input
                      id="register-password-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="password_confirmation"
                      className={`auth-input${
                        formData.password_confirmation &&
                        formData.password_confirmation !== formData.password
                          ? ' is-invalid'
                          : ''
                      }`}
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {formData.password_confirmation &&
                    formData.password_confirmation !== formData.password && (
                      <span className="auth-field-error" role="alert">Passwords do not match</span>
                    )}
                </div>

                {/* Terms */}
                <div className="auth-field">
                  <label className="auth-terms-label">
                    <input
                      type="checkbox"
                      className="auth-checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      aria-required="true"
                    />
                    <span>
                      I agree to the{' '}
                      <Link to="/terms" className="auth-terms-link">Terms of Service</Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="auth-terms-link">Privacy Policy</Link>
                      {' '}<span className="auth-field-required" aria-label="required">*</span>
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || !formData.name || !formData.email || !formData.password || !formData.password_confirmation || !agreeToTerms}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="auth-footer">
                Already have an account?{' '}
                <Link to="/login" className="auth-footer-link">
                  Sign in
                </Link>
              </p>
            </SlideInUp>
          </FadeIn>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
