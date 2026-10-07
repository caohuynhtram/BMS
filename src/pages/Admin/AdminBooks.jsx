import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Badge } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import bookApi from "../../api/bookApi";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const emptyBook = {
  title: "", author: "", categoryId: "", price: "",
  description: "", stock: "", image: "", rating: 0, reviewCount: 0,
};

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
      setBooks(booksRes.data);
      setCategories(catRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "price" || name === "stock" || name === "categoryId"
      ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await bookApi.update(editingBook.id, formData);
        toast.success("Book updated!");
      } else {
        await bookApi.create(formData);
        toast.success("Book created!");
      }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error("Operation failed"); }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData(book);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await bookApi.delete(deleteId);
      toast.success("Book deleted!");
      setShowDeleteModal(false);
      fetchData();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const handleAdd = () => {
    setEditingBook(null);
    setFormData(emptyBook);
    setShowModal(true);
  };

  const getCategoryName = (id) => categories.find((c) => String(c.id) === String(id))?.name || "N/A";

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Book Management</h2>
          <Button variant="primary" onClick={handleAdd}>
            <FaPlus className="me-1" /> Add Book
          </Button>
        </div>
        <div className="mb-3" style={{ maxWidth: "400px" }}>
          <SearchBar onSearch={setSearchQuery} placeholder="Search books..." />
        </div>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Title</th><th>Author</th><th>Category</th>
              <th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((book) => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td><Badge bg="secondary">{getCategoryName(book.categoryId)}</Badge></td>
                <td>${book.price}</td>
                <td>{book.stock}</td>
                <td>{book.rating}</td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEdit(book)}>
                    <FaEdit />
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => { setDeleteId(book.id); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Book Form Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingBook ? "Edit Book" : "Add New Book"}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" value={formData.title} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Author</Form.Label>
                <Form.Control name="author" value={formData.author} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price ($)</Form.Label>
                <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required min={0} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control type="number" name="stock" value={formData.stock} onChange={handleChange} required min={0} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control name="image" value={formData.image} onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">{editingBook ? "Update" : "Create"}</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ConfirmModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Book"
          message="Are you sure you want to delete this book?"
        />
      </Container>
    </div>
  );
};

export default AdminBooks;
