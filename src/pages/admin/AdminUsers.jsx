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
      toast.warning("You cannot lock your own account!");
      return;
    }
    setSelectedUser(user);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUser) return;
    if (String(selectedUser.id) === String(currentUser?.id)) {
      toast.error("You cannot lock your own account!");
      setShowConfirmModal(false);
      setSelectedUser(null);
      return;
    }
    const newStatus = selectedUser.status === "active" ? "blocked" : "active";
    try {
      await userApi.updateStatus(selectedUser.id, newStatus);
      toast.success(
        `Successfully ${newStatus === "active" ? "unlocked" : "locked"} account "${selectedUser.name}"!`
      );
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update account status.");
    }
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const handleOpenEditModal = (user) => {
    if (!isAdmin) {
      toast.error("Only Administrators have permission to edit user information.");
      return;
    }
    if (String(user.id) === String(currentUser?.id)) {
      toast.error("To edit your own profile, please visit the Profile page.");
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
      toast.error("Only Administrators have permission to edit user information.");
      return;
    }
    if (!editForm.name?.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }
    try {
      await userApi.update(editingUser.id, {
        name: editForm.name.trim(),
        phone: (editForm.phone || "").trim(),
        address: (editForm.address || "").trim(),
      });
      toast.success(`Successfully updated information for "${editForm.name.trim()}"!`);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update information. Please try again.");
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
          <h2 className="fw-bold text-dark mb-1">User Management</h2>
          <p className="text-muted small mb-0">Manage customer accounts, update details, and manage account status.</p>
        </div>
      </div>

      <Row className="mb-3 g-2">
        <Col md={6}>
          <SearchBar
            onSearch={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, phone number, or address..."
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "65px" }}>#</th>
            <th style={{ minWidth: "180px" }}>Full Name</th>
            <th style={{ minWidth: "200px" }}>Email</th>
            <th style={{ width: "135px" }}>Phone</th>
            <th style={{ minWidth: "200px" }}>Address</th>
            <th style={{ width: "130px" }}>Status</th>
            <th className="col-actions text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((user, index) => (
            <tr key={user.id}>
              <td><strong>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</strong></td>
              <td className="fw-semibold text-dark">{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone || <span className="text-muted">Not updated</span>}</td>
              <td>{user.address || <span className="text-muted">Not updated</span>}</td>
              <td>
                <Badge bg={user.status === "active" ? "success" : "danger"}>
                  {user.status === "active" ? "Active" : "Blocked"}
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
                      title="Edit customer information"
                    >
                      <FaEdit />
                    </Button>
                  )}
                  {String(user.id) === String(currentUser?.id) ? (
                    <Badge bg="light" text="secondary" className="border px-2 py-1">
                      Your account
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
                          <span>Lock</span>
                        </>
                      ) : (
                        <>
                          <FaCheck className="me-1 flex-shrink-0" />
                          <span>Unlock</span>
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
                No matching users found.
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
        title={selectedUser?.status === "active" ? "Lock User Account" : "Unlock User Account"}
        message={`Are you sure you want to ${
          selectedUser?.status === "active" ? "lock" : "unlock"
        } account "${selectedUser?.name}" (${selectedUser?.email})?`}
        confirmText={selectedUser?.status === "active" ? "Lock Account" : "Unlock"}
        confirmVariant={selectedUser?.status === "active" ? "danger" : "success"}
      />

      {/* Modal Chỉnh sửa thông tin người dùng */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">Edit Customer Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Full Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter full name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Email Address</Form.Label>
            <Form.Control
              value={editingUser?.email || ""}
              disabled
              readOnly
              className="bg-light text-muted"
            />
            <Form.Text className="text-muted small">
              Email is the unique account identifier and cannot be changed.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Phone Number</Form.Label>
            <Form.Control
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="Enter phone number (e.g., 0912345678)"
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="fw-semibold">Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="Enter shipping address"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminUsers;
