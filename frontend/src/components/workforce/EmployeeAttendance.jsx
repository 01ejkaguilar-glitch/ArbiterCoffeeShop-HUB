import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaPlay, FaStop, FaCheckCircle,
  FaHistory, FaTimes, FaExclamationCircle,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeAttendance.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';
import { useToast } from '../../hooks/useToast';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtDateShort(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function calcElapsed(clockInIso) {
  if (!clockInIso) return null;
  const diff = Date.now() - new Date(clockInIso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const STATUS_MAP = {
  present:  { label: 'Present',   badge: 'present' },
  late:     { label: 'Late',      badge: 'late' },
  absent:   { label: 'Absent',    badge: 'absent' },
  on_leave: { label: 'On Leave',  badge: 'on_leave' },
  half_day: { label: 'Half Day',  badge: 'half_day' },
};

// ── Component ──────────────────────────────────────────────────────────────────

const EmployeeAttendance = ({ theme = DEFAULT_THEME }) => {
  const t = { ...DEFAULT_THEME, ...theme };

  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const [liveTime, setLiveTime] = useState(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.MY_ATTENDANCE);
      const data = res.data?.data ?? res.data;
      setToday(data?.today ?? null);
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setStats(data?.stats ?? null);
    } catch {
      showToast('error', 'Failed to load attendance data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleClockIn = async () => {
    setActing(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.WORKFORCE.CLOCK_IN, {});
      const record = res.data?.data ?? res.data;
      setToday(record);
      showToast('success', 'Successfully clocked in! Have a great shift.');
      fetchAttendance();
    } catch (err) {
      showToast('error', err?.response?.data?.message ?? 'Failed to clock in. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleClockOut = async () => {
    setActing(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.WORKFORCE.CLOCK_OUT, {});
      const record = res.data?.data ?? res.data;
      setToday(record);
      showToast('success', 'Successfully clocked out! Great work today.');
      fetchAttendance();
    } catch (err) {
      showToast('error', err?.response?.data?.message ?? 'Failed to clock out. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const isClockedIn = !!(today?.clock_in && !today?.clock_out);
  const isComplete  = !!(today?.clock_in && today?.clock_out);
  const notStarted  = !today?.clock_in;

  let statusClass = 'not-started';
  let statusText  = 'Not Clocked In';
  if (isClockedIn) { statusClass = 'clocked-in';  statusText = 'Clocked In'; }
  if (isComplete)  { statusClass = 'clocked-out'; statusText = 'Shift Complete'; }

  const elapsed = isClockedIn ? calcElapsed(today.clock_in) : null;

  // Normalize stat keys — barista uses stats.present, kitchen uses stats.total_present
  const statPresent = stats?.present ?? stats?.total_present ?? '—';
  const statHours   = stats ? `${stats.total_hours ?? 0}h` : '—';
  const statLate    = stats?.late ?? stats?.total_late ?? '—';
  const statAbsent  = stats?.absent ?? stats?.total_absent ?? '—';

  if (loading) {
    return (
      <div className="ac-loader">
        <div className="ac-spinner" style={{ borderTopColor: t.primary }} />
        <span>Loading attendance…</span>
      </div>
    );
  }

  return (
    <div
      className="ac-page"
      style={{
        '--wf-primary': t.primary,
        '--wf-tint': t.tint,
        '--wf-tint-border': t.tintBorder,
      }}
    >
      {/* Topbar */}
      <div className="ac-topbar">
        <div className="ac-topbar-title">
          <h1>Attendance Clock</h1>
          <p>Clock in and out for your shifts</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`ac-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          {toast.msg}
            <button className="ac-toast-close" onClick={clearToast}><FaTimes size={12} /></button>
        </div>
      )}

      {/* Main layout */}
      <div className="ac-grid">

        {/* Left — clock hero */}
        <div className="ac-clock-card">
          <div className="ac-live-clock">
            {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className="ac-live-date">
            {liveTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className={`ac-status-badge ${statusClass}`}>
            <div className="ac-status-dot" />
            {statusText}
          </div>

          <div className="ac-times-row">
            <div className="ac-time-box">
              <span className="ac-time-label">Clock In</span>
              <span className={`ac-time-val${notStarted ? ' muted' : ''}`}>
                {today?.clock_in ? fmtTime(today.clock_in) : '—'}
              </span>
            </div>
            <div className="ac-time-divider" />
            <div className="ac-time-box">
              <span className="ac-time-label">Clock Out</span>
              <span className={`ac-time-val${!isComplete ? ' muted' : ''}`}>
                {today?.clock_out ? fmtTime(today.clock_out) : '—'}
              </span>
            </div>
            {isComplete && (
              <>
                <div className="ac-time-divider" />
                <div className="ac-time-box">
                  <span className="ac-time-label">Hours</span>
                  <span className="ac-time-val">{Number(today.hours_worked ?? 0).toFixed(1)}h</span>
                </div>
              </>
            )}
          </div>

          {isClockedIn && elapsed && (
            <div className="ac-elapsed">Elapsed: <span>{elapsed}</span></div>
          )}

          <div className="ac-action-row">
            {notStarted && (
              <button
                className="ac-btn clock-in"
                style={{ background: t.primary }}
                onClick={handleClockIn}
                disabled={acting}
              >
                <FaPlay size={12} />
                {acting ? 'Clocking In…' : 'Clock In'}
              </button>
            )}
            {isClockedIn && (
              <button className="ac-btn clock-out" onClick={handleClockOut} disabled={acting}>
                <FaStop size={12} />
                {acting ? 'Clocking Out…' : 'Clock Out'}
              </button>
            )}
            {isComplete && (
              <button className="ac-btn complete" disabled>
                <FaCheckCircle size={12} /> Shift Complete
              </button>
            )}
          </div>
        </div>

        {/* Right — stats + history */}
        <div className="ac-side">

          <div className="ac-stats">
            <div className="ac-stat">
              <div className="ac-stat-val green">{statPresent}</div>
              <div className="ac-stat-lbl">Present</div>
            </div>
            <div className="ac-stat">
              <div className="ac-stat-val blue" style={{ color: t.primary }}>{statHours}</div>
              <div className="ac-stat-lbl">Hours</div>
            </div>
            <div className="ac-stat">
              <div className="ac-stat-val amber">{statLate}</div>
              <div className="ac-stat-lbl">Late</div>
            </div>
            <div className="ac-stat">
              <div className="ac-stat-val red">{statAbsent}</div>
              <div className="ac-stat-lbl">Absent</div>
            </div>
          </div>

          <div className="ac-section">
            <div className="ac-section-hdr">
              <FaHistory size={13} style={{ color: t.primary }} />
              Recent History
            </div>
            {history.length === 0 ? (
              <div className="ac-empty">No attendance records found</div>
            ) : (
              <div className="ac-history-list">
                {history.map((rec, idx) => {
                  const s = STATUS_MAP[rec.status] ?? { label: rec.status, badge: rec.status };
                  const hrs = Number(rec.hours_worked ?? 0);
                  return (
                    <div key={rec.id ?? idx} className="ac-history-item">
                      <div className={`ac-history-dot ${rec.status}`} />
                      <div className="ac-history-info">
                        <div className="ac-history-date">{fmtDateShort(rec.date)}</div>
                        <div className="ac-history-time">
                          {rec.clock_in ? fmtTime(rec.clock_in) : '—'}
                          {rec.clock_out ? ` – ${fmtTime(rec.clock_out)}` : ''}
                        </div>
                      </div>
                      <span className={`ac-hist-badge ${s.badge}`}>{s.label}</span>
                      {hrs > 0 && <span className="ac-hist-hours">{hrs.toFixed(1)}h</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
