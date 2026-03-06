import React, { useEffect, useState, useCallback } from 'react';
import {
  FaUsers, FaSearch, FaPlus, FaEdit, FaTrash, FaTimes,
  FaUserCheck, FaUserTimes, FaSync, FaExclamationTriangle, FaEnvelope, FaPhone,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminWorkforce.css';

const blankForm = () => ({
  name: '', email: '', phone: '', password: '', role: 'barista',
  position: '', department: '', hire_date: '', salary: '', status: 'active',
});

const RoleBadge = ({ role }) => (
  <span className={`wf-badge ${role === 'admin' ? 'blue' : role === 'manager' ? 'amber' : 'green'}`}>
    {role || 'barista'}
  </span>
);
const STATUS_MAP = {
  active:     { cls: 'present', label: 'Active' },
  on_leave:   { cls: 'late',    label: 'On Leave' },
  suspended:  { cls: 'absent',  label: 'Suspended' },
  terminated: { cls: 'absent',  label: 'Terminated' },
  inactive:   { cls: 'absent',  label: 'Inactive' },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { cls: 'absent', label: status || 'Inactive' };
  return <span className={`wf-badge ${s.cls}`}>{s.label}</span>;
};

const AdminEmployees = () => {
  const [employees, setEmployees]   = useState([]);
  const [stats, setStats]           = useState({ total: 0, active: 0, inactive: 0, new: 0 });
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const [formData, setFormData]     = useState(blankForm());
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete]     = useState(null);
  const [error, setError]           = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.EMPLOYEES);
      if (res.success) {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Normalize: flatten user sub-object and extract Spatie role
        const d = raw.map(emp => ({
          ...emp,
          name:  emp.user?.name  || emp.name  || '',
          email: emp.user?.email || emp.email || '',
          phone: emp.user?.phone || emp.phone || '',
          role:  emp.user?.roles?.[0]?.name || emp.role || 'barista',
        }));
        setEmployees(d);
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setStats({
          total:    d.length,
          active:   d.filter(e => e.status === 'active').length,
          inactive: d.filter(e => e.status !== 'active').length,
          new:      d.filter(e => e.hire_date && new Date(e.hire_date) >= thirtyDaysAgo).length,
        });
      }
    } catch { setError('Failed to load employees.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim())  errs.name  = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    if (!selected && !formData.password.trim()) errs.password = 'Password is required';
    if (!selected && !formData.position.trim()) errs.position = 'Position is required';
    return errs;
  };

  const openAdd = () => { setSelected(null); setFormData(blankForm()); setFormErrors({}); setShowModal(true); };
  const openEdit = (emp) => {
    setSelected(emp);
    setFormData({
      name:       emp.name       || '',
      email:      emp.email      || '',
      phone:      emp.phone      || '',
      password:   '',
      role:       emp.role       || 'barista',
      position:   emp.position   || '',
      department: emp.department || '',
      hire_date:  emp.hire_date  ? String(emp.hire_date).substring(0, 10) : '',
      salary:     emp.salary     || '',
      status:     emp.status     || 'active',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      let res;
      if (selected) {
        // Update: backend accepts position, department, salary, status + name/phone on user
        const payload = {
          name:       formData.name,
          phone:      formData.phone,
          position:   formData.position,
          department: formData.department,
          hire_date:  formData.hire_date  || undefined,
          salary:     formData.salary !== '' ? parseFloat(formData.salary) : undefined,
          status:     formData.status,
        };
        res = await apiService.put(API_ENDPOINTS.WORKFORCE.EMPLOYEE_DETAIL(selected.id), payload);
      } else {
        // Create: requires name, email, password, role, position, hire_date
        const payload = {
          name:       formData.name,
          email:      formData.email,
          phone:      formData.phone,
          password:   formData.password,
          role:       formData.role,
          position:   formData.position,
          department: formData.department,
          hire_date:  formData.hire_date,
          salary:     formData.salary !== '' ? parseFloat(formData.salary) : undefined,
          status:     'active',
        };
        res = await apiService.post(API_ENDPOINTS.WORKFORCE.EMPLOYEES, payload);
      }
      if (res.success) { setShowModal(false); fetchEmployees(); }
      else setError(res.message || 'Save failed.');
    } catch (err) { setError(err?.response?.data?.message || 'Failed to save employee.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await apiService.delete(API_ENDPOINTS.WORKFORCE.EMPLOYEE_DETAIL(toDelete.id));
      if (res.success) { setShowDelete(false); setToDelete(null); fetchEmployees(); }
    } catch { setError('Failed to delete employee.'); }
  };

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData(p => ({ ...p, [key]: e.target.value })),
  });

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return (e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q))
      && (roleFilter === 'all' || e.role === roleFilter);
  });

  return (
    <PageShell title="Employee Management" subtitle="Manage your team members" error={error} onRetry={fetchEmployees}>
      <div className="wf-page">

        {/* Stats */}
        <div className="wf-stat-grid">
          {[
            { label: 'Total Employees', val: stats.total,    icon: <FaUsers />,     color: 'blue'  },
            { label: 'Active',          val: stats.active,   icon: <FaUserCheck />, color: 'green' },
            { label: 'Inactive',        val: stats.inactive, icon: <FaUserTimes />, color: 'red'   },
            { label: 'New This Month',  val: stats.new,      icon: <FaPlus />,      color: 'amber' },
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
            <input className="wf-search-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="wf-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {['barista', 'manager', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="wf-btn secondary wf-btn-icon" onClick={fetchEmployees} title="Refresh"><FaSync /></button>
          <button className="wf-btn primary" onClick={openAdd}><FaPlus style={{ marginRight: '.4rem' }} />Add Employee</button>
        </div>

        {/* Table */}
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Name</th><th>Contact</th><th>Role</th>
                <th>Department</th><th>Hire Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="wf-empty">Loading employees…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="wf-empty"><FaUsers size={28} style={{ color: '#d1d5db', display: 'block', margin: '0 auto .5rem' }} />No employees found.</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id}>
                  <td className="wf-td-bold">{emp.name}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                      {emp.email && <span style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}><FaEnvelope size={10} style={{ color: '#9ca3af' }} />{emp.email}</span>}
                      {emp.phone && <span style={{ fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}><FaPhone size={10} style={{ color: '#9ca3af' }} />{emp.phone}</span>}
                    </div>
                  </td>
                  <td><RoleBadge role={emp.role} /></td>
                  <td className="wf-td-muted">{emp.department || '—'}</td>
                  <td className="wf-td-muted">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td>
                    <div className="wf-action-group">
                      <button className="wf-action-btn edit" title="Edit" onClick={() => openEdit(emp)}><FaEdit /></button>
                      <button className="wf-action-btn delete" title="Delete" onClick={() => { setToDelete(emp); setShowDelete(true); }}><FaTrash /></button>
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
            <div className="wf-modal lg" onClick={e => e.stopPropagation()}>
              <div className="wf-modal-head">
                <span className="wf-modal-title"><FaUsers style={{ marginRight: '.5rem' }} />{selected ? 'Edit Employee' : 'Add Employee'}</span>
                <button className="wf-modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="wf-modal-body">
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Full Name *</label>
                      <input className={`wf-field-input${formErrors.name ? ' error' : ''}`} placeholder="Full name" {...field('name')} required />
                      {formErrors.name && <span className="wf-field-error">{formErrors.name}</span>}
                    </div>
                    <div>
                      <label className="wf-form-label">Email *</label>
                      <input type="email" className={`wf-field-input${formErrors.email ? ' error' : ''}`} placeholder="Email address" {...field('email')} required />
                      {formErrors.email && <span className="wf-field-error">{formErrors.email}</span>}
                    </div>
                  </div>
                  {!selected && (
                    <div className="wf-form-row wf-2col">
                      <div>
                        <label className="wf-form-label">Password *</label>
                        <input type="password" className={`wf-field-input${formErrors.password ? ' error' : ''}`} placeholder="Min. 8 characters" {...field('password')} />
                        {formErrors.password && <span className="wf-field-error">{formErrors.password}</span>}
                      </div>
                      <div>
                        <label className="wf-form-label">Role</label>
                        <select className="wf-field-select" {...field('role')}>
                          {['barista', 'manager', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Phone</label>
                      <input className="wf-field-input" placeholder="Phone number" {...field('phone')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Position / Job Title *</label>
                      <input className={`wf-field-input${formErrors.position ? ' error' : ''}`} placeholder="e.g. Head Barista" {...field('position')} />
                      {formErrors.position && <span className="wf-field-error">{formErrors.position}</span>}
                    </div>
                  </div>
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Department</label>
                      <input className="wf-field-input" placeholder="Department" {...field('department')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Hire Date</label>
                      <input type="date" className="wf-field-input" {...field('hire_date')} />
                    </div>
                  </div>
                  <div className="wf-form-row wf-2col">
                    <div>
                      <label className="wf-form-label">Salary (₱)</label>
                      <input type="number" min="0" step="0.01" className="wf-field-input" placeholder="0.00" {...field('salary')} />
                    </div>
                    <div>
                      <label className="wf-form-label">Status</label>
                      <select className="wf-field-select" {...field('status')}>
                        <option value="active">Active</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="wf-modal-foot">
                  <button type="button" className="wf-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="wf-btn primary" disabled={saving}>{saving ? 'Saving…' : selected ? 'Update Employee' : 'Add Employee'}</button>
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
                <span className="wf-modal-title" style={{ color: '#C41E3A' }}><FaExclamationTriangle style={{ marginRight: '.5rem' }} />Delete Employee</span>
                <button className="wf-modal-close" onClick={() => setShowDelete(false)}><FaTimes /></button>
              </div>
              <div className="wf-modal-body" style={{ textAlign: 'center', padding: '1.5rem 1.75rem' }}>
                <p>Are you sure you want to delete <strong>{toDelete.name}</strong>? This action cannot be undone.</p>
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

export default AdminEmployees;
