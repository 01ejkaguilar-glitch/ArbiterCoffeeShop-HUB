import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaBan, FaCheckCircle, FaEdit, FaEye, FaPlus, FaSearch,
  FaUsers, FaUserCheck, FaUserShield, FaUserTimes, FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './AdminUsers.css';

const PER_PAGE_OPTIONS = [10, 15, 25, 50];
const ROLES = ['customer', 'barista', 'manager', 'admin', 'super-admin'];

function getAvatarClass(name) {
  const char = (name || '?')[0].toLowerCase();
  const map = { a:'a', b:'b', c:'c', d:'d', e:'e', f:'f', g:'g', h:'h' };
  return `au-avatar au-avatar-${map[char] || 'z'}`;
}

function RoleBadge({ role }) {
  const name = typeof role === 'string' ? role : role?.name || '';
  return <span className={`au-role-badge ${name}`}>{name}</span>;
}

function StatusChip({ status }) {
  const s = status || 'active';
  return (
    <span className={`au-status ${s}`}>
      <span className="au-dot" /> {s}
    </span>
  );
}

const AdminUsers = () => {
  /* ── server-side state ── */
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [meta, setMeta]           = useState({ total:0, last_page:1, current_page:1, from:0, to:0 });
  const [page, setPage]           = useState(1);
  const [perPage, setPerPage]     = useState(15);

  /* ── filters ── */
  const [search, setSearch]                   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter]           = useState('all');
  const [statusFilter, setStatusFilter]       = useState('all');

  /* ── stats ── */
  const [stats, setStats] = useState({ total_users:0, active_users:0, inactive_users:0, by_role:{} });

  /* ── modals ── */
  const [showDetail, setShowDetail]     = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showEdit, setShowEdit]   = useState(false);
  const [editMode, setEditMode]   = useState('create');
  const [editForm, setEditForm]   = useState({ name:'', email:'', password:'', role:'customer' });
  const [editSaving, setEditSaving] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toggling, setToggling]       = useState(false);

  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();

  /* ── debounce ── */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  /* ── fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: perPage });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiService.get(`${API_ENDPOINTS.ADMIN.USERS}?${params}`);
      if (res.success) {
        const p = res.data;
        setUsers(Array.isArray(p.data) ? p.data : []);
        setMeta({ total: p.total ?? 0, last_page: p.last_page ?? 1, current_page: p.current_page ?? 1, from: p.from ?? 0, to: p.to ?? 0 });
      }
    } catch (err) {
      console.error('fetchUsers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.ADMIN.USER_STATISTICS);
      if (res.success) setStats(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── filter handlers ── */
  const handleRole    = (v) => { setRoleFilter(v);       setPage(1); };
  const handleStatus  = (v) => { setStatusFilter(v);     setPage(1); };
  const handlePerPage = (v) => { setPerPage(Number(v));  setPage(1); };

  /* ── view detail ── */
  const handleView = async (user) => {
    setSelectedUser(user);
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await apiService.get(API_ENDPOINTS.ADMIN.USER_DETAIL(user.id));
      if (res.success) setDetailData(res.data);
    } catch (_) {}
    setDetailLoading(false);
  };

  /* ── create / edit ── */
  const handleOpenCreate = () => {
    setEditMode('create');
    setEditForm({ name:'', email:'', password:'', role:'customer' });
    setShowEdit(true);
  };

  const handleOpenEdit = (user) => {
    const roles = Array.isArray(user.roles) ? user.roles.map(r => typeof r === 'string' ? r : r.name) : [];
    setEditMode('edit');
    setEditForm({ id: user.id, name: user.name || '', email: user.email || '', password:'', role: roles[0] || 'customer' });
    setShowEdit(true);
  };

  const handleEditChange = (field, val) => setEditForm(f => ({ ...f, [field]: val }));

  const handleSaveUser = async () => {
    setEditSaving(true);
    try {
      let res;
      if (editMode === 'create') {
        res = await apiService.post(API_ENDPOINTS.ADMIN.USERS, editForm);
      } else {
        const payload = { name: editForm.name, email: editForm.email, role: editForm.role };
        if (editForm.password) payload.password = editForm.password;
        res = await apiService.put(API_ENDPOINTS.ADMIN.USER_DETAIL(editForm.id), payload);
      }
      if (res.success) {
        showSuccessNotification('Success', editMode === 'create' ? 'User created!' : 'User updated!');
        setShowEdit(false);
        fetchUsers();
        fetchStats();
      } else {
        showErrorNotification('Error', res.message || 'Failed to save user');
      }
    } catch (err) {
      showErrorNotification('Error', err?.response?.data?.message || 'Failed to save user');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── toggle status ── */
  const handleToggleRequest = (user) => { setConfirmUser(user); setShowConfirm(true); };

  const handleToggleConfirm = async () => {
    if (!confirmUser) return;
    const isActive = (confirmUser.status || 'active') === 'active';
    setToggling(true);
    try {
      let res;
      if (isActive) {
        res = await apiService.delete(API_ENDPOINTS.ADMIN.USER_DETAIL(confirmUser.id));
      } else {
        res = await apiService.post(API_ENDPOINTS.ADMIN.USER_REACTIVATE(confirmUser.id));
      }
      if (res.success) {
        showSuccessNotification('Updated', `User ${isActive ? 'deactivated' : 'reactivated'} successfully`);
        setShowConfirm(false);
        setConfirmUser(null);
        fetchUsers();
        fetchStats();
      }
    } catch (err) {
      showErrorNotification('Error', `Failed to ${isActive ? 'deactivate' : 'reactivate'} user`);
    } finally {
      setToggling(false);
    }
  };

  /* ── pagination buttons ── */
  const pageButtons = useMemo(() => {
    const { last_page, current_page } = meta;
    if (last_page <= 1) return [];
    const range = [];
    for (let i = Math.max(1, current_page - 2); i <= Math.min(last_page, current_page + 2); i++) range.push(i);
    const buttons = [...range];
    if (range[0] > 1) { if (range[0] > 2) buttons.unshift('...-left'); buttons.unshift(1); }
    if (range[range.length-1] < last_page) { if (range[range.length-1] < last_page-1) buttons.push('...-right'); buttons.push(last_page); }
    return buttons;
  }, [meta]);

  return (
    <PageShell
      title="User Management"
      subtitle="Manage user accounts, roles and permissions"
      loading={false}
    >
      {/* Stats Bar */}
      <div className="au-stats-bar">
        <div className="au-stat-card">
          <div className="au-stat-icon blue"><FaUsers /></div>
          <div><div className="au-stat-label">Total Users</div><div className="au-stat-value">{stats.total_users}</div></div>
        </div>
        <div className="au-stat-card">
          <div className="au-stat-icon green"><FaUserCheck /></div>
          <div><div className="au-stat-label">Active</div><div className="au-stat-value">{stats.active_users}</div></div>
        </div>
        <div className="au-stat-card">
          <div className="au-stat-icon red"><FaUserTimes /></div>
          <div><div className="au-stat-label">Inactive</div><div className="au-stat-value">{stats.inactive_users}</div></div>
        </div>
        <div className="au-stat-card">
          <div className="au-stat-icon purple"><FaUserShield /></div>
          <div><div className="au-stat-label">Admins</div><div className="au-stat-value">{stats.by_role?.admins ?? 0}</div></div>
        </div>
        <div className="au-stat-card">
          <div className="au-stat-icon teal"><FaUsers /></div>
          <div><div className="au-stat-label">Baristas</div><div className="au-stat-value">{stats.by_role?.baristas ?? 0}</div></div>
        </div>
        <div className="au-stat-card">
          <div className="au-stat-icon amber"><FaUsers /></div>
          <div><div className="au-stat-label">Customers</div><div className="au-stat-value">{stats.by_role?.customers ?? 0}</div></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="au-filter-bar">
        <div className="au-search-wrap">
          <FaSearch className="au-search-icon" />
          <input
            className="au-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="au-select" value={roleFilter} onChange={e => handleRole(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select className="au-select" value={statusFilter} onChange={e => handleStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select className="au-select" value={perPage} onChange={e => handlePerPage(e.target.value)} style={{minWidth:90}}>
          {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        {meta.total > 0 && <span className="au-count-label">{meta.from}–{meta.to} of {meta.total}</span>}
        <button className="au-add-btn" onClick={handleOpenCreate}><FaPlus /> Add User</button>
      </div>

      {/* Table */}
      <div className="au-table-wrap">
        {loading ? (
          <div className="au-empty"><p>Loading users…</p></div>
        ) : users.length === 0 ? (
          <div className="au-empty">
            <div className="au-empty-icon"><FaUsers /></div>
            <p>No users found.{(search || roleFilter !== 'all' || statusFilter !== 'all') && ' Try adjusting your filters.'}</p>
          </div>
        ) : (
          <table className="au-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const roles = Array.isArray(user.roles) ? user.roles : [];
                const status = user.status || 'active';
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="au-user-cell">
                        <div className={getAvatarClass(user.name)}>{(user.name || '?')[0].toUpperCase()}</div>
                        <div>
                          <div className="au-user-name">{user.name}</div>
                          <div className="au-user-id">#{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:'.85rem'}}>{user.email}</td>
                    <td>{roles.length === 0 ? <RoleBadge role="customer" /> : roles.map((r,i) => <RoleBadge key={i} role={r} />)}</td>
                    <td><StatusChip status={status} /></td>
                    <td style={{fontSize:'.82rem',color:'#666'}}>
                      {new Date(user.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td>
                      <div className="au-actions-cell">
                        <button className="au-action-btn view" title="View Details" onClick={() => handleView(user)}><FaEye /></button>
                        <button className="au-action-btn edit" title="Edit User" onClick={() => handleOpenEdit(user)}><FaEdit /></button>
                        <button
                          className={`au-action-btn ${status === 'active' ? 'deactivate' : 'reactivate'}`}
                          title={status === 'active' ? 'Deactivate' : 'Reactivate'}
                          onClick={() => handleToggleRequest(user)}
                        >{status === 'active' ? <FaBan /> : <FaCheckCircle />}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {pageButtons.length > 0 && (
          <div className="au-pagination-bar">
            <span className="au-pagination-info">Page {meta.current_page} of {meta.last_page}</span>
            <div className="au-pagination">
              <button className="au-page-btn" onClick={() => setPage(1)} disabled={meta.current_page===1}>&#171;</button>
              <button className="au-page-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={meta.current_page===1}>&#8249;</button>
              {pageButtons.map(btn =>
                typeof btn === 'string'
                  ? <span key={btn} className="au-page-ellipsis">…</span>
                  : <button key={btn} className={`au-page-btn${btn===meta.current_page?' active':''}`} onClick={() => setPage(btn)}>{btn}</button>
              )}
              <button className="au-page-btn" onClick={() => setPage(p => Math.min(meta.last_page,p+1))} disabled={meta.current_page===meta.last_page}>&#8250;</button>
              <button className="au-page-btn" onClick={() => setPage(meta.last_page)} disabled={meta.current_page===meta.last_page}>&#187;</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedUser && (
        <div className="au-modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setShowDetail(false); }}>
          <div className="au-modal lg">
            <div className="au-modal-header">
              <span className="au-modal-title">User Details — {selectedUser.name}</span>
              <button className="au-modal-close" onClick={() => setShowDetail(false)}><FaTimes /></button>
            </div>
            <div className="au-modal-body">
              {detailLoading ? <div className="au-empty"><p>Loading…</p></div> : (() => {
                const u = detailData || selectedUser;
                return (
                  <>
                    <div className={`${getAvatarClass(u.name)} au-detail-avatar`}>{(u.name||'?')[0].toUpperCase()}</div>
                    <div className="au-detail-grid">
                      <div className="au-detail-field"><label>User ID</label><div className="au-val">#{u.id}</div></div>
                      <div className="au-detail-field"><label>Status</label><div className="au-val"><StatusChip status={u.status||'active'} /></div></div>
                      <div className="au-detail-field"><label>Full Name</label><div className="au-val">{u.name}</div></div>
                      <div className="au-detail-field"><label>Email</label><div className="au-val">{u.email}</div></div>
                      <div className="au-detail-field"><label>Phone</label><div className="au-val">{u.phone||'—'}</div></div>
                      <div className="au-detail-field"><label>Roles</label><div className="au-val">{(u.roles||[]).map((r,i)=><RoleBadge key={i} role={r}/>)}</div></div>
                      <div className="au-detail-field"><label>Joined</label><div className="au-val">{new Date(u.created_at).toLocaleString()}</div></div>
                      <div className="au-detail-field"><label>Last Updated</label><div className="au-val">{new Date(u.updated_at).toLocaleString()}</div></div>
                    </div>
                    {u.customer_profile && (<>
                      <hr className="au-detail-divider" />
                      <p className="au-section-title">Customer Profile</p>
                      <div className="au-detail-grid">
                        <div className="au-detail-field"><label>Total Orders</label><div className="au-val">{u.customer_profile.total_orders??0}</div></div>
                        <div className="au-detail-field"><label>Total Spent</label><div className="au-val">₱{parseFloat(u.customer_profile.total_spent||0).toFixed(2)}</div></div>
                      </div>
                    </>)}
                    {detailData?.orders?.length > 0 && (<>
                      <hr className="au-detail-divider" />
                      <p className="au-section-title">Recent Orders ({detailData.orders.length})</p>
                      <div className="au-orders-list">
                        {detailData.orders.map(order => (
                          <div key={order.id} className="au-order-row">
                            <span>#{order.order_number}</span>
                            <StatusChip status={order.status} />
                            <span>₱{parseFloat(order.total_amount||0).toFixed(2)}</span>
                            <span style={{color:'#aaa',fontSize:'.76rem'}}>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </>)}
                  </>
                );
              })()}
            </div>
            <div className="au-modal-footer">
              <button className="au-btn ghost" onClick={() => setShowDetail(false)}>Close</button>
              <button className="au-btn primary" onClick={() => { setShowDetail(false); handleOpenEdit(selectedUser); }}>Edit User</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showEdit && (
        <div className="au-modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setShowEdit(false); }}>
          <div className="au-modal">
            <div className="au-modal-header">
              <span className="au-modal-title">{editMode==='create' ? 'Add New User' : `Edit — ${editForm.name}`}</span>
              <button className="au-modal-close" onClick={() => setShowEdit(false)}><FaTimes /></button>
            </div>
            <div className="au-modal-body">
              <div className="au-form-grid">
                <div className="au-form-group">
                  <label className="au-form-label">Full Name *</label>
                  <input className="au-form-input" value={editForm.name} onChange={e=>handleEditChange('name',e.target.value)} placeholder="Enter full name" />
                </div>
                <div className="au-form-group">
                  <label className="au-form-label">Email *</label>
                  <input className="au-form-input" type="email" value={editForm.email} onChange={e=>handleEditChange('email',e.target.value)} placeholder="Enter email address" />
                </div>
                <div className="au-form-group">
                  <label className="au-form-label">{editMode==='create' ? 'Password *' : 'New Password'}</label>
                  <input className="au-form-input" type="password" value={editForm.password} onChange={e=>handleEditChange('password',e.target.value)} placeholder={editMode==='create' ? 'Min 8 characters' : 'Leave blank to keep current'} />
                  {editMode==='edit' && <span className="au-form-hint">Leave blank to keep the current password</span>}
                </div>
                <div className="au-form-group">
                  <label className="au-form-label">Role *</label>
                  <select className="au-form-select" value={editForm.role} onChange={e=>handleEditChange('role',e.target.value)}>
                    {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="au-modal-footer">
              <button className="au-btn ghost" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="au-btn primary" onClick={handleSaveUser} disabled={editSaving}>
                {editSaving ? 'Saving…' : (editMode==='create' ? 'Create User' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate / Reactivate */}
      {showConfirm && confirmUser && (
        <div className="au-modal-backdrop" onClick={e => { if (e.target===e.currentTarget) { setShowConfirm(false); setConfirmUser(null); } }}>
          <div className="au-modal sm">
            <div className="au-modal-header">
              <span className="au-modal-title">{(confirmUser.status||'active')==='active' ? 'Deactivate' : 'Reactivate'} User</span>
              <button className="au-modal-close" onClick={() => { setShowConfirm(false); setConfirmUser(null); }}><FaTimes /></button>
            </div>
            <div className="au-modal-body au-confirm-body">
              <div className="au-confirm-icon">
                <FaExclamationTriangle style={{color:(confirmUser.status||'active')==='active'?'#e74c3c':'#2ecc71',fontSize:'2.5rem'}} />
              </div>
              <div className="au-confirm-title">{(confirmUser.status||'active')==='active'?'Deactivate':'Reactivate'} {confirmUser.name}?</div>
              <p className="au-confirm-msg">
                {(confirmUser.status||'active')==='active'
                  ? 'This will prevent the user from logging in. You can reactivate them later.'
                  : 'This will restore access for this user.'}
              </p>
            </div>
            <div className="au-modal-footer">
              <button className="au-btn ghost" onClick={() => { setShowConfirm(false); setConfirmUser(null); }}>Cancel</button>
              <button
                className={`au-btn ${(confirmUser.status||'active')==='active'?'danger':'success'}`}
                onClick={handleToggleConfirm}
                disabled={toggling}
              >{toggling?'Please wait…':((confirmUser.status||'active')==='active'?'Deactivate':'Reactivate')}</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminUsers;
