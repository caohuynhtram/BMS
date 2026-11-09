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

  const isAdmin = user?.role === "admin";

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
      setError("Please enter your full name.");
      return;
    }
    if (!isValidFullName(name)) {
      setError("Full name must contain at least 2 words and only letters.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Invalid phone number. Please enter a 10-digit number (e.g. 0912345678).");
      return;
    }
    if (!address.trim()) {
      setError("Please enter your shipping address.");
      return;
    }
    if (!isValidAddress(address)) {
      setError("Please enter a more detailed shipping address (at least 2 words).");
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
      toast.success("Profile updated successfully.", { toastId: "profile-update" });
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again later.");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setError("New password must be between 6 and 18 characters.");
      return;
    }
    if (!confirmPassword) {
      setError("Please re-enter your new password to confirm.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (currentPassword !== user.password) {
      setError("Current password is incorrect.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your current password.");
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile(user.id, { password: newPassword });
      dispatch(updateProfile({ password: newPassword }));
      toast.success("Password changed successfully!", { toastId: "profile-password" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Failed to change password. Please try again later.");
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
          <h1 className="h4 fw-bold text-dark mb-1">Account Settings</h1>
          <p className="text-secondary small mb-0">
            Manage your personal information, order history, and account security.
          </p>
        </div>
        <Button
          as={Link}
          to={isAdmin ? "/admin" : "/"}
          variant="outline-secondary"
          size="sm"
          className="btn-back d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2 flex-shrink-0" />
          <span>{isAdmin ? "Back to Admin Dashboard" : "Back to Home"}</span>
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
                    Profile Information
                  </button>

                  {!isAdmin && (
                    <button
                      type="button"
                      className={`settings-nav-link justify-content-between ${activeTab === "orders" ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab("orders");
                        setError("");
                      }}
                    >
                      <span>My Orders</span>
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
                    Change Password
                  </button>

                  <hr className="my-2 border-secondary-subtle" />

                  <button
                    type="button"
                    className="settings-nav-link text-danger"
                    onClick={handleLogout}
                  >
                    Logout
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
                      {user?.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </div>

                  <Form onSubmit={handleUpdateProfile} style={{ maxWidth: "560px" }} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="form-control-clean"
                      />
                      <Form.Text className="text-muted small">
                        Email is securely linked to your account and cannot be changed.
                      </Form.Text>
                    </Form.Group>

                    <Row className="g-3 mb-3">
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1">
                            Full Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            className="form-control-clean"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary mb-1">
                            Phone Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 0912345678"
                            className="form-control-clean"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Default Shipping Address
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address, ward, district, city/province"
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
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </Form>
                </div>
              )}

              {/* TAB 2: MY ORDERS */}
              {activeTab === "orders" && (
                <div>
                  <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
                    <div>
                      <h2 className="h5 fw-bold text-dark mb-1">Order History</h2>
                      <p className="text-secondary small mb-0">
                        Track your orders and shipping status.
                      </p>
                    </div>
                    {orders && orders.length > 0 && (
                      <span className="badge bg-light text-secondary border">
                        {orders.length} {orders.length === 1 ? "order" : "orders"}
                      </span>
                    )}
                  </div>

                  {orders && orders.length > 0 ? (
                    <>
                      <Table hover responsive className="mb-0 align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "135px", whiteSpace: "nowrap" }} className="text-nowrap">Order ID</th>
                            <th style={{ width: "120px", whiteSpace: "nowrap" }}>Date</th>
                            <th style={{ minWidth: "110px" }}>Total</th>
                            <th style={{ minWidth: "120px" }}>Status</th>
                            <th className="text-end" style={{ width: "130px", whiteSpace: "nowrap" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="fw-semibold text-dark text-nowrap" style={{ whiteSpace: "nowrap" }}>
                                #{String(order.orderCode || order.id).replace(/^#/, "")}
                              </td>
                              <td className="text-secondary">{formatDate(order.createdAt) || order.createdAt}</td>
                              <td className="fw-semibold text-dark">
                                {formatCurrency(order.totalPrice)}
                              </td>
                              <td>
                                <span className={`badge ${statusBadgeClasses[order.status] || "bg-light text-secondary border"}`}>
                                  {order.status === "Pending" ? "Pending" :
                                   order.status === "Confirmed" ? "Confirmed" :
                                   order.status === "Shipping" ? "Shipping" :
                                   order.status === "Delivered" ? "Delivered" :
                                   order.status === "Cancelled" ? "Cancelled" :
                                   order.status === "Return Requested" ? "Return Requested" :
                                   order.status === "Returned" ? "Returned" : order.status}
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
                                  View Details
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
                      <p className="mb-3">You have not placed any orders yet.</p>
                      <Button as={Link} to="/books" variant="dark" size="sm" className="btn-clean px-3 py-2">
                        Explore Books
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CHANGE PASSWORD */}
              {activeTab === "password" && (
                <div>
                  <div className="pb-3 mb-4 border-bottom">
                    <h2 className="h5 fw-bold text-dark mb-1">Change Password</h2>
                    <p className="text-secondary small mb-0">
                      Create a secure password between 6 and 18 characters to protect your account.
                    </p>
                  </div>

                  <Form onSubmit={handleChangePassword} style={{ maxWidth: "460px" }} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Current Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
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
                          title={showCurrent ? "Hide password" : "Show password"}
                          aria-label={showCurrent ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        New Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (6 - 18 characters)"
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
                          title={showNew ? "Hide password" : "Show password"}
                          aria-label={showNew ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className={`small mt-1 ${isValidPassword(newPassword) ? "text-success" : "text-danger"}`}>
                          {isValidPassword(newPassword) ? "✓ Valid password length (6 - 18 characters)" : "✕ Password must be between 6 and 18 characters"}
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-semibold text-secondary mb-1">
                        Confirm New Password
                      </Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
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
                          title={showConfirm ? "Hide password" : "Show password"}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <div className={`small mt-1 ${confirmPassword === newPassword ? "text-success" : "text-danger"}`}>
                          {confirmPassword === newPassword ? "✓ Passwords match" : "✕ Passwords do not match"}
                        </div>
                      )}
                    </Form.Group>

                    <Button
                      variant="dark"
                      type="submit"
                      disabled={loading}
                      className="btn-clean px-4 py-2"
                    >
                      {loading ? "Updating..." : "Update Password"}
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
