import React, { useEffect, useState, useCallback } from 'react';
import {
  FaCalendarAlt, FaSearch, FaCheck, FaTimes, FaSync,
  FaHourglassHalf, FaTimesCircle, FaCheckCircle, FaFilter,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminWorkforce.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const diffDays = (s, e) => {
  if (!s || !e) return 0;
  const ms = new Date(e) - new Date(s);
  return Math.max(1, Math.round(ms / 86400000) + 1);
};

const StatusBadge = ({ status }) => {
  const map = { pending: 'amber', approved: 'present', rejected: 'absent', cancelled: 'absent' };
  return <span className={`wf-badge ${map[status] || 'amber'}`}>{status}</span>;
};

const LEAVE_TYPES = ['annual', 'sick', 'emergency', 'maternity', 'paternity', 'unpaid'];

const AdminLeaveRequests = () => {
  const [requests, setRequests]       = useState([]);
  const [stats, setStats]             = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [showModal, setShowModal]     = useState(false);
  const [selected, setSelected]       = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [action, setAction]           = useState('approved');
  const [remarks, setRemarks]         = useState('');
  const [error, setError]             = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.LEAVE_REQUESTS);
      if (res.success) {
        const d = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRequests(d);
        setStats({
          total:    d.length,
          pending:  d.filter(r => r.status === 'pending').length,
          approved: d.filter(r => r.status === 'approved').length,
          rejected: d.filter(r => r.status === 'rejected').length,
        });
      }
    } catch { setError('Failed to load leave requests.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openReview = (req, defaultAction = 'approved') => {
    setSelected(req);
    setAction(defaultAction);
    setRemarks('');
    setShowModal(true);
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await apiService.put(
        API_ENDPOINTS.WORKFORCE.LEAVE_REQUEST_DETAIL(selected.id),
        { status: action, remarks }
      );
      if (res.success) { setShowModal(false); fetchRequests(); }
      else setError(res.message || 'Action failed.');
    } catch { setError('Failed to process leave request.'); }
    finally { setActionLoading(false); }
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const nameMatch = (r.employee_name || r.employee?.name || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    const typeMatch   = typeFilter   === 'all' || r.leave_type === typeFilter;
    return nameMatch && statusMatch && typeMatch;
  });

  return (
    <PageShell title="Leave Requests" subtitle="Review and approve employee leave requests" error={error} onRetry={fetchRequests}>
      <div className="wf-page">

        {/* Stats */}
        <div className="wf-stat-grid">
          {[
            { label: 'Total Requests', val: stats.total,    icon: <FaCalendarAlt />,  color: 'blue'  },
            { label: 'Pending Review', val: stats.pending,  icon: <FaHourglassHalf />, color: 'amber' },
            { label: 'Approved',       val: stats.approved, icon: <FaCheckCircle />,   color: 'green' },
            { label: 'Rejected',       val: stats.rejected, icon: <FaTimesCircle />,   color: 'red'   },
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
            <input className="wf-search-input" placeholder="Search by employee name…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="wf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {['pending', 'approved', 'rejected', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="wf-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="wf-btn secondary wf-btn-icon" onClick={fetchRequests} title="Refresh"><FaSync /></button>
        </div>

        {/* Table */}
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Employee</th><th>Type</th><th>Start</th><th>End</th>
                <th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="wf-empty">Loading leave requests…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="wf-empty"><FaFilter size={26} style={{ color: '#d1d5db', display: 'block', margin: '0 auto .5rem' }} />No requests match your filters.</td></tr>
              ) : filtered.map(req => (
                <tr key={req.id}>
                  <td className="wf-td-bold">{req.employee_name || req.employee?.name || `#${req.employee_id}`}</td>
                  <td><span className="wf-badge teal">{req.leave_type || 'annual'}</span></td>
                  <td className="wf-td-muted">{fmtDate(req.start_date)}</td>
                  <td className="wf-td-muted">{fmtDate(req.end_date)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{diffDays(req.start_date, req.end_date)}</td>
                  <td className="wf-td-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason || '—'}</td>
                  <td><StatusBadge status={req.status} /></td>
                  <td>
                    {req.status === 'pending' ? (
                      <div className="wf-action-group">
                        <button className="wf-action-btn edit" title="Approve" onClick={() => openReview(req, 'approved')}><FaCheck /></button>
                        <button className="wf-action-btn delete" title="Reject"  onClick={() => openReview(req, 'rejected')}><FaTimes /></button>
                      </div>
                    ) : (
                      <button className="wf-btn secondary" style={{ fontSize: '.73rem', padding: '4px 10px' }} onClick={() => openReview(req, 'approved')}>Review</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Review Modal */}
        {showModal && selected && (
          <div className="wf-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaCalendarAlt style={{ marginRight: '.5rem' }} />Review Leave Request</span>
                <button className="wf-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleAction}>
                <div className="wf-modal-body">
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '.875rem' }}>
                    <p><strong>Employee:</strong> {selected.employee_name || selected.employee?.name}</p>
                    <p><strong>Type:</strong> {selected.leave_type}</p>
                    <p><strong>Period:</strong> {fmtDate(selected.start_date)} — {fmtDate(selected.end_date)} ({diffDays(selected.start_date, selected.end_date)} day/s)</p>
                    {selected.reason && <p><strong>Reason:</strong> {selected.reason}</p>}
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Decision</label>
                    <select className="wf-field-select" value={action} onChange={e => setAction(e.target.value)}>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Remarks (optional)</label>
                    <textarea className="wf-field-textarea" rows={3} placeholder="Add a note for the employee…" value={remarks} onChange={e => setRemarks(e.target.value)} />
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className={`wf-btn ${action === 'approved' ? 'primary' : 'danger'}`} disabled={actionLoading}>
                    {actionLoading ? 'Processing…' : action === 'approved' ? 'Approve Request' : 'Reject Request'}
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

export default AdminLeaveRequests;
