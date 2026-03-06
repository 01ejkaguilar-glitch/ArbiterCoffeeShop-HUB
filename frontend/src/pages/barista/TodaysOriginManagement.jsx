import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaStar, FaPlus, FaEdit, FaTrash, FaCoffee, FaCalendarAlt,
  FaClock, FaMapMarkerAlt, FaSpinner, FaExclamationTriangle,
} from 'react-icons/fa';
import './TodaysOriginManagement.css';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';

/* ── Helpers ──────────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().split('T')[0];

/** Format H:i or H:i:s → "9:00 AM" */
const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

/** Strip seconds from H:i:s → H:i for <input type="time"> */
const toTimeInput = (t) => (t ? t.slice(0, 5) : '');

const EMPTY_FORM = {
  coffee_bean_id: '',
  feature_date: todayStr(),
  start_time: '09:00',
  end_time: '21:00',
  special_notes: '',
  promotion_text: '',
  is_active: true,
};

/* ── Reusable modal wrapper ───────────────────────────────── */
function Modal({ open, onClose, children, size }) {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="tom-overlay"
      ref={ref}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className={`tom-dialog${size ? ` ${size}` : ''}`}>{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════ */
const TodaysOriginManagement = () => {
  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();

  const [featuredOrigins, setFeaturedOrigins] = useState([]);
  const [availableBeans, setAvailableBeans]   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const [showFormModal, setShowFormModal]     = useState(false);
  const [editingOrigin, setEditingOrigin]     = useState(null);
  const [formData, setFormData]               = useState({ ...EMPTY_FORM });

  const [deleteTarget, setDeleteTarget]       = useState(null); // origin to confirm-delete

  /* ── Date filter ───────────────────────────────────────── */
  const [filterDate, setFilterDate]           = useState('');
  const [byDateOrigins, setByDateOrigins]     = useState([]);
  const [loadingByDate, setLoadingByDate]     = useState(false);

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [originsRes, beansRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.LIST),
        apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.AVAILABLE_BEANS),
      ]);

      const origins = originsRes.data?.data ?? originsRes.data ?? [];
      const beans   = beansRes.data?.data   ?? beansRes.data   ?? [];

      setFeaturedOrigins(Array.isArray(origins) ? origins : []);
      setAvailableBeans(Array.isArray(beans) ? beans : []);
    } catch {
      showErrorNotification('Failed to load featured origins data');
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived lists ─────────────────────────────────────── */
  const today = todayStr();

  const todaysFeatured = featuredOrigins.filter(o => {
    const d = o.feature_date?.slice?.(0, 10) ?? o.feature_date;
    return d === today;
  });

  const scheduledOrigins = featuredOrigins
    .filter(o => {
      const d = o.feature_date?.slice?.(0, 10) ?? o.feature_date;
      return d >= today;
    })
    .sort((a, b) => {
      const da = a.feature_date?.slice?.(0, 10) ?? a.feature_date;
      const db = b.feature_date?.slice?.(0, 10) ?? b.feature_date;
      return da < db ? -1 : da > db ? 1 : 0;
    });

  /* ── Fetch by specific date ────────────────────────────── */
  const fetchByDate = useCallback(async (date) => {
    if (!date) { setByDateOrigins([]); return; }
    setLoadingByDate(true);
    try {
      const res = await apiService.get(`${API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.BY_DATE}?date=${date}`);
      const data = res.data?.data ?? res.data ?? [];
      setByDateOrigins(Array.isArray(data) ? data : []);
    } catch {
      showErrorNotification('Failed to load origins for selected date');
    } finally {
      setLoadingByDate(false);
    }
  }, [showErrorNotification]);

  const handleFilterDateChange = useCallback((e) => {
    const date = e.target.value;
    setFilterDate(date);
    fetchByDate(date);
  }, [fetchByDate]);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setEditingOrigin(null);
    setFormData({ ...EMPTY_FORM });
  }, []);

  /* ── Save (create / update) ────────────────────────────── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        coffee_bean_id: parseInt(formData.coffee_bean_id, 10),
      };

      if (editingOrigin) {
        await apiService.put(
          API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.UPDATE(editingOrigin.id),
          payload,
        );
        showSuccessNotification('Featured origin updated successfully');
      } else {
        await apiService.post(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.CREATE, payload);
        showSuccessNotification('Featured origin scheduled successfully');
      }

      await fetchData();
      closeFormModal();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save featured origin';
      showErrorNotification(msg);
    } finally {
      setSaving(false);
    }
  }, [formData, editingOrigin, fetchData, closeFormModal, showSuccessNotification, showErrorNotification]);

  /* ── Delete ─────────────────────────────────────────────── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiService.delete(
        API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.DELETE(deleteTarget.id),
      );
      showSuccessNotification('Featured origin removed');
      await fetchData();
      setDeleteTarget(null);
    } catch {
      showErrorNotification('Failed to remove featured origin');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData, showSuccessNotification, showErrorNotification]);

  /* ── Form helpers ───────────────────────────────────────── */
  const openCreateModal = useCallback(() => {
    setEditingOrigin(null);
    setFormData({ ...EMPTY_FORM });
    setShowFormModal(true);
  }, []);

  const openEditModal = useCallback((origin) => {
    setEditingOrigin(origin);
    setFormData({
      coffee_bean_id: String(origin.coffee_bean_id),
      feature_date:   origin.feature_date?.slice?.(0, 10) ?? origin.feature_date,
      start_time:     toTimeInput(origin.start_time) || '09:00',
      end_time:       toTimeInput(origin.end_time)   || '21:00',
      special_notes:  origin.special_notes   || '',
      promotion_text: origin.promotion_text  || '',
      is_active:      origin.is_active ?? true,
    });
    setShowFormModal(true);
  }, []);

  const setField = (key) => (e) =>
    setFormData(p => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  /* ── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="tom-page">
        <div className="tom-spinner-wrap">
          <FaSpinner className="tom-spin" size={28} />
          <span>Loading featured origins…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tom-page">
      {/* Top bar */}
      <div className="tom-topbar">
        <div>
          <h1 className="tom-title">Today's Origin Management</h1>
          <p className="tom-subtitle">Schedule and manage featured coffee bean origins</p>
        </div>
        <button className="tom-btn primary" onClick={openCreateModal}>
          <FaPlus size={12} />
          Schedule New Feature
        </button>
      </div>

      {/* ── Today's featured ── */}
      <div className="tom-section">
        <div className="tom-section-head amber">
          <FaStar className="tom-section-icon" />
          <h2>Today's Featured Origins</h2>
          <span className="tom-count-badge">{todaysFeatured.length} active</span>
        </div>
        <div className="tom-section-body">
          {todaysFeatured.length === 0 ? (
            <div className="tom-empty">
              <FaCoffee size={36} />
              <p>No featured origin scheduled for today.</p>
              <p>Use "Schedule New Feature" to highlight a special origin.</p>
            </div>
          ) : (
            <div className="tom-featured-grid">
              {todaysFeatured.map(origin => (
                <div className="tom-featured-card" key={origin.id}>
                  <div className="tom-featured-card-head">
                    <div>
                      <p className="tom-bean-name">{origin.coffeeBean?.name || origin.coffee_bean?.name}</p>
                      <span className="tom-bean-origin">
                        <FaMapMarkerAlt size={10} />
                        {[origin.coffeeBean?.origin_country || origin.coffee_bean?.origin_country,
                          origin.coffeeBean?.region         || origin.coffee_bean?.region]
                          .filter(Boolean).join(' • ')}
                      </span>
                    </div>
                    {origin.is_active
                      ? <span className="tom-active-badge">Active</span>
                      : <span className="tom-inactive-badge">Inactive</span>}
                  </div>

                  <div className="tom-time-row">
                    <FaClock size={11} />
                    {fmtTime(origin.start_time)} – {fmtTime(origin.end_time)}
                  </div>

                  {origin.special_notes && (
                    <div className="tom-notes-box">{origin.special_notes}</div>
                  )}
                  {origin.promotion_text && (
                    <div className="tom-promo-box">{origin.promotion_text}</div>
                  )}

                  <div className="tom-card-actions">
                    <button className="tom-btn secondary sm" onClick={() => openEditModal(origin)}>
                      <FaEdit size={11} /> Edit
                    </button>
                    <button className="tom-btn danger sm" onClick={() => setDeleteTarget(origin)}>
                      <FaTrash size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Scheduled / upcoming table ── */}
      <div className="tom-section">
        <div className="tom-section-head">
          <FaCalendarAlt className="tom-section-icon green" />
          <h2>Scheduled Featured Origins</h2>
          <span className="tom-count-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-dark-green)', borderColor: 'var(--color-info-border)' }}>
            {filterDate ? byDateOrigins.length : scheduledOrigins.length} {filterDate ? 'found' : 'upcoming'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="tom-date-filter" style={{ fontSize: '.8rem', color: '#555', marginBottom: 0 }}>Filter by date:</label>
            <input
              id="tom-date-filter"
              type="date"
              value={filterDate}
              onChange={handleFilterDateChange}
              style={{ fontSize: '.85rem', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            {filterDate && (
              <button
                className="tom-btn secondary sm"
                onClick={() => { setFilterDate(''); setByDateOrigins([]); }}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {loadingByDate ? (
          <div className="tom-empty"><FaSpinner className="tom-spin" size={24} /><p>Loading…</p></div>
        ) : (filterDate ? byDateOrigins : scheduledOrigins).length === 0 ? (
          <div className="tom-empty">
            <FaCalendarAlt size={36} />
            <p>{filterDate ? `No featured origins scheduled for ${filterDate}.` : 'No upcoming featured origins scheduled.'}</p>
          </div>
        ) : (
          <div className="tom-table-wrap">
            <table className="tom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Coffee Bean</th>
                  <th>Origin</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filterDate ? byDateOrigins : scheduledOrigins).map(origin => {
                  const dateStr = origin.feature_date?.slice?.(0, 10) ?? origin.feature_date;
                  const isToday = dateStr === today;
                  return (
                    <tr key={origin.id}>
                      <td className={`tom-date-cell${isToday ? ' tom-date-today' : ''}`}>
                        {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {isToday && <span style={{ fontSize: '.7rem', marginLeft: '.35rem' }}>(Today)</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {origin.coffeeBean?.name || origin.coffee_bean?.name || '—'}
                      </td>
                      <td className="tom-origin-text">
                        {[origin.coffeeBean?.origin_country || origin.coffee_bean?.origin_country,
                          origin.coffeeBean?.region         || origin.coffee_bean?.region]
                          .filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="tom-time-cell">
                        {fmtTime(origin.start_time)} – {fmtTime(origin.end_time)}
                      </td>
                      <td>
                        {origin.is_active
                          ? <span className="tom-status-active">Active</span>
                          : <span className="tom-status-inactive">Inactive</span>}
                      </td>
                      <td>
                        <div className="tom-row-actions">
                          <button className="tom-btn secondary sm" onClick={() => openEditModal(origin)} title="Edit">
                            <FaEdit size={11} />
                          </button>
                          <button className="tom-btn danger sm" onClick={() => setDeleteTarget(origin)} title="Remove">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          Schedule / Edit modal
          ═══════════════════════════════════════════════════ */}
      <Modal open={showFormModal} onClose={closeFormModal}>
        <div className="tom-dialog-head">
          <h2 className="tom-dialog-title">
            {editingOrigin ? 'Edit Featured Origin' : 'Schedule New Featured Origin'}
          </h2>
          <button className="tom-dialog-close" onClick={closeFormModal}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="tom-dialog-body">
            <div className="tom-form-grid">
              {/* Coffee Bean */}
              <div className="tom-form-group span2">
                <label className="tom-label">Coffee Bean <span>*</span></label>
                <select
                  className="tom-select"
                  value={formData.coffee_bean_id}
                  onChange={setField('coffee_bean_id')}
                  required
                >
                  <option value="">Select a coffee bean…</option>
                  {availableBeans.map(bean => (
                    <option key={bean.id} value={bean.id}>
                      {bean.name} – {bean.origin_country}{bean.region ? `, ${bean.region}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feature Date */}
              <div className="tom-form-group">
                <label className="tom-label">Feature Date <span>*</span></label>
                <input
                  className="tom-input"
                  type="date"
                  value={formData.feature_date}
                  min={editingOrigin ? undefined : todayStr()}
                  onChange={setField('feature_date')}
                  required
                />
              </div>

              {/* is_active toggle */}
              <div className="tom-form-group" style={{ justifyContent: 'center' }}>
                <label className="tom-label">Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', marginTop: '.3rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={setField('is_active')}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '.85rem', color: '#374151' }}>Active (visible to customers)</span>
                </label>
              </div>

              {/* Start Time */}
              <div className="tom-form-group">
                <label className="tom-label">Start Time</label>
                <input
                  className="tom-input"
                  type="time"
                  value={formData.start_time}
                  onChange={setField('start_time')}
                />
              </div>

              {/* End Time */}
              <div className="tom-form-group">
                <label className="tom-label">End Time</label>
                <input
                  className="tom-input"
                  type="time"
                  value={formData.end_time}
                  onChange={setField('end_time')}
                />
              </div>

              {/* Special Notes */}
              <div className="tom-form-group span2">
                <label className="tom-label">Special Notes</label>
                <textarea
                  className="tom-textarea"
                  value={formData.special_notes}
                  onChange={setField('special_notes')}
                  placeholder="Any special notes about this coffee bean…"
                />
                <span className="tom-hint">Max 1,000 characters</span>
              </div>

              {/* Promotion Text */}
              <div className="tom-form-group span2">
                <label className="tom-label">Promotion Text</label>
                <textarea
                  className="tom-textarea"
                  value={formData.promotion_text}
                  onChange={setField('promotion_text')}
                  placeholder="Special promotion or highlight text…"
                />
                <span className="tom-hint">Max 500 characters (shown prominently to customers)</span>
              </div>
            </div>
          </div>
          <div className="tom-dialog-footer">
            <button type="button" className="tom-btn secondary" onClick={closeFormModal} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="tom-btn primary"
              disabled={saving || !formData.coffee_bean_id || !formData.feature_date}
            >
              {saving
                ? <><FaSpinner className="tom-spin" size={12} /> Saving…</>
                : editingOrigin ? 'Update Feature' : 'Schedule Feature'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          Delete confirmation modal
          ═══════════════════════════════════════════════════ */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <div className="tom-dialog-head">
          <FaExclamationTriangle style={{ color: '#dc2626', flexShrink: 0 }} />
          <h2 className="tom-dialog-title">Remove Featured Origin</h2>
          <button className="tom-dialog-close" onClick={() => setDeleteTarget(null)}>✕</button>
        </div>
        <div className="tom-dialog-body">
          <p className="tom-delete-msg">
            Are you sure you want to remove{' '}
            <span className="tom-delete-name">
              {deleteTarget?.coffeeBean?.name || deleteTarget?.coffee_bean?.name}
            </span>{' '}
            from the schedule on{' '}
            {deleteTarget && new Date((deleteTarget.feature_date?.slice?.(0, 10) ?? deleteTarget.feature_date) + 'T00:00:00')
              .toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}?
          </p>
          <p style={{ fontSize: '.8rem', color: '#9ca3af', margin: 0 }}>
            This action cannot be undone.
          </p>
        </div>
        <div className="tom-dialog-footer">
          <button className="tom-btn secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </button>
          <button className="tom-btn danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><FaSpinner className="tom-spin" size={12} /> Removing…</> : 'Yes, Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TodaysOriginManagement;
