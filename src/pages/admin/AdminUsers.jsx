import { useState, useEffect } from "react";
import { Table, Button, Badge, Modal, Form, Row, Col } from "react-bootstrap";
import { useSelector } from "react-redux";
import userApi from "../../api/userApi";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "react-toastify";
import { FaBan, FaCheck, FaEdit } from "react-icons/fa";
import { USER_ROLES, matchesSearch } from "../../utils/helpers";

const ITEMS_PER_PAGE = 10;

const AdminUsers = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      // Chỉ hiển thị các tài khoản khách hàng (không bao gồm chính admin)
      setUsers((res.data || []).filter((u) => u.role !== USER_ROLES.ADMIN));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      toast.success(
        `Đã ${newStatus === "active" ? "mở khóa" : "khóa"} tài khoản "${selectedUser.name}" thành công!`
      );
      fetchUsers();
    } catch (err) {
      toast.error("Cập nhật trạng thái tài khoản chưa thành công.");
    }
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const handleOpenEditModal = (user) => {
    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa thông tin người dùng.");
      return;
    }
    if (String(user.id) === String(currentUser?.id)) {
      toast.error("Để sửa thông tin của chính mình, vui lòng vào trang Hồ sơ cá nhân (Profile).");
      return;
    }
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    if (!isAdmin) {
      toast.error("Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa thông tin người dùng.");
      return;
    }
    if (!editForm.name?.trim()) {
      toast.error("Họ và tên không được để trống.");
      return;
    }
    try {
      await userApi.update(editingUser.id, {
        name: editForm.name.trim(),
        phone: (editForm.phone || "").trim(),
        address: (editForm.address || "").trim(),
      });
      toast.success(`Cập nhật thông tin cho "${editForm.name.trim()}" thành công!`);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thông tin chưa thành công. Vui lòng thử lại.");
    }
  };

  let filtered = users.filter(
    (u) =>
      matchesSearch(u.name, searchQuery) ||
      matchesSearch(u.email, searchQuery) ||
      matchesSearch(u.phone, searchQuery) ||
      matchesSearch(u.address, searchQuery)
  );

  if (filterStatus !== "all") {
    filtered = filtered.filter((u) => u.status === filterStatus);
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Quản lý người dùng</h2>
          <p className="text-muted small mb-0">Quản lý danh sách tài khoản khách hàng, cập nhật thông tin và trạng thái tài khoản.</p>
        </div>
      </div>

      <Row className="mb-3 g-2">
        <Col md={6}>
          <SearchBar
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc địa chỉ..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="blocked">Đã bị khóa</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "65px" }}>STT</th>
            <th style={{ minWidth: "180px" }}>Họ và tên</th>
            <th style={{ minWidth: "200px" }}>Email</th>
            <th style={{ width: "135px" }}>Số điện thoại</th>
            <th style={{ minWidth: "200px" }}>Địa chỉ</th>
            <th style={{ width: "130px" }}>Trạng thái</th>
            <th className="col-actions text-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((user, index) => (
            <tr key={user.id}>
              <td><strong>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</strong></td>
              <td className="fw-semibold text-dark">{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone || <span className="text-muted">Chưa cập nhật</span>}</td>
              <td>{user.address || <span className="text-muted">Chưa cập nhật</span>}</td>
              <td>
                <Badge bg={user.status === "active" ? "success" : "danger"}>
                  {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                </Badge>
              </td>
              <td className="col-actions text-nowrap">
                <div className="d-inline-flex gap-1 align-items-center">
                  {isAdmin && String(user.id) !== String(currentUser?.id) && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="btn-action-icon"
                      onClick={() => handleOpenEditModal(user)}
                      title="Chỉnh sửa thông tin khách hàng"
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
                        <>
                          <FaBan className="me-1 flex-shrink-0" />
                          <span>Khóa</span>
                        </>
                      ) : (
                        <>
                          <FaCheck className="me-1 flex-shrink-0" />
                          <span>Mở khóa</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted py-4">
                Không tìm thấy người dùng nào phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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

      {/* Modal Chỉnh sửa thông tin người dùng */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">Chỉnh sửa thông tin khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Họ và tên <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Nhập họ và tên"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Địa chỉ Email</Form.Label>
            <Form.Control
              value={editingUser?.email || ""}
              disabled
              readOnly
              className="bg-light text-muted"
            />
            <Form.Text className="text-muted small">
              Email là tài khoản định danh đăng nhập, không thể thay đổi.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Số điện thoại</Form.Label>
            <Form.Control
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="Nhập số điện thoại (VD: 0912345678)"
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="Nhập địa chỉ nhận hàng"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Lưu thay đổi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsers;
