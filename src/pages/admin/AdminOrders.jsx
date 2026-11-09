import { useState, useEffect } from "react";
import { Table, Form, Button, Modal, Image, Row, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../../redux/orderSlice";
import orderApi from "../../api/orderApi";
import userApi from "../../api/userApi";
import bookApi from "../../api/bookApi";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import SearchBar from "../../components/SearchBar";
import { ORDER_STATUS, formatDate, formatCurrency, matchesSearch } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaEye, FaMapMarkerAlt, FaPhone, FaUser } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const statusLabels = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  Shipping: "Shipping",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  "Return Requested": "Return Requested",
  Returned: "Returned",
};

const statusStyleMap = {
  Pending: {
    color: "#b45309",
    bgColor: "#fef3c7",
    borderColor: "#fde68a",
  },
  Confirmed: {
    color: "#0369a1",
    bgColor: "#e0f2fe",
    borderColor: "#bae6fd",
  },
  Shipping: {
    color: "#1d4ed8",
    bgColor: "#dbeafe",
    borderColor: "#bfdbfe",
  },
  Delivered: {
    color: "#15803d",
    bgColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  Cancelled: {
    color: "#dc2626",
    bgColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  "Return Requested": {
    color: "#c2410c",
    bgColor: "#ffedd5",
    borderColor: "#fed7aa",
  },
  Returned: {
    color: "#475569",
    bgColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
};

// Quy tắc chuyển trạng thái hợp lệ
const validTransitions = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  "Return Requested": [ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.RETURNED]: [],
};

const AdminOrders = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tìm kiếm, lọc trạng thái và phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal xác nhận thao tác cập nhật đơn hàng
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    orderId: null,
    newStatus: "",
    onConfirm: () => {},
  });

  const fetchData = async () => {
    try {
      const [ordersRes, usersRes, booksRes] = await Promise.all([
        orderApi.getAll(),
        userApi.getAll(),
        bookApi.getAll(),
      ]);
      setOrders(ordersRes.data || []);
      setUsers(usersRes.data || []);
      setBooks(booksRes.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserName = (userId) => {
    if (!userId) return "Customer";
    const found = users.find((u) => String(u.id) === String(userId));
    return found ? found.name : `User #${userId}`;
  };

  const getBookInfo = (bookId) =>
    books.find((b) => String(b.id) === String(bookId));

  const executeStatusChange = async (orderId, newStatus) => {
    try {
      const resultAction = await dispatch(updateOrderStatus({ orderId, status: newStatus }));
      if (updateOrderStatus.fulfilled.match(resultAction)) {
        toast.success(
          `Successfully updated order #${orderId} to status "${statusLabels[newStatus] || newStatus}"!`
        );
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
        fetchData();
      } else {
        toast.error(resultAction.payload || "Failed to update order status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status. Please try again later.");
    }
  };

  const requestStatusChange = (orderId, newStatus) => {
    if (!newStatus) return;
    setConfirmModal({
      show: true,
      orderId,
      newStatus,
      onConfirm: () => {
        executeStatusChange(orderId, newStatus);
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleViewDetail = async (order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await orderApi.getOrderItems(order.id);
      setOrderItems(res.data || []);
    } catch (err) {
      console.error("Failed to fetch order items:", err);
    }
    setDetailLoading(false);
  };

  const getAvailableTransitions = (currentStatus) => {
    return validTransitions[currentStatus] || [];
  };

  let filteredOrders = orders.filter((o) => {
    const idMatch = matchesSearch(String(o.orderCode || o.id), searchTerm) || matchesSearch(String(o.id), searchTerm);
    const userMatch = matchesSearch(getUserName(o.userId), searchTerm);
    const recipientMatch = matchesSearch(o.recipientName || "", searchTerm);
    return idMatch || userMatch || recipientMatch;
  });

  if (filterStatus !== "all") {
    filteredOrders = filteredOrders.filter((o) => o.status === filterStatus);
  }

  filteredOrders.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return String(b.id).localeCompare(String(a.id));
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="fw-bold mb-4 text-dark">Order Management</h2>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar
            onSearch={(q) => { setSearchTerm(q); setCurrentPage(1); }}
            placeholder="Search by order ID, customer name, or recipient..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            {Object.values(ORDER_STATUS).map((st) => (
              <option
                key={st}
                value={st}
                className={`status-option-${st}`}
                style={{ color: statusStyleMap[st]?.color, fontWeight: "600" }}
              >
                {statusLabels[st] || st}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "150px", minWidth: "140px", whiteSpace: "nowrap" }} className="text-nowrap">Order ID</th>
            <th style={{ minWidth: "160px" }}>Customer</th>
            <th style={{ minWidth: "180px" }}>Recipient</th>
            <th style={{ width: "135px" }}>Date</th>
            <th style={{ width: "115px" }}>Total</th>
            <th style={{ width: "195px" }}>Status</th>
            <th className="col-actions text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => {
            const transitions = getAvailableTransitions(order.status);
            return (
              <tr key={order.id}>
                <td className="text-nowrap" style={{ whiteSpace: "nowrap" }}>
                  <strong style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}>
                    #{String(order.orderCode || order.id).replace(/^#/, "")}
                  </strong>
                </td>
                <td>{getUserName(order.userId)}</td>
                <td>
                  <div className="small fw-semibold">{order.recipientName || "N/A"}</div>
                  {order.phone && <div className="text-muted small">{order.phone}</div>}
                </td>
                <td>{formatDate(order.createdAt) || order.createdAt}</td>
                <td className="fw-bold text-primary">{formatCurrency(order.totalPrice)}</td>
                <td>
                  {transitions.length > 0 ? (
                    <Form.Select
                      size="sm"
                      value={order.status}
                      onChange={(e) => requestStatusChange(order.id, e.target.value)}
                      className={`fw-semibold status-option-${order.status}`}
                      style={{
                        color: statusStyleMap[order.status]?.color || "#1e293b",
                        backgroundColor: statusStyleMap[order.status]?.bgColor || "#ffffff",
                        borderColor: statusStyleMap[order.status]?.borderColor || "#cbd5e1",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <option
                        value={order.status}
                        className={`status-option-${order.status}`}
                        style={{
                          color: statusStyleMap[order.status]?.color || "#1e293b",
                          backgroundColor: "#ffffff",
                          fontWeight: "700",
                        }}
                      >
                        {statusLabels[order.status] || order.status} (Current)
                      </option>
                      {transitions.map((nextStatus) => (
                        <option
                          key={nextStatus}
                          value={nextStatus}
                          className={`status-option-${nextStatus}`}
                          style={{
                            color: statusStyleMap[nextStatus]?.color || "#1e293b",
                            backgroundColor: "#ffffff",
                            fontWeight: "600",
                          }}
                        >
                          Change to: {statusLabels[nextStatus] || nextStatus}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <span
                      className="d-inline-flex align-items-center justify-content-center px-3 py-1 rounded-2 fw-semibold"
                      style={{
                        fontSize: "0.875rem",
                        color: statusStyleMap[order.status]?.color || "#475569",
                        backgroundColor: statusStyleMap[order.status]?.bgColor || "#f1f5f9",
                        border: `1px solid ${statusStyleMap[order.status]?.borderColor || "#cbd5e1"}`,
                        minHeight: "31px",
                      }}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  )}
                </td>
                <td className="col-actions text-nowrap">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleViewDetail(order)}
                    className="d-inline-flex align-items-center"
                  >
                    <FaEye className="me-2 flex-shrink-0" /> <span>Details</span>
                  </Button>
                </td>
              </tr>
            );
          })}
          {paginatedOrders.length === 0 && (
            <tr><td colSpan={7} className="text-center text-muted py-3">No orders found.</td></tr>
          )}
        </tbody>
      </Table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Order Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">
            Order Details #{String(selectedOrder?.orderCode || selectedOrder?.id || "").replace(/^#/, "")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="row g-3 mb-4 bg-light p-3 rounded">
                <div className="col-md-6">
                  <p className="mb-1">
                    <strong className="text-dark">Account:</strong>{" "}
                    {getUserName(selectedOrder?.userId)}
                  </p>
                  <p className="mb-1">
                    <strong className="text-dark">Order Date:</strong>{" "}
                    {formatDate(selectedOrder?.createdAt) || selectedOrder?.createdAt}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="mb-1">
                    <strong className="text-dark"><FaUser className="me-2 flex-shrink-0" /> Recipient:</strong>{" "}
                    {selectedOrder?.recipientName || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong className="text-dark"><FaPhone className="me-2 flex-shrink-0" /> Phone:</strong>{" "}
                    {selectedOrder?.phone || "N/A"}
                  </p>
                  <p className="mb-0">
                    <strong className="text-dark"><FaMapMarkerAlt className="me-2 flex-shrink-0" /> Shipping Address:</strong>{" "}
                    {selectedOrder?.shippingAddress || "N/A"}
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 mb-4 p-3 border rounded">
                <strong className="text-dark">Current Status:</strong>
                <span
                  className="d-inline-flex align-items-center justify-content-center px-3 py-1 rounded-2 fw-semibold"
                  style={{
                    fontSize: "0.875rem",
                    color: statusStyleMap[selectedOrder?.status]?.color || "#475569",
                    backgroundColor: statusStyleMap[selectedOrder?.status]?.bgColor || "#f1f5f9",
                    border: `1px solid ${statusStyleMap[selectedOrder?.status]?.borderColor || "#cbd5e1"}`,
                  }}
                >
                  {statusLabels[selectedOrder?.status] || selectedOrder?.status}
                </span>

                {getAvailableTransitions(selectedOrder?.status).length > 0 && (
                  <div className="ms-auto d-flex align-items-center gap-2">
                    <span className="small text-muted">Change to:</span>
                    <Form.Select
                      size="sm"
                      style={{ width: "190px" }}
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          requestStatusChange(selectedOrder.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" style={{ color: "#64748b" }}>Select status...</option>
                      {getAvailableTransitions(selectedOrder?.status).map((st) => (
                        <option
                          key={st}
                          value={st}
                          className={`status-option-${st}`}
                          style={{
                            color: statusStyleMap[st]?.color || "#1e293b",
                            fontWeight: "600",
                          }}
                        >
                          {statusLabels[st] || st}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                )}
              </div>

              <h6 className="fw-bold mb-3 text-dark">Order Items</h6>
              <Table striped bordered hover responsive size="sm" className="bg-white align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>Image</th>
                    <th>Book Title</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item) => {
                    const bookInfo = getBookInfo(item.bookId);
                    const displayTitle = bookInfo?.title || item.title || `Book #${item.bookId}`;
                    const displayImage = bookInfo?.image || item.image;
                    return (
                      <tr key={item.id}>
                        <td>
                          {displayImage ? (
                            <Image
                              src={displayImage}
                              alt={displayTitle}
                              rounded
                              style={{ width: "45px", height: "60px", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/images/books/book-1.jpg";
                              }}
                            />
                          ) : (
                            <div style={{ width: "45px", height: "60px", background: "#eee" }} className="d-flex align-items-center justify-content-center rounded">
                              <small>N/A</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{displayTitle}</div>
                          {bookInfo?.author && <small className="text-muted">{bookInfo.author}</small>}
                        </td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td className="text-end fw-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="text-end mt-3 border-top pt-3">
                {selectedOrder?.subtotal != null && (
                  <div className="mb-1 text-muted">
                    Subtotal: <strong>{formatCurrency(selectedOrder.subtotal)}</strong>
                  </div>
                )}
                {Number(selectedOrder?.discountAmount) > 0 && (
                  <div className="mb-1 text-success">
                    Discount: <strong>-{formatCurrency(selectedOrder.discountAmount)}</strong>
                  </div>
                )}
                <h5 className="fw-bold text-primary mt-2">
                  Total: {formatCurrency(selectedOrder?.totalPrice)}
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

      <ConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
        onConfirm={confirmModal.onConfirm}
        title="Confirm Order Status Change"
        message={`Are you sure you want to change order #${confirmModal.orderId} status to "${statusLabels[confirmModal.newStatus] || confirmModal.newStatus}"?`}
        confirmText="Confirm Change"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminOrders;
