import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Table,
} from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { updateProfile, logout } from "../../redux/authSlice";
import { clearCart } from "../../redux/cartSlice";
import { clearWishlist } from "../../redux/wishlistSlice";
import { fetchOrders, clearOrders } from "../../redux/orderSlice";
import authApi from "../../api/authApi";
import Pagination from "../../components/Pagination";
import {
  isValidFullName,
  isValidPhone,
  isValidAddress,
  isValidPassword,
  formatDate,
  formatCurrency,
} from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";

const statusBadgeClasses = {
  Pending: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  Confirmed: "bg-info-subtle text-info-emphasis border border-info-subtle",
  Shipping: "bg-primary-subtle text-primary-emphasis border border-primary-subtle",
  Delivered: "bg-success-subtle text-success-emphasis border border-success-subtle",
  Cancelled: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
  "Return Requested": "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  Returned: "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle",
};

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const { orders } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 5;

  const totalOrderPages = Math.ceil((orders?.length || 0) / ORDERS_PER_PAGE);
  const pagedOrders = useMemo(() => {
    const reversed = [...(orders || [])].reverse();
    const start = (orderPage - 1) * ORDERS_PER_PAGE;
    return reversed.slice(start, start + ORDERS_PER_PAGE);
  }, [orders, orderPage]);

  useEffect(() => {
    if (orderPage > totalOrderPages && totalOrderPages > 0) {
      setOrderPage(totalOrderPages);
    }
  }, [orderPage, totalOrderPages]);

  useEffect(() => {
    if (user) {
      setName((prev) => (prev ? prev : user.name || ""));
      setPhone((prev) => (prev ? prev : user.phone || ""));
      setAddress((prev) => (prev ? prev : user.address || ""));
      dispatch(fetchOrders(user.id));
    }
  }, [user, dispatch]);

  const getUserInitials = (u) => {
    if (u?.name) {
      const parts = u.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return u.name.substring(0, 2).toUpperCase();
    }
    if (u?.email) {
      return u.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!isValidFullName(name)) {
      setError("Họ và tên phải có ít nhất 2 từ và chỉ bao gồm chữ cái.");
      return;
    }
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập số gồm 10 chữ số (VD: 0912345678).");
      return;
    }
    if (!address.trim()) {
      setError("Vui lòng nhập địa chỉ nhận hàng.");
      return;
    }
    if (!isValidAddress(address)) {
      setError("Vui lòng nhập địa chỉ nhận hàng chi tiết hơn (ít nhất 2 từ).");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      await authApi.updateProfile(user.id, updateData);
      dispatch(updateProfile(updateData));
      toast.success("Cập nhật thông tin cá nhân thành công.", { toastId: "profile-update" });
    } catch (err) {
      console.error(err);
      setError("Cập nhật thông tin chưa thành công. Vui lòng thử lại sau.");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError("Mật khẩu mới phải có độ dài từ 6 đến 18 ký tự.");
      return;
    }
    if (!confirmPassword) {
      setError("Vui lòng nhập lại mật khẩu mới để xác nhận.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }
    if (currentPassword !== user.password) {
      setError("Mật khẩu hiện tại không chính xác.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile(user.id, { password: newPassword });
      dispatch(updateProfile({ password: newPassword }));
      toast.success("Đổi mật khẩu thành công!", { toastId: "profile-password" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Đổi mật khẩu chưa thành công. Vui lòng thử lại sau.");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearWishlist());
    dispatch(clearOrders());
  };

  return (
    <Container className="py-5 settings-container">
      {/* Page Header with inline Back Button */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Cài đặt tài khoản</h1>
          <p className="text-secondary small mb-0">
            Quản lý thông tin cá nhân, lịch sử đơn hàng và bảo mật tài khoản.
          </p>
        </div>
        <Button
          as={Link}
          to={isStaffOrAdmin ? "/admin" : "/"}
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>{isStaffOrAdmin ? "Quay lại trang quản trị" : "Quay lại trang chủ"}</span>
        </Button>
      </div>

      <Row className="g-4">
        {/* Navigation Sidebar */}
        <Col md={3}>
          <div className="sticky-top" style={{ top: "80px" }}>
            <Card className="shadow-sm border-0 bg-white">
              <Card.Body className="p-3">
                <nav className="settings-nav">
                  <button
                    type="button"
                    className={`settings-nav-link ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("profile");
                      setError("");
                    }}
                  >
                    Thông tin cá nhân
                  </button>

                  {!isStaffOrAdmin && (
                    <button
                      type="button"
                      className={`settings-nav-link justify-content-between ${activeTab === "orders" ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab("orders");
                        setError("");
                      }}
                    >
                      <span>Đơn hàng của tôi</span>
                      {orders && orders.length > 0 && (
                        <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">
                          {orders.length}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    className={`settings-nav-link ${activeTab === "password" ? "active" : ""}`}
                    onClick={() => {
                      setActiveTab("password");
                      setError("");
                    }}
                  >
                    Đổi mật khẩu
                  </button>

                  <hr className="my-2 border-secondary-subtle" />

                  <button
                    type="button"
                    className="settings-nav-link text-danger"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </nav>
              </Card.Body>
            </Card>
          </div>
        </Col>

        {/* Tab Content Panel */}
        <Col md={9}>
          <Card className="settings-card profile-content-scroll shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              {error && (
                <Alert variant="danger" className="py-2 mb-4 small">
                  {error}
                </Alert>
              )}

              {/* TAB 1: PERSONAL INFORMATION */}
              {activeTab === "profile" && (
                <div>
                  {/* User Summary Bar */}
                  <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom">
                    <div className="user-avatar-initials">
                      {getUserInitials(user)}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-dark text-truncate">
                        {user?.name || "Member"}
                      </div>
                      <div className="text-secondary small text-truncate">
                        {user?.email}
                      </div>
                    </div>
                    <span className="badge bg-light text-secondary border small">
                      {user?.role === "admin" ? "Quản trị viên" : user?.role === "staff" ? "Nhân viên" : "Khách hàng"}
                    </span>
                  </div>

                  <Form onSubmit={handleUpdateProfile} style={{ maxWidth: "560px" }} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Địa chỉ Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="form-control-clean"
                      />
                      <Form.Text className="text-muted small">
                        Email được liên kết bảo mật với tài khoản của bạn và không thể thay đổi.
                      </Form.Text>
                    </Form.Group>

                    <Row className="g-3 mb-3">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1">
                            Họ và tên
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập đầy đủ họ và tên"
                            className="form-control-clean"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1">
                            Số điện thoại
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="VD: 0912345678"
                            className="form-control-clean"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Địa chỉ nhận hàng mặc định
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        className="form-control-clean"
                        required
                      />
                    </Form.Group>

                    <Button
                      variant="dark"
                      type="submit"
                      disabled={loading}
                      className="btn-clean px-4 py-2"
                    >
                      {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </Form>
                </div>
              )}

              {/* TAB 2: MY ORDERS */}
              {activeTab === "orders" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
                    <div>
                      <h2 className="h5 fw-bold text-dark mb-1">Lịch sử đơn hàng</h2>
                      <p className="text-secondary small mb-0">
                        Theo dõi tình trạng vận chuyển và đơn hàng đã đặt.
                      </p>
                    </div>
                    {orders && orders.length > 0 && (
                      <span className="badge bg-light text-secondary border">
                        {orders.length} đơn hàng
                      </span>
                    )}
                  </div>

                  {orders && orders.length > 0 ? (
                    <>
                      <Table hover responsive className="mb-0 align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Mã đơn</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th className="text-end">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="fw-semibold text-dark">#{order.id}</td>
                              <td className="text-secondary">{formatDate(order.createdAt) || order.createdAt}</td>
                              <td className="fw-semibold text-dark">
                                {formatCurrency(order.totalPrice)}
                              </td>
                              <td>
                                <span className={`badge ${statusBadgeClasses[order.status] || "bg-light text-secondary border"}`}>
                                  {order.status === "Pending" ? "Chờ xử lý" :
                                   order.status === "Confirmed" ? "Đã xác nhận" :
                                   order.status === "Shipping" ? "Đang giao" :
                                   order.status === "Delivered" ? "Đã giao" :
                                   order.status === "Cancelled" ? "Đã hủy" :
                                   order.status === "Return Requested" ? "Đang yêu cầu trả hàng" :
                                   order.status === "Returned" ? "Đã trả hàng" : order.status}
                                </span>
                              </td>
                              <td className="text-end">
                                <Button
                                  as={Link}
                                  to={`/orders/${order.id}`}
                                  variant="outline-secondary"
                                  size="sm"
                                  className="btn-clean py-1 px-3"
                                >
                                  Xem chi tiết
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      {totalOrderPages > 1 && (
                        <div className="mt-3 d-flex justify-content-center">
                          <Pagination
                            currentPage={orderPage}
                            totalPages={totalOrderPages}
                            onPageChange={setOrderPage}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-5 text-secondary">
                      <p className="mb-3">Bạn chưa có đơn hàng nào.</p>
                      <Button as={Link} to="/books" variant="dark" size="sm" className="btn-clean px-3 py-2">
                        Khám phá sách hay
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CHANGE PASSWORD */}
              {activeTab === "password" && (
                <div>
                  <div className="pb-3 mb-4 border-bottom">
                    <h2 className="h5 fw-bold text-dark mb-1">Đổi mật khẩu</h2>
                    <p className="text-secondary small mb-0">
                      Tạo mật khẩu an toàn từ 6 đến 18 ký tự để bảo vệ tài khoản.
                    </p>
                  </div>

                  <Form onSubmit={handleChangePassword} style={{ maxWidth: "460px" }} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Mật khẩu hiện tại
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="form-control-clean pe-5"
                          required
                        />
                        <button
                          type="button"
                          className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                          style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            setShowCurrent((prev) => !prev);
                          }}
                          title={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          tabIndex={-1}
                        >
                          {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Mật khẩu mới
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới (6 - 18 ký tự)"
                          minLength={6}
                          maxLength={18}
                          className="form-control-clean pe-5"
                          required
                        />
                        <button
                          type="button"
                          className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                          style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            setShowNew((prev) => !prev);
                          }}
                          title={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          tabIndex={-1}
                        >
                          {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className={`small mt-1 ${isValidPassword(newPassword) ? "text-success" : "text-danger"}`}>
                          {isValidPassword(newPassword) ? "✓ Độ dài hợp lệ (6 - 18 ký tự)" : "✕ Mật khẩu phải từ 6 đến 18 ký tự"}
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Xác nhận mật khẩu mới
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          minLength={6}
                          maxLength={18}
                          className="form-control-clean pe-5"
                          required
                        />
                        <button
                          type="button"
                          className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                          style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.preventDefault();
                            setShowConfirm((prev) => !prev);
                          }}
                          title={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                          tabIndex={-1}
                        >
                          {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <div className={`small mt-1 ${confirmPassword === newPassword ? "text-success" : "text-danger"}`}>
                          {confirmPassword === newPassword ? "✓ Mật khẩu xác nhận trùng khớp" : "✕ Mật khẩu xác nhận không trùng khớp"}
                        </div>
                      )}
                    </Form.Group>

                    <Button
                      variant="dark"
                      type="submit"
                      disabled={loading}
                      className="btn-clean px-4 py-2"
                    >
                      {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </Button>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
