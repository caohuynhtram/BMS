import React, { useState, useEffect } from "react";
import { Container, Table, Form, Badge, Button, Modal, Image } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import orderApi from "../../api/orderApi";
import userApi from "../../api/userApi";
import bookApi from "../../api/bookApi";
import axiosClient from "../../api/axiosClient";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import { FaEye } from "react-icons/fa";


const statusColors = {
  Pending: "warning",
  Confirmed: "info",
  Shipping: "primary",
  Delivered: "success",
  Cancelled: "danger",
  Returned: "secondary",
};

// Valid transitions: admin can only move to these next statuses
const validTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipping"],
  Shipping: ["Delivered"],
  Delivered: [],
  Cancelled: [],
  Returned: [],
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, usersRes, booksRes] = await Promise.all([
        orderApi.getAll(),
        userApi.getAll(),
        bookApi.getAll(),
      ]);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
      setBooks(booksRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserName = (userId) =>
    users.find((u) => String(u.id) === String(userId))?.name || "Unknown";

  const getBookInfo = (bookId) =>
    books.find((b) => String(b.id) === String(bookId));

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleViewDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await axiosClient.get(`/orderItems?orderId=${order.id}`);
      setOrderItems(res.data);
    } catch (err) {
      console.error("Failed to fetch order items:", err);
    }
    setDetailLoading(false);
  };

  const getAvailableTransitions = (currentStatus) => {
    return validTransitions[currentStatus] || [];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <h2 className="fw-bold mb-4">Order Management</h2>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...orders].reverse().map((order) => {
              const transitions = getAvailableTransitions(order.status);
              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{getUserName(order.userId)}</td>
                  <td className="fw-bold">${order.totalPrice?.toFixed(2)}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <Badge bg={statusColors[order.status] || "secondary"}>
                      {order.status}
                    </Badge>
                  </td>
                  <td>
                    {transitions.length > 0 ? (
                      <Form.Select
                        size="sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleStatusChange(order.id, e.target.value);
                          }
                        }}
                        style={{ maxWidth: "160px" }}
                      >
                        <option value="">Select next...</option>
                        {transitions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <small className="text-muted">Final</small>
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => handleViewDetail(order)}
                    >
                      <FaEye className="me-1" /> View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Order Detail Modal */}
        <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Order #{selectedOrder?.id} Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {detailLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="mb-3">
                  <p>
                    <strong>Customer:</strong>{" "}
                    {getUserName(selectedOrder?.userId)}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedOrder?.createdAt}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Badge
                      bg={statusColors[selectedOrder?.status] || "secondary"}
                    >
                      {selectedOrder?.status}
                    </Badge>
                  </p>
                </div>

                <h6 className="fw-bold mb-3">Items</h6>
                <Table striped bordered hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Book</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => {
                      const bookInfo = getBookInfo(item.bookId);
                      return (
                        <tr key={item.id}>
                          <td>
                            {bookInfo?.image ? (
                              <Image
                                src={bookInfo.image}
                                alt={bookInfo?.title}
                                rounded
                                style={{
                                  width: "50px",
                                  height: "65px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "50px",
                                  height: "65px",
                                  background: "#eee",
                                }}
                                className="d-flex align-items-center justify-content-center rounded"
                              >
                                <small>N/A</small>
                              </div>
                            )}
                          </td>
                          <td className="align-middle">
                            <div className="fw-bold">
                              {bookInfo?.title || `Book #${item.bookId}`}
                            </div>
                            {bookInfo && (
                              <small className="text-muted">
                                {bookInfo.author}
                              </small>
                            )}
                          </td>
                          <td className="align-middle">${item.price}</td>
                          <td className="align-middle">{item.quantity}</td>
                          <td className="align-middle fw-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>

                <div className="text-end mt-3">
                  <h5 className="fw-bold text-primary">
                    Total: ${selectedOrder?.totalPrice?.toFixed(2)}
                  </h5>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminOrders;
