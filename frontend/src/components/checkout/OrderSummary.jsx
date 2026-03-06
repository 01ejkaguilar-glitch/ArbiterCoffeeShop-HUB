import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { AnimatedButton } from '../animations/AnimationWrappers';

function OrderSummary({ cart, subtotal, deliveryFee, total, loading, onPlaceOrder, canOrder }) {
  return (
    <Card className="shadow-sm sticky-top-20">
      <Card.Header className="bg-success text-white">
        <h5 className="mb-0">Order Summary</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          {cart?.items?.map((item, index) => (
            <div key={index} className="d-flex justify-content-between mb-2">
              <div className="flex-grow-1">
                <div className="fw-bold">{item.product?.name || 'Product'}</div>
                <div className="text-muted small">Qty: {item.quantity} x ₱{parseFloat(item.unit_price).toFixed(2)}</div>
              </div>
              <div className="fw-bold">
                ₱{(item.unit_price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <hr />

        <div className="d-flex justify-content-between mb-2">
          <span>Subtotal:</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="d-flex justify-content-between mb-2">
          <span>Delivery Fee:</span>
          <span>₱{deliveryFee.toFixed(2)}</span>
        </div>
        <hr />
        <div className="d-flex justify-content-between mb-4">
          <span className="fw-bold">Total:</span>
          <span className="fw-bold fs-5">₱{total.toFixed(2)}</span>
        </div>
        <AnimatedButton
          variant="success"
          size="lg"
          className="w-100"
          onClick={onPlaceOrder}
          disabled={loading || !canOrder}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            'Place Order'
          )}
        </AnimatedButton>
      </Card.Body>
    </Card>
  );
}

export default OrderSummary;
