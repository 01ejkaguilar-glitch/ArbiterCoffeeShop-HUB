import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { FaBoxOpen, FaTimes, FaUpload, FaSave, FaPlusCircle } from 'react-icons/fa';
import { BACKEND_BASE_URL } from '../../../config/api';
import '../AdminProducts.css';

const ProductFormModal = ({
  show,
  onHide,
  editingProduct,
  formData,
  onFormChange,
  categories,
  onSubmit,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  /* Live image preview when a new file is chosen */
  useEffect(() => {
    if (formData.image instanceof File) {
      const url = URL.createObjectURL(formData.image);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [formData.image]);

  /* Current image from server (edit mode) */
  const serverThumb = editingProduct?.image_url
    ? `${BACKEND_BASE_URL}${editingProduct.image_url}`
    : null;

  const displayThumb = previewUrl || serverThumb;

  return (
    <Modal show={show} onHide={onHide} size="lg" className="ap-modal" centered>
      {/* ── Header ── */}
      <div className="ap-modal-header">
        <h5 className="ap-modal-title">
          <span className="ap-modal-title-icon">
            {editingProduct ? <FaBoxOpen size={14} /> : <FaPlusCircle size={14} />}
          </span>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h5>
        <button className="ap-modal-close" onClick={onHide} aria-label="Close">
          <FaTimes size={14} />
        </button>
      </div>

      {/* ── Body ── */}
      <form onSubmit={onSubmit}>
        <div className="ap-modal-body">
          <div className="ap-form-grid">

            {/* Product name — full width */}
            <div className="ap-form-group ap-form-full">
              <label className="ap-form-label" htmlFor="pf-name">
                Product Name <span className="req">*</span>
              </label>
              <input
                id="pf-name"
                className="ap-form-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={onFormChange}
                placeholder="e.g. Caramel Macchiato"
                required
              />
            </div>

            {/* Description — full width */}
            <div className="ap-form-group ap-form-full">
              <label className="ap-form-label" htmlFor="pf-desc">Description</label>
              <textarea
                id="pf-desc"
                className="ap-form-textarea"
                name="description"
                value={formData.description}
                onChange={onFormChange}
                rows={3}
                placeholder="Brief description of the product…"
              />
            </div>

            {/* Price */}
            <div className="ap-form-group">
              <label className="ap-form-label" htmlFor="pf-price">
                Price (₱) <span className="req">*</span>
              </label>
              <input
                id="pf-price"
                className="ap-form-input"
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={onFormChange}
                placeholder="0.00"
                required
              />
            </div>

            {/* Stock */}
            <div className="ap-form-group">
              <label className="ap-form-label" htmlFor="pf-stock">
                Stock Quantity <span className="req">*</span>
              </label>
              <input
                id="pf-stock"
                className="ap-form-input"
                type="number"
                min="0"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={onFormChange}
                placeholder="0"
                required
              />
            </div>

            {/* Category */}
            <div className="ap-form-group">
              <label className="ap-form-label" htmlFor="pf-cat">
                Category <span className="req">*</span>
              </label>
              <select
                id="pf-cat"
                className="ap-form-select"
                name="category_id"
                value={formData.category_id}
                onChange={onFormChange}
                required
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Availability toggle */}
            <div className="ap-form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="ap-form-label" style={{ visibility: 'hidden' }}>Availability</label>
              <div className="ap-toggle-wrap">
                <input
                  id="pf-avail"
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={onFormChange}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2d6a4f' }}
                />
                <label htmlFor="pf-avail" className="ap-toggle-label">
                  Available for sale
                </label>
              </div>
            </div>

            {/* Image upload — full width */}
            <div className="ap-form-group ap-form-full">
              <label className="ap-form-label">
                Product Image
                <span className="ap-form-label" style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                  JPEG / PNG / GIF / SVG · max 2 MB
                </span>
              </label>
              <div className="ap-upload-zone">
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={onFormChange}
                  aria-label="Upload product image"
                />
                {displayThumb ? (
                  <img
                    src={displayThumb}
                    alt="Preview"
                    className="ap-upload-preview"
                    loading="lazy"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <FaUpload className="ap-upload-icon" />
                )}
                <span className="ap-upload-hint">
                  {displayThumb
                    ? 'Click or drag to replace image'
                    : 'Click or drag image here to upload'}
                </span>
              </div>
            </div>

          </div>{/* end .ap-form-grid */}
        </div>{/* end .ap-modal-body */}

        {/* ── Footer ── */}
        <div className="ap-modal-footer">
          <button type="button" className="ap-cancel-btn" onClick={onHide}>
            Cancel
          </button>
          <button type="submit" className="ap-submit-btn">
            <FaSave size={13} />
            {editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
