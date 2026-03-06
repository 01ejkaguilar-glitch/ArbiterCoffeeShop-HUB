import React from 'react';
import { Card, Form, Alert } from 'react-bootstrap';
import { FaQrcode } from 'react-icons/fa';

function PaymentMethodSelector({ paymentMethod, setPaymentMethod }) {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Payment Method</h5>
      </Card.Header>
      <Card.Body>
        <Form>
          <Form.Check
            type="radio"
            name="payment"
            label="Cash on Delivery / Cash"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mb-3"
          />
          <Form.Check
            type="radio"
            name="payment"
            label={
              <div className="d-flex align-items-center">
                <span>GCash</span>
                <small className="text-muted ms-2">(QR code will be shown after order)</small>
              </div>
            }
            value="gcash"
            checked={paymentMethod === 'gcash'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mb-3"
          />
          <Form.Check
            type="radio"
            name="payment"
            label={
              <div className="d-flex align-items-center">
                <span>Maya</span>
                <small className="text-muted ms-2">(QR code will be shown after order)</small>
              </div>
            }
            value="maya"
            checked={paymentMethod === 'maya'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mb-3"
          />
          <Form.Check
            type="radio"
            name="payment"
            label="Card"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mb-3"
          />
        </Form>

        {['gcash', 'maya'].includes(paymentMethod) && (
          <Alert variant="info" className="mt-3">
            <FaQrcode className="me-2" />
            <strong>Digital Payment:</strong> After placing your order, a QR code will be displayed for payment.
            Please scan the code with your {paymentMethod === 'gcash' ? 'GCash' : 'Maya'} app to complete the payment.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

export default PaymentMethodSelector;
