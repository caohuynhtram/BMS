import { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Form, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import userApi from "../../api/userApi";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "react-toastify";
import { FaBan, FaCheck, FaPlus, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { USER_ROLES, matchesSearch, isValidEmail } from "../../utils/helpers";

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [staffError, setStaffError] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleUser, setRoleUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers((res.data || []).filter((u) => u.role !== USER_ROLES.ADMIN));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenConfirm = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      toast.warning("Bạn không thể tự khóa tài khoản của chính mình!");
      return;
    }
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUser) return;
    if (String(selectedUser.id) === String(currentUser?.id)) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình!");
      setShowConfirmModal(false);
      setSelectedUser(null);
      return;
    }
    const newStatus = selectedUser.status === "active" ? "blocked" : "active";
    try {
      await userApi.updateStatus(selectedUser.id, newStatus);
      toast.success(`Đã ${newStatus === "active" ? "mở khóa" : "khóa"} tài khoản "${selectedUser.name}" thành công!`);
      fetchUsers();
    } catch (err) { toast.error("Cập nhật trạng thái tài khoản chưa thành công."); }
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setStaffError("");

    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền tạo tài khoản nhân viên.");
      return;
    }

    if (!staffForm.name?.trim()) {
      setStaffError("Vui lòng nhập họ và tên nhân viên.");
      return;
    }
    if (!staffForm.email?.trim()) {
      setStaffError("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!isValidEmail(staffForm.email)) {
      setStaffError("Định dạng email không hợp lệ (VD: staff@example.com).");
      return;
    }
    if (!staffForm.password) {
      setStaffError("Vui lòng nhập mật khẩu ban đầu.");
      return;
    }
    if (staffForm.password.length < 6 || staffForm.password.length > 18) {
      setStaffError("Mật khẩu ban đầu phải có độ dài từ 6 đến 18 ký tự.");
      return;
    }

    try {
      const normalizedEmail = staffForm.email.trim().toLowerCase();
      const res = await userApi.getAll();
      const exists = (res.data || []).find(
        (u) => (u.email || "").toLowerCase() === normalizedEmail
      );
      if (exists) {
        setStaffError("Địa chỉ email này đã tồn tại trong hệ thống.");
        return;
      }
      await userApi.create({
        ...staffForm,
        email: normalizedEmail,
        role: USER_ROLES.STAFF,
        status: "active",
      });
      toast.success("Tạo tài khoản nhân viên thành công!");
      setShowCreateStaffModal(false);
      setStaffForm({ name: "", email: "", password: "", phone: "", address: "" });
      fetchUsers();
    } catch (err) {
      toast.error("Tạo tài khoản nhân viên chưa thành công. Vui lòng thử lại.");
    }
  };

  const handleOpenRoleModal = (user) => {
    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền thay đổi vai trò người dùng.");
      return;
    }
    if (String(user.id) === String(currentUser?.id)) {
      toast.error("Bạn không thể tự thay đổi vai trò của chính mình!");
      return;
    }
    setRoleUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleUpdateRole = async () => {
    if (!roleUser || !newRole) return;
    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền thay đổi vai trò người dùng.");
      return;
    }
    if (String(roleUser.id) === String(currentUser?.id)) {
      toast.error("Bạn không thể tự thay đổi vai trò của chính mình!");
      return;
    }
    try {
      await userApi.update(roleUser.id, { role: newRole });
      const roleDisplayName = newRole === "staff" ? "Nhân viên" : "Khách hàng";
      toast.success(`Cập nhật vai trò "${roleDisplayName}" cho ${roleUser.name} thành công!`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (err) { toast.error("Cập nhật vai trò chưa thành công."); }
  };

  let filtered = users.filter(
    (u) =>
      matchesSearch(u.name, searchQuery) ||
      matchesSearch(u.email, searchQuery) ||
      matchesSearch(u.phone, searchQuery)
  );
  if (filterRole !== "all") {
    filtered = filtered.filter((u) => {
      if (filterRole === "customer") return u.role === "customer" || u.role === "user";
      return u.role === filterRole;
    });
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark mb-0">Quản lý người dùng</h2>
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowCreateStaffModal(true)} className="d-inline-flex align-items-center">
            <FaPlus className="me-2 flex-shrink-0" /> Thêm nhân viên
          </Button>
        )}
      </div>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar onSearch={(q) => { setSearchQuery(q); setCurrentPage(1); }} placeholder="Tìm kiếm người dùng theo tên, email hoặc số điện thoại..." />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "60px" }}>ID</th>
            <th style={{ minWidth: "180px" }}>Họ và tên</th>
            <th style={{ minWidth: "220px" }}>Email</th>
            <th style={{ width: "135px" }}>Số điện thoại</th>
            <th style={{ width: "115px" }}>Vai trò</th>
            <th style={{ width: "110px" }}>Trạng thái</th>
            <th className="col-actions text-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td className="fw-semibold text-dark">{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone || "Chưa cập nhật"}</td>
              <td>
                <Badge bg={user.role === "staff" ? "primary" : "secondary"}>
                  {user.role === "staff" ? "Nhân viên" : user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </Badge>
              </td>
              <td>
                <Badge bg={user.status === "active" ? "success" : "danger"}>
                  {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                </Badge>
              </td>
              <td className="col-actions text-nowrap">
                <div className="d-inline-flex gap-1 align-items-center">
                  {/* Chỉ Admin mới có quyền cập nhật vai trò và không được tự sửa vai trò của chính mình */}
                  {isAdmin && String(user.id) !== String(currentUser?.id) && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="btn-action-icon"
                      onClick={() => handleOpenRoleModal(user)}
                      title="Cập nhật vai trò"
                    >
                      <FaEdit />
                    </Button>
                  )}
                  {String(user.id) === String(currentUser?.id) ? (
                    <Badge bg="light" text="secondary" className="border px-2 py-1">
                      Tài khoản của bạn
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={user.status === "active" ? "outline-danger" : "outline-success"}
                      onClick={() => handleOpenConfirm(user)}
                      className="d-inline-flex align-items-center"
                    >
                      {user.status === "active" ? (
                        <><FaBan className="me-2 flex-shrink-0" /><span>Khóa</span></>
                      ) : (
                        <><FaCheck className="me-2 flex-shrink-0" /><span>Mở khóa</span></>
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr><td colSpan={7} className="text-center text-muted py-3">Không tìm thấy người dùng nào.</td></tr>
          )}
        </tbody>
      </Table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmToggle}
        title={selectedUser?.status === "active" ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản"}
        message={`Bạn có chắc chắn muốn ${
          selectedUser?.status === "active" ? "khóa" : "mở khóa"
        } tài khoản "${selectedUser?.name}" (${selectedUser?.email}) không?`}
        confirmText={selectedUser?.status === "active" ? "Khóa tài khoản" : "Mở khóa"}
        confirmVariant={selectedUser?.status === "active" ? "danger" : "success"}
      />

      <Modal show={showCreateStaffModal} onHide={() => setShowCreateStaffModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">Thêm tài khoản nhân viên</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateStaff} noValidate>
          <Modal.Body>
            {staffError && <div className="alert alert-danger py-2">{staffError}</div>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Họ và tên <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="Nhập họ và tên nhân viên"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Địa chỉ Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="VD: nhanvien@gmail.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mật khẩu ban đầu <span className="text-danger">*</span></Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showStaffPassword ? "text" : "password"}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pe-5"
                  required minLength={6}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y text-secondary border-0 bg-transparent shadow-none d-flex align-items-center justify-content-center p-2 me-2"
                  style={{ zIndex: 10, cursor: "pointer", width: "36px", height: "36px" }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowStaffPassword((prev) => !prev);
                  }}
                  title={showStaffPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-label={showStaffPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={-1}
                >
                  {showStaffPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
                  <Form.Control
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="VD: 0912345678"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
                  <Form.Control
                    value={staffForm.address}
                    onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                    placeholder="Tỉnh/Thành phố hoặc địa chỉ chi tiết"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateStaffModal(false)}>Hủy bỏ</Button>
            <Button type="submit" variant="primary">Tạo tài khoản</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">Cập nhật vai trò người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            Đang thay đổi vai trò cho: <strong className="text-dark">{roleUser?.name}</strong> ({roleUser?.email})
          </p>
          <Form.Group>
            <Form.Label className="fw-semibold">Vai trò mới</Form.Label>
            <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="customer">Khách hàng</option>
              <option value="staff">Nhân viên</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Hủy bỏ</Button>
          <Button variant="primary" onClick={handleUpdateRole}>Lưu thay đổi</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsers;
