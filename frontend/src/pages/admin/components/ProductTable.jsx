import React from 'react';
import { FaEdit, FaTrash, FaBoxOpen, FaCircle } from 'react-icons/fa';
import { BACKEND_BASE_URL } from '../../../config/api';
import '../AdminProducts.css';

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f3f4f6' rx='8'/%3E%3Ctext x='24' y='29' text-anchor='middle' fill='%239ca3af' font-size='9' font-family='sans-serif'%3ENo img%3C/text%3E%3C/svg%3E";

const StockBadge = ({ qty }) => {
  const n = Number(qty);
  if (n === 0) return <span className="ap-stock-badge out">Out</span>;
  if (n <= 10) return <span className="ap-stock-badge low">{n}</span>;
  return <span className="ap-stock-badge high">{n}</span>;
};

const ProductTable = ({
  products,
  categories,
  selectedProducts,
  onToggleSelection,
  onToggleSelectAll,
  onEdit,
  onDelete,
}) => {
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && !allSelected;

  return (
    <div className="ap-table-card shadow-sm">
      <div style={{ overflowX: 'auto' }}>
        <table className="ap-table" aria-label="Products list">
          <thead>
            <tr>
              <th style={{ width: 44, paddingLeft: '1rem' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={onToggleSelectAll}
                  aria-label="Select all products"
                />
              </th>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ width: 72 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={{ paddingLeft: '1rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => onToggleSelection(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td>
                    <div className="ap-product-cell">
                      <img
                        src={product.image_url ? `${BACKEND_BASE_URL}${product.image_url}` : FALLBACK}
                        alt={product.name}
                        loading="lazy"
                        width="48"
                        height="48"
                        className="ap-product-thumb"
                        onError={e => { e.target.src = FALLBACK; }}
                      />
                      <div>
                        <div className="ap-product-name">{product.name}</div>
                        <div className="ap-product-id">ID #{product.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="ap-price">₱{parseFloat(product.price).toFixed(2)}</span>
                  </td>
                  <td>
                    <StockBadge qty={product.stock_quantity} />
                  </td>
                  <td>
                    <span className={`ap-avail-badge ${product.is_available ? 'on' : 'off'}`}>
                      <FaCircle size={6} />
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <div className="ap-actions-cell">
                      <button
                        className="ap-action-btn edit"
                        onClick={() => onEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        className="ap-action-btn del"
                        onClick={() => onDelete(product.id)}
                        aria-label={`Delete ${product.name}`}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="ap-empty">
                    <FaBoxOpen className="ap-empty-icon" />
                    <p>No products found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
