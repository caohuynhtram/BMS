import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Row, Col } from "react-bootstrap";
import bookApi from "../../api/bookApi";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaUndo } from "react-icons/fa";
import { BOOK_STATUS, formatCurrency, matchesSearch } from "../../utils/helpers";

const BOOKS_PER_PAGE = 10;

const emptyBook = {
  title: "", author: "", categoryId: "", price: "",
  description: "", stock: "", image: "", rating: 0, reviewCount: 0,
  status: BOOK_STATUS.ACTIVE,
};

const RequiredLabel = ({ children }) => (
  <Form.Label className="fw-semibold">
    {children} <span className="text-danger">*</span>
  </Form.Label>
);

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState(emptyBook);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    try {
      const [booksRes, catRes] = await Promise.all([
        bookApi.getAll(), bookApi.getCategories(),
      ]);
      setBooks(booksRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let parsed = value;
    if (name === "price") {
      parsed = value === "" ? "" : Math.max(0, Number(value));
    } else if (name === "stock") {
      parsed = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
    }
    setFormData((prev) => {
      const updated = { ...prev, [name]: parsed };
      if (name === "stock") {
        const stockNum = Number(parsed) || 0;
        if (stockNum === 0 && updated.status === BOOK_STATUS.ACTIVE) {
          updated.status = BOOK_STATUS.OUT_OF_STOCK;
        } else if (stockNum > 0 && updated.status === BOOK_STATUS.OUT_OF_STOCK) {
          updated.status = BOOK_STATUS.ACTIVE;
        }
      }
      if (name === "status") {
        if (parsed === BOOK_STATUS.ACTIVE && Number(updated.stock) === 0) {
          toast.warning("Kho hàng đang bằng 0, sách đã được chuyển sang trạng thái Hết hàng.");
          updated.status = BOOK_STATUS.OUT_OF_STOCK;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error("Vui lòng nhập tựa đề sách.");
      return;
    }
    if (!formData.author?.trim()) {
      toast.error("Vui lòng nhập tên tác giả.");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Vui lòng chọn danh mục cho sách.");
      return;
    }
    if (formData.price === "" || Number(formData.price) < 0) {
      toast.error("Giá bán phải lớn hơn hoặc bằng 0.");
      return;
    }
    if (formData.stock === "" || Number(formData.stock) < 0) {
      toast.error("Số lượng trong kho không được là số âm.");
      return;
    }

    const isInactive = formData.status === BOOK_STATUS.INACTIVE;
    const stockNum = Math.max(0, parseInt(formData.stock, 10) || 0);
    let finalStatus;

    if (isInactive) {
      finalStatus = BOOK_STATUS.INACTIVE;
    } else if (stockNum === 0 || formData.status === BOOK_STATUS.OUT_OF_STOCK) {
      finalStatus = BOOK_STATUS.OUT_OF_STOCK;
    } else {
      finalStatus = BOOK_STATUS.ACTIVE;
    }

    try {
      const payload = {
        ...formData,
        title: (formData.title || "").trim(),
        author: (formData.author || "").trim(),
        price: Number(formData.price) || 0,
        stock: stockNum,
        categoryId: String(formData.categoryId || ""),
        description: (formData.description || "").trim(),
        image: (formData.image || "").trim(),
        rating: Number(formData.rating || 0),
        reviewCount: Number(formData.reviewCount || 0),
        status: finalStatus,
        isDeleted: isInactive,
      };

      if (editingBook) {
        await bookApi.update(editingBook.id, payload);
        toast.success("Cập nhật thông tin sách thành công!");
      } else {
        const numericIds = books
          .map((b) => Number(b.id))
          .filter((n) => !isNaN(n) && Number.isInteger(n));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : books.length + 1;
        payload.id = String(nextId);

        await bookApi.create(payload);
        toast.success("Thêm sách mới thành công!");
      }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error("Thao tác không thành công. Vui lòng thử lại sau."); }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    const initialStatus = book.isDeleted || book.status === BOOK_STATUS.INACTIVE
      ? BOOK_STATUS.INACTIVE
      : book.status === BOOK_STATUS.OUT_OF_STOCK || book.stock === 0
      ? BOOK_STATUS.OUT_OF_STOCK
      : BOOK_STATUS.ACTIVE;
    setFormData({ ...book, status: initialStatus });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await bookApi.update(deleteId, { isDeleted: true, status: BOOK_STATUS.INACTIVE });
      toast.success("Đã ẩn sách khỏi cửa hàng thành công!");
      setShowDeleteModal(false);
      fetchData();
    } catch (err) { toast.error("Không thể xóa sách lúc này. Vui lòng thử lại sau."); }
  };

  const handleRestore = async (book) => {
    try {
      const bookObj = typeof book === "object" ? book : books.find((b) => String(b.id) === String(book));
      const targetStatus = (bookObj?.stock || 0) > 0 ? BOOK_STATUS.ACTIVE : BOOK_STATUS.OUT_OF_STOCK;
      await bookApi.update(bookObj?.id || book, { isDeleted: false, status: targetStatus });
      toast.success("Đã khôi phục và mở bán sách thành công!");
      fetchData();
    } catch (err) { toast.error("Khôi phục sách chưa thành công. Vui lòng thử lại sau."); }
  };

  const handleAdd = () => {
    setEditingBook(null);
    setFormData(emptyBook);
    setShowModal(true);
  };

  const getCategoryName = (id) =>
    categories.find((c) => String(c.id) === String(id))?.name || "N/A";

  let filtered = books.filter((b) =>
    matchesSearch(b.title, searchQuery) ||
    matchesSearch(b.author, searchQuery)
  );
  if (filterStatus !== "all") {
    if (filterStatus === "Inactive") {
      filtered = filtered.filter((b) => b.isDeleted || b.status === BOOK_STATUS.INACTIVE);
    } else {
      filtered = filtered.filter((b) => b.status === filterStatus && !b.isDeleted);
    }
  }
  if (filterCategory !== "all") {
    filtered = filtered.filter((b) => String(b.categoryId) === filterCategory);
  }

  filtered.sort((a, b) => {
    const aInactive = a.isDeleted || a.status === BOOK_STATUS.INACTIVE ? 1 : 0;
    const bInactive = b.isDeleted || b.status === BOOK_STATUS.INACTIVE ? 1 : 0;
    return aInactive - bInactive;
  });

  const totalPages = Math.ceil(filtered.length / BOOKS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  const getStatusBadge = (book) => {
    if (book.isDeleted || book.status === BOOK_STATUS.INACTIVE) {
      return <Badge bg="danger">Ngừng bán</Badge>;
    }
    if (book.status === BOOK_STATUS.OUT_OF_STOCK || book.stock === 0) {
      return <Badge bg="warning" text="dark">Hết hàng</Badge>;
    }
    return <Badge bg="success">Đang bán</Badge>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark mb-0">Quản lý sách</h2>
        <Button variant="primary" onClick={handleAdd} className="d-inline-flex align-items-center">
          <FaPlus className="me-2 flex-shrink-0" /> Thêm sách mới
        </Button>
      </div>

      <Row className="mb-3 g-2 align-items-end">
        <Col md={6}>
          <SearchBar onSearch={(q) => { setSearchQuery(q); setCurrentPage(1); }} placeholder="Tìm theo tên sách hoặc tác giả..." />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Active">Đang bán</option>
            <option value="Out of Stock">Hết hàng</option>
            <option value="Inactive">Ngừng bán / Đã xóa</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.filter((c) => !c.isDeleted).map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "65px" }}>STT</th>
            <th style={{ minWidth: "220px" }}>Tên sách</th>
            <th style={{ minWidth: "240px" }}>Tác giả</th>
            <th style={{ width: "135px" }}>Danh mục</th>
            <th style={{ width: "90px" }}>Giá</th>
            <th style={{ width: "75px" }}>Kho</th>
            <th style={{ width: "115px" }}>Trạng thái</th>
            <th className="col-actions text-nowrap">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((book, index) => (
            <tr
              key={book.id}
              className={book.isDeleted || book.status === BOOK_STATUS.INACTIVE ? "table-danger" : ""}
            >
              <td><strong>{(currentPage - 1) * BOOKS_PER_PAGE + index + 1}</strong></td>
              <td className="fw-semibold text-dark">{book.title}</td>
              <td>{book.author}</td>
              <td><Badge bg="secondary">{getCategoryName(book.categoryId)}</Badge></td>
              <td className="fw-bold text-primary">{formatCurrency(book.price)}</td>
              <td>
                <Badge bg={book.stock > 0 ? "success" : "danger"}>
                  {book.stock}
                </Badge>
              </td>
              <td>{getStatusBadge(book)}</td>
              <td className="col-actions text-nowrap">
                <div className="d-inline-flex gap-1 align-items-center">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="btn-action-icon"
                    onClick={() => handleEdit(book)}
                    title="Chỉnh sửa"
                  >
                    <FaEdit />
                  </Button>
                  {book.isDeleted ? (
                    <Button
                      size="sm"
                      variant="outline-success"
                      className="btn-action-icon"
                      onClick={() => handleRestore(book.id)}
                      title="Khôi phục sách"
                    >
                      <FaUndo />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="btn-action-icon"
                      onClick={() => { setDeleteId(book.id); setShowDeleteModal(true); }}
                      title="Ẩn / Xóa sách"
                    >
                      <FaTrash />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {paginated.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center text-muted py-3">Không tìm thấy cuốn sách nào.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">
            {editingBook ? "Chỉnh sửa thông tin sách" : "Thêm sách mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            <Form.Group className="mb-3">
              <RequiredLabel>Tên sách</RequiredLabel>
              <Form.Control name="title" value={formData.title} onChange={handleChange} placeholder="Nhập tựa đề sách" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <RequiredLabel>Tác giả</RequiredLabel>
              <Form.Control name="author" value={formData.author} onChange={handleChange} placeholder="Nhập tên tác giả" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <RequiredLabel>Danh mục sách</RequiredLabel>
              <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                {categories
                  .filter((c) => !c.isDeleted || String(c.id) === String(formData.categoryId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.isDeleted ? " (Đã xóa)" : ""}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <RequiredLabel>Giá bán ($)</RequiredLabel>
                <Form.Control
                  type="number" name="price" value={formData.price}
                  onChange={handleChange} required min={0} step="0.01"
                />
              </Col>
              <Col md={6}>
                <RequiredLabel>Số lượng trong kho</RequiredLabel>
                <Form.Control
                  type="number" name="stock" value={formData.stock}
                  onChange={handleChange} required min={0}
                />
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Trạng thái</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Đang bán</option>
                <option value="Out of Stock">Hết hàng</option>
                <option value="Inactive">Ngừng bán</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Đường dẫn hình ảnh (URL)</Form.Label>
              <Form.Control name="image" value={formData.image} onChange={handleChange} placeholder="https://..." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Mô tả nội dung</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} placeholder="Giới thiệu sơ lược về cuốn sách..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button type="submit" variant="primary">{editingBook ? "Cập nhật" : "Thêm mới"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Xác nhận ẩn sách khỏi cửa hàng"
        message="Bạn có chắc chắn muốn xóa cuốn sách này không? Sách sẽ được ẩn khỏi trang bán hàng nhưng vẫn được lưu giữ trong lịch sử các đơn hàng trước đây."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />
    </div>
  );
};

export default AdminBooks;
