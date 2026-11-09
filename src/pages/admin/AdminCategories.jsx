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
        toast.error("Tên danh mục không được để trống.");
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
        toast.error(`Danh mục "${trimmedName}" đã tồn tại! Vui lòng chọn tên khác.`);
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
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const numericIds = categories
          .map((c) => Number(c.id))
          .filter((n) => !isNaN(n) && Number.isInteger(n));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : categories.length + 1;
        payload.id = String(nextId);

        await bookApi.createCategory(payload);
        toast.success("Thêm danh mục mới thành công!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) { toast.error("Thao tác không thành công. Vui lòng thử lại sau."); }
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
      toast.success("Đã ẩn danh mục khỏi cửa hàng thành công!");
      setShowDeleteModal(false);
      fetchCategories();
    } catch (err) { toast.error("Xóa danh mục chưa thành công. Vui lòng thử lại sau."); }
  };

  const handleRestore = async (catId) => {
    try {
      await bookApi.updateCategory(catId, { isDeleted: false, status: CATEGORY_STATUS.ACTIVE });
      toast.success("Khôi phục danh mục thành công!");
      fetchCategories();
    } catch (err) { toast.error("Khôi phục danh mục chưa thành công. Vui lòng thử lại sau."); }
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
        <h2 className="fw-bold text-dark mb-0">Quản lý danh mục</h2>
        <Button variant="primary" onClick={handleAdd} className="d-inline-flex align-items-center">
          <FaPlus className="me-2 flex-shrink-0" /> Thêm danh mục
        </Button>
      </div>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar
            onSearch={(q) => { setSearchTerm(q); setCurrentPage(1); }}
            placeholder="Tìm kiếm danh mục..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Vô hiệu hóa / Đã ẩn</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "70px" }}>STT</th>
            <th>Tên danh mục</th>
            <th style={{ width: "160px" }}>Trạng thái</th>
            <th className="col-actions text-nowrap">Thao tác</th>
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
                    {isInactive ? "Vô hiệu hóa" : "Hoạt động"}
                  </Badge>
                </td>
                <td className="col-actions text-nowrap">
                  <div className="d-inline-flex gap-1 align-items-center">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="btn-action-icon"
                      onClick={() => handleEdit(cat)}
                      title="Chỉnh sửa"
                    >
                      <FaEdit />
                    </Button>
                    {isInactive ? (
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="btn-action-icon"
                        onClick={() => handleRestore(cat.id)}
                        title="Khôi phục danh mục"
                      >
                        <FaUndo />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="btn-action-icon"
                        onClick={() => { setDeleteId(cat.id); setShowDeleteModal(true); }}
                        title="Ẩn / Vô hiệu hóa danh mục"
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
              <td colSpan={4} className="text-center text-muted py-3">Không tìm thấy danh mục nào.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Tên danh mục <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên danh mục..." required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Trạng thái</Form.Label>
              <Form.Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value={CATEGORY_STATUS.ACTIVE}>Hoạt động</option>
                <option value={CATEGORY_STATUS.INACTIVE}>Vô hiệu hóa (Ngừng hiển thị)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button type="submit" variant="primary">{editing ? "Cập nhật" : "Thêm mới"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Xác nhận vô hiệu hóa danh mục"
        message="Bạn có chắc chắn muốn vô hiệu hóa danh mục này không? Danh mục sẽ được ẩn khỏi cửa hàng nhưng các cuốn sách thuộc danh mục vẫn được lưu trữ dữ liệu an toàn."
        confirmText="Xác nhận vô hiệu hóa"
        cancelText="Hủy bỏ"
      />
    </div>
  );
};

export default AdminCategories;
