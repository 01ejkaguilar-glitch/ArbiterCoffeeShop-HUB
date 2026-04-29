import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaBox, FaExclamationTriangle, FaPlus, FaMinus,
  FaSearch, FaSave, FaSync, FaSpinner,
  FaCheckCircle, FaTimes,
  FaCoffee, FaUtensils, FaCookieBite, FaSnowflake, FaSprayCan, FaPencilAlt,
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../common/NotificationSystem';
import './EmployeeInventory.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';

/* ── Default Constants (Barista) ──────────────────────────── */
export const BARISTA_INVENTORY_TYPES = [
  { key: 'bar',        label: 'Bar',         icon: FaCoffee    },
  { key: 'kitchen',    label: 'Kitchen',     icon: FaUtensils  },
  { key: 'baking',     label: 'Baking',      icon: FaCookieBite },
  { key: 'deli',       label: 'Deli Frozen', icon: FaSnowflake },
  { key: 'packaging',  label: 'Packaging',   icon: FaBox       },
  { key: 'cleaning',   label: 'Cleaning',    icon: FaSprayCan  },
  { key: 'stationery', label: 'Stationery',  icon: FaPencilAlt },
];

export const KITCHEN_INVENTORY_TYPES = [
  { key: 'kitchen',    label: 'Kitchen',     icon: FaUtensils  },
  { key: 'baking',     label: 'Baking',      icon: FaCookieBite },
  { key: 'deli',       label: 'Deli Frozen', icon: FaSnowflake },
  { key: 'packaging',  label: 'Packaging',   icon: FaBox       },
  { key: 'cleaning',   label: 'Cleaning',    icon: FaSprayCan  },
  { key: 'stationery', label: 'Stationery',  icon: FaPencilAlt },
];

const STATUS_FILTERS = [
  { key: 'all',           label: 'All Status'   },
  { key: 'in_stock',      label: 'In Stock'     },
  { key: 'low_stock',     label: 'Low Stock'    },
  { key: 'out_of_stock',  label: 'Out of Stock' },
];

/** Default endpoints (barista WORKFORCE API) */
const defaultEndpoints = {
  inventory: () => apiService.get(API_ENDPOINTS.WORKFORCE.INVENTORY, { per_page: 200 }),
  adjust: (itemId, payload) => apiService.post(API_ENDPOINTS.WORKFORCE.INVENTORY_ADJUST(itemId), payload),
};

/** Default payload builder — delta-based (barista style) */
const defaultBuildPayload = (item, newQty, delta) => ({
  type:     delta > 0 ? 'restock' : 'usage',
  quantity: Math.abs(delta),
  notes:    'Checklist update',
});

/* ── Helpers ─────────────────────────────────────────────── */
const getStockInfo = (item, currentQty) => {
  const qty = currentQty ?? parseFloat(item.quantity);
  const reorder = parseFloat(item.reorder_level);
  if (qty <= 0)       return { cls: 'out', label: 'Out of Stock', barPct: 0 };
  if (qty <= reorder) return { cls: 'low', label: 'Low Stock',    barPct: Math.max(10, (qty / Math.max(reorder * 2, 1)) * 100) };
  const cap = Math.max(reorder * 3, qty * 1.2, 1);
  return { cls: 'in', label: 'In Stock', barPct: Math.min(100, (qty / cap) * 100) };
};

/* ════════════════════════════════════════════════════════════
   Main shared component
   ════════════════════════════════════════════════════════════ */
