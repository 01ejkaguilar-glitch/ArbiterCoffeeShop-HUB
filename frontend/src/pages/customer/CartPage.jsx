import React from 'react';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const CartPage = () => {
  const { cart, cartCount, updateCartItem, removeFromCart } = useCart();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity > 0) {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      await removeFromCart(itemId);
    }
  };

  if (cartCount === 0) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={6} className="text-center">
            <Card className="shadow-sm">
              <Card.Body className="py-5">
                <h2 className="mb-3">Your cart is empty</h2>
                <p className="text-muted mb-4">
                  Start adding some delicious coffee to your cart!
                </p>
                <Button as={Link} to="/products" variant="primary" size="lg">
                  Browse Products
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h1 className="display-5 fw-bold">Shopping Cart</h1>
          <p className="lead text-muted">{cartCount} {cartCount === 1 ? 'item' : 'items'} in cart</p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart?.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.product?.image_url || 'https://via.placeholder.com/80'}
                            alt={item.product?.name}
                            width="80"
                            height="80"
                            className="me-3 rounded"
                          />
                          <div>
                            <h6 className="mb-0">{item.product?.name}</h6>
                            {item.special_instructions && (
                              <small className="text-muted">
                                Note: {item.special_instructions}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">₱{item.unit_price}</td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <FaMinus />
                          </Button>
                          <span className="px-2">{item.quantity}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <FaPlus />
                          </Button>
                        </div>
                      </td>
                      <td className="align-middle fw-bold">
                        ₱{(item.unit_price * item.quantity).toFixed(2)}
                      </td>
                      <td className="align-middle">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemove(item.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm sticky-top" style={{ top: '100px' }}>
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span className="fw-bold">₱{cart?.subtotal?.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Delivery Fee:</span>
                <span>₱50.00</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <span className="fw-bold">Total:</span>
                <span className="fw-bold fs-5 text-primary">
                  ₱{((cart?.subtotal || 0) + 50).toFixed(2)}
                </span>
              </div>
              <Button
                as={Link}
                to="/checkout"
                variant="primary"
                size="lg"
                className="w-100 mb-2"
              >
                Proceed to Checkout
              </Button>
              <Button
                as={Link}
                to="/products"
                variant="outline-secondary"
                className="w-100"
              >
                Continue Shopping
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;
