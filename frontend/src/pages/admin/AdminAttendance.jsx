import React, { useEffect, useState, useCallback } from 'react';
import {
  FaClock, FaSearch, FaPlus, FaCheckCircle, FaTimesCircle,
  FaUserClock, FaTimes, FaCalendarAlt, FaSync,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminWorkforce.css';

const fmtTime = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
};
const fmtDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return s; }
};
const calcHours = (ci, co) => {
  if (!ci || !co) return '—';
  const diff = (new Date(co) - new Date(ci)) / 3600000;
  return diff > 0 ? diff.toFixed(2) + 'h' : '—';
};

const WfBadge = ({ status }) => {
  const label = { present: 'Present', late: 'Late', absent: 'Absent', half_day: 'Half Day', on_leave: 'On Leave' };
  return <span className={`wf-badge ${status}`}>{label[status] || status}</span>;
};

const blankForm = () => ({ employee_id: '', date: new Date().toISOString().split('T')[0], status: 'present', notes: '' });

const AdminAttendance = () => {
  const [records, setRecords]           = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [stats, setStats]               = useState({ present: 0, late: 0, absent: 0, total: 0 });
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [dateFilter, setDateFilter]     = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal]       = useState(false);
  const [formData, setFormData]         = useState(blankForm());
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = dateFilter ? `?date=${dateFilter}` : '';
      const res = await apiService.get(`${API_ENDPOINTS.WORKFORCE.ATTENDANCE}${params}`);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRecords(data);
        setStats({
          present: data.filter(r => r.status === 'present').length,
          late:    data.filter(r => r.status === 'late').length,
          absent:  data.filter(r => r.status === 'absent').length,
          total:   data.length,
        });
      }
    } catch { setError('Failed to load attendance records.'); }
    finally   { setLoading(false); }
  }, [dateFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.EMPLOYEES);
      if (res.success) {
        const d = res.data?.data || res.data;
        setEmployees(Array.isArray(d) ? d : []);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.WORKFORCE.ATTENDANCE_MARK, formData);
      if (res.success) { setShowModal(false); fetchAttendance(); }
      else setError(res.message || 'Failed to mark attendance.');
    } catch { setError('Failed to mark attendance.'); }
    finally { setSaving(false); }
  };

  const filtered = records.filter(r => {
    const name = r.employee?.name || r.employee_name || '';
    return name.toLowerCase().includes(search.toLowerCase())
      && (statusFilter === 'all' || r.status === statusFilter);
  });

  return (
    <PageShell title="Attendance Management" subtitle="Track daily employee clock-in/out records" error={error} onRetry={fetchAttendance}>
      <div className="wf-page">

        {/* Stats */}
        <div className="wf-stat-grid">
          {[
            { label: 'Present Today',  val: stats.present, icon: <FaCheckCircle />, color: 'green' },
            { label: 'Late',           val: stats.late,    icon: <FaUserClock />,   color: 'amber' },
            { label: 'Absent',         val: stats.absent,  icon: <FaTimesCircle />, color: 'red'   },
            { label: 'Total Records',  val: stats.total,   icon: <FaCalendarAlt />, color: 'blue'  },
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
            <input className="wf-search-input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" className="wf-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 160 }} />
          <select className="wf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {['present', 'late', 'absent', 'half_day', 'on_leave'].map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <button className="wf-btn secondary wf-btn-icon" onClick={fetchAttendance} title="Refresh"><FaSync /></button>
          <button className="wf-btn primary" onClick={() => { setFormData(blankForm()); setShowModal(true); }}>
            <FaPlus style={{ marginRight: '.4rem' }} />Mark Attendance
          </button>
        </div>

        {/* Table */}
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Employee</th><th>Date</th><th>Status</th>
                <th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="wf-empty">Loading attendance records…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="wf-empty"><FaClock size={28} style={{ color: '#d1d5db', display: 'block', margin: '0 auto .5rem' }} />No attendance records found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="wf-td-bold">{r.employee?.name || r.employee_name || '—'}</td>
                  <td>{fmtDate(r.date || r.created_at)}</td>
                  <td><WfBadge status={r.status} /></td>
                  <td>{fmtTime(r.clock_in || r.check_in)}</td>
                  <td>{fmtTime(r.clock_out || r.check_out)}</td>
                  <td>{calcHours(r.clock_in || r.check_in, r.clock_out || r.check_out)}</td>
                  <td className="wf-td-muted">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mark Attendance Modal */}
        {showModal && (
          <div className="wf-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaClock style={{ marginRight: '.5rem' }} />Mark Attendance</span>
                <button className="wf-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="wf-modal-body">
                  <div className="wf-form-row">
                    <label className="wf-form-label">Employee *</label>
                    <select className="wf-field-select" required value={formData.employee_id}
                      onChange={e => setFormData(p => ({ ...p, employee_id: e.target.value }))}>
                      <option value="">Select employee…</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Date *</label>
                    <input type="date" className="wf-field-input" required value={formData.date}
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Status *</label>
                    <select className="wf-field-select" required value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                      {['present', 'late', 'absent', 'half_day', 'on_leave'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Notes</label>
                    <textarea className="wf-field-textarea" rows={3} value={formData.notes}
                      onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Optional notes…" />
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Mark Attendance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default AdminAttendance;