const EmployeeInventory = ({
  theme           = DEFAULT_THEME,
  inventoryTypes  = BARISTA_INVENTORY_TYPES,
  defaultTab,                            // falls back to first type in inventoryTypes
  title           = 'Inventory Checklist',
  subtitle        = 'Monitor and update stock levels',
  endpoints       = defaultEndpoints,
  buildAdjustPayload = defaultBuildPayload,
}) => {
  const t = { ...DEFAULT_THEME, ...theme };
  const firstTab = defaultTab ?? inventoryTypes[0]?.key ?? 'kitchen';

  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();

  const [inventory, setInventory]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [changes, setChanges]       = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab]   = useState(firstTab);
  const [statusFilter, setStatusFilter] = useState('all');

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchInventory = useCallback(async (quiet = false) => {
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      const res = await endpoints.inventory();
      const paginator = res.data?.data ?? res.data;
      const list = Array.isArray(paginator?.data)
        ? paginator.data
        : Array.isArray(paginator) ? paginator : [];
      setInventory(list);
      setChanges({});
    } catch {
      showErrorNotification('Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoints, showErrorNotification]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return inventory.filter(item => {
      const qty = changes[item.id] !== undefined ? changes[item.id] : parseFloat(item.quantity);
      const reorder = parseFloat(item.reorder_level);
      if (item.type !== activeTab) return false;
      if (statusFilter === 'in_stock'     && !(qty > reorder))             return false;
      if (statusFilter === 'low_stock'    && !(qty <= reorder && qty > 0)) return false;
      if (statusFilter === 'out_of_stock' && qty > 0)                      return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [inventory, changes, activeTab, statusFilter, searchTerm]);

  /* ── Stats (per active tab) ────────────────────────────── */
  const stats = useMemo(() => {
    const src = inventory.filter(i => i.type === activeTab);
    let inStock = 0, lowStock = 0, outOfStock = 0;
    src.forEach(item => {
      const qty = parseFloat(item.quantity);
      const reorder = parseFloat(item.reorder_level);
      if (qty <= 0)            outOfStock++;
      else if (qty <= reorder) lowStock++;
      else                     inStock++;
    });
    return { total: src.length, inStock, lowStock, outOfStock };
  }, [inventory, activeTab]);

  /* ── Tab alert counts ──────────────────────────────────── */
  const tabCounts = useMemo(() => {
    const counts = {};
    inventoryTypes.forEach(type => {
      counts[type.key] = inventory.filter(i => {
        if (i.type !== type.key) return false;
        const qty = parseFloat(i.quantity);
        const reorder = parseFloat(i.reorder_level);
        return qty <= reorder;
      }).length;
    });
    return counts;
  }, [inventory, inventoryTypes]);

  /* ── Change handlers ────────────────────────────────────── */
  const setQty = useCallback((itemId, value) => {
    const qty = Math.max(0, parseFloat(value) || 0);
    setChanges(prev => ({ ...prev, [itemId]: qty }));
  }, []);

  const adjustQty = useCallback((itemId, delta) => {
    setChanges(prev => {
      const item = inventory.find(i => i.id === itemId);
      const cur = prev[itemId] !== undefined ? prev[itemId] : parseFloat(item?.quantity ?? 0);
      return { ...prev, [itemId]: Math.max(0, cur + delta) };
    });
  }, [inventory]);

  const discardItemChange = useCallback((itemId) => {
    setChanges(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  /* ── Save all changes ───────────────────────────────────── */
  const saveChanges = useCallback(async () => {
    const entries = Object.entries(changes);
    if (!entries.length) return;
    setSaving(true);
    try {
      const adjustCalls = entries.flatMap(([itemId, newQty]) => {
        const item = inventory.find(i => i.id === Number(itemId));
        if (!item) return [];
        const oldQty = parseFloat(item.quantity);
        const delta  = newQty - oldQty;
        if (Math.abs(delta) < 0.001) return [];
        const payload = buildAdjustPayload(item, newQty, delta);
        return [endpoints.adjust(itemId, payload)];
      });

      if (!adjustCalls.length) {
        showSuccessNotification('No quantity changes detected');
        setChanges({});
        setSaving(false);
        return;
      }

      await Promise.all(adjustCalls);
      showSuccessNotification(`Inventory updated — ${adjustCalls.length} item(s) adjusted`);
      await fetchInventory(true);
    } catch (err) {
      showErrorNotification(err?.response?.data?.message || 'Failed to save inventory changes');
    } finally {
      setSaving(false);
    }
  }, [changes, inventory, endpoints, buildAdjustPayload, fetchInventory,
      showSuccessNotification, showErrorNotification]);

  const hasChanges = Object.keys(changes).length > 0;

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ic-page">
        <div className="ic-spinner-wrap">
          <FaSpinner className="ic-spin" size={28} style={{ color: t.primary }} />
          <span>Loading inventory…</span>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div
      className="ic-page"
      style={{ '--wf-primary': t.primary, '--wf-tint': t.tint, '--wf-tint-border': t.tintBorder }}
    >
      {/* Top bar */}
      <div className="ic-topbar">
        <div>
          <h1 className="ic-title">{title}</h1>
          <p className="ic-subtitle">{subtitle}</p>
        </div>
        <div className="ic-topbar-actions">
          <button className="ic-btn ghost" onClick={() => fetchInventory(true)} disabled={refreshing || saving}>
            <FaSync className={refreshing ? 'ic-spin' : ''} size={12} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {hasChanges && (
            <button className="ic-btn primary" onClick={saveChanges} disabled={saving}>
              {saving
                ? <><FaSpinner className="ic-spin" size={12} /> Saving…</>
                : <><FaSave size={12} /> Save Changes ({Object.keys(changes).length})</>}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ic-stats">
        <div className="ic-stat-card">
          <div className="ic-stat-icon blue"><FaBox /></div>
          <div><p className="ic-stat-label">Total Items</p><p className="ic-stat-value">{stats.total}</p></div>
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-icon green"><FaCheckCircle /></div>
          <div><p className="ic-stat-label">In Stock</p><p className="ic-stat-value">{stats.inStock}</p></div>
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-icon amber"><FaExclamationTriangle /></div>
          <div><p className="ic-stat-label">Low Stock</p><p className="ic-stat-value amber">{stats.lowStock}</p></div>
        </div>
        <div className="ic-stat-card">
          <div className="ic-stat-icon red"><FaTimes /></div>
          <div><p className="ic-stat-label">Out of Stock</p><p className="ic-stat-value red">{stats.outOfStock}</p></div>
        </div>
      </div>

      {/* Unsaved banner */}
      {hasChanges && (
        <div className="ic-banner">
          <FaExclamationTriangle size={13} />
          {Object.keys(changes).length} item{Object.keys(changes).length !== 1 ? 's' : ''} with
          unsaved changes — click <strong>Save Changes</strong> to update stock.
        </div>
      )}

      {/* Category Tabs */}
      <div className="ic-cat-tabs">
        {inventoryTypes.map(type => {
          const Icon = type.icon;
          const alertCount = tabCounts[type.key] || 0;
          return (
            <button
              key={type.key}
              className={`ic-cat-tab${activeTab === type.key ? ' active' : ''}`}
              onClick={() => { setActiveTab(type.key); setSearchTerm(''); setStatusFilter('all'); }}
            >
              <Icon size={11} /> {type.label}
              {alertCount > 0 && <span className="ic-tab-count">{alertCount}</span>}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="ic-toolbar">
        <div className="ic-search-wrap">
          <FaSearch className="ic-search-icon" size={13} />
          <input
            className="ic-search-input"
            type="text"
            placeholder="Search items…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="ic-status-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <span className="ic-count-badge">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="ic-empty">
          <FaBox size={40} />
          <p>{searchTerm || statusFilter !== 'all' ? 'No items match your filters.' : 'No inventory items found.'}</p>
        </div>
      ) : (
        <div className="ic-grid">
          {filtered.map(item => {
            const currentQty   = changes[item.id] !== undefined ? changes[item.id] : parseFloat(item.quantity);
            const originalQty  = parseFloat(item.quantity);
            const stockInfo    = getStockInfo(item, currentQty);
            const hasChange    = changes[item.id] !== undefined;
            const delta        = currentQty - originalQty;

            return (
              <div
                key={item.id}
                className={[
                  'ic-card',
                  hasChange ? 'changed' : '',
                  !hasChange && stockInfo.cls === 'low' ? 'low' : '',
                  !hasChange && stockInfo.cls === 'out' ? 'out' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Head */}
                <div className="ic-card-head">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="ic-item-name">{item.name}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.25rem' }}>
                    <span className={`ic-type-badge ${item.type}`}>{item.type}</span>
                    <span className={`ic-status ${stockInfo.cls}`}>{stockInfo.label}</span>
                  </div>
                </div>

                {/* Stock bar */}
                <div className="ic-stock-section">
                  <div className="ic-stock-meta">
                    <span className={`ic-stock-qty${hasChange ? ' changed' : ''}`}>
                      {currentQty % 1 === 0 ? currentQty : currentQty.toFixed(1)} {item.unit}
                    </span>
                    <span className="ic-reorder-label">reorder ≤ {item.reorder_level} {item.unit}</span>
                  </div>
                  <div className="ic-stock-bar-track">
                    <div className={`ic-stock-bar-fill ${stockInfo.cls}`} style={{ width: `${stockInfo.barPct}%` }} />
                  </div>
                  {hasChange && (
                    <div className={`ic-delta${delta > 0 ? ' pos' : delta < 0 ? ' neg' : ''}`}>
                      {delta > 0 ? '+' : ''}{delta % 1 === 0 ? delta : delta.toFixed(1)} {item.unit} from original
                    </div>
                  )}
                </div>

                {/* Adjust controls */}
                <div className="ic-adjust-row">
                  <button className="ic-adj-btn" onClick={() => adjustQty(item.id, -1)} title="Decrease by 1">
                    <FaMinus size={10} />
                  </button>
                  <input
                    className="ic-num-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={currentQty}
                    onChange={e => setQty(item.id, e.target.value)}
                  />
                  <button className="ic-adj-btn" onClick={() => adjustQty(item.id, 1)} title="Increase by 1">
                    <FaPlus size={10} />
                  </button>
                  <span className="ic-unit-label">{item.unit}</span>
                  {hasChange && (
                    <button className="ic-btn ghost sm" onClick={() => discardItemChange(item.id)}
                      title="Discard change" style={{ marginLeft: 'auto' }}>
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>

                {/* Cost */}
                {item.cost_per_unit && (
                  <p className="ic-cost">₱{parseFloat(item.cost_per_unit).toFixed(2)} / {item.unit}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeInventory;
