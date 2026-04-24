import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTrophy, FaChartLine, FaClipboardList, FaStar,
  FaUserTie, FaAngleDown, FaLightbulb, FaThumbsUp,
  FaBullseye, FaCommentDots, FaTimes, FaCheckCircle,
  FaExclamationCircle, FaInbox, FaChartBar,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeMyPerformance.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';
import { useToast } from '../../hooks/useToast';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const fmtPeriod = (start, end) => {
  if (!start || !end) return 'N/A';
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return s === e ? s : `${s} – ${e}`;
};
const scoreBadge = (score) => {
  if (score >= 4.5) return { cls: 'excellent', label: 'Excellent' };
  if (score >= 3.5) return { cls: 'good',      label: 'Good' };
  if (score >= 2.5) return { cls: 'average',   label: 'Average' };
  if (score >= 1.5) return { cls: 'below',     label: 'Below Avg' };
  return                    { cls: 'poor',      label: 'Poor' };
};
const barCls = (score) => {
  if (score >= 3.5) return '';
  if (score >= 2.5) return 'mid';
  return 'low';
};

/* ── Stars ───────────────────────────────────────────────────── */
const Stars = ({ score, max = 5 }) => {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    let cls = 'mp-star';
    if (i <= Math.floor(score)) cls += ' lit';
    else if (i - 0.5 <= score) cls += ' half';
    stars.push(<FaStar key={i} className={cls} />);
  }
  return <span className="mp-stars">{stars}</span>;
};

