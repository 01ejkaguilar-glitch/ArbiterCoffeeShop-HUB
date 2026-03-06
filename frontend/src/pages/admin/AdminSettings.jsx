import React, { useEffect, useState, useCallback } from 'react';
import {
  FaHistory, FaUsers, FaPlus, FaEdit, FaTrash, FaTimes,
  FaChevronUp, FaChevronDown, FaSave, FaUserCircle, FaSync,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminSettings.css';

// ─── Blank helpers ────────────────────────────────────────────────────────────
const blankTimeline = () => ({ year: new Date().getFullYear(), title: '', description: '' });
const blankMember   = () => ({ name: '', role: '', bio: '', photo_url: '', display_order: 0 });

// ─── Alert banner ─────────────────────────────────────────────────────────────
const Alert = ({ msg, type, onClose }) =>
  msg ? (
    <div className={`as-alert ${type}`}>
      {msg}
      <button className="as-alert-close" onClick={onClose}><FaTimes /></button>
    </div>
  ) : null;

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminSettings = () => {
  const [timeline, setTimeline]   = useState([]);
  const [team, setTeam]           = useState([]);
  const [loading, setLoading]     = useState({ timeline: true, team: true });
  const [saving, setSaving]       = useState({ timeline: false, team: false });
  const [alert, setAlert]         = useState({ timeline: null, team: null });
  const [error, setError]         = useState(null);

  // Modal state shared
  const [tlModal, setTlModal]     = useState(false);
  const [tmModal, setTmModal]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [tlForm, setTlForm]       = useState(blankTimeline());
  const [tmForm, setTmForm]       = useState(blankMember());

  const clearAlert = (key) => setAlert(p => ({ ...p, [key]: null }));
  const showAlert = (key, msg, type = 'success') => {
    setAlert(p => ({ ...p, [key]: { msg, type } }));
    setTimeout(() => clearAlert(key), 4000);
  };

  // ── Fetch Timeline ──────────────────────────────────────────────────────────
  const fetchTimeline = useCallback(async () => {
    setLoading(p => ({ ...p, timeline: true }));
    try {
      const res = await apiService.get(API_ENDPOINTS.ADMIN.SETTINGS.TIMELINE);
      if (res.success) setTimeline(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setError('Failed to load timeline.'); }
    finally { setLoading(p => ({ ...p, timeline: false })); }
  }, []);

  // ── Fetch Team ──────────────────────────────────────────────────────────────
  const fetchTeam = useCallback(async () => {
    setLoading(p => ({ ...p, team: true }));
    try {
      const res = await apiService.get(API_ENDPOINTS.ADMIN.SETTINGS.TEAM);
      if (res.success) setTeam(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { setError('Failed to load team members.'); }
    finally { setLoading(p => ({ ...p, team: false })); }
  }, []);

  useEffect(() => { fetchTimeline(); fetchTeam(); }, [fetchTimeline, fetchTeam]);

  // ── Timeline CRUD ───────────────────────────────────────────────────────────
  const openTlAdd  = () => { setSelected(null); setTlForm(blankTimeline()); setTlModal(true); };
  const openTlEdit = (item) => { setSelected(item); setTlForm({ year: item.year || '', title: item.title || '', description: item.description || '' }); setTlModal(true); };

  const saveTl = async (e) => {
    e.preventDefault();
    setSaving(p => ({ ...p, timeline: true }));
    try {
      const res = selected
        ? await apiService.put(`${API_ENDPOINTS.ADMIN.SETTINGS.TIMELINE}/${selected.id}`, tlForm)
        : await apiService.post(API_ENDPOINTS.ADMIN.SETTINGS.TIMELINE, tlForm);
      if (res.success) { setTlModal(false); fetchTimeline(); showAlert('timeline', selected ? 'Timeline entry updated.' : 'Timeline entry added.'); }
      else showAlert('timeline', res.message || 'Save failed.', 'danger');
    } catch { showAlert('timeline', 'Failed to save timeline entry.', 'danger'); }
    finally { setSaving(p => ({ ...p, timeline: false })); }
  };

  const deleteTl = async (item) => {
    if (!window.confirm(`Delete "${item.title}" (${item.year})?`)) return;
    try {
      await apiService.delete(`${API_ENDPOINTS.ADMIN.SETTINGS.TIMELINE}/${item.id}`);
      fetchTimeline(); showAlert('timeline', 'Entry deleted.');
    } catch { showAlert('timeline', 'Delete failed.', 'danger'); }
  };

  const moveTl = (idx, dir) => {
    const arr = [...timeline];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setTimeline(arr);
  };

  // ── Team CRUD ───────────────────────────────────────────────────────────────
  const openTmAdd  = () => { setSelected(null); setTmForm(blankMember()); setTmModal(true); };
  const openTmEdit = (m) => { setSelected(m); setTmForm({ name: m.name || '', role: m.role || '', bio: m.bio || '', photo_url: m.photo_url || '', display_order: m.display_order || 0 }); setTmModal(true); };

  const saveTm = async (e) => {
    e.preventDefault();
    setSaving(p => ({ ...p, team: true }));
    try {
      const res = selected
        ? await apiService.put(`${API_ENDPOINTS.ADMIN.SETTINGS.TEAM}/${selected.id}`, tmForm)
        : await apiService.post(API_ENDPOINTS.ADMIN.SETTINGS.TEAM, tmForm);
      if (res.success) { setTmModal(false); fetchTeam(); showAlert('team', selected ? 'Member updated.' : 'Member added.'); }
      else showAlert('team', res.message || 'Save failed.', 'danger');
    } catch { showAlert('team', 'Failed to save team member.', 'danger'); }
    finally { setSaving(p => ({ ...p, team: false })); }
  };

  const deleteTm = async (m) => {
    if (!window.confirm(`Remove team member "${m.name}"?`)) return;
    try {
      await apiService.delete(`${API_ENDPOINTS.ADMIN.SETTINGS.TEAM}/${m.id}`);
      fetchTeam(); showAlert('team', 'Member removed.');
    } catch { showAlert('team', 'Delete failed.', 'danger'); }
  };

  const tlField = k => ({ value: tlForm[k], onChange: e => setTlForm(p => ({ ...p, [k]: e.target.value })) });
  const tmField = k => ({ value: tmForm[k], onChange: e => setTmForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <PageShell title="Settings" subtitle="Manage company timeline and team members" error={error} onRetry={() => { fetchTimeline(); fetchTeam(); }}>
      <div className="as-page">

        {/* ── Company Timeline ─────────────────────────────────────────────── */}
        <div className="as-section-card">
          <div className="as-section-head">
            <div className="as-section-icon green"><FaHistory /></div>
            <span className="as-section-title">Company Timeline</span>
            <span className="as-section-count">{timeline.length} entries</span>
            <div className="as-head-actions">
              <button className="as-btn add" onClick={fetchTimeline} title="Refresh"><FaSync /></button>
              <button className="as-btn add" onClick={openTlAdd}><FaPlus />Add Entry</button>
            </div>
          </div>
          <div className="as-section-body">
            <Alert msg={alert.timeline?.msg} type={alert.timeline?.type} onClose={() => clearAlert('timeline')} />
            {loading.timeline ? (
              <div className="as-loading"><div className="as-spinner" />Loading timeline…</div>
            ) : timeline.length === 0 ? (
              <div className="as-empty">
                <div className="as-empty-icon"><FaHistory /></div>
                <div className="as-empty-text">No timeline entries yet</div>
                <div className="as-empty-sub">Add your first milestone to showcase your journey</div>
              </div>
            ) : (
              <div className="as-entries">
                {timeline.map((item, idx) => (
                  <div className="as-entry-card" key={item.id || idx}>
                    <div className="as-entry-head">
                      <div className="as-entry-num">{idx + 1}</div>
                      <span className="as-year-pill">{item.year}</span>
                      <span className={`as-entry-title ${item.title ? '' : 'muted'}`}>{item.title || 'Untitled entry'}</span>
                      <div className="as-entry-actions">
                        <button className="as-icon-btn" title="Move up"   disabled={idx === 0}                   onClick={() => moveTl(idx, -1)}><FaChevronUp /></button>
                        <button className="as-icon-btn" title="Move down" disabled={idx === timeline.length - 1} onClick={() => moveTl(idx, +1)}><FaChevronDown /></button>
                        <button className="as-icon-btn" title="Edit" onClick={() => openTlEdit(item)}><FaEdit /></button>
                        <button className="as-icon-btn danger" title="Delete" onClick={() => deleteTl(item)}><FaTrash /></button>
                      </div>
                    </div>
                    {item.description && (
                      <div className="as-entry-body">
                        <p style={{ margin: 0, fontSize: '.875rem', color: '#6b7280' }}>{item.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Team Members ─────────────────────────────────────────────────── */}
        <div className="as-section-card">
          <div className="as-section-head">
            <div className="as-section-icon blue"><FaUsers /></div>
            <span className="as-section-title">Team Members</span>
            <span className="as-section-count">{team.length} members</span>
            <div className="as-head-actions">
              <button className="as-btn add" onClick={fetchTeam} title="Refresh"><FaSync /></button>
              <button className="as-btn add" onClick={openTmAdd}><FaPlus />Add Member</button>
            </div>
          </div>
          <div className="as-section-body">
            <Alert msg={alert.team?.msg} type={alert.team?.type} onClose={() => clearAlert('team')} />
            {loading.team ? (
              <div className="as-loading"><div className="as-spinner" />Loading team members…</div>
            ) : team.length === 0 ? (
              <div className="as-empty">
                <div className="as-empty-icon"><FaUsers /></div>
                <div className="as-empty-text">No team members yet</div>
                <div className="as-empty-sub">Add members to display on your public page</div>
              </div>
            ) : (
              <div className="as-entries">
                {team.map((m, idx) => (
                  <div className="as-entry-card" key={m.id || idx}>
                    <div className="as-entry-head">
                      <div className="as-entry-num">{idx + 1}</div>
                      {m.photo_url
                        ? <img className="as-avatar-preview" src={m.photo_url} alt={m.name} loading="lazy" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div className="as-avatar-placeholder" style={{ width: 32, height: 32, fontSize: '.9rem' }}><FaUserCircle /></div>}
                      <span className={`as-entry-title ${m.name ? '' : 'muted'}`}>
                        {m.name || 'Unnamed'}
                        {m.role && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '.4rem', fontSize: '.8rem' }}>— {m.role}</span>}
                      </span>
                      <div className="as-entry-actions">
                        <button className="as-icon-btn" title="Edit" onClick={() => openTmEdit(m)}><FaEdit /></button>
                        <button className="as-icon-btn danger" title="Remove" onClick={() => deleteTm(m)}><FaTrash /></button>
                      </div>
                    </div>
                    {m.bio && (
                      <div className="as-entry-body">
                        <p style={{ margin: 0, fontSize: '.875rem', color: '#6b7280' }}>{m.bio}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline Modal ────────────────────────────────────────────────── */}
        {tlModal && (
          <div className="wf-modal-overlay" onClick={() => setTlModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaHistory style={{ marginRight: '.5rem' }} />{selected ? 'Edit Timeline Entry' : 'Add Timeline Entry'}</span>
                <button className="wf-modal-close" onClick={() => setTlModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={saveTl}>
                <div className="wf-modal-body">
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Year *</label>
                      <input type="number" min="1900" max="2100" className="wf-field-input" required {...tlField('year')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Title *</label>
                      <input className="wf-field-input" placeholder="Milestone title" required {...tlField('title')} />
                    </div>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Description</label>
                    <textarea className="wf-field-textarea" rows={3} placeholder="Describe this milestone…" {...tlField('description')} />
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setTlModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving.timeline}><FaSave style={{ marginRight: '.3rem' }} />{saving.timeline ? 'Saving…' : selected ? 'Update' : 'Add Entry'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Team Member Modal ─────────────────────────────────────────────── */}
        {tmModal && (
          <div className="wf-modal-overlay" onClick={() => setTmModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaUsers style={{ marginRight: '.5rem' }} />{selected ? 'Edit Team Member' : 'Add Team Member'}</span>
                <button className="wf-modal-close" onClick={() => setTmModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={saveTm}>
                <div className="wf-modal-body">
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Full Name *</label>
                      <input className="wf-field-input" placeholder="Member name" required {...tmField('name')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Role / Position</label>
                      <input className="wf-field-input" placeholder="e.g. Head Barista" {...tmField('role')} />
                    </div>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Bio</label>
                    <textarea className="wf-field-textarea" rows={3} placeholder="Short bio or description…" {...tmField('bio')} />
                  </div>
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Photo URL</label>
                      <input className="wf-field-input" placeholder="https://…" {...tmField('photo_url')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Display Order</label>
                      <input type="number" min="0" className="wf-field-input" {...tmField('display_order')} />
                    </div>
                  </div>
                  {tmForm.photo_url && (
                    <div className="as-avatar-row" style={{ marginTop: '.5rem' }}>
                      <img className="as-avatar-preview" src={tmForm.photo_url} alt="Preview" loading="lazy" onError={e => { e.target.style.display = 'none'; }} />
                      <span style={{ fontSize: '.78rem', color: '#9ca3af' }}>Photo preview</span>
                    </div>
                  )}
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setTmModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving.team}><FaSave style={{ marginRight: '.3rem' }} />{saving.team ? 'Saving…' : selected ? 'Update' : 'Add Member'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
};

export default AdminSettings;
