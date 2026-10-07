import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import bookApi from "../../api/bookApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await bookApi.getCategories();
      setCategories(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await bookApi.updateCategory(editing.id, { name });
        toast.success("Category updated!");
      } else {
        await bookApi.createCategory({ name });
        toast.success("Category created!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) { toast.error("Operation failed"); }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await bookApi.deleteCategory(deleteId);
      toast.success("Category deleted!");
      setShowDeleteModal(false);
      fetchCategories();
    } catch (err) { toast.error("Failed to delete"); }
  };

  const handleAdd = () => {
    setEditing(null);
    setName("");
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Category Management</h2>
          <Button variant="primary" onClick={handleAdd}>
            <FaPlus className="me-1" /> Add Category
          </Button>
        </div>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEdit(cat)}>
                    <FaEdit />
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => { setDeleteId(cat.id); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{editing ? "Edit Category" : "Add Category"}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group>
                <Form.Label>Category Name</Form.Label>
                <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">{editing ? "Update" : "Create"}</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ConfirmModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Category"
          message="Are you sure? Books in this category may be affected."
        />
      </Container>
    </div>
  );
};

export default AdminCategories;
