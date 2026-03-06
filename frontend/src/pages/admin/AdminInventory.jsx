import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert, Modal, ProgressBar, Spinner } from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaBoxes, FaCoffee, FaUtensils, FaBox, FaSprayCan,
  FaPencilAlt, FaSort, FaSortUp, FaSortDown, FaHistory, FaLayerGroup, FaTimesCircle,
  FaCookieBite, FaSnowflake, FaSearch, FaArrowUp, FaArrowDown, FaExchangeAlt,
  FaRecycle, FaChevronLeft, FaChevronRight, FaBoxOpen,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import PageShell from '../../components/layout/PageShell';
import './AdminInventory.css';

const INVENTORY_TYPES = [
  { key: 'bar',        label: 'Bar Inventory',      icon: FaCoffee },
  { key: 'kitchen',    label: 'Kitchen Supplies',    icon: FaUtensils },
  { key: 'baking',     label: 'Baking Items',        icon: FaCookieBite },
  { key: 'deli',       label: 'Deli Frozen',         icon: FaSnowflake },
  { key: 'packaging',  label: 'Packaging Materials', icon: FaBox },
  { key: 'cleaning',   label: 'Cleaning Supplies',   icon: FaSprayCan },
  { key: 'stationery', label: 'Stationery',          icon: FaPencilAlt },
];

const SUPPLY_CATEGORIES = [
  'Kitchen Supplies', 'Baking Items', 'Deli Frozen Products',
  'Cleaning Supplies', 'Bar Supplies', 'Stationery Supplies', 'Packaging Supplies',
];

const ADJUST_TYPES = [
  { key: 'restock',    label: 'Restock',    desc: 'Add incoming stock',       icon: FaArrowUp,     cls: 'restock' },
  { key: 'adjustment', label: 'Adjust',     desc: 'Manual count correction',  icon: FaExchangeAlt, cls: 'adjustment' },
  { key: 'usage',      label: 'Usage',      desc: 'Mark stock as consumed',   icon: FaArrowDown,   cls: 'usage' },
  { key: 'wastage',    label: 'Wastage',    desc: 'Record spoilage / damage', icon: FaRecycle,     cls: 'wastage' },
];

const PAGE_SIZE = 25;

const emptyForm = (type = 'bar') => ({
  name: '', category: 'Kitchen Supplies', source: 'Wet Market',
  type, quantity: '', unit: '', reorder_level: '', cost_per_unit: '',
});

function getStockStatus(item) {
  const qty = parseFloat(item.quantity);
  if (qty <= 0) return 'out-stock';
  if (qty <= parseFloat(item.reorder_level)) return 'low-stock';
  return 'in-stock';
}

