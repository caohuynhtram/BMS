import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Row, Col } from "react-bootstrap";
import bookApi from "../../api/bookApi";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/ConfirmModal";
import SearchBar from "../../components/SearchBar";
import { matchesSearch, CATEGORY_STATUS } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaUndo } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(CATEGORY_STATUS.ACTIVE);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCategories = async () => {
    try {
      const res = await bookApi.getCategories();
      setCategories(res.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Category name cannot be empty.");
        return;
      }
      const isDuplicate = categories.some(
        (c) =>
          (!editing || String(c.id) !== String(editing.id)) &&
          !c.isDeleted &&
          c.status !== CATEGORY_STATUS.INACTIVE &&
          c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        toast.error(`Category "${trimmedName}" already exists! Please choose another name.`);
        return;
      }

      const isInactive = status === CATEGORY_STATUS.INACTIVE;
      const payload = {
        name: trimmedName,
        status: isInactive ? CATEGORY_STATUS.INACTIVE : CATEGORY_STATUS.ACTIVE,
        isDeleted: isInactive,
      };

      if (editing) {
        await bookApi.updateCategory(editing.id, payload);
        toast.success("Category updated successfully!");
      } else {
        const numericIds = categories
          .map((c) => Number(c.id))
          .filter((n) => !isNaN(n) && Number.isInteger(n));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : categories.length + 1;
        payload.id = String(nextId);

        await bookApi.createCategory(payload);
        toast.success("New category added successfully!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) { toast.error("Action failed. Please try again later."); }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setStatus(cat.isDeleted || cat.status === CATEGORY_STATUS.INACTIVE ? CATEGORY_STATUS.INACTIVE : CATEGORY_STATUS.ACTIVE);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await bookApi.updateCategory(deleteId, { isDeleted: true, status: CATEGORY_STATUS.INACTIVE });
      toast.success("Category deactivated successfully!");
      setShowDeleteModal(false);
      fetchCategories();
    } catch (err) { toast.error("Failed to delete category. Please try again later."); }
  };

  const handleRestore = async (catId) => {
    try {
      await bookApi.updateCategory(catId, { isDeleted: false, status: CATEGORY_STATUS.ACTIVE });
      toast.success("Category restored successfully!");
      fetchCategories();
    } catch (err) { toast.error("Failed to restore category. Please try again later."); }
  };

  const handleAdd = () => {
    setEditing(null);
    setName("");
    setStatus(CATEGORY_STATUS.ACTIVE);
    setShowModal(true);
  };

  let filtered = categories.filter((cat) =>
    matchesSearch(cat.name, searchTerm)
  );
  if (filterStatus === "active") filtered = filtered.filter((c) => !c.isDeleted && c.status !== CATEGORY_STATUS.INACTIVE);
  if (filterStatus === "inactive") filtered = filtered.filter((c) => c.isDeleted || c.status === CATEGORY_STATUS.INACTIVE);

  filtered.sort((a, b) => {
    const aInactive = a.isDeleted || a.status === CATEGORY_STATUS.INACTIVE ? 1 : 0;
    const bInactive = b.isDeleted || b.status === CATEGORY_STATUS.INACTIVE ? 1 : 0;
    if (aInactive !== bInactive) return aInactive - bInactive;
    return String(a.id).localeCompare(String(b.id));
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark mb-0">Category Management</h2>
        <Button variant="primary" onClick={handleAdd} className="d-inline-flex align-items-center">
          <FaPlus className="me-2 flex-shrink-0" /> Add Category
        </Button>
      </div>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar
            onSearch={(q) => { setSearchTerm(q); setCurrentPage(1); }}
            placeholder="Search categories..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive / Hidden</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "70px" }}>#</th>
            <th>Category Name</th>
            <th style={{ width: "160px" }}>Status</th>
            <th className="col-actions text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((cat, index) => {
            const isInactive = cat.isDeleted || cat.status === CATEGORY_STATUS.INACTIVE;
            return (
              <tr key={cat.id} className={isInactive ? "table-danger" : ""}>
                <td><strong>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</strong></td>
                <td className="fw-semibold text-dark">{cat.name}</td>
                <td>
                  <Badge bg={isInactive ? "danger" : "success"}>
                    {isInactive ? "Inactive" : "Active"}
                  </Badge>
                </td>
                <td className="col-actions text-nowrap">
                  <div className="d-inline-flex gap-1 align-items-center">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="btn-action-icon"
                      onClick={() => handleEdit(cat)}
                      title="Edit"
                    >
                      <FaEdit />
                    </Button>
                    {isInactive ? (
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="btn-action-icon"
                        onClick={() => handleRestore(cat.id)}
                        title="Restore category"
                      >
                        <FaUndo />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="btn-action-icon"
                        onClick={() => { setDeleteId(cat.id); setShowDeleteModal(true); }}
                        title="Deactivate category"
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-muted py-3">No categories found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">{editing ? "Edit Category" : "Add New Category"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Category Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter category name..." required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value={CATEGORY_STATUS.ACTIVE}>Active</option>
                <option value={CATEGORY_STATUS.INACTIVE}>Inactive (Hidden)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editing ? "Update" : "Add"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirm Deactivate Category"
        message="Are you sure you want to deactivate this category? It will be hidden from the store, but books in this category will remain safe."
        confirmText="Deactivate"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminCategories;
