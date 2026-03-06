import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaChartLine, FaClock, FaStar, FaCheckCircle,
  FaExclamationTriangle, FaTrophy, FaCalendarAlt,
  FaTasks, FaUserClock,
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import './TrainingInsights.css';

/* ── Helpers ─────────────────────────────────────────────────── */
const getGrade = (rate) => {
  if (rate >= 95) return { grade: 'A+', label: 'Outstanding',    cls: 'success' };
  if (rate >= 85) return { grade: 'A',  label: 'Excellent',      cls: 'success' };
  if (rate >= 75) return { grade: 'B+', label: 'Very Good',      cls: 'info' };
  if (rate >= 65) return { grade: 'B',  label: 'Good',           cls: 'info' };
  if (rate >= 55) return { grade: 'C+', label: 'Satisfactory',   cls: 'warning' };
  if (rate >= 45) return { grade: 'C',  label: 'Needs Work',     cls: 'warning' };
  return             { grade: 'D',  label: 'Below Standard', cls: 'danger' };
};

const getSpeedInfo = (minutes) => {
  if (minutes == null || minutes === 0) return { label: 'N/A', pct: 0, cls: 'secondary' };
  if (minutes <= 8)  return { label: 'Fast',    pct: 100, badgeCls: 'success', fillCls: 'green' };
  if (minutes <= 12) return { label: 'Good',    pct: 75,  badgeCls: 'info',    fillCls: 'blue' };
  if (minutes <= 15) return { label: 'Average', pct: 50,  badgeCls: 'warning', fillCls: 'amber' };
  return                    { label: 'Slow',    pct: 25,  badgeCls: 'danger',  fillCls: 'amber' };
};

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
const TrainingInsights = () => {
  const [perf, setPerf]     = useState(null);
  const [tasks, setTasks]   = useState([]);
  const [shift, setShift]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [period, setPeriod] = useState('today');

  /* ── Fetch all three data sources in parallel ─────────────── */
  const fetchAll = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const [perfRes, tasksRes, shiftRes] = await Promise.allSettled([
        apiService.get(API_ENDPOINTS.BARISTA.PERFORMANCE, { params: { period: p } }),
        apiService.get(API_ENDPOINTS.BARISTA.TASKS_TODAY),
        apiService.get(API_ENDPOINTS.BARISTA.SHIFT_CURRENT),
      ]);

      if (perfRes.status === 'fulfilled') {
        setPerf(perfRes.value.data?.data ?? perfRes.value.data);
      } else {
        setError('Failed to load performance data.');
      }

      if (tasksRes.status === 'fulfilled') {
        const raw = tasksRes.value.data?.data ?? tasksRes.value.data;
        setTasks(Array.isArray(raw) ? raw : []);
      }

      if (shiftRes.status === 'fulfilled') {
        setShift(shiftRes.value.data?.data ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(period); }, [period, fetchAll]);

  /* ── Derived ─────────────────────────────────────────────── */
  const completionRate = useMemo(() => {
    if (!perf || !perf.total_orders) return 0;
    return Math.round((perf.orders_completed / perf.total_orders) * 100);
  }, [perf]);

  const grade   = useMemo(() => perf?.total_orders ? getGrade(completionRate) : null, [perf, completionRate]);
  const speed   = useMemo(() => getSpeedInfo(perf?.avg_preparation_time ?? null), [perf]);
  const ratings = useMemo(() => parseFloat(perf?.customer_ratings ?? 0), [perf]);

  const achievements = useMemo(() => [
    {
      key: 'master',
      name: 'Order Master',
      desc: '10+ orders completed',
      icon: <FaCheckCircle />,
      unlocked: (perf?.orders_completed ?? 0) >= 10,
      color: 'green',
    },
    {
      key: 'speed',
      name: 'Speed Demon',
      desc: 'Avg prep time ≤ 10 min',
      icon: <FaClock />,
      unlocked: perf?.avg_preparation_time > 0 && perf.avg_preparation_time <= 10,
      color: 'blue',
    },
    {
      key: 'quality',
      name: 'Quality Champion',
      desc: 'Customer rating ≥ 4.5',
      icon: <FaStar />,
      unlocked: ratings >= 4.5,
      color: 'amber',
    },
  ], [perf, ratings]);

  /* ── UI states ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ti-page">
        <div className="ti-loader">
          <div className="ti-spinner" />
          <span>Loading performance data…</span>
        </div>
      </div>
    );
  }

  if (error && !perf) {
    return (
      <div className="ti-page">
        <div className="ti-error">
          <h3><FaExclamationTriangle style={{ marginRight: 8 }} />Performance Data Unavailable</h3>
          <p>{error}</p>
          <p style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.8 }}>
            Performance tracking requires barista orders to have a barista_id assigned.
            This becomes active once orders are processed through your account.
          </p>
        </div>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────────────── */
  const PERIOD_LABEL = { today: 'Today', week: 'This Week', month: 'This Month' };

  return (
    <div className="ti-page">
      {/* Topbar */}
      <div className="ti-topbar">
        <div className="ti-topbar-title">
          <h1>Training Insights</h1>
          <p>Track your performance and skill development — {PERIOD_LABEL[period]}</p>
        </div>
        <select
          className="ti-period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Select time period"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="ti-stats">
        {/* Grade */}
        <div className="ti-stat-card">
          <div className="ti-stat-icon purple"><FaTrophy /></div>
          <div className="ti-stat-value">{grade?.grade ?? '—'}</div>
          <div className="ti-stat-label">Performance Grade</div>
          {grade ? (
            <div className={`ti-stat-badge ${grade.cls}`}>{grade.label}</div>
          ) : (
            <div className="ti-stat-badge secondary">No Data Yet</div>
          )}
        </div>

        {/* Orders completed */}
        <div className="ti-stat-card">
          <div className="ti-stat-icon green"><FaCheckCircle /></div>
          <div className="ti-stat-value">{perf?.orders_completed ?? 0}</div>
          <div className="ti-stat-label">Orders Completed</div>
          <div className="ti-stat-badge secondary">of {perf?.total_orders ?? 0} total</div>
        </div>

        {/* Avg prep time */}
        <div className="ti-stat-card">
          <div className="ti-stat-icon blue"><FaClock /></div>
          <div className="ti-stat-value">
            {perf?.avg_preparation_time > 0 ? `${perf.avg_preparation_time}m` : '—'}
          </div>
          <div className="ti-stat-label">Avg Prep Time</div>
          {speed.label !== 'N/A' ? (
            <div className={`ti-stat-badge ${speed.badgeCls}`}>{speed.label}</div>
          ) : (
            <div className="ti-stat-badge secondary">No Data</div>
          )}
        </div>

        {/* Customer rating */}
        <div className="ti-stat-card">
          <div className="ti-stat-icon amber"><FaStar /></div>
          <div className="ti-stat-value">{ratings > 0 ? ratings.toFixed(1) : '—'}</div>
          <div className="ti-stat-label">Customer Rating</div>
          {ratings > 0 ? (
            <div className="ti-stars">
              {[1,2,3,4,5].map(i => (
                <FaStar key={i} className={i <= Math.round(ratings) ? 'filled' : 'empty'} size={12} />
              ))}
            </div>
          ) : (
            <div className="ti-stat-badge secondary">No Ratings Yet</div>
          )}
        </div>
      </div>

      {/* Body: breakdown + side column */}
      <div className="ti-content">
        {/* Performance Breakdown */}
        <div className="ti-section">
          <div className="ti-section-hdr">
            <FaChartLine /> Performance Breakdown
          </div>
          <div className="ti-section-body">
            <div className="ti-metric">
              <div className="ti-metric-header">
                <span className="ti-metric-label">Order Completion Rate</span>
                <span className="ti-metric-value">{completionRate}%</span>
              </div>
              <div className="ti-track">
                <div className="ti-fill green" style={{ width: `${completionRate}%` }} />
              </div>
            </div>

            <div className="ti-metric">
              <div className="ti-metric-header">
                <span className="ti-metric-label">Speed Efficiency</span>
                <span className="ti-metric-value">
                  {speed.label !== 'N/A'
                    ? `${perf?.avg_preparation_time}m avg — ${speed.label}`
                    : 'No data'}
                </span>
              </div>
              <div className="ti-track">
                <div className={`ti-fill ${speed.fillCls ?? 'blue'}`} style={{ width: `${speed.pct}%` }} />
              </div>
            </div>

            <div className="ti-metric">
              <div className="ti-metric-header">
                <span className="ti-metric-label">Customer Satisfaction</span>
                <span className="ti-metric-value">
                  {ratings > 0 ? `${((ratings / 5) * 100).toFixed(0)}%` : 'No data'}
                </span>
              </div>
              <div className="ti-track">
                <div className="ti-fill amber" style={{ width: ratings > 0 ? `${(ratings / 5) * 100}%` : '0%' }} />
              </div>
            </div>

            <div className="ti-metric">
              <div className="ti-metric-header">
                <span className="ti-metric-label">Tasks Completed Today</span>
                <span className="ti-metric-value">
                  {tasks.length > 0
                    ? `${tasks.filter(t => t.status === 'completed').length} / ${tasks.length}`
                    : 'None assigned'}
                </span>
              </div>
              <div className="ti-track">
                <div
                  className="ti-fill purple"
                  style={{
                    width: tasks.length > 0
                      ? `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="ti-side">
          {/* Today's Tasks */}
          <div className="ti-section">
            <div className="ti-section-hdr">
              <FaTasks /> Today's Tasks
            </div>
            <div className="ti-section-body">
              {tasks.length === 0 ? (
                <div className="ti-task-empty">
                  <FaCalendarAlt size={24} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <div>No tasks assigned for today</div>
                </div>
              ) : (
                <ul className="ti-task-list">
                  {tasks.map(task => {
                    const done = task.status === 'completed';
                    const prio = (task.priority ?? 'low').toLowerCase();
                    return (
                      <li key={task.id} className={`ti-task-item${done ? ' done' : ''}`}>
                        <div className={`ti-task-checkbox${done ? ' checked' : ''}`}>
                          {done && '✓'}
                        </div>
                        <div className="ti-task-info">
                          <div className={`ti-task-name${done ? ' done' : ''}`}>{task.title}</div>
                          <div className="ti-task-meta">
                            <span className={`ti-priority ${prio}`}>{prio}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Current Shift */}
          <div className="ti-section">
            <div className="ti-section-hdr">
              <FaUserClock /> Current Shift
            </div>
            <div className="ti-section-body">
              {!shift ? (
                <div className="ti-no-shift">No active shift found for today</div>
              ) : (
                <>
                  <div className="ti-shift-row">
                    <span className="ti-shift-key">Position</span>
                    <span className="ti-shift-val">{shift.position ?? '—'}</span>
                  </div>
                  <div className="ti-shift-row">
                    <span className="ti-shift-key">Start</span>
                    <span className="ti-shift-val">{fmtTime(shift.start_time)}</span>
                  </div>
                  <div className="ti-shift-row">
                    <span className="ti-shift-key">End</span>
                    <span className="ti-shift-val">{fmtTime(shift.end_time)}</span>
                  </div>
                  <div className="ti-shift-row">
                    <span className="ti-shift-key">Hours In</span>
                    <span className="ti-shift-val">{shift.elapsed_hours ? `${Number(shift.elapsed_hours).toFixed(1)}h` : '—'}</span>
                  </div>
                  <div className="ti-shift-row">
                    <span className="ti-shift-key">Remaining</span>
                    <span className="ti-shift-val">{shift.remaining_hours ? `${Number(shift.remaining_hours).toFixed(1)}h` : '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="ti-section">
        <div className="ti-section-hdr">
          <FaTrophy /> Achievements
        </div>
        <div className="ti-section-body">
          <div className="ti-achievements">
            {achievements.map(a => (
              <div key={a.key} className={`ti-badge-card ${a.unlocked ? `unlocked ${a.color}` : 'locked'}`}>
                <div className="ti-badge-icon">{a.icon}</div>
                <div className="ti-badge-name">{a.name}</div>
                <div className="ti-badge-desc">{a.desc}</div>
                {!a.unlocked && <div className="ti-locked-label">Locked</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingInsights;