function StockBadge({ item }) {
  const status = getStockStatus(item);
  const labels = { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-stock': 'Out of Stock' };
  return (
    <span className={`ai-status ${status}`}>
      <span className="ai-dot" />
      {labels[status]}
    </span>
  );
}

function SortIcon({ col, sortConfig }) {
  if (sortConfig.key !== col) return <FaSort style={{ marginLeft: 4, opacity: 0.35, fontSize: '0.65rem' }} />;
  return sortConfig.dir === 'asc'
    ? <FaSortUp style={{ marginLeft: 4, color: 'var(--color-dark-green)', fontSize: '0.65rem' }} />
      : <FaSortDown style={{ marginLeft: 4, color: 'var(--color-dark-green)', fontSize: '0.65rem' }} />;
}
const AdminInventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLogs, setInventoryLogs]   = useState([]);
  const [logsLoaded, setLogsLoaded]         = useState(false);
  const [loading, setLoading]               = useState(true);
  const [loadingLogs, setLoadingLogs]       = useState(false);
  const [activeTab, setActiveTab]           = useState('bar');
  const [search, setSearch]                 = useState('');
  const [filterSource, setFilterSource]     = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [sortConfig, setSortConfig]         = useState({ key: 'source', dir: 'desc' });
  const [page, setPage]                     = useState(1);
  const [alert, setAlert]                   = useState({ show: false, message: '', type: '' });
  const [showModal, setShowModal]           = useState(false);
  const [editingItem, setEditingItem]       = useState(null);
  const [formData, setFormData]             = useState(emptyForm('bar'));
  const [showAdjust, setShowAdjust]         = useState(false);
  const [adjustItem, setAdjustItem]         = useState(null);
  const [adjustType, setAdjustType]         = useState('restock');
  const [adjustQty, setAdjustQty]           = useState('');
  const [adjustReason, setAdjustReason]     = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [showLogModal, setShowLogModal]     = useState(false);
  const [logItem, setLogItem]               = useState(null);
  const [itemLogs, setItemLogs]             = useState([]);
  const [loadingItemLogs, setLoadingItemLogs] = useState(false);
  const [showBulkModal, setShowBulkModal]   = useState(false);
  const [bulkRows, setBulkRows]             = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress]     = useState({ done: 0, total: 0, errors: [] });

  const showAlertMsg = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3500);
  };

  const fetchInventoryItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.ADMIN.INVENTORY.LIST);
      if (res.success) {
        const items = res.data.data || res.data;
        setInventoryItems(Array.isArray(items) ? items : []);
      }
    } catch { showAlertMsg('Failed to load inventory items', 'danger'); }
    finally { setLoading(false); }
  }, []);

  const fetchInventoryLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await apiService.get(API_ENDPOINTS.ADMIN.INVENTORY.LOGS);
      if (res.success) {
        const logs = res.data.data || res.data;
        setInventoryLogs(Array.isArray(logs) ? logs : []);
        setLogsLoaded(true);
      }
    } catch { showAlertMsg('Failed to load logs', 'danger'); }
    finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => { fetchInventoryItems(); }, [fetchInventoryItems]);
  useEffect(() => {
    if (activeTab === 'logs' && !logsLoaded) fetchInventoryLogs();
    setPage(1);
  }, [activeTab, logsLoaded, fetchInventoryLogs]);

  const filteredItems = useMemo(() => {
    let list = activeTab === 'logs' ? inventoryItems : inventoryItems.filter(i => i.type === activeTab);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(i => i.name.toLowerCase().includes(q)); }
    if (filterSource) list = list.filter(i => i.source === filterSource);
    if (filterStatus) list = list.filter(i => getStockStatus(i) === filterStatus);
    if (sortConfig.key) {
      list = [...list].sort((a, b) => {
        let av = a[sortConfig.key] ?? '', bv = b[sortConfig.key] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
        if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [inventoryItems, activeTab, search, filterSource, filterStatus, sortConfig]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const stats = useMemo(() => {
    const src = activeTab === 'logs' ? inventoryItems : inventoryItems.filter(i => i.type === activeTab);
    return {
      total:    src.length,
      inStock:  src.filter(i => getStockStatus(i) === 'in-stock').length,
      lowStock: src.filter(i => getStockStatus(i) === 'low-stock').length,
      outStock: src.filter(i => getStockStatus(i) === 'out-stock').length,
    };
  }, [inventoryItems, activeTab]);

  const tabCounts = useMemo(() => {
    const counts = {};
    INVENTORY_TYPES.forEach(t => { counts[t.key] = inventoryItems.filter(i => i.type === t.key && getStockStatus(i) === 'low-stock').length; });
    return counts;
  }, [inventoryItems]);

  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };

  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ name: item.name, category: item.category || 'Kitchen Supplies', source: item.source || 'Wet Market', type: item.type, quantity: item.quantity, unit: item.unit, reorder_level: item.reorder_level || '', cost_per_unit: item.cost_per_unit || '' });
    } else {
      setEditingItem(null);
      setFormData(emptyForm(activeTab === 'logs' ? 'bar' : activeTab));
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, quantity: parseFloat(formData.quantity) || 0, reorder_level: parseFloat(formData.reorder_level) || 0, cost_per_unit: parseFloat(formData.cost_per_unit) || null };
      const res = editingItem
        ? await apiService.put(API_ENDPOINTS.ADMIN.INVENTORY.UPDATE(editingItem.id), payload)
        : await apiService.post(API_ENDPOINTS.ADMIN.INVENTORY.CREATE, payload);
      if (res.success) { showAlertMsg(editingItem ? 'Item updated!' : 'Item added!'); setShowModal(false); fetchInventoryItems(); }
    } catch (err) { showAlertMsg(err.response?.data?.message || 'Failed to save item', 'danger'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      const res = await apiService.delete(API_ENDPOINTS.ADMIN.INVENTORY.DELETE(id));
      if (res.success) { showAlertMsg('Item deleted.'); fetchInventoryItems(); }
    } catch { showAlertMsg('Failed to delete item', 'danger'); }
  };

  const handleOpenAdjust = (item) => { setAdjustItem(item); setAdjustType('restock'); setAdjustQty(''); setAdjustReason(''); setShowAdjust(true); };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty < 0) return;
    setAdjustSubmitting(true);
    try {
      const res = await apiService.post(API_ENDPOINTS.ADMIN.INVENTORY.ADJUST(adjustItem.id), { quantity: qty, type: adjustType, reason: adjustReason || `${adjustType} by admin` });
      if (res.success) { showAlertMsg('Stock adjusted!'); setShowAdjust(false); setLogsLoaded(false); fetchInventoryItems(); }
    } catch { showAlertMsg('Failed to adjust stock', 'danger'); }
    finally { setAdjustSubmitting(false); }
  };

  const handleOpenLog = async (item) => {
    setLogItem(item); setItemLogs([]); setShowLogModal(true); setLoadingItemLogs(true);
    try {
      let all = inventoryLogs;
      if (!logsLoaded) {
        const res = await apiService.get(API_ENDPOINTS.ADMIN.INVENTORY.LOGS);
        if (res.success) {
          all = res.data.data || res.data;
          setInventoryLogs(Array.isArray(all) ? all : []);
          setLogsLoaded(true);
        }
      }
      setItemLogs((Array.isArray(all) ? all : []).filter(l =>
        Number(l.inventory_item_id ?? l.item?.id) === Number(item.id)
      ));
    } catch {}
    finally { setLoadingItemLogs(false); }
  };

  const emptyBulkRow = () => emptyForm(activeTab === 'logs' ? 'bar' : activeTab);

  const handleOpenBulk = () => { setBulkRows([emptyBulkRow(), emptyBulkRow(), emptyBulkRow()]); setBulkProgress({ done: 0, total: 0, errors: [] }); setShowBulkModal(true); };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const valid = bulkRows.filter(r => r.name.trim() && r.unit.trim());
    if (!valid.length) { showAlertMsg('Fill in at least one row (Name + Unit required).', 'warning'); return; }
    setBulkSubmitting(true);
    setBulkProgress({ done: 0, total: valid.length, errors: [] });
    const errors = [];
    for (let i = 0; i < valid.length; i++) {
      try {
        await apiService.post(API_ENDPOINTS.ADMIN.INVENTORY.CREATE, { ...valid[i], quantity: parseFloat(valid[i].quantity) || 0, reorder_level: parseFloat(valid[i].reorder_level) || 0, cost_per_unit: parseFloat(valid[i].cost_per_unit) || null });
      } catch (err) { errors.push(`Row ${i + 1} (${valid[i].name}): ${err.response?.data?.message || 'Failed'}`); }
      setBulkProgress({ done: i + 1, total: valid.length, errors });
    }
    setBulkSubmitting(false);
    if (!errors.length) { showAlertMsg(`${valid.length} item${valid.length > 1 ? 's' : ''} added!`); setShowBulkModal(false); fetchInventoryItems(); }
    else { showAlertMsg(`${valid.length - errors.length} added, ${errors.length} failed.`, 'warning'); fetchInventoryItems(); }
  };
  return (
    <PageShell
      title="Inventory Management"
      subtitle="Track and manage stock across all supply categories"
      loading={loading}
      headerRight={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="ai-btn ai-btn-secondary" onClick={handleOpenBulk}>
            <FaLayerGroup size={12} /> Bulk Add
          </button>
          <button className="ai-btn ai-btn-primary" onClick={() => handleShowModal()}>
            <FaPlus size={12} /> Add Item
          </button>
        </div>
      }
    >
      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })} className="mb-3" style={{ borderRadius: 10, fontSize: '0.875rem' }}>
          {alert.message}
        </Alert>
      )}

      {!loading && (
        <div className="ai-stats-bar">
          <div className="ai-stat-card">
            <div className="ai-stat-icon blue"><FaBoxes /></div>
            <div><div className="ai-stat-value">{stats.total}</div><div className="ai-stat-label">Total Items</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon green"><FaBoxOpen /></div>
            <div><div className="ai-stat-value">{stats.inStock}</div><div className="ai-stat-label">In Stock</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon amber"><FaBoxes /></div>
            <div><div className="ai-stat-value">{stats.lowStock}</div><div className="ai-stat-label">Low Stock</div></div>
          </div>
          <div className="ai-stat-card">
            <div className="ai-stat-icon red"><FaBoxes /></div>
            <div><div className="ai-stat-value">{stats.outStock}</div><div className="ai-stat-label">Out of Stock</div></div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="ai-cat-tabs">
          {INVENTORY_TYPES.map(t => {
            const Icon = t.icon;
            const low = tabCounts[t.key] || 0;
            return (
              <button key={t.key}
                className={`ai-cat-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => { setActiveTab(t.key); setSearch(''); setFilterSource(''); setFilterStatus(''); setSortConfig({ key: 'source', dir: 'desc' }); }}>
                <Icon size={11} /> {t.label}
                {low > 0 && <span className="ai-tab-count">{low}</span>}
              </button>
            );
          })}
          <button className={`ai-cat-tab${activeTab === 'logs' ? ' active' : ''}`}
            onClick={() => setActiveTab('logs')}>
            <FaHistory size={11} /> Adjustment Logs
          </button>
        </div>
      )}

      {!loading && activeTab !== 'logs' && (
        <div className="ai-toolbar">
          <div className="ai-search-wrap">
            <FaSearch className="ai-search-icon" />
            <input className="ai-search-input" type="search" placeholder="Search items..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="ai-filter-select" value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
            <option value="">All Sources</option>
            <option value="Wet Market">Wet Market</option>
            <option value="Online">Online</option>
          </select>
          <select className="ai-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-stock">Out of Stock</option>
          </select>
          <div className="ai-toolbar-right">
            <span className="ai-count-badge">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {!loading && activeTab !== 'logs' && (
        <div className="ai-table-card">
          <table className="ai-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>Name <SortIcon col="name" sortConfig={sortConfig} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('source')}>Source <SortIcon col="source" sortConfig={sortConfig} /></th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>Quantity <SortIcon col="quantity" sortConfig={sortConfig} /></th>
                <th>Status</th>
                <th style={{ width: 112 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((item, idx) => {
                const status = getStockStatus(item);
                const qty = parseFloat(item.quantity);
                const lvl = parseFloat(item.reorder_level) || 1;
                const barPct = Math.min(100, Math.round((qty / (lvl * 3)) * 100));
                const barCls = status === 'in-stock' ? 'green' : status === 'low-stock' ? 'amber' : 'red';
                return (
                  <tr key={item.id}>
                    <td className="ai-item-id">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      <div className="ai-item-name">{item.name}</div>
                      <div className="ai-item-id" style={{ fontSize: '0.72rem', marginTop: 1 }}>{item.category}</div>
                    </td>
                    <td>
                      <span className={`ai-cat-badge ${item.source === 'Online' ? 'bar' : 'kitchen'}`}>{item.source || '—'}</span>
                    </td>
                    <td>
                      <span className="ai-qty-value">{parseFloat(item.quantity).toFixed(2)}</span>
                      <span className="ai-qty-unit"> {item.unit}</span>
                      <div className="ai-stock-bar-wrap">
                        <div className={`ai-stock-bar ${barCls}`} style={{ width: `${barPct}%` }} />
                      </div>
                    </td>
                    <td><StockBadge item={item} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="ai-action-btn adjust" title="Adjust Stock" onClick={() => handleOpenAdjust(item)}><FaBoxes /></button>
                        <button className="ai-action-btn log" title="View Logs" onClick={() => handleOpenLog(item)}><FaHistory /></button>
                        <button className="ai-action-btn edit" title="Edit" onClick={() => handleShowModal(item)}><FaEdit /></button>
                        <button className="ai-action-btn delete" title="Delete" onClick={() => handleDelete(item.id)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6}>
                  <div className="ai-empty">
                    <div className="ai-empty-icon"><FaBoxOpen /></div>
                    <div className="ai-empty-text">No items found</div>
                    <div className="ai-empty-sub">Try adjusting your search or filters</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="ai-pagination">
              <span className="ai-pagination-info">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredItems.length)}–{Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
              </span>
              <div className="ai-pagination-controls">
                <button className="ai-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><FaChevronLeft /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: '0 4px', color: '#9ca3af' }}>...</span>}
                      <button className={`ai-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    </React.Fragment>
                  ))}
                <button className="ai-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FaChevronRight /></button>
              </div>
            </div>
          )}
        </div>
      )}
      {!loading && activeTab === 'logs' && (
        <div className="ai-table-card">
          {loadingLogs
            ? <div className="ai-empty"><Spinner animation="border" size="sm" style={{ marginRight: 8 }} /> Loading logs...</div>
            : (
              <table className="ai-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Item</th><th>Type</th>
                    <th>Change</th><th>Before</th><th>After</th><th>Reason</th><th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.length > 0 ? inventoryLogs.map((log, i) => {
                    const change = parseFloat(log.change ?? log.adjustment ?? 0);
                    return (
                      <tr key={log.id || i}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '.78rem', color: '#6b7280' }}>
                          {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                        </td>
                        <td><div className="ai-item-name">{log.item?.name || log.inventory_item?.name || '—'}</div></td>
                        <td><span className={`ai-cat-badge ${log.type || 'adjustment'}`} style={{ textTransform: 'capitalize' }}>{log.type || 'adjustment'}</span></td>
                        <td><span className={`ai-log-qty ${change >= 0 ? 'positive' : 'negative'}`}>{change >= 0 ? '+' : ''}{change}</span></td>
                        <td style={{ fontSize: '.8rem' }}>{log.quantity_before ?? log.previous_quantity ?? '—'}</td>
                        <td style={{ fontSize: '.8rem' }}>{log.quantity_after ?? log.new_quantity ?? '—'}</td>
                        <td style={{ fontSize: '.78rem', color: '#4A4A4A' }}>{log.reason || '—'}</td>
                        <td style={{ fontSize: '.78rem', color: '#6b7280' }}>{log.user?.name || log.adjusted_by || '—'}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={8}>
                      <div className="ai-empty">
                        <div className="ai-empty-icon"><FaHistory /></div>
                        <div className="ai-empty-text">No adjustment logs yet</div>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <div className="ai-modal-head">
          <div className="ai-modal-head-left">
            <div className={`ai-modal-icon ${editingItem ? 'slate' : 'green'}`}>
              {editingItem ? <FaEdit /> : <FaPlus />}
            </div>
            <div>
              <div className="ai-modal-title">{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</div>
              <div className="ai-modal-subtitle">{editingItem ? editingItem.name : 'Fill in the details to add a new item'}</div>
            </div>
          </div>
          <button className="ai-modal-close" onClick={() => setShowModal(false)} aria-label="Close">&#x2715;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ai-modal-body">
            <div className="ai-section-label">Item Details</div>
            <div className="ai-form-group">
              <label className="ai-form-label">Item Name *</label>
              <input className="ai-form-input" required placeholder="e.g. Coffee Beans"
                value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="ai-form-row col-type-src" style={{ marginBottom: '1rem' }}>
              <div>
                <label className="ai-form-label">Type *</label>
                <select className="ai-form-input" required value={formData.type}
                  onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                  {INVENTORY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="ai-form-label">Source</label>
                <select className="ai-form-input" value={formData.source}
                  onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}>
                  <option>Wet Market</option>
                  <option>Online</option>
                </select>
              </div>
              <div>
                <label className="ai-form-label">Supply Category</label>
                <select className="ai-form-input" value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                  {SUPPLY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="ai-section-label">Stock Info</div>
            <div className="ai-form-row col-4" style={{ marginBottom: 0 }}>
              <div>
                <label className="ai-form-label">Quantity *</label>
                <input className="ai-form-input" type="number" min="0" step="0.01" required
                  value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="ai-form-label">Unit *</label>
                <input className="ai-form-input" required placeholder="pcs, kg..."
                  value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} />
              </div>
              <div>
                <label className="ai-form-label">Reorder Level *</label>
                <input className="ai-form-input" type="number" min="0" step="0.01" required
                  value={formData.reorder_level} onChange={e => setFormData(p => ({ ...p, reorder_level: e.target.value }))} />
              </div>
              <div>
                <label className="ai-form-label">Cost / Unit <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opt.)</span></label>
                <input className="ai-form-input" type="number" min="0" step="0.01" placeholder="0.00"
                  value={formData.cost_per_unit} onChange={e => setFormData(p => ({ ...p, cost_per_unit: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="ai-modal-footer">
            <button type="button" className="ai-btn ai-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="ai-btn ai-btn-primary">{editingItem ? 'Update Item' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal show={showAdjust} onHide={() => setShowAdjust(false)} centered>
        <div className="ai-modal-head">
          <div className="ai-modal-head-left">
            <div className="ai-modal-icon amber"><FaBoxes /></div>
            <div>
              <div className="ai-modal-title">Adjust Stock</div>
              <div className="ai-modal-subtitle">{adjustItem?.name}</div>
            </div>
          </div>
          <button className="ai-modal-close" onClick={() => setShowAdjust(false)} aria-label="Close">&#x2715;</button>
        </div>
        <form onSubmit={handleAdjustSubmit}>
          <div className="ai-modal-body">
            {adjustItem && (
              <div className="ai-current-stock">
                <div>
                  <div className="ai-current-stock-label">Current Stock</div>
                  <div className="ai-current-stock-value">
                    {parseFloat(adjustItem.quantity).toFixed(2)}
                    <span style={{ fontSize: '.85rem', color: '#6b7280', marginLeft: 4 }}>{adjustItem.unit}</span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}><StockBadge item={adjustItem} /></div>
              </div>
            )}
            <div className="ai-section-label">Adjustment Type</div>
            <div className="ai-adjust-types" style={{ marginBottom: '1.25rem' }}>
              {ADJUST_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button type="button" key={t.key}
                    className={`ai-type-card ${t.cls}${adjustType === t.key ? ' selected' : ''}`}
                    onClick={() => setAdjustType(t.key)}>
                    <div className="ai-type-icon"><Icon /></div>
                    <div className="ai-type-name">{t.label}</div>
                    <div className="ai-type-desc">{t.desc}</div>
                  </button>
                );
              })}
            </div>
            <div className="ai-form-row col-2" style={{ alignItems: 'end' }}>
              <div>
                <label className="ai-form-label">
                  {adjustType === 'restock' ? 'Quantity to Add' : adjustType === 'adjustment' ? 'New Total Quantity' : 'Quantity'} *
                </label>
                <input className="ai-form-input" type="number" min="0" step="0.01" required
                  value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="ai-form-label">Notes <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                <input className="ai-form-input" placeholder="Reason or note..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="ai-modal-footer">
            <button type="button" className="ai-btn ai-btn-secondary" onClick={() => setShowAdjust(false)}>Cancel</button>
            <button type="submit" className="ai-btn ai-btn-primary" disabled={adjustSubmitting}>
              {adjustSubmitting ? <><Spinner animation="border" size="sm" /> Saving...</> : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Item Log Modal */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered>
        <div className="ai-modal-head">
          <div className="ai-modal-head-left">
            <div className="ai-modal-icon slate"><FaHistory /></div>
            <div>
              <div className="ai-modal-title">Stock History</div>
              <div className="ai-modal-subtitle">{logItem?.name}</div>
            </div>
          </div>
          <button className="ai-modal-close" onClick={() => setShowLogModal(false)} aria-label="Close">&#x2715;</button>
        </div>
        <div className="ai-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {loadingItemLogs
            ? <div className="ai-empty"><Spinner animation="border" size="sm" style={{ marginRight: 8 }} /> Loading...</div>
            : itemLogs.length > 0
              ? (
                <ul className="ai-log-list">
                  {itemLogs.map((log, i) => {
                    const change = parseFloat(log.change ?? log.adjustment ?? 0);
                    return (
                      <li key={log.id || i} className="ai-log-item">
                        <div className={`ai-log-dot ${log.type || 'adjustment'}`}>
                          {change >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <div className="ai-log-type" style={{ textTransform: 'capitalize' }}>{log.type || 'adjustment'}</div>
                            <div className={`ai-log-qty ${change >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '.85rem', fontWeight: 700 }}>
                              {change >= 0 ? '+' : ''}{change}
                            </div>
                          </div>
                          {log.quantity_before != null && (
                            <div style={{ fontSize: '.72rem', color: '#9ca3af' }}>{log.quantity_before} → {log.quantity_after}</div>
                          )}
                          {log.reason && <div className="ai-log-notes">{log.reason}</div>}
                          <div className="ai-log-meta">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                            {log.user?.name ? ` · ${log.user.name}` : ''}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
              : <div className="ai-empty"><div className="ai-empty-icon"><FaHistory /></div><div className="ai-empty-text">No logs yet for this item</div></div>
          }
        </div>
        <div className="ai-modal-footer">
          <button className="ai-btn ai-btn-secondary" onClick={() => setShowLogModal(false)}>Close</button>
        </div>
      </Modal>

      {/* Bulk Add Modal */}
      <Modal show={showBulkModal} onHide={() => { if (!bulkSubmitting) setShowBulkModal(false); }}
        size="xl" centered backdrop={bulkSubmitting ? 'static' : true}>
        <div className="ai-modal-head">
          <div className="ai-modal-head-left">
            <div className="ai-modal-icon green"><FaLayerGroup /></div>
            <div>
              <div className="ai-modal-title">Bulk Add Items</div>
              <div className="ai-modal-subtitle">Name and Unit are required per row</div>
            </div>
          </div>
          {!bulkSubmitting && <button className="ai-modal-close" onClick={() => setShowBulkModal(false)} aria-label="Close">&#x2715;</button>}
        </div>
        <form onSubmit={handleBulkSubmit}>
          <div className="ai-modal-body" style={{ padding: '1rem 1.5rem' }}>
            {bulkProgress.total > 0 && (
              <div className="ai-bulk-progress">
                <div className="ai-bulk-progress-header">
                  <span>Adding items...</span>
                  <span>{bulkProgress.done} / {bulkProgress.total}</span>
                </div>
                <ProgressBar now={(bulkProgress.done / bulkProgress.total) * 100}
                  variant={bulkProgress.errors.length ? 'warning' : 'success'}
                  animated={bulkSubmitting} style={{ height: 6, borderRadius: 99 }} />
                {bulkProgress.errors.length > 0 && (
                  <ul className="ai-bulk-errors">
                    {bulkProgress.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
            <div style={{ overflowX: 'auto', maxHeight: '50vh', overflowY: 'auto' }}>
              <table className="ai-table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th style={{ minWidth: 160 }}>Name *</th>
                    <th style={{ minWidth: 130 }}>Type</th>
                    <th style={{ minWidth: 150 }}>Category</th>
                    <th style={{ minWidth: 110 }}>Source</th>
                    <th style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 75 }}>Unit *</th>
                    <th style={{ width: 90 }}>Reorder</th>
                    <th style={{ width: 90 }}>Cost/Unit</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="ai-item-id" style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td><input className="ai-form-input ai-bulk-input"
                        value={row.name} placeholder="Item name" onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, name: e.target.value } : r))} /></td>
                      <td><select className="ai-form-input ai-bulk-input"
                        value={row.type} onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, type: e.target.value } : r))}>
                        {INVENTORY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select></td>
                      <td><select className="ai-form-input ai-bulk-input"
                        value={row.category} onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, category: e.target.value } : r))}>
                        {SUPPLY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select></td>
                      <td><select className="ai-form-input ai-bulk-input"
                        value={row.source} onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, source: e.target.value } : r))}>
                        <option>Wet Market</option><option>Online</option>
                      </select></td>
                      <td><input className="ai-form-input ai-bulk-input"
                        type="number" min="0" step="0.01" value={row.quantity} placeholder="0"
                        onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))} /></td>
                      <td><input className="ai-form-input ai-bulk-input"
                        value={row.unit} placeholder="pcs"
                        onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r))} /></td>
                      <td><input className="ai-form-input ai-bulk-input"
                        type="number" min="0" step="0.01" value={row.reorder_level} placeholder="0"
                        onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, reorder_level: e.target.value } : r))} /></td>
                      <td><input className="ai-form-input ai-bulk-input"
                        type="number" min="0" step="0.01" value={row.cost_per_unit} placeholder="0.00"
                        onChange={e => setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, cost_per_unit: e.target.value } : r))} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="ai-action-btn delete"
                          disabled={bulkRows.length === 1 || bulkSubmitting}
                          onClick={() => setBulkRows(prev => prev.filter((_, i) => i !== idx))}>
                          <FaTimesCircle />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="ai-btn ai-btn-secondary ai-btn-sm" style={{ marginTop: '.75rem' }}
              disabled={bulkSubmitting} onClick={() => setBulkRows(prev => [...prev, emptyBulkRow()])}>
              <FaPlus size={10} /> Add Row
            </button>
          </div>
          <div className="ai-modal-footer space-between">
            <span className="ai-count-badge">
              {bulkRows.filter(r => r.name.trim() && r.unit.trim()).length} of {bulkRows.length} rows ready
            </span>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="button" className="ai-btn ai-btn-secondary" disabled={bulkSubmitting} onClick={() => setShowBulkModal(false)}>Cancel</button>
              <button type="submit" className="ai-btn ai-btn-primary" disabled={bulkSubmitting}>
                {bulkSubmitting ? <><Spinner animation="border" size="sm" /> Saving...</> : <><FaPlus size={11} /> Submit All</>}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default AdminInventory;