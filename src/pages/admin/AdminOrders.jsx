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
  Pending: "Chờ xử lý",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  Cancelled: "Đã hủy",
  "Return Requested": "Yêu cầu trả hàng",
  Returned: "Đã trả hàng",
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
          `Cập nhật đơn hàng #${orderId} sang trạng thái "${statusLabels[newStatus] || newStatus}" thành công!`
        );
        if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
        }
        fetchData();
      } else {
        toast.error(resultAction.payload || "Cập nhật trạng thái đơn hàng chưa thành công.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật trạng thái đơn hàng chưa thành công. Vui lòng thử lại sau.");
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
    const idMatch = matchesSearch(String(o.id), searchTerm);
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
      <h2 className="fw-bold mb-4 text-dark">Quản lý đơn hàng</h2>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar
            onSearch={(q) => { setSearchTerm(q); setCurrentPage(1); }}
            placeholder="Tìm kiếm theo mã đơn, tên khách hàng hoặc người nhận..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tất cả trạng thái</option>
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
            <th style={{ width: "85px" }}>Mã đơn</th>
            <th style={{ minWidth: "160px" }}>Khách hàng</th>
            <th style={{ minWidth: "180px" }}>Người nhận</th>
            <th style={{ width: "135px" }}>Ngày đặt</th>
            <th style={{ width: "115px" }}>Tổng tiền</th>
            <th style={{ width: "195px" }}>Trạng thái</th>
            <th className="col-actions text-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => {
            const transitions = getAvailableTransitions(order.status);
            return (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
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
                        {statusLabels[order.status] || order.status} (Hiện tại)
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
                          Chuyển sang: {statusLabels[nextStatus] || nextStatus}
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
                    <FaEye className="me-2 flex-shrink-0" /> <span>Chi tiết</span>
                  </Button>
                </td>
              </tr>
    </div>
  );
};

export default AdminOrders;
