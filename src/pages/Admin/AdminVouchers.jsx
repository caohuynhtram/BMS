import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Badge } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import voucherApi from "../../api/voucherApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const emptyVoucher = {
  title: "", code: "", type: "percentage", value: "",
  minOrderValue: "", expirationDate: "", usageLimit: "", used: 0,
};

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyVoucher);
  const [deleteId, setDeleteId] = useState(null);

  const fetchVouchers = async () => {
    try {
      const res = await voucherApi.getAll();
      setVouchers(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ["value", "minOrderValue", "usageLimit"].includes(name) ? Number(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await voucherApi.update(editing.id, formData);
        toast.success("Voucher updated!");
      } else {
        await voucherApi.create({ ...formData, used: 0 });
        toast.success("Voucher created!");
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) { toast.error("Operation failed"); }
  };

  const handleEdit = (v) => { setEditing(v); setFormData(v); setShowModal(true); };
  const handleAdd = () => { setEditing(null); setFormData(emptyVoucher); setShowModal(true); };

  const handleDelete = async () => {
    try {
      await voucherApi.delete(deleteId);
      toast.success("Voucher deleted!");
      setShowDeleteModal(false);
      fetchVouchers();
    } catch (err) { toast.error("Failed to delete"); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Voucher Management</h2>
          <Button variant="primary" onClick={handleAdd}>
            <FaPlus className="me-1" /> Add Voucher
          </Button>
        </div>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Code</th><th>Title</th><th>Type</th><th>Value</th>
              <th>Min Order</th><th>Expires</th><th>Usage</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}>
                <td><code>{v.code}</code></td>
                <td>{v.title}</td>
                <td><Badge bg={v.type === "percentage" ? "info" : "success"}>{v.type}</Badge></td>
                <td>{v.type === "percentage" ? `${v.value}%` : `$${v.value}`}</td>
                <td>${v.minOrderValue}</td>
                <td>{v.expirationDate}</td>
                <td>{v.used}/{v.usageLimit}</td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEdit(v)}>
                    <FaEdit />
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => { setDeleteId(v.id); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editing ? "Edit Voucher" : "Add Voucher"}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control name="title" value={formData.title} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Code</Form.Label>
                <Form.Control name="code" value={formData.code} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select name="type" value={formData.type} onChange={handleChange}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Value</Form.Label>
                <Form.Control type="number" name="value" value={formData.value} onChange={handleChange} required min={0} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Minimum Order Value ($)</Form.Label>
                <Form.Control type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} required min={0} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Expiration Date</Form.Label>
                <Form.Control type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Usage Limit</Form.Label>
                <Form.Control type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} required min={1} />
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
          title="Delete Voucher"
          message="Are you sure you want to delete this voucher?"
        />
      </Container>
    </div>
  );
};

export default AdminVouchers;