/* ── Categories ──────────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'customer_service_score', label: 'Customer Service' },
  { key: 'speed_score',            label: 'Speed' },
  { key: 'quality_score',          label: 'Quality' },
  { key: 'teamwork_score',         label: 'Teamwork' },
  { key: 'attendance_score',       label: 'Attendance' },
];

/* ── ReviewCard ──────────────────────────────────────────────── */
const ReviewCard = ({ review, theme }) => {
  const [open, setOpen] = useState(false);
  const score = review.overall_score || 0;
  const { cls, label } = scoreBadge(score);
  const reviewer = review.reviewer?.name
    || [review.reviewer?.first_name, review.reviewer?.last_name].filter(Boolean).join(' ')
    || 'Manager';

  return (
    <div className="mp-review-card">
      <div className="mp-review-header" onClick={() => setOpen(o => !o)}>
        <div>
          <div className="mp-review-period">{fmtPeriod(review.review_period_start, review.review_period_end)}</div>
          <div className="mp-review-meta">Reviewed by {reviewer} · {fmtDate(review.created_at)}</div>
        </div>
        <div className="mp-review-score-pill">
          <Stars score={score} />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: theme.primary }}>{score}/5</span>
          <span className={`mp-badge ${cls}`}>{label}</span>
          <FaAngleDown className={`mp-review-chevron${open ? ' open' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="mp-review-body">
          <div className="mp-review-scores-grid">
            {CATEGORIES.map(cat => (
              <div className="mp-review-score-cell" key={cat.key}>
                <div className="val">{review[cat.key] != null ? Number(review[cat.key]).toFixed(1) : '—'}</div>
                <div className="lbl">{cat.label}</div>
              </div>
            ))}
          </div>
          {(review.strengths || review.areas_for_improvement || review.goals || review.comments) && (
            <div className="mp-review-text-grid">
              {review.strengths && (
                <div className="mp-text-block">
                  <div className="mp-text-block-title"><FaThumbsUp />Strengths</div>
                  <div className="mp-text-block-body">{review.strengths}</div>
                </div>
              )}
              {review.areas_for_improvement && (
                <div className="mp-text-block">
                  <div className="mp-text-block-title"><FaLightbulb />Areas for Improvement</div>
                  <div className="mp-text-block-body">{review.areas_for_improvement}</div>
                </div>
              )}
              {review.goals && (
                <div className="mp-text-block">
                  <div className="mp-text-block-title"><FaBullseye />Goals</div>
                  <div className="mp-text-block-body">{review.goals}</div>
                </div>
              )}
              {review.comments && (
                <div className="mp-text-block">
                  <div className="mp-text-block-title"><FaCommentDots />Comments</div>
                  <div className="mp-text-block-body">{review.comments}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
const EmployeeMyPerformance = ({
  theme = DEFAULT_THEME,
  liveEndpoint = API_ENDPOINTS.BARISTA.PERFORMANCE,
}) => {
  const t = { ...DEFAULT_THEME, ...theme };

  const [reviews, setReviews]     = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [period, setPeriod]       = useState('today');
  const [loading, setLoading]     = useState(true);
  const [liveLoad, setLiveLoad]   = useState(false);
  const [liveErr, setLiveErr]     = useState('');
  const { toast, showToast, clearToast } = useToast();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await apiService.get(API_ENDPOINTS.WORKFORCE.PERFORMANCE_REVIEWS);
      const list = raw?.data?.data || raw?.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Failed to load performance reviews.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchLiveStats = useCallback(async (p) => {
    if (!liveEndpoint) return;
    try {
      setLiveLoad(true);
      setLiveErr('');
      const raw = await apiService.get(liveEndpoint, { params: { period: p } });
      setLiveStats(raw?.data || raw);
    } catch (err) {
      setLiveErr(err?.response?.data?.message || 'Failed to load live stats.');
    } finally {
      setLiveLoad(false);
    }
  }, [liveEndpoint]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchLiveStats(period); }, [period, fetchLiveStats]);

  /* ── Derived stats ── */
  const avgOverall = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + Number(r.overall_score || 0), 0) / reviews.length * 10) / 10
    : 0;

  const latest = reviews.length
    ? reviews.reduce((a, b) => new Date(b.review_period_end) > new Date(a.review_period_end) ? b : a)
    : null;

  const avgByCategory = CATEGORIES.map(cat => {
    const vals = reviews.map(r => Number(r[cat.key] || 0)).filter(v => v > 0);
    const avg = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : 0;
    return { ...cat, avg };
  });

  const bestCat = avgByCategory.length
    ? avgByCategory.reduce((a, b) => (b.avg > a.avg ? b : a))
    : null;

  const { cls: overallCls } = scoreBadge(avgOverall);

  if (loading) {
    return (
      <div className="mp-page">
        <div className="mp-loader">
          <div className="mp-spinner" style={{ borderTopColor: t.primary }} />
          <span>Loading performance data…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mp-page"
      style={{ '--wf-primary': t.primary, '--wf-tint': t.tint, '--wf-tint-border': t.tintBorder }}
    >
      {/* Topbar */}
      <div className="mp-topbar">
        <div className="mp-topbar-title">
          <h1>My Performance</h1>
          <p>Track your professional growth and review history</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mp-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle size={14} /> : <FaExclamationCircle size={14} />}
          <span>{toast.msg}</span>
          <button className="mp-toast-close" onClick={clearToast}><FaTimes size={12} /></button>
        </div>
      )}

      {/* Period tabs */}
      <div className="mp-period-row">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week',  label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`mp-period-tab${period === key ? ' active' : ''}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="mp-stats">
        <div className="mp-stat-card">
          <div className="mp-stat-icon green"><FaTrophy size={16} /></div>
          <div>
            <div className="mp-stat-val">{avgOverall || '—'}</div>
            <div className="mp-stat-lbl">Overall Avg Score</div>
            <div className="mp-stat-sub">
              {reviews.length
                ? <><Stars score={avgOverall} />&nbsp;<span className={`mp-badge ${overallCls}`}>{scoreBadge(avgOverall).label}</span></>
                : 'No reviews yet'}
            </div>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon blue"><FaClipboardList size={16} /></div>
          <div>
            <div className="mp-stat-val">{latest ? Number(latest.overall_score).toFixed(1) : '—'}</div>
            <div className="mp-stat-lbl">Latest Review</div>
            <div className="mp-stat-sub">
              {latest ? fmtPeriod(latest.review_period_start, latest.review_period_end) : 'No reviews yet'}
            </div>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon amber"><FaChartBar size={16} /></div>
          <div>
            <div className="mp-stat-val">{reviews.length}</div>
            <div className="mp-stat-lbl">Total Reviews</div>
            <div className="mp-stat-sub">All-time</div>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon green"><FaStar size={16} /></div>
          <div>
            <div className="mp-stat-val" style={{ fontSize: '1.1rem' }}>
              {bestCat && bestCat.avg > 0 ? bestCat.label : '—'}
            </div>
            <div className="mp-stat-lbl">Best Category</div>
            <div className="mp-stat-sub">
              {bestCat && bestCat.avg > 0 ? `Avg ${bestCat.avg}/5` : 'No data yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Live order performance */}
      {liveEndpoint && (
        <div className="mp-live-card">
          <div className="mp-card-hdr">
            <FaChartLine size={14} style={{ color: t.primary }} />
            Live Order Performance&nbsp;–&nbsp;
            <em style={{ fontWeight: 400, fontStyle: 'normal', textTransform: 'capitalize' }}>{period}</em>
          </div>
          {liveLoad ? (
            <div className="mp-loader" style={{ minHeight: 80 }}>
              <div className="mp-spinner" style={{ borderTopColor: t.primary }} />
            </div>
          ) : liveErr ? (
            <div className="mp-empty" style={{ padding: '16px' }}>
              <FaExclamationCircle size={18} style={{ color: '#ef4444', opacity: 0.6 }} />
              <p style={{ marginTop: 6, fontSize: '0.82rem', color: '#b91c1c' }}>{liveErr}</p>
            </div>
          ) : (
            <div className="mp-live-grid">
              <div className="mp-live-item">
                <div className="mp-live-val">{liveStats?.orders_completed ?? '—'}</div>
                <div className="mp-live-lbl">Orders Completed</div>
              </div>
              <div className="mp-live-item">
                <div className="mp-live-val">{liveStats?.total_orders ?? '—'}</div>
                <div className="mp-live-lbl">Total Orders</div>
              </div>
              <div className="mp-live-item">
                <div className="mp-live-val">
                  {liveStats?.avg_preparation_time != null ? `${liveStats.avg_preparation_time}m` : '—'}
                </div>
                <div className="mp-live-lbl">Avg Prep Time</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-column grid */}
      <div className="mp-grid">

        {/* Score breakdown */}
        <div className="mp-section-card">
          <div className="mp-card-hdr">
            <FaTrophy size={13} style={{ color: t.primary }} />
            Category Averages
          </div>
          <div className="mp-section-body">
            {reviews.length === 0 ? (
              <div className="mp-empty"><FaInbox size={32} /><p>No review data yet</p></div>
            ) : (
              avgByCategory.map(cat => (
                <div className="mp-score-row" key={cat.key}>
                  <div className="mp-score-header">
                    <span className="mp-score-name">{cat.label}</span>
                    <span className="mp-score-num" style={{ color: t.primary }}>
                      {cat.avg > 0 ? `${cat.avg}/5` : '—'}
                    </span>
                  </div>
                  <div className="mp-bar-track">
                    <div
                      className={`mp-bar-fill ${barCls(cat.avg)}`}
                      style={{ width: `${(cat.avg / 5) * 100}%`, background: t.gradient }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review history */}
        <div className="mp-section-card">
          <div className="mp-card-hdr">
            <FaClipboardList size={13} style={{ color: t.primary }} />
            Review History
          </div>
          <div className="mp-reviews-body">
            {reviews.length === 0 ? (
              <div className="mp-empty">
                <FaUserTie size={32} />
                <p>No performance reviews yet</p>
                <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 4 }}>
                  Your manager will add reviews here after evaluations.
                </p>
              </div>
            ) : (
              reviews.map(review => <ReviewCard key={review.id} review={review} theme={t} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeMyPerformance;
