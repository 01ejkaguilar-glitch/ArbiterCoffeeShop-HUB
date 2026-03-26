import React from 'react';
import { Row, Col, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import BottomNavigation from '../../components/mobile/BottomNavigation';
import PullToRefresh from '../../components/mobile/PullToRefresh';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { BACKEND_BASE_URL } from '../../config/api';

const CartPage = () => {
  const { cart, cartCount, updateCartItem, removeFromCart } = useCart();

  // Handler to remove item from cart
  const handleRemove = (itemId) => {
    removeFromCart(itemId);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity > 0) {
      await updateCartItem(itemId, newQuantity);
    }
  };

  // Handler to reload cart
  const reloadCart = () => {
    window.location.reload(); // Replace with better logic if available
  };

  return (
    <PageShell title="Shopping Cart" subtitle={`${cartCount} ${cartCount === 1 ? 'item' : 'items'} in cart`}>
      <PullToRefresh onRefresh={reloadCart}>
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Table responsive aria-label="Shopping cart items">
                  <caption className="visually-hidden">Your shopping cart with {cartCount} items</caption>
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Price</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Total</th>
                      <th scope="col"><span className="visually-hidden">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart?.items?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={item.product?.image_url ? `${BACKEND_BASE_URL}${item.product.image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zNWVtIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjEwIj5Db2ZmZWU8L3RleHQ+Cjxzdmc+'}
                              alt={`${item.product?.name} product image`}
                              width="80"
                              height="80"
                              className="me-3 rounded"
                              loading="lazy"
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
                        <td className="align-middle fw-bold">
                          <data value={(item.unit_price * item.quantity).toFixed(2)} aria-label={`Total: ${(item.unit_price * item.quantity).toFixed(2)} pesos`}>
                            ₱{(item.unit_price * item.quantity).toFixed(2)}
                          </data>
                        </td>
                        <td className="align-middle">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                            aria-label={`Remove ${item.product?.name} from cart`}
                          >
                            <FaTrash aria-hidden="true" />
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
                  <span className="fw-bold">₱{parseFloat(cart?.subtotal || 0).toFixed(2)}</span>
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
                  aria-label="Continue shopping"
                >
                  Continue Shopping
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </PullToRefresh>
      <BottomNavigation />
    </PageShell>
  );
}

export default CartPage;

