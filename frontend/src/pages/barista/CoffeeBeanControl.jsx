import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaCoffee, FaEdit, FaSearch, FaStar, FaRegStar,
  FaExclamationTriangle, FaCalendarAlt, FaClock,
  FaPlus, FaMapMarkerAlt, FaSync, FaArchive,
  FaTimes, FaSpinner, FaLeaf,
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../../config/api';
import apiService from '../../services/api.service';
import { useNotificationSystem } from '../../components/common/NotificationSystem';
import './CoffeeBeanControl.css';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const normalise = (responseData) => {
  const d = responseData?.data ?? responseData;
  return Array.isArray(d) ? d : [];
};

const getStockStatus = (qty) => {
  const q = parseFloat(qty) || 0;
  if (q <= 0)  return { cls: 'out',    label: 'Out of Stock', barPct: 2 };
  if (q < 5)   return { cls: 'low',    label: 'Low Stock',    barPct: Math.min((q / 5) * 30, 30) };
  if (q < 20)  return { cls: 'medium', label: 'Medium',       barPct: Math.min(30 + ((q - 5) / 15) * 35, 65) };
  return               { cls: 'good',  label: 'Good Stock',   barPct: Math.min(65 + ((q - 20) / 80) * 35, 100) };
};

const todayStr = () => new Date().toISOString().split('T')[0];

const EMPTY_BEAN_FORM = {
  name: '', origin_country: '', region: '', elevation: '',
  processing_method: '', variety: '', tasting_notes: '',
  producer: '', stock_quantity: 0, is_featured: false,
};

const EMPTY_FEATURED_FORM = {
  coffee_bean_id: '', feature_date: todayStr(),
  start_time: '08:00', end_time: '18:00',
  special_notes: '', promotion_text: '', is_active: true,
};

