import React, { useEffect } from "react";
import { Container, Card, Badge, Button, Row, Col } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { fetchOrders, cancelOrder, confirmReceipt, returnOrder } from "../../redux/slices/orderSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import { FaCheckCircle, FaUndo, FaStar, FaTimesCircle } from "react-icons/fa";

const statusColors = {
  Pending: "warning",
  Confirmed: "info",
  Shipping: "primary",
  Delivered: "success",
  Cancelled: "danger",
  Returned: "secondary",
};

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchOrders(user.id));
    }
  }, [dispatch, user]);

  const handleCancel = async (orderId) => {
    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error("Failed to cancel order");
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    try {
      await dispatch(confirmReceipt(orderId)).unwrap();
      toast.success("Order received! Thank you.");
    } catch (err) {
      toast.error("Failed to confirm receipt");
    }
  };

  const handleReturn = async (orderId) => {
    try {
      await dispatch(returnOrder(orderId)).unwrap();
      toast.success("Return request submitted");
    } catch (err) {
      toast.error("Failed to submit return request");
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!orders || orders.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3">No orders yet</h3>
        <p className="text-muted">Start shopping to see your orders here!</p>
        <Link to="/books">
          <Button variant="primary">Browse Books</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="fw-bold mb-4">My Orders</h2>
      <Row className="g-3">
        {[...orders].reverse().map((order) => (
          <Col xs={12} key={order.id}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">Order #{order.id}</h5>
                    <small className="text-muted">
                      Placed on: {order.createdAt}
                    </small>
                  </div>
                  <div className="text-end">
                    <Badge
                      bg={statusColors[order.status] || "secondary"}
                      className="mb-2 fs-6"
                    >
                      {order.status}
                    </Badge>
                    <div className="fw-bold text-primary fs-5">
                      ${order.totalPrice?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 d-flex gap-2 flex-wrap">
                  <Link to={`/orders/${order.id}`}>
                    <Button variant="outline-primary" size="sm">
                      View Details
                    </Button>
                  </Link>
                  {order.status === "Pending" && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleCancel(order.id)}
                    >
                      <FaTimesCircle className="me-1" /> Cancel Order
                    </Button>
                  )}
                  {order.status === "Shipping" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleConfirmReceipt(order.id)}
                    >
                      <FaCheckCircle className="me-1" /> Confirm Receipt
                    </Button>
                  )}
                  {order.status === "Delivered" && (
                    <>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleReturn(order.id)}
                      >
                        <FaUndo className="me-1" /> Return
                      </Button>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline-warning" size="sm">
                          <FaStar className="me-1" /> Write Review
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default OrdersPage;
