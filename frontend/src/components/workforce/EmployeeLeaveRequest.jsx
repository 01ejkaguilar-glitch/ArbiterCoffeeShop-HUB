import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaFileAlt, FaPlus, FaTimes, FaCheckCircle,
  FaExclamationCircle, FaClock, FaCalendarAlt,
  FaInbox, FaClipboardList, FaHourglassHalf, FaBan,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeLeaveRequest.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';
import { useToast } from '../../hooks/useToast';

/* ── Constants ───────────────────────────────────────────────── */
const LEAVE_TYPES = [
  { value: 'sick',        label: 'Sick Leave' },
  { value: 'vacation',    label: 'Vacation' },
  { value: 'personal',    label: 'Personal Leave' },
  { value: 'emergency',   label: 'Emergency Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
];
const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'];
const TYPE_LABELS = Object.fromEntries(LEAVE_TYPES.map(t => [t.value, t.label]));

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function calcDays(start, end) {
  if (!start || !end) return 0;
  return Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1;
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

/* ── Form Drawer ─────────────────────────────────────────────── */
function FormDrawer({ onClose, onSubmit, submitting }) {
  const today = todayStr();
  const [form, setForm] = useState({ type: '', start_date: '', end_date: '', reason: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const days = calcDays(form.start_date, form.end_date);
  const valid = form.type && form.start_date && form.end_date && form.reason.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(form);
  };

  return (
    <>
      <div className="lr-overlay" onClick={onClose} />
      <div className="lr-drawer" role="dialog" aria-label="New Leave Request">
        <div className="lr-drawer-hdr">
          <h2>New Leave Request</h2>
          <button className="lr-drawer-close" onClick={onClose} aria-label="Close"><FaTimes size={13} /></button>
        </div>
        <form className="lr-drawer-body" onSubmit={handleSubmit}>
          <div className="lr-form-group">
            <label className="lr-label">Leave Type <span>*</span></label>
            <select className="lr-select" value={form.type} onChange={e => set('type', e.target.value)} required>
              <option value="">Select type…</option>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="lr-form-group lr-date-row">
            <div>
              <label className="lr-label">Start Date <span>*</span></label>
              <input type="date" className="lr-input" value={form.start_date} min={today}
                onChange={e => set('start_date', e.target.value)} required />
            </div>
            <div>
              <label className="lr-label">End Date <span>*</span></label>
              <input type="date" className="lr-input" value={form.end_date} min={form.start_date || today}
                onChange={e => set('end_date', e.target.value)} required />
            </div>
          </div>

          {form.start_date && form.end_date && days > 0 && (
            <div className="lr-duration-hint">
              <FaCalendarAlt size={12} /> {days} day{days !== 1 ? 's' : ''} requested
            </div>
          )}

          <div className="lr-form-group" style={{ marginTop: 4 }}>
            <label className="lr-label">Reason <span>*</span></label>
            <textarea className="lr-textarea" value={form.reason}
              placeholder="Please describe the reason for your leave…"
              onChange={e => set('reason', e.target.value)} maxLength={1000} required />
          </div>
        </form>
        <div className="lr-drawer-footer">
          <button className="lr-btn secondary" onClick={onClose} type="button">Cancel</button>
          <button className="lr-btn primary" onClick={handleSubmit}
            disabled={!valid || submitting} type="button">
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Detail Drawer ───────────────────────────────────────────── */
function DetailDrawer({ request, onClose, onCancel, cancelling }) {
  const days = calcDays(request.start_date, request.end_date);
  return (
    <>
      <div className="lr-overlay" onClick={onClose} />
      <div className="lr-drawer" role="dialog" aria-label="Leave Request Details">
        <div className="lr-drawer-hdr">
          <h2>Leave Request Details</h2>
          <button className="lr-drawer-close" onClick={onClose} aria-label="Close"><FaTimes size={13} /></button>
        </div>
        <div className="lr-drawer-body">
          <div className="lr-detail-row">
            <div className="lr-detail-col">
              <div className="lr-detail-label">Leave Type</div>
              <span className={`lr-badge ${request.type}`}>{TYPE_LABELS[request.type] ?? request.type}</span>
            </div>
            <div className="lr-detail-col">
              <div className="lr-detail-label">Status</div>
              <span className={`lr-badge ${request.status}`}>{request.status}</span>
            </div>
          </div>
          <hr className="lr-detail-divider" />
          <div className="lr-detail-row">
            <div className="lr-detail-col">
              <div className="lr-detail-label">Start Date</div>
              <div className="lr-detail-val">{fmtDate(request.start_date)}</div>
            </div>
            <div className="lr-detail-col">
              <div className="lr-detail-label">End Date</div>
              <div className="lr-detail-val">{fmtDate(request.end_date)}</div>
            </div>
          </div>
          <div className="lr-detail-row">
            <div className="lr-detail-col">
              <div className="lr-detail-label">Duration</div>
              <div className="lr-detail-val">
                {request.days_requested ?? days} day{(request.days_requested ?? days) !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="lr-detail-col">
              <div className="lr-detail-label">Submitted</div>
              <div className="lr-detail-val">{fmtDate(request.created_at)}</div>
            </div>
          </div>
          <hr className="lr-detail-divider" />
          <div className="lr-detail-label">Reason</div>
          <div className="lr-detail-text">{request.reason}</div>

          {request.review_notes && (
            <>
              <hr className="lr-detail-divider" />
              <div className="lr-detail-label">Manager Review Notes</div>
              <div className="lr-detail-text">{request.review_notes}</div>
            </>
          )}
          {request.reviewer && (
            <div style={{ marginTop: 8 }}>
              <div className="lr-detail-label">Reviewed By</div>
              <div className="lr-detail-val">
                {request.reviewer.name ||
                  (`${request.reviewer.first_name || ''} ${request.reviewer.last_name || ''}`).trim() ||
                  'Manager'}
              </div>
            </div>
          )}
        </div>
        <div className="lr-drawer-footer">
          <button className="lr-btn secondary" onClick={onClose}>Close</button>
          {request.status === 'pending' && (
            <button className="lr-btn danger" onClick={() => onCancel(request.id)} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel Request'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
const EmployeeLeaveRequest = ({ theme = DEFAULT_THEME }) => {
  const t = { ...DEFAULT_THEME, ...theme };

  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { toast, showToast, clearToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.LEAVE_REQUESTS);
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setRequests(list);
    } catch {
      showToast('error', 'Failed to load leave requests. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = useCallback(async (form) => {
    setSubmitting(true);
    try {
      await apiService.post(API_ENDPOINTS.WORKFORCE.LEAVE_REQUESTS, {
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
      });
      showToast('success', 'Leave request submitted successfully!');
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      showToast('error', err?.response?.data?.message ?? 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  }, [fetchRequests, showToast]);

  const handleCancel = useCallback(async (id) => {
    setCancelling(true);
    try {
      await apiService.delete(API_ENDPOINTS.WORKFORCE.LEAVE_REQUEST_DETAIL(id));
      showToast('success', 'Leave request cancelled.');
      setSelected(null);
      fetchRequests();
    } catch (err) {
      showToast('error', err?.response?.data?.message ?? 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  }, [fetchRequests, showToast]);

  const stats = useMemo(() => ({
    total:    requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  const filtered = useMemo(() =>
    filter === 'all' ? requests : requests.filter(r => r.status === filter),
    [requests, filter]
  );

  if (loading) {
    return (
      <div className="lr-page">
        <div className="lr-loader">
          <div className="lr-spinner" style={{ borderTopColor: t.primary }} />
          <span>Loading leave requests…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="lr-page"
      style={{ '--wf-primary': t.primary, '--wf-tint': t.tint, '--wf-tint-border': t.tintBorder }}
    >
      {/* Topbar */}
      <div className="lr-topbar">
        <div className="lr-topbar-title">
          <h1>Leave Requests</h1>
          <p>Manage your time-off requests</p>
        </div>
        <button className="lr-new-btn" onClick={() => { setShowForm(true); clearToast(); }}>
          <FaPlus size={12} /> New Request
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`lr-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          {toast.msg}
          <button className="lr-toast-close" onClick={clearToast}><FaTimes size={12} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="lr-stats">
        <div className="lr-stat-card">
          <div className="lr-stat-icon indigo"><FaFileAlt /></div>
          <div>
            <div className="lr-stat-val">{stats.total}</div>
            <div className="lr-stat-lbl">Total Requests</div>
          </div>
        </div>
        <div className="lr-stat-card">
          <div className="lr-stat-icon amber"><FaHourglassHalf /></div>
          <div>
            <div className="lr-stat-val">{stats.pending}</div>
            <div className="lr-stat-lbl">Pending</div>
          </div>
        </div>
        <div className="lr-stat-card">
          <div className="lr-stat-icon green"><FaCheckCircle /></div>
          <div>
            <div className="lr-stat-val">{stats.approved}</div>
            <div className="lr-stat-lbl">Approved</div>
          </div>
        </div>
        <div className="lr-stat-card">
          <div className="lr-stat-icon red"><FaBan /></div>
          <div>
            <div className="lr-stat-val">{stats.rejected}</div>
            <div className="lr-stat-lbl">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="lr-filter-row">
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`lr-filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="lr-empty">
          <FaInbox size={36} />
          <p>{filter === 'all' ? 'No leave requests yet' : `No ${filter} requests`}</p>
          {filter === 'all' && (
            <button className="lr-empty-add" onClick={() => setShowForm(true)}>
              <FaPlus size={11} style={{ marginRight: 5 }} /> New Request
            </button>
          )}
        </div>
      ) : (
        <div className="lr-list">
          {filtered.map(req => {
            const days = req.days_requested ?? calcDays(req.start_date, req.end_date);
            return (
              <div key={req.id} className={`lr-card ${req.status}`}
                onClick={() => setSelected(req)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelected(req)}
              >
                <div>
                  <div className="lr-card-title">{TYPE_LABELS[req.type] ?? req.type}</div>
                  <div className="lr-card-meta">
                    <span className="lr-card-meta-item">
                      <FaCalendarAlt size={10} />
                      {fmtDate(req.start_date)} — {fmtDate(req.end_date)}
                    </span>
                    <span className="lr-card-meta-item"><FaClock size={10} />{days} day{days !== 1 ? 's' : ''}</span>
                    <span className="lr-card-meta-item"><FaClipboardList size={10} />{fmtDate(req.created_at)}</span>
                  </div>
                </div>
                <div className="lr-card-right">
                  <span className={`lr-badge ${req.status}`}>{req.status}</span>
                  <span className="lr-days-badge">{days}d</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <FormDrawer onClose={() => setShowForm(false)} onSubmit={handleSubmit} submitting={submitting} />
      )}
      {selected && (
        <DetailDrawer request={selected} onClose={() => setSelected(null)}
          onCancel={handleCancel} cancelling={cancelling} />
      )}
    </div>
  );
};

export default EmployeeLeaveRequest;