// â”€â”€ Modal wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Modal = ({ show, onClose, children, size = '' }) => {
  useEffect(() => {
    if (!show) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="cbc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`cbc-dialog ${size}`}>{children}</div>
    </div>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const CoffeeBeanControl = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  // â”€â”€ Bean state â”€â”€
  const [beans, setBeans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // â”€â”€ Stock modal â”€â”€
  const [showStockModal, setShowStockModal]   = useState(false);
  const [selectedBean, setSelectedBean]       = useState(null);
  const [newStock, setNewStock]               = useState('');
  const [updatingStock, setUpdatingStock]     = useState(false);

  // â”€â”€ Add bean modal â”€â”€
  const [showAddModal, setShowAddModal]       = useState(false);
  const [addingBean, setAddingBean]           = useState(false);
  const [selectedImage, setSelectedImage]     = useState(null);
  const [imagePreview, setImagePreview]       = useState(null);
  const [newBeanForm, setNewBeanForm]         = useState(EMPTY_BEAN_FORM);
  const fileInputRef = useRef(null);

  // â”€â”€ Archive modal â”€â”€
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [beanToArchive, setBeanToArchive]       = useState(null);
  const [archiving, setArchiving]               = useState(false);

  // â”€â”€ Featured state â”€â”€
  const [featuredOrigins, setFeaturedOrigins]   = useState([]);
  const [todaysFeatured, setTodaysFeatured]     = useState(null);
  const [availableBeans, setAvailableBeans]     = useState([]);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [featuredForm, setFeaturedForm]           = useState(EMPTY_FEATURED_FORM);
  const [creatingFeatured, setCreatingFeatured]   = useState(false);

  const { showSuccessNotification, showErrorNotification } = useNotificationSystem();

  // â”€â”€ Fetchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchCoffeeBeans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.BARISTA.COFFEE_BEANS.LIST);
      setBeans(normalise(res.data));
    } catch {
      showErrorNotification('Failed to load coffee beans');
      setBeans([]);
    } finally {
      setLoading(false);
    }
  }, [showErrorNotification]);

  const fetchFeaturedOrigins = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.LIST);
      setFeaturedOrigins(normalise(res.data));
    } catch {
      setFeaturedOrigins([]);
    }
  }, []);

  const fetchTodaysFeatured = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.TODAY);
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        setTodaysFeatured(data[0]);
      } else if (data && !Array.isArray(data) && data.id) {
        setTodaysFeatured(data);
      } else {
        setTodaysFeatured(null);
      }
    } catch {
      setTodaysFeatured(null);
    }
  }, []);

  const fetchAvailableBeans = useCallback(async () => {
    try {
      const res = await apiService.get(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.AVAILABLE_BEANS);
      setAvailableBeans(normalise(res.data));
    } catch {
      setAvailableBeans([]);
    }
  }, []);

  useEffect(() => {
    fetchCoffeeBeans();
    fetchFeaturedOrigins();
    fetchTodaysFeatured();
    fetchAvailableBeans();
  }, [fetchCoffeeBeans, fetchFeaturedOrigins, fetchTodaysFeatured, fetchAvailableBeans]);

  const handleRefreshAll = useCallback(() => {
    fetchCoffeeBeans();
    fetchFeaturedOrigins();
    fetchTodaysFeatured();
    fetchAvailableBeans();
  }, [fetchCoffeeBeans, fetchFeaturedOrigins, fetchTodaysFeatured, fetchAvailableBeans]);

  // â”€â”€ Stock update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateBeanStock = useCallback(async () => {
    if (!selectedBean || newStock === '') return;
    try {
      setUpdatingStock(true);
      await apiService.put(API_ENDPOINTS.BARISTA.COFFEE_BEANS.UPDATE_STOCK(selectedBean.id), {
        stock_quantity: parseFloat(newStock),
      });
      setBeans(prev => prev.map(b =>
        b.id === selectedBean.id ? { ...b, stock_quantity: parseFloat(newStock) } : b
      ));
      showSuccessNotification(`Stock updated for ${selectedBean.name}`);
      setShowStockModal(false);
      setSelectedBean(null);
      setNewStock('');
    } catch {
      showErrorNotification('Failed to update stock');
    } finally {
      setUpdatingStock(false);
    }
  }, [selectedBean, newStock, showSuccessNotification, showErrorNotification]);

  // â”€â”€ Image handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  // â”€â”€ Add bean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addCoffeeBean = useCallback(async () => {
    try {
      setAddingBean(true);
      const fd = new FormData();
      Object.entries(newBeanForm).forEach(([k, v]) => {
        fd.append(k, k === 'is_featured' ? (v ? '1' : '0') : v);
      });
      if (selectedImage) fd.append('image', selectedImage);
      const res = await apiService.post(API_ENDPOINTS.BARISTA.COFFEE_BEANS.CREATE, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBeans(prev => [...prev, res.data?.data ?? res.data]);
      showSuccessNotification(`"${newBeanForm.name}" added successfully`);
      setShowAddModal(false);
      setNewBeanForm(EMPTY_BEAN_FORM);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      showErrorNotification(err.response?.data?.message || 'Failed to add coffee bean');
    } finally {
      setAddingBean(false);
    }
  }, [newBeanForm, selectedImage, showSuccessNotification, showErrorNotification]);

  // â”€â”€ Archive bean â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const archiveCoffeeBean = useCallback(async () => {
    if (!beanToArchive) return;
    try {
      setArchiving(true);
      await apiService.delete(API_ENDPOINTS.BARISTA.COFFEE_BEANS.ARCHIVE(beanToArchive.id));
      setBeans(prev => prev.filter(b => b.id !== beanToArchive.id));
      showSuccessNotification(`"${beanToArchive.name}" archived successfully`);
      setShowArchiveModal(false);
      setBeanToArchive(null);
    } catch {
      showErrorNotification('Failed to archive coffee bean');
    } finally {
      setArchiving(false);
    }
  }, [beanToArchive, showSuccessNotification, showErrorNotification]);

  // â”€â”€ Create featured origin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const createFeaturedOrigin = useCallback(async () => {
    try {
      setCreatingFeatured(true);
      await apiService.post(API_ENDPOINTS.BARISTA.FEATURED_ORIGINS.CREATE, featuredForm);
      showSuccessNotification('Featured origin created successfully');
      setShowFeaturedModal(false);
      setFeaturedForm(EMPTY_FEATURED_FORM);
      fetchFeaturedOrigins();
      fetchTodaysFeatured();
    } catch (err) {
      showErrorNotification(err.response?.data?.message || 'Failed to create featured origin');
    } finally {
      setCreatingFeatured(false);
    }
  }, [featuredForm, showSuccessNotification, showErrorNotification, fetchFeaturedOrigins, fetchTodaysFeatured]);

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = beans.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.origin_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // â”€â”€ Renders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderInventory = () => (
    <>
      {/* Search + Add */}
      <div className="cbc-search-row">
        <div className="cbc-search-wrap">
          <FaSearch className="cbc-search-icon" size={13} />
          <input
            className="cbc-search-input"
            type="text"
            placeholder="Search by name, origin or region…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="cbc-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
              <FaTimes size={10} />
            </button>
          )}
        </div>
        <button className="cbc-btn success" onClick={() => setShowAddModal(true)}>
          <FaPlus size={12} />
          Add Bean
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="cbc-empty">
          <FaSpinner className="cbc-spin" size={32} />
          <p style={{ marginTop: '.75rem', color: '#9ca3af' }}>Loading coffee beans…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cbc-empty">
          <FaCoffee />
          <h3>No coffee beans found</h3>
          <p>{searchTerm ? 'Try different search terms.' : 'Add your first coffee bean to get started.'}</p>
        </div>
      ) : (
        <div className="cbc-bean-grid">
          {filtered.map(bean => {
            const st = getStockStatus(bean.stock_quantity);
            return (
              <div className="cbc-bean-card" key={bean.id}>
                {/* Image */}
                <div className="cbc-bean-img-wrap">
                  {bean.image_url ? (
                    <img className="cbc-bean-img" src={bean.image_url} alt={bean.name} loading="lazy" />
                  ) : (
                    <div className="cbc-bean-img-placeholder"><FaCoffee /></div>
                  )}
                  {bean.is_featured && (
                    <span className="cbc-bean-featured-tag"><FaStar size={10} /> Featured</span>
                  )}
                  <span className={`cbc-bean-stock-tag ${st.cls}`}>{st.label}</span>
                </div>

                {/* Body */}
                <div className="cbc-bean-body">
                  <p className="cbc-bean-name">{bean.name}</p>
                  <p className="cbc-bean-origin">
                    <FaMapMarkerAlt size={11} />
                    {[bean.origin_country, bean.region].filter(Boolean).join(' • ')}
                  </p>

                  <div className="cbc-bean-details">
                    {bean.elevation && (
                      <div className="cbc-detail-row">
                        <span className="cbc-detail-label">Elevation</span>
                        <span className="cbc-detail-value">{bean.elevation}</span>
                      </div>
                    )}
                    {bean.processing_method && (
                      <div className="cbc-detail-row">
                        <span className="cbc-detail-label">Process</span>
                        <span className="cbc-detail-value">{bean.processing_method}</span>
                      </div>
                    )}
                    {bean.variety && (
                      <div className="cbc-detail-row">
                        <span className="cbc-detail-label">Variety</span>
                        <span className="cbc-detail-value">{bean.variety}</span>
                      </div>
                    )}
                    {bean.producer && (
                      <div className="cbc-detail-row">
                        <span className="cbc-detail-label">Producer</span>
                        <span className="cbc-detail-value">{bean.producer}</span>
                      </div>
                    )}
                  </div>

                  {bean.tasting_notes && (
                    <p className="cbc-bean-notes">{bean.tasting_notes}</p>
                  )}

                  <div className="cbc-stock-section">
                    <div className="cbc-stock-bar-wrap">
                      <div
                        className={`cbc-stock-bar-fill ${st.cls}`}
                        style={{ width: `${st.barPct}%` }}
                      />
                    </div>
                    <span className="cbc-stock-qty">{parseFloat(bean.stock_quantity || 0).toFixed(1)} kg</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="cbc-bean-footer">
                  <button
                    className="cbc-btn primary sm"
                    onClick={() => {
                      setSelectedBean(bean);
                      setNewStock(String(bean.stock_quantity));
                      setShowStockModal(true);
                    }}
                  >
                    <FaEdit size={11} /> Update Stock
                  </button>
                  <button
                    className="cbc-btn danger sm"
                    onClick={() => { setBeanToArchive(bean); setShowArchiveModal(true); }}
                  >
                    <FaArchive size={11} /> Archive
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderFeatured = () => (
    <>
      {/* Today's hero */}
      <div className="cbc-hero">
        <div className="cbc-hero-head">
          <FaStar />
          <h2>Today's Featured Origin</h2>
        </div>
        {todaysFeatured ? (
          <div className="cbc-hero-body">
            <div className="cbc-hero-info">
              <p className="cbc-hero-bean-name">{todaysFeatured.coffeeBean?.name}</p>
              <p className="cbc-hero-meta">
                <FaMapMarkerAlt style={{ marginRight: '.3rem', color: '#9B6B00' }} />
                {[todaysFeatured.coffeeBean?.origin_country, todaysFeatured.coffeeBean?.region]
                  .filter(Boolean).join(' • ')}
              </p>
              {todaysFeatured.coffeeBean?.tasting_notes && (
                <p style={{ fontSize: '.82rem', color: '#6b7280', marginBottom: '.65rem' }}>
                  <em>{todaysFeatured.coffeeBean.tasting_notes}</em>
                </p>
              )}
              {todaysFeatured.promotion_text && (
                <div className="cbc-hero-promo">
                  <strong>Promotion:</strong> {todaysFeatured.promotion_text}
                </div>
              )}
              {todaysFeatured.special_notes && (
                <p className="cbc-hero-notes"><strong>Notes:</strong> {todaysFeatured.special_notes}</p>
              )}
              {todaysFeatured._isScheduled && (
                <p style={{ fontSize: '.78rem', color: '#9B6B00', marginTop: '.5rem' }}>
                  <FaClock style={{ marginRight: '.3rem' }} />
                  Scheduled "” activates at {todaysFeatured.start_time}
                </p>
              )}
            </div>
            <div className="cbc-hero-aside">
              <span className={`cbc-status-chip ${todaysFeatured._isScheduled ? 'scheduled' : (todaysFeatured.is_active ? 'active' : 'inactive')}`}>
                {todaysFeatured._isScheduled ? 'Scheduled' : (todaysFeatured.is_active ? 'Active Now' : 'Inactive')}
              </span>
              {(todaysFeatured.start_time || todaysFeatured.end_time) && (
                <span className="cbc-time-chip">
                  <FaClock size={11} />
                  {todaysFeatured.start_time} "“ {todaysFeatured.end_time}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="cbc-hero-empty">
            <FaRegStar />
            <h4>No featured origin for today</h4>
            <p>Set a featured coffee bean origin to highlight for customers.</p>
          </div>
        )}
      </div>

      {/* Manage section */}
      <div className="cbc-section-head">
        <h3 className="cbc-section-title">
          <FaLeaf style={{ color: 'var(--color-dark-green)', marginRight: '.4rem' }} />
          Scheduled Featured Origins
        </h3>
        <button className="cbc-btn amber" onClick={() => setShowFeaturedModal(true)}>
          <FaStar size={12} /> Set Featured Origin
        </button>
      </div>

      {featuredOrigins.length === 0 ? (
        <div className="cbc-empty">
          <FaRegStar />
          <h3>No featured origins scheduled</h3>
          <p>Create your first featured origin to highlight special coffee beans.</p>
        </div>
      ) : (
        <div className="cbc-featured-grid">
          {featuredOrigins.map(f => (
            <div className="cbc-featured-card" key={f.id}>
              <div className="cbc-featured-card-head">
                <div>
                  <p className="cbc-featured-card-name">{f.coffeeBean?.name}</p>
                  <span className="cbc-featured-card-date">
                    <FaCalendarAlt size={10} />
                    {f.feature_date ? new Date(f.feature_date).toLocaleDateString() : '"”'}
                  </span>
                </div>
                <span className={`cbc-status-chip ${f.is_active ? 'active' : 'inactive'}`}>
                  {f.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="cbc-featured-card-body">
                <p>
                  <FaMapMarkerAlt style={{ color: '#9B6B00', marginRight: '.3rem' }} />
                  {[f.coffeeBean?.origin_country, f.coffeeBean?.region].filter(Boolean).join(' • ')}
                </p>
                {f.start_time && f.end_time && (
                  <p>
                    <FaClock style={{ marginRight: '.3rem', color: '#6b7280' }} />
                    {f.start_time} "“ {f.end_time}
                  </p>
                )}
                {f.promotion_text && (
                  <div className="cbc-featured-promo">{f.promotion_text}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // â”€â”€ Main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="cbc-page">

      {/* Top bar */}
      <div className="cbc-topbar">
        <div>
          <h1 className="cbc-title"><FaCoffee /> Coffee Bean Control</h1>
          <p className="cbc-subtitle">Manage inventory, stock levels, and featured origins</p>
        </div>
        <div className="cbc-topbar-actions">
          <button className="cbc-btn secondary" onClick={handleRefreshAll}>
            <FaSync size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cbc-tabs">
        <button
          className={`cbc-tab-btn${activeTab === 'inventory' ? ' active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <FaCoffee size={13} /> Bean Inventory
          <span className="cbc-tab-count">{beans.length}</span>
        </button>
        <button
          className={`cbc-tab-btn${activeTab === 'featured' ? ' active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          <FaStar size={13} /> Featured Origins
          <span className="cbc-tab-count">{featuredOrigins.length}</span>
        </button>
      </div>

      {/* Tab panels */}
      {activeTab === 'inventory' ? renderInventory() : renderFeatured()}

      {/* â”€â”€ Stock Modal â”€â”€ */}
      <Modal show={showStockModal} onClose={() => { setShowStockModal(false); setSelectedBean(null); setNewStock(''); }} size="sm">
        <div className="cbc-dialog-head">
          <h2 className="cbc-dialog-title"><FaEdit size={15} /> Update Stock</h2>
          <button className="cbc-dialog-close" onClick={() => { setShowStockModal(false); setSelectedBean(null); setNewStock(''); }}>✕</button>
        </div>
        <div className="cbc-dialog-body">
          <p style={{ fontWeight: 700, marginBottom: '.75rem', color: '#1A1A1A' }}>{selectedBean?.name}</p>
          <div className="cbc-form-group" style={{ marginBottom: '.75rem' }}>
            <label className="cbc-label">Current Stock</label>
            <input className="cbc-input readonly" readOnly value={`${selectedBean?.stock_quantity ?? 0} kg`} />
          </div>
          <div className="cbc-form-group">
            <label className="cbc-label">New Stock Quantity (kg)<span>*</span></label>
            <input
              className="cbc-input"
              type="number"
              step="0.1"
              min="0"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              placeholder="e.g. 12.5"
              autoFocus
            />
            <span className="cbc-hint">Enter the new stock quantity in kilograms</span>
          </div>
          {newStock !== '' && (
            <div className={`cbc-stock-indicator ${getStockStatus(parseFloat(newStock)).cls}`}>
              <FaExclamationTriangle size={14} />
              Will set to {parseFloat(newStock || 0).toFixed(1)} kg "” {getStockStatus(parseFloat(newStock)).label}
            </div>
          )}
        </div>
        <div className="cbc-dialog-footer">
          <button className="cbc-btn secondary" onClick={() => { setShowStockModal(false); setSelectedBean(null); setNewStock(''); }}>Cancel</button>
          <button
            className="cbc-btn primary"
            onClick={updateBeanStock}
            disabled={updatingStock || newStock === ''}
          >
            {updatingStock ? <FaSpinner className="cbc-spin" size={13} /> : <FaEdit size={13} />}
            Update Stock
          </button>
        </div>
      </Modal>

      {/* â”€â”€ Add Bean Modal â”€â”€ */}
      <Modal show={showAddModal} onClose={() => { setShowAddModal(false); setNewBeanForm(EMPTY_BEAN_FORM); setSelectedImage(null); setImagePreview(null); }} size="lg">
        <div className="cbc-dialog-head">
          <h2 className="cbc-dialog-title"><FaPlus size={14} /> Add New Coffee Bean</h2>
          <button className="cbc-dialog-close" onClick={() => { setShowAddModal(false); setNewBeanForm(EMPTY_BEAN_FORM); setSelectedImage(null); setImagePreview(null); }}>✕</button>
        </div>
        <div className="cbc-dialog-body">
          <div className="cbc-form-grid">
            <div className="cbc-form-group">
              <label className="cbc-label">Bean Name<span>*</span></label>
              <input className="cbc-input" type="text" placeholder="e.g. Ethiopian Yirgacheffe"
                value={newBeanForm.name} onChange={e => setNewBeanForm(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Origin Country<span>*</span></label>
              <input className="cbc-input" type="text" placeholder="e.g. Ethiopia"
                value={newBeanForm.origin_country} onChange={e => setNewBeanForm(p => ({...p, origin_country: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Region</label>
              <input className="cbc-input" type="text" placeholder="e.g. Sidamo"
                value={newBeanForm.region} onChange={e => setNewBeanForm(p => ({...p, region: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Elevation</label>
              <input className="cbc-input" type="text" placeholder="e.g. 1800–2200m"
                value={newBeanForm.elevation} onChange={e => setNewBeanForm(p => ({...p, elevation: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Processing Method</label>
              <input className="cbc-input" type="text" placeholder="e.g. Washed, Natural"
                value={newBeanForm.processing_method} onChange={e => setNewBeanForm(p => ({...p, processing_method: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Variety</label>
              <input className="cbc-input" type="text" placeholder="e.g. Heirloom"
                value={newBeanForm.variety} onChange={e => setNewBeanForm(p => ({...p, variety: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Producer</label>
              <input className="cbc-input" type="text" placeholder="e.g. Local Cooperative"
                value={newBeanForm.producer} onChange={e => setNewBeanForm(p => ({...p, producer: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Initial Stock (kg)<span>*</span></label>
              <input className="cbc-input" type="number" step="0.1" min="0" placeholder="0"
                value={newBeanForm.stock_quantity}
                onChange={e => setNewBeanForm(p => ({...p, stock_quantity: parseFloat(e.target.value) || 0}))} />
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-label">Tasting Notes</label>
              <textarea className="cbc-textarea" rows={3} placeholder="e.g. Floral, Citrus, Bergamot"
                value={newBeanForm.tasting_notes} onChange={e => setNewBeanForm(p => ({...p, tasting_notes: e.target.value}))} />
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-label">Coffee Bean Image</label>
              <div className="cbc-file-drop" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} />
                <FaCoffee size={22} style={{ color: '#9ca3af', display: 'block', margin: '0 auto .4rem' }} />
                <p>Click to upload image (JPG, PNG "” max 2MB)</p>
              </div>
              {imagePreview && <img className="cbc-img-preview" src={imagePreview} alt="Preview" loading="lazy" />}
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-checkbox-row">
                <input type="checkbox" checked={newBeanForm.is_featured}
                  onChange={e => setNewBeanForm(p => ({...p, is_featured: e.target.checked}))} />
                Mark as Featured Bean
              </label>
            </div>
          </div>
        </div>
        <div className="cbc-dialog-footer">
          <button className="cbc-btn secondary" onClick={() => { setShowAddModal(false); setNewBeanForm(EMPTY_BEAN_FORM); setSelectedImage(null); setImagePreview(null); }}>Cancel</button>
          <button
            className="cbc-btn success"
            onClick={addCoffeeBean}
            disabled={addingBean || !newBeanForm.name || !newBeanForm.origin_country}
          >
            {addingBean ? <FaSpinner className="cbc-spin" size={13} /> : <FaPlus size={13} />}
            {addingBean ? 'Adding…' : 'Add Coffee Bean'}
          </button>
        </div>
      </Modal>

      {/* â”€â”€ Archive Modal â”€â”€ */}
      <Modal show={showArchiveModal} onClose={() => { setShowArchiveModal(false); setBeanToArchive(null); }} size="sm">
        <div className="cbc-dialog-head">
          <h2 className="cbc-dialog-title"><FaArchive size={14} /> Archive Bean</h2>
          <button className="cbc-dialog-close" onClick={() => { setShowArchiveModal(false); setBeanToArchive(null); }}>✕</button>
        </div>
        <div className="cbc-dialog-body">
          <div className="cbc-warn-box">
            <FaExclamationTriangle size={18} />
            <p>Are you sure you want to archive <strong>{beanToArchive?.name}</strong>? This will remove it from active inventory. It can be restored by an administrator.</p>
          </div>
        </div>
        <div className="cbc-dialog-footer">
          <button className="cbc-btn secondary" onClick={() => { setShowArchiveModal(false); setBeanToArchive(null); }}>Cancel</button>
          <button className="cbc-btn danger" onClick={archiveCoffeeBean} disabled={archiving}>
            {archiving ? <FaSpinner className="cbc-spin" size={13} /> : <FaArchive size={13} />}
            {archiving ? 'Archiving…' : 'Archive Bean'}
          </button>
        </div>
      </Modal>

      {/* â”€â”€ Featured Origin Modal â”€â”€ */}
      <Modal show={showFeaturedModal} onClose={() => { setShowFeaturedModal(false); setFeaturedForm(EMPTY_FEATURED_FORM); }} size="lg">
        <div className="cbc-dialog-head">
          <h2 className="cbc-dialog-title"><FaStar size={14} /> Set Featured Origin</h2>
          <button className="cbc-dialog-close" onClick={() => { setShowFeaturedModal(false); setFeaturedForm(EMPTY_FEATURED_FORM); }}>✕</button>
        </div>
        <div className="cbc-dialog-body">
          <div className="cbc-form-grid">
            <div className="cbc-form-group">
              <label className="cbc-label">Coffee Bean<span>*</span></label>
              <select className="cbc-select"
                value={featuredForm.coffee_bean_id}
                onChange={e => setFeaturedForm(p => ({...p, coffee_bean_id: e.target.value}))}
              >
                <option value="">Select a coffee bean…</option>
                {availableBeans.map(b => (
                  <option key={b.id} value={b.id}>{b.name} – {b.origin_country}{b.region ? `, ${b.region}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Feature Date<span>*</span></label>
              <input className="cbc-input" type="date" min={todayStr()}
                value={featuredForm.feature_date}
                onChange={e => setFeaturedForm(p => ({...p, feature_date: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">Start Time</label>
              <input className="cbc-input" type="time"
                value={featuredForm.start_time}
                onChange={e => setFeaturedForm(p => ({...p, start_time: e.target.value}))} />
            </div>
            <div className="cbc-form-group">
              <label className="cbc-label">End Time</label>
              <input className="cbc-input" type="time"
                value={featuredForm.end_time}
                onChange={e => setFeaturedForm(p => ({...p, end_time: e.target.value}))} />
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-label">Promotion Text</label>
              <textarea className="cbc-textarea" rows={2} placeholder="e.g. Special 20% discount today!"
                value={featuredForm.promotion_text}
                onChange={e => setFeaturedForm(p => ({...p, promotion_text: e.target.value}))} />
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-label">Special Notes (internal)</label>
              <textarea className="cbc-textarea" rows={2} placeholder="Internal notes about this featured origin"
                value={featuredForm.special_notes}
                onChange={e => setFeaturedForm(p => ({...p, special_notes: e.target.value}))} />
            </div>
            <div className="cbc-form-group span2">
              <label className="cbc-checkbox-row">
                <input type="checkbox" checked={featuredForm.is_active}
                  onChange={e => setFeaturedForm(p => ({...p, is_active: e.target.checked}))} />
                Active (visible to customers)
              </label>
            </div>
          </div>
        </div>
        <div className="cbc-dialog-footer">
          <button className="cbc-btn secondary" onClick={() => { setShowFeaturedModal(false); setFeaturedForm(EMPTY_FEATURED_FORM); }}>Cancel</button>
          <button
            className="cbc-btn amber"
            onClick={createFeaturedOrigin}
            disabled={creatingFeatured || !featuredForm.coffee_bean_id}
          >
            {creatingFeatured ? <FaSpinner className="cbc-spin" size={13} /> : <FaStar size={13} />}
            {creatingFeatured ? 'Creating…' : 'Set as Featured'}
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default CoffeeBeanControl;
