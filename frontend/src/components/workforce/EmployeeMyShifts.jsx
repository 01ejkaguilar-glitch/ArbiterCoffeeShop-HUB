import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaCalendarAlt, FaClock, FaCheckCircle, FaListUl,
  FaClipboardList, FaCalendarCheck, FaChevronLeft, FaChevronRight,
  FaTimes, FaInbox,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeMyShifts.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';
import { useToast } from '../../hooks/useToast';

/* ── Helpers ─────────────────────────────────────────────────── */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtTime(raw) {
  if (!raw) return 'N/A';
  try {
    const d = new Date(raw);
    if (!isNaN(d)) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const [h, m] = raw.split(':').map(Number);
    const d2 = new Date(); d2.setHours(h, m, 0);
    return d2.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return raw; }
}

function calcDuration(start, end) {
  if (!start || !end) return 'N/A';
  const s = new Date(start); const e = new Date(end);
  if (isNaN(s) || isNaN(e)) return 'N/A';
  let diff = (e - s) / 60000;
  if (diff < 0) diff += 24 * 60;
  return `${Math.floor(diff / 60)}h ${diff % 60 > 0 ? `${diff % 60}m` : ''}`.trim();
}

function fmtDateShort(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function shiftLocalDate(shift) {
  const parts = (shift.date ?? '').split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

const STATUS_LABELS = {
  scheduled: 'Scheduled', confirmed: 'Confirmed',
  completed: 'Completed', cancelled: 'Cancelled',
};

function StatusBadge({ status }) {
  return (
    <span className={`ms-badge ${status ?? 'scheduled'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
const EmployeeMyShifts = ({ theme = DEFAULT_THEME }) => {
  const t = { ...DEFAULT_THEME, ...theme };

  const now = new Date();
  const [shifts, setShifts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const { toast, showToast, clearToast } = useToast();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const fetchShifts = useCallback(async (month, year) => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.MY_SHIFTS, { month, year });
      const data = res.data?.data ?? res.data;
      setShifts(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', 'Failed to load shifts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchShifts(viewMonth, viewYear); }, [fetchShifts, viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const stats = useMemo(() => {
    const total = shifts.length;
    const completed = shifts.filter(s => s.status === 'completed').length;
    const upcoming = shifts.filter(s => {
      const d = shiftLocalDate(s); const today = new Date(); today.setHours(0,0,0,0);
      return d >= today && s.status !== 'cancelled';
    }).length;
    const hours = shifts.reduce((acc, s) => {
      const start = new Date(s.start_time); const end = new Date(s.end_time);
      if (!isNaN(start) && !isNaN(end)) {
        let diff = (end - start) / 3600000;
        if (diff < 0) diff += 24;
        return acc + diff;
      }
      return acc;
    }, 0);
    return { total, completed, upcoming, hours: Math.round(hours * 10) / 10 };
  }, [shifts]);

  const weekDays = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const start = new Date(today); start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start); date.setDate(start.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const dayShifts = shifts.filter(s => (s.date ?? '').split('T')[0] === dateStr);
      return { date, dayShifts, isToday: date.getTime() === today.getTime() };
    });
  }, [shifts]);

  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return shifts
      .filter(s => shiftLocalDate(s) >= today && s.status !== 'cancelled')
      .sort((a, b) => shiftLocalDate(a) - shiftLocalDate(b))
      .slice(0, 5);
  }, [shifts]);

  if (loading) {
    return (
      <div className="ms-page">
        <div className="ms-loader">
          <div className="ms-spinner" style={{ borderTopColor: t.primary }} />
          <span>Loading your shifts…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ms-page"
      style={{ '--wf-primary': t.primary, '--wf-tint': t.tint, '--wf-tint-border': t.tintBorder }}
    >
      {/* Topbar */}
      <div className="ms-topbar">
        <div className="ms-topbar-title">
          <h1>My Shifts</h1>
          <p>View and track your scheduled work shifts</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`ms-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaTimes />}
          {toast.msg}
          <button className="ms-toast-close" onClick={clearToast}><FaTimes size={12} /></button>
        </div>
      )}

      {/* Month navigator */}
      <div className="ms-month-nav">
        <button className="ms-month-btn" onClick={prevMonth} aria-label="Previous month">
          <FaChevronLeft size={12} />
        </button>
        <span className="ms-month-label">{MONTH_NAMES[viewMonth - 1]} {viewYear}</span>
        <button className="ms-month-btn" onClick={nextMonth} aria-label="Next month">
          <FaChevronRight size={12} />
        </button>
      </div>

      {/* Stats */}
      <div className="ms-stats">
        <div className="ms-stat-card">
          <div className="ms-stat-icon green"><FaClipboardList /></div>
          <div>
            <div className="ms-stat-val">{stats.total}</div>
            <div className="ms-stat-lbl">Total Shifts</div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-icon green"><FaClock /></div>
          <div>
            <div className="ms-stat-val">{stats.hours}h</div>
            <div className="ms-stat-lbl">Hours This Month</div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-icon blue"><FaCheckCircle /></div>
          <div>
            <div className="ms-stat-val">{stats.completed}</div>
            <div className="ms-stat-lbl">Completed</div>
          </div>
        </div>
        <div className="ms-stat-card">
          <div className="ms-stat-icon amber"><FaCalendarCheck /></div>
          <div>
            <div className="ms-stat-val">{stats.upcoming}</div>
            <div className="ms-stat-lbl">Upcoming</div>
          </div>
        </div>
      </div>

      {/* This week */}
      <div className="ms-section">
        <div className="ms-section-hdr">
          <FaCalendarAlt size={14} style={{ color: t.primary }} />
          This Week's Schedule
        </div>
        <div className="ms-week-grid">
          {weekDays.map(({ date, dayShifts, isToday }) => (
            <div key={date.toISOString()} className={`ms-day-cell${isToday ? ' today' : ''}`}>
              <span className="ms-day-name">{DAY_ABBR[date.getDay()]}</span>
              <span className="ms-day-num">{date.getDate()}</span>
              {dayShifts.length === 0
                ? <span className="ms-day-off">Off</span>
                : dayShifts.map(s => (
                    <span key={s.id} className={`ms-day-shift-pill ${s.status}`}>
                      {fmtTime(s.start_time)}
                    </span>
                  ))
              }
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming shifts */}
      <div className="ms-section">
        <div className="ms-section-hdr">
          <FaClock size={14} style={{ color: t.primary }} />
          Upcoming Shifts
        </div>
        {upcoming.length === 0 ? (
          <div className="ms-empty"><FaInbox size={32} /><p>No upcoming shifts this month</p></div>
        ) : (
          <div className="ms-upcoming-list">
            {upcoming.map(shift => {
              const d = shiftLocalDate(shift);
              return (
                <div key={shift.id} className="ms-upcoming-item">
                  <div className="ms-upcoming-date-box">
                    <span className="ms-upcoming-day">{d.getDate()}</span>
                    <span className="ms-upcoming-mon">{MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
                  </div>
                  <div className="ms-upcoming-info">
                    <div className="ms-upcoming-time">
                      {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
                    </div>
                    <div className="ms-upcoming-meta">
                      {calcDuration(shift.start_time, shift.end_time)}
                      {shift.position ? ` · ${shift.position}` : ''}
                      {shift.role    ? ` · ${shift.role}` : ''}
                    </div>
                  </div>
                  <div className="ms-upcoming-right">
                    <StatusBadge status={shift.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All shifts table */}
      <div className="ms-section">
        <div className="ms-section-hdr">
          <FaListUl size={14} style={{ color: t.primary }} />
          All Shifts — {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </div>
        {shifts.length === 0 ? (
          <div className="ms-empty"><FaInbox size={32} /><p>No shifts found for this month</p></div>
        ) : (
          <div className="ms-table-wrap">
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Date</th><th>Start</th><th>End</th><th>Duration</th>
                  <th>Position / Role</th><th>Status</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {shifts
                  .slice()
                  .sort((a, b) => shiftLocalDate(a) - shiftLocalDate(b))
                  .map(shift => (
                    <tr key={shift.id}>
                      <td className="ms-td-date">{fmtDateShort(shift.date)}</td>
                      <td>{fmtTime(shift.start_time)}</td>
                      <td>{fmtTime(shift.end_time)}</td>
                      <td className="ms-td-dur">{calcDuration(shift.start_time, shift.end_time)}</td>
                      <td>{[shift.position, shift.role].filter(Boolean).join(' / ') || '—'}</td>
                      <td><StatusBadge status={shift.status} /></td>
                      <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{shift.notes || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeMyShifts;
