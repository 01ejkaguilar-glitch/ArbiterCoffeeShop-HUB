import React, { useEffect, useState, useCallback } from 'react';
import {
  FaCalendarAlt, FaSearch, FaPlus, FaEdit, FaTrash,
  FaTimes, FaSync, FaClock, FaUsers, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminWorkforce.css';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtTime = t => t ? t.slice(0, 5) : '—';
const getWeekStart = (d = new Date()) => {
  const day = new Date(d);
  day.setDate(day.getDate() - day.getDay());
  day.setHours(0, 0, 0, 0);
  return day;
};
const fmtDateLabel = d => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

const blankForm = () => ({
  employee_id: '', shift_date: '', start_time: '08:00', end_time: '16:00', notes: '',
});

const AdminShifts = () => {
  const [shifts, setShifts]           = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [weeklyData, setWeeklyData]   = useState([]);
  const [stats, setStats]             = useState({ total: 0, today: 0, upcoming: 0, uniqueEmp: 0 });
  const [loading, setLoading]         = useState(true);
  const [currentWeek, setCurrentWeek] = useState(() => getWeekStart());
  const [view, setView]               = useState('list'); // 'list' | 'week'
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [selected, setSelected]       = useState(null);
  const [formData, setFormData]       = useState(blankForm());
  const [saving, setSaving]           = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [toDelete, setToDelete]       = useState(null);
  const [error, setError]             = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.EMPLOYEES);
      if (res.success) setEmployees(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { /* non-fatal */ }
  }, []);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.SHIFTS);
      if (res.success) {
        const d = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setShifts(d);
        const today = new Date().toISOString().slice(0, 10);
        setStats({
          total:     d.length,
          today:     d.filter(s => s.shift_date === today).length,
          upcoming:  d.filter(s => s.shift_date > today).length,
          uniqueEmp: new Set(d.map(s => s.employee_id)).size,
        });
      }
    } catch { setError('Failed to load shifts.'); }
    finally { setLoading(false); }
  }, []);

  const fetchWeekly = useCallback(async () => {
    try {
      const params = `?week_start=${currentWeek.toISOString().slice(0, 10)}`;
      const res = await apiService.get(`${API_ENDPOINTS.WORKFORCE.WEEKLY_SCHEDULE}${params}`);
      if (res.success) setWeeklyData(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { /* non-fatal */ }
  }, [currentWeek]);

  useEffect(() => { fetchShifts(); fetchEmployees(); }, [fetchShifts, fetchEmployees]);
  useEffect(() => { if (view === 'week') fetchWeekly(); }, [view, fetchWeekly]);

  const prevWeek = () => { const w = new Date(currentWeek); w.setDate(w.getDate() - 7); setCurrentWeek(w); };
  const nextWeek = () => { const w = new Date(currentWeek); w.setDate(w.getDate() + 7); setCurrentWeek(w); };

  const openAdd = () => { setSelected(null); setFormData(blankForm()); setShowModal(true); };
  const openEdit = (sh) => {
    setSelected(sh);
    setFormData({ employee_id: sh.employee_id || '', shift_date: sh.shift_date || '',
      start_time: sh.start_time?.slice(0, 5) || '08:00', end_time: sh.end_time?.slice(0, 5) || '16:00',
      notes: sh.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = selected
        ? await apiService.put(API_ENDPOINTS.WORKFORCE.SHIFT_DETAIL(selected.id), formData)
        : await apiService.post(API_ENDPOINTS.WORKFORCE.SHIFTS, formData);
      if (res.success) { setShowModal(false); fetchShifts(); if (view === 'week') fetchWeekly(); }
      else setError(res.message || 'Save failed.');
    } catch { setError('Failed to save shift.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await apiService.delete(API_ENDPOINTS.WORKFORCE.SHIFT_DETAIL(toDelete.id));
      setShowDelete(false); setToDelete(null); fetchShifts();
    } catch { setError('Failed to delete shift.'); }
  };

  const field = k => ({
    value: formData[k],
    onChange: e => setFormData(p => ({ ...p, [k]: e.target.value })),
  });

  const empName = id => {
    const e = employees.find(e => String(e.id) === String(id));
    return e ? e.name : `#${id}`;
  };

  const filtered = shifts.filter(s => {
    const q = search.toLowerCase();
    return empName(s.employee_id).toLowerCase().includes(q) || (s.shift_date || '').includes(q);
  });

  // Build weekly grid: array of 7 day-columns
  const weekDays = DAYS.map((_, i) => {
    const d = new Date(currentWeek); d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <PageShell title="Shift Scheduling" subtitle="Manage and view employee work schedules" error={error} onRetry={fetchShifts}>
      <div className="wf-page">

        {/* Stats */}
        <div className="wf-stat-grid">
          {[
            { label: 'Total Shifts',     val: stats.total,     icon: <FaCalendarAlt />, color: 'blue'  },
            { label: 'Today\'s Shifts',  val: stats.today,     icon: <FaClock />,       color: 'green' },
            { label: 'Upcoming',         val: stats.upcoming,  icon: <FaChevronRight />, color: 'amber' },
            { label: 'Employees Scheduled', val: stats.uniqueEmp, icon: <FaUsers />,    color: 'teal'  },
          ].map(({ label, val, icon, color }) => (
            <div className="wf-stat-card" key={label}>
              <div className={`wf-stat-icon ${color}`}>{icon}</div>
              <div><div className="wf-stat-val">{val}</div><div className="wf-stat-label">{label}</div></div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="wf-filter-bar">
          <div className="wf-search-wrap">
            <FaSearch className="wf-search-icon" />
            <input className="wf-search-input" placeholder="Search by name or date…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className={`wf-btn ${view === 'list' ? 'primary' : 'secondary'}`} onClick={() => setView('list')}>List</button>
            <button className={`wf-btn ${view === 'week' ? 'primary' : 'secondary'}`} onClick={() => setView('week')}>Weekly</button>
          </div>
          <button className="wf-btn secondary wf-btn-icon" onClick={() => { fetchShifts(); if (view === 'week') fetchWeekly(); }} title="Refresh"><FaSync /></button>
          <button className="wf-btn primary" onClick={openAdd}><FaPlus style={{ marginRight: '.4rem' }} />Add Shift</button>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="wf-table-wrap">
            <table className="wf-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Date</th><th>Start</th><th>End</th><th>Hours</th><th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="wf-empty">Loading shifts…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="wf-empty"><FaCalendarAlt size={26} style={{ color: '#d1d5db', display: 'block', margin: '0 auto .5rem' }} />No shifts found.</td></tr>
                ) : filtered.map(sh => {
                  const hrs = sh.start_time && sh.end_time
                    ? (new Date(`2000-01-01T${sh.end_time}`) - new Date(`2000-01-01T${sh.start_time}`)) / 3600000
                    : null;
                  return (
                    <tr key={sh.id}>
                      <td className="wf-td-bold">{empName(sh.employee_id)}</td>
                      <td className="wf-td-muted">{sh.shift_date ? new Date(sh.shift_date + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</td>
                      <td>{fmtTime(sh.start_time)}</td>
                      <td>{fmtTime(sh.end_time)}</td>
                      <td style={{ fontWeight: 600 }}>{hrs != null ? `${hrs}h` : '—'}</td>
                      <td className="wf-td-muted">{sh.notes || '—'}</td>
                      <td>
                        <div className="wf-action-group">
                          <button className="wf-action-btn edit" title="Edit" onClick={() => openEdit(sh)}><FaEdit /></button>
                          <button className="wf-action-btn delete" title="Delete" onClick={() => { setToDelete(sh); setShowDelete(true); }}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Weekly View */}
        {view === 'week' && (
          <div className="wf-table-wrap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
              <button className="wf-btn secondary wf-btn-icon" onClick={prevWeek}><FaChevronLeft /></button>
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {fmtDateLabel(weekDays[0])} — {fmtDateLabel(weekDays[6])}
              </span>
              <button className="wf-btn secondary wf-btn-icon" onClick={nextWeek}><FaChevronRight /></button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="wf-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    {weekDays.map((d, i) => (
                      <th key={i} style={{ textAlign: 'center' }}>
                        {DAYS[i]}<br /><span style={{ fontWeight: 400, fontSize: '.75rem', color: '#6b7280' }}>{fmtDateLabel(d)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weekDays.map((d, i) => {
                      const iso = d.toISOString().slice(0, 10);
                      const dayShifts = (weeklyData.length ? weeklyData : shifts).filter(s => s.shift_date === iso);
                      return (
                        <td key={i} style={{ verticalAlign: 'top', minWidth: 120, padding: '.5rem' }}>
                          {dayShifts.length === 0 ? (
                            <span style={{ color: '#d1d5db', fontSize: '.75rem' }}>—</span>
                          ) : dayShifts.map(sh => (
                            <div key={sh.id} style={{ background: 'var(--color-success-bg)', borderRadius: 6, padding: '4px 8px', marginBottom: 4, fontSize: '.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-dark-green)' }}>{empName(sh.employee_id)}</div>
                              <div style={{ color: 'var(--color-medium-green)' }}>{fmtTime(sh.start_time)}–{fmtTime(sh.end_time)}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="wf-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaCalendarAlt style={{ marginRight: '.5rem' }} />{selected ? 'Edit Shift' : 'Add Shift'}</span>
                <button className="wf-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="wf-modal-body">
                  <div className="wf-form-row">
                    <label className="wf-form-label">Employee *</label>
                    <select className="wf-field-select" required {...field('employee_id')}>
                      <option value="">Select employee…</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Shift Date *</label>
                    <input type="date" className="wf-field-input" required {...field('shift_date')} />
                  </div>
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Start Time</label>
                      <input type="time" className="wf-field-input" {...field('start_time')} />
                    </div>
                    <div>
                      <label className="wf-form-label">End Time</label>
                      <input type="time" className="wf-field-input" {...field('end_time')} />
                    </div>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Notes</label>
                    <textarea className="wf-field-textarea" rows={2} placeholder="Optional notes…" {...field('notes')} />
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving}>{saving ? 'Saving…' : selected ? 'Update Shift' : 'Add Shift'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {showDelete && toDelete && (
          <div className="wf-modal-overlay" onClick={() => setShowDelete(false)}>
            <div className="wf-modal sm" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title" style={{ color: '#C41E3A' }}>Delete Shift</span>
                <button className="wf-modal-close" onClick={() => setShowDelete(false)}><FaTimes /></button>
              </div>
              <div className="wf-modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <p>Remove shift for <strong>{empName(toDelete.employee_id)}</strong> on <strong>{toDelete.shift_date}</strong>?</p>
              </div>
              <div className="wf-modal-foot">
                <button className="wf-btn secondary" onClick={() => setShowDelete(false)}>Cancel</button>
                <button className="wf-btn danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminShifts;
