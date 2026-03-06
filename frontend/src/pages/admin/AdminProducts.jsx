import React, { useEffect, useState, useMemo } from 'react';
import { Alert } from 'react-bootstrap';
import { FaPlus, FaBoxOpen, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaLayerGroup } from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import ProductFormModal from './components/ProductFormModal';
import ProductTable from './components/ProductTable';
import BatchActionModal from './components/BatchActionModal';
import PageShell from '../../components/layout/PageShell';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [batchAction, setBatchAction] = useState('');
  const [batchValue, setBatchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    is_available: true,
    image: null
  });
  const [categories, setCategories] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Search / filter / sort state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvail, setFilterAvail] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      // Use the admin-specific endpoint — bypasses the public cache so the list
      // is always fresh and includes products regardless of availability status.
      const response = await apiService.get(API_ENDPOINTS.ADMIN.PRODUCTS.LIST);
      if (response.success && response.data) {
        // Handle paginated response - extract the data array
        const productsData = response.data.data || response.data;
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (response.success && response.data) {
        // Handle paginated response - extract the data array
        const categoriesData = response.data.data || response.data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id || '',
        is_available: product.is_available,
        image: null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        is_available: true,
        image: null
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0] || null
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;

      // Check if we have an image file to upload
      if (formData.image) {
        // Use FormData for file upload
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'image' && formData[key]) {
            formDataToSend.append(key, formData[key]);
          } else if (key === 'price') {
            formDataToSend.append(key, parseFloat(formData[key]) || 0);
          } else if (key === 'stock_quantity') {
            formDataToSend.append(key, parseInt(formData[key]) || 0);
          } else if (key === 'category_id') {
            formDataToSend.append(key, parseInt(formData[key]) || '');
          } else if (key === 'is_available') {
            formDataToSend.append(key, formData[key] ? 1 : 0);
          } else if (key !== 'image') {
            formDataToSend.append(key, formData[key]);
          }
        });

        if (editingProduct) {
          response = await apiService.upload(
            API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id),
            formDataToSend
          );
        } else {
          response = await apiService.upload(API_ENDPOINTS.PRODUCTS.CREATE, formDataToSend);
        }
      } else {
        // Use regular JSON for non-file uploads
        const dataToSend = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          category_id: parseInt(formData.category_id) || null,
          is_available: formData.is_available ? 1 : 0
        };
        delete dataToSend.image; // Remove image field if no file

        if (editingProduct) {
          response = await apiService.put(
            API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id),
            dataToSend
          );
        } else {
          response = await apiService.post(API_ENDPOINTS.PRODUCTS.CREATE, dataToSend);
        }
      }

      if (response.success) {
        setAlert({
          show: true,
          message: editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
          type: 'success'
        });
        handleCloseModal();
        fetchProducts();
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save product';
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const errorDetails = Object.values(validationErrors).flat().join(', ');
        setAlert({
          show: true,
          message: `${errorMessage}: ${errorDetails}`,
          type: 'danger'
        });
      } else {
        setAlert({
          show: true,
          message: errorMessage,
          type: 'danger'
        });
      }
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiService.delete(API_ENDPOINTS.PRODUCTS.DELETE(productId));
        if (response.success) {
          setAlert({ show: true, message: 'Product deleted successfully!', type: 'success' });
          fetchProducts();
          setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
        }
      } catch (error) {
        setAlert({
          show: true,
          message: error.response?.data?.message || 'Failed to delete product',
          type: 'danger'
        });
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleBatchAction = async () => {
    if (selectedProducts.length === 0) {
      setAlert({ show: true, message: 'Please select products first', type: 'warning' });
      return;
    }

    try {
      let updateData = {};
      switch (batchAction) {
        case 'price':
          updateData = { price: parseFloat(batchValue) };
          break;
        case 'stock':
          updateData = { stock_quantity: parseInt(batchValue) };
          break;
        case 'available':
          updateData = { is_available: batchValue === 'true' };
          break;
        default:
          return;
      }

      // Update each selected product
      await Promise.all(
        selectedProducts.map(productId =>
          apiService.put(API_ENDPOINTS.PRODUCTS.UPDATE(productId), updateData)
        )
      );

      setAlert({ show: true, message: `Updated ${selectedProducts.length} products successfully!`, type: 'success' });
      setShowBatchModal(false);
      setSelectedProducts([]);
      setBatchAction('');
      setBatchValue('');
      fetchProducts();
    } catch (error) {
      setAlert({ show: true, message: 'Failed to update products', type: 'danger' });
    }
  };

  // ── Derived: filtered + sorted products ─────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      String(p.id) === q);
    if (filterCategory) list = list.filter(p => String(p.category_id) === filterCategory);
    if (filterAvail === 'yes') list = list.filter(p => p.is_available);
    if (filterAvail === 'no')  list = list.filter(p => !p.is_available);
    list.sort((a, b) => {
      if (sortBy === 'name')  return a.name.localeCompare(b.name);
      if (sortBy === 'price') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'stock') return Number(a.stock_quantity) - Number(b.stock_quantity);
      return b.id - a.id; // newest
    });
    return list;
  }, [products, search, filterCategory, filterAvail, sortBy]);

  // ── Stats ────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     products.length,
    available: products.filter(p => p.is_available).length,
    unavailable: products.filter(p => !p.is_available).length,
    lowStock:  products.filter(p => Number(p.stock_quantity) <= 10 && Number(p.stock_quantity) > 0).length,
  }), [products]);

  return (
    <PageShell
      title="Products Management"
      subtitle="Manage your product catalog"
      loading={loading}
      headerRight={
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          {selectedProducts.length > 0 && (
            <button className="ap-batch-btn" onClick={() => setShowBatchModal(true)}>
              <FaLayerGroup size={13} />
              Batch Edit ({selectedProducts.length})
            </button>
          )}
          <button className="ap-add-btn" onClick={() => handleShowModal()}>
            <FaPlus size={13} />
            Add Product
          </button>
        </div>
      }
    >
      {/* Alert */}
      {alert.show && (
        <Alert
          variant={alert.type}
          onClose={() => setAlert({ show: false, message: '', type: '' })}
          dismissible
          className="mb-4"
        >
          {alert.message}
        </Alert>
      )}

      {/* Stats Bar */}
      {!loading && (
        <div className="ap-stats-bar">
          <div className="ap-stat-card">
            <div className="ap-stat-icon blue"><FaBoxOpen /></div>
            <div>
              <div className="ap-stat-value">{stats.total}</div>
              <div className="ap-stat-label">Total Products</div>
            </div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-icon green"><FaCheckCircle /></div>
            <div>
              <div className="ap-stat-value">{stats.available}</div>
              <div className="ap-stat-label">Available</div>
            </div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-icon red"><FaTimesCircle /></div>
            <div>
              <div className="ap-stat-value">{stats.unavailable}</div>
              <div className="ap-stat-label">Unavailable</div>
            </div>
          </div>
          <div className="ap-stat-card">
            <div className="ap-stat-icon amber"><FaExclamationTriangle /></div>
            <div>
              <div className="ap-stat-value">{stats.lowStock}</div>
              <div className="ap-stat-label">Low Stock (≤10)</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!loading && (
        <div className="ap-filter-bar">
          {/* Search */}
          <div className="ap-search-wrap">
            <svg className="ap-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              className="ap-search-input"
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedProducts([]); }}
            />
          </div>

          {/* Category filter */}
          <select
            className="ap-filter-select"
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setSelectedProducts([]); }}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Availability filter */}
          <select
            className="ap-filter-select"
            value={filterAvail}
            onChange={e => { setFilterAvail(e.target.value); setSelectedProducts([]); }}
            aria-label="Filter by availability"
          >
            <option value="">All Status</option>
            <option value="yes">Available</option>
            <option value="no">Unavailable</option>
          </select>

          {/* Sort */}
          <select
            className="ap-filter-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort by"
          >
            <option value="name">Sort: Name A–Z</option>
            <option value="price">Sort: Price ↑</option>
            <option value="stock">Sort: Stock ↑</option>
            <option value="newest">Sort: Newest</option>
          </select>

          <span className="ap-filter-results">
            {filteredProducts.length} of {products.length}
          </span>
        </div>
      )}

      {/* Product Table */}
      <ProductTable
        products={filteredProducts}
        categories={categories}
        selectedProducts={selectedProducts}
        onToggleSelection={toggleProductSelection}
        onToggleSelectAll={toggleSelectAll}
        onEdit={handleShowModal}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      <ProductFormModal
        show={showModal}
        onHide={handleCloseModal}
        editingProduct={editingProduct}
        formData={formData}
        onFormChange={handleChange}
        categories={categories}
        onSubmit={handleSubmit}
      />

      {/* Batch Modal */}
      <BatchActionModal
        show={showBatchModal}
        onHide={() => setShowBatchModal(false)}
        selectedCount={selectedProducts.length}
        batchAction={batchAction}
        setBatchAction={setBatchAction}
        batchValue={batchValue}
        setBatchValue={setBatchValue}
        onApply={handleBatchAction}
      />
    </PageShell>
  );
};

export default AdminProducts;
