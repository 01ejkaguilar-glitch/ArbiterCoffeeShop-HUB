import React, { useEffect, useState, useCallback } from 'react';
import {
  FaTasks, FaSearch, FaPlus, FaEdit, FaTrash, FaTimes,
  FaSync, FaCheckCircle, FaHourglassHalf, FaExclamationCircle, FaUser,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminWorkforce.css';

const blankForm = () => ({
  title: '', description: '', assigned_to: '', priority: 'medium',
  status: 'pending', due_date: '',
});

const PriorityBadge = ({ priority }) => {
  const map = { high: 'red', medium: 'amber', low: 'teal' };
  return <span className={`wf-badge ${map[priority] || 'amber'}`}>{priority}</span>;
};
const StatusBadge = ({ status }) => {
  const map = { pending: 'amber', in_progress: 'in_progress', completed: 'present', cancelled: 'absent' };
  const label = status === 'in_progress' ? 'In Progress' : status;
  return <span className={`wf-badge ${map[status] || 'amber'}`}>{label}</span>;
};

const AdminTasks = () => {
  const [tasks, setTasks]           = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [formData, setFormData]     = useState(blankForm());
  const [saving, setSaving]         = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const [error, setError]           = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.EMPLOYEES);
      if (res.success) setEmployees(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch { /* non-fatal */ }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.TASKS);
      if (res.success) {
        const d = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setTasks(d);
        setStats({
          total:      d.length,
          pending:    d.filter(t => t.status === 'pending').length,
          inProgress: d.filter(t => t.status === 'in_progress').length,
          completed:  d.filter(t => t.status === 'completed').length,
        });
      }
    } catch { setError('Failed to load tasks.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); fetchEmployees(); }, [fetchTasks, fetchEmployees]);

  const openAdd  = () => { setSelected(null); setFormData(blankForm()); setShowModal(true); };
  const openEdit = (task) => {
    setSelected(task);
    setFormData({ title: task.title || '', description: task.description || '',
      assigned_to: task.assigned_to || task.employee_id || '',
      priority: task.priority || 'medium', status: task.status || 'pending',
      due_date: task.due_date || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = selected
        ? await apiService.put(API_ENDPOINTS.WORKFORCE.TASK_DETAIL(selected.id), formData)
        : await apiService.post(API_ENDPOINTS.WORKFORCE.TASKS, formData);
      if (res.success) { setShowModal(false); fetchTasks(); }
      else setError(res.message || 'Save failed.');
    } catch { setError('Failed to save task.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await apiService.delete(API_ENDPOINTS.WORKFORCE.TASK_DETAIL(toDelete.id));
      setShowDelete(false); setToDelete(null); fetchTasks();
    } catch { setError('Failed to delete task.'); }
  };

  const field = k => ({
    value: formData[k],
    onChange: e => setFormData(p => ({ ...p, [k]: e.target.value })),
  });

  const empName = id => {
    const e = employees.find(e => String(e.id) === String(id));
    return e ? e.name : id ? `#${id}` : '—';
  };

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    const nameMatch   = (t.title || '').toLowerCase().includes(q) || empName(t.assigned_to).toLowerCase().includes(q);
    const statusMatch = statusFilter   === 'all' || t.status   === statusFilter;
    const prioMatch   = priorityFilter === 'all' || t.priority === priorityFilter;
    return nameMatch && statusMatch && prioMatch;
  });

  const overdue = (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date();

  return (
    <PageShell title="Task Management" subtitle="Assign and track employee tasks" error={error} onRetry={fetchTasks}>
      <div className="wf-page">

        {/* Stats */}
        <div className="wf-stat-grid">
          {[
            { label: 'Total Tasks',  val: stats.total,      icon: <FaTasks />,           color: 'blue'  },
            { label: 'Pending',      val: stats.pending,    icon: <FaHourglassHalf />,   color: 'amber' },
            { label: 'In Progress',  val: stats.inProgress, icon: <FaExclamationCircle />, color: 'teal'},
            { label: 'Completed',   val: stats.completed,  icon: <FaCheckCircle />,      color: 'green' },
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
            <input className="wf-search-input" placeholder="Search tasks or assignee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="wf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="wf-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="wf-btn secondary wf-btn-icon" onClick={fetchTasks} title="Refresh"><FaSync /></button>
          <button className="wf-btn primary" onClick={openAdd}><FaPlus style={{ marginRight: '.4rem' }} />Add Task</button>
        </div>

        {/* Table */}
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Task</th><th>Assigned To</th><th>Priority</th>
                <th>Due Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="wf-empty">Loading tasks…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="wf-empty"><FaTasks size={28} style={{ color: '#d1d5db', display: 'block', margin: '0 auto .5rem' }} />No tasks found.</td></tr>
              ) : filtered.map(task => (
                <tr key={task.id} style={overdue(task) ? { background: '#fff5f5' } : {}}>
                  <td>
                    <div className="wf-td-bold">{task.title}</div>
                    {task.description && <div className="wf-td-muted" style={{ fontSize: '.75rem', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                    {overdue(task) && <span style={{ fontSize: '.7rem', color: '#ef4444', fontWeight: 600 }}>OVERDUE</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <FaUser size={10} style={{ color: '#9ca3af' }} />
                      <span>{empName(task.assigned_to || task.employee_id)}</span>
                    </div>
                  </td>
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td className="wf-td-muted">{task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td><StatusBadge status={task.status} /></td>
                  <td>
                    <div className="wf-action-group">
                      <button className="wf-action-btn edit" title="Edit" onClick={() => openEdit(task)}><FaEdit /></button>
                      <button className="wf-action-btn delete" title="Delete" onClick={() => { setToDelete(task); setShowDelete(true); }}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="wf-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="wf-modal" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaTasks style={{ marginRight: '.5rem' }} />{selected ? 'Edit Task' : 'Add Task'}</span>
                <button className="wf-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="wf-modal-body">
                  <div className="wf-form-row">
                    <label className="wf-form-label">Task Title *</label>
                    <input className="wf-field-input" placeholder="Task title" required {...field('title')} />
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Description</label>
                    <textarea className="wf-field-textarea" rows={3} placeholder="Task description…" {...field('description')} />
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Assign To</label>
                    <select className="wf-field-select" {...field('assigned_to')}>
                      <option value="">Unassigned</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Priority</label>
                      <select className="wf-field-select" {...field('priority')}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="wf-form-label">Status</label>
                      <select className="wf-field-select" {...field('status')}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="wf-form-row">
                    <label className="wf-form-label">Due Date</label>
                    <input type="date" className="wf-field-input" {...field('due_date')} />
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving}>{saving ? 'Saving…' : selected ? 'Update Task' : 'Add Task'}</button>
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
                <span className="wf-modal-title" style={{ color: '#C41E3A' }}>Delete Task</span>
                <button className="wf-modal-close" onClick={() => setShowDelete(false)}><FaTimes /></button>
              </div>
              <div className="wf-modal-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <p>Delete task <strong>"{toDelete.title}"</strong>?</p>
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

export default AdminTasks;
