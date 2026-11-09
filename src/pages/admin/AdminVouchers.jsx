import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Badge, Row, Col } from "react-bootstrap";
import voucherApi from "../../api/voucherApi";
import { isVoucherExpired } from "../../utils/cartUtils";
import { formatCurrency, VOUCHER_STATUS, matchesSearch } from "../../utils/helpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";
import SearchBar from "../../components/SearchBar";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaUndo } from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const emptyVoucher = {
  title: "",
  code: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  expirationDate: "",
  usageLimit: "",
  used: 0,
  status: VOUCHER_STATUS.ACTIVE,
};

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyVoucher);
  const [deleteId, setDeleteId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVouchers = async () => {
    try {
      const res = await voucherApi.getAll();
      const rawList = res.data || [];
      // Tự động đồng bộ trạng thái "Expired" vào DB nếu mã đã hết hạn hoặc hết lượt dùng
      const updatedList = await Promise.all(
        rawList.map(async (v) => {
          if (!v.isDeleted && v.status === VOUCHER_STATUS.ACTIVE) {
            const isExpired = v.expirationDate ? isVoucherExpired(v.expirationDate) : false;
            const isExhausted = v.usageLimit ? Number(v.used || 0) >= Number(v.usageLimit) : false;
            if (isExpired || isExhausted) {
              try {
                await voucherApi.update(v.id, { status: VOUCHER_STATUS.EXPIRED });
                return { ...v, status: VOUCHER_STATUS.EXPIRED };
              } catch (e) {
                console.error("Failed to auto-expire voucher in DB:", e);
              }
            }
          }
          return v;
        })
      );
      setVouchers(updatedList);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ["value", "minOrderValue", "usageLimit"].includes(name)
        ? (value === "" ? "" : Number(value))
        : name === "code"
        ? value.toUpperCase()
        : value,
    });
  };

  const getVoucherStatus = (v) => {
    if (v.isDeleted || v.status === VOUCHER_STATUS.INACTIVE) {
      return VOUCHER_STATUS.INACTIVE;
    }
    const isExpired = v.expirationDate ? isVoucherExpired(v.expirationDate) : false;
    const isExhausted = v.usageLimit ? Number(v.used || 0) >= Number(v.usageLimit) : false;
    if (isExpired || isExhausted) {
      return VOUCHER_STATUS.EXPIRED;
    }
    return VOUCHER_STATUS.ACTIVE;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code?.trim()) {
      toast.error("Please enter a voucher code.");
      return;
    }
    if (!formData.title?.trim()) {
      toast.error("Please enter a voucher title.");
      return;
    }

    if (editing && editing.isDeleted) {
      toast.error("This voucher is inactive. Please restore the voucher before editing.");
      return;
    }

    if (formData.type === "percentage" && (Number(formData.value) <= 0 || Number(formData.value) > 100)) {
      toast.error("Percentage discount must be between 1% and 100%.");
      return;
    }
    if (formData.type === "fixed" && Number(formData.value) <= 0) {
      toast.error("Fixed discount amount must be greater than $0.");
      return;
    }
    if (formData.usageLimit && Number(formData.usageLimit) <= 0) {
      toast.error("Usage limit must be 1 or greater, or left blank for unlimited.");
      return;
    }

    try {
      const upperCode = (formData.code || "").trim().toUpperCase();
      const isDuplicate = vouchers.some(
        (v) =>
          (!editing || String(v.id) !== String(editing.id)) &&
          !v.isDeleted &&
          (v.code || "").trim().toUpperCase() === upperCode
      );
      if (isDuplicate) {
        toast.error(`Voucher code "${upperCode}" already exists! Please choose another code.`);
        return;
      }

      let finalStatus = formData.status || VOUCHER_STATUS.ACTIVE;
      const parsedLimit = formData.usageLimit ? Math.max(1, parseInt(formData.usageLimit, 10)) : null;
      const usedCount = Number(formData.used || 0);
      const isExpired = formData.expirationDate ? isVoucherExpired(formData.expirationDate) : false;
      const isExhausted = parsedLimit ? usedCount >= parsedLimit : false;

      if (isExpired || isExhausted) {
        finalStatus = VOUCHER_STATUS.EXPIRED;
      } else if (finalStatus === VOUCHER_STATUS.EXPIRED && !isExpired && !isExhausted) {
        finalStatus = VOUCHER_STATUS.ACTIVE;
      }

      const payload = {
        ...formData,
        code: upperCode,
        status: finalStatus,
        value: Number(formData.value) || 0,
        minOrderValue: Number(formData.minOrderValue) || 0,
        expirationDate: formData.expirationDate || "",
        usageLimit: parsedLimit,
      };
      if (editing) {
        await voucherApi.update(editing.id, {
          ...payload,
          used: usedCount,
        });
        toast.success("Voucher updated successfully!");
      } else {
        const numericIds = vouchers
          .map((v) => Number(v.id))
          .filter((n) => !isNaN(n) && Number.isInteger(n));
        const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : vouchers.length + 1;

        await voucherApi.create({
          id: String(nextId),
          ...payload,
          used: 0,
          status: finalStatus,
          isDeleted: false,
        });
        toast.success("New voucher created successfully!");
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      toast.error("Operation failed. Please try again later.");
    }
  };

  const handleEdit = (v) => {
    setEditing(v);
    setFormData({
      ...v,
      status: v.status || getVoucherStatus(v),
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(emptyVoucher);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await voucherApi.update(deleteId, { isDeleted: true, status: VOUCHER_STATUS.INACTIVE });
      toast.success("Voucher deactivated successfully!");
      setShowDeleteModal(false);
      fetchVouchers();
    } catch (err) {
      toast.error("Failed to deactivate voucher.");
    }
  };

  const handleRestore = async (voucherId) => {
    try {
      const target = vouchers.find((v) => String(v.id) === String(voucherId));
      let restoreStatus = VOUCHER_STATUS.ACTIVE;
      if (target) {
        const isExpired = isVoucherExpired(target.expirationDate);
        const isExhausted = Number(target.used || 0) >= Number(target.usageLimit || 9999);
        if (isExpired || isExhausted) {
          restoreStatus = VOUCHER_STATUS.EXPIRED;
        }
      }
      await voucherApi.update(voucherId, { isDeleted: false, status: restoreStatus });
      toast.success("Voucher restored successfully!");
      fetchVouchers();
    } catch (err) {
      toast.error("Failed to restore voucher.");
    }
  };

  let filtered = vouchers.filter(
    (v) =>
      matchesSearch(v.code, searchTerm) ||
      matchesSearch(v.title, searchTerm)
  );

  if (filterStatus !== "all") {
    filtered = filtered.filter((v) => getVoucherStatus(v) === filterStatus);
  }

  filtered.sort((a, b) => {
    const aInactive = a.isDeleted || a.status === VOUCHER_STATUS.INACTIVE ? 1 : 0;
    const bInactive = b.isDeleted || b.status === VOUCHER_STATUS.INACTIVE ? 1 : 0;
    return aInactive - bInactive;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark mb-0">Voucher Management</h2>
        <Button variant="primary" onClick={handleAdd} className="d-inline-flex align-items-center">
          <FaPlus className="me-2 flex-shrink-0" /> Add Voucher
        </Button>
      </div>

      <Row className="mb-3 g-2">
        <Col md={5}>
          <SearchBar
            onSearch={(q) => { setSearchTerm(q); setCurrentPage(1); }}
            placeholder="Search by voucher code or title..."
          />
        </Col>
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value={VOUCHER_STATUS.ACTIVE}>Active</option>
            <option value={VOUCHER_STATUS.EXPIRED}>Expired</option>
            <option value={VOUCHER_STATUS.INACTIVE}>Inactive</option>
          </Form.Select>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th style={{ width: "120px" }}>Voucher Code</th>
            <th style={{ minWidth: "220px" }}>Title</th>
            <th style={{ width: "105px" }}>Discount Type</th>
            <th style={{ width: "105px" }}>Discount</th>
            <th style={{ width: "120px" }}>Min Spend</th>
            <th style={{ width: "125px" }}>Expiration Date</th>
            <th style={{ width: "95px" }}>Usage</th>
            <th style={{ width: "130px" }}>Status</th>
            <th className="col-actions text-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((v) => {
            const status = getVoucherStatus(v);
            return (
              <tr key={v.id} className={status === VOUCHER_STATUS.INACTIVE ? "table-danger" : ""}>
                <td><code className="fw-bold">{v.code}</code></td>
                <td className="fw-semibold text-dark">{v.title}</td>
                <td>
                  <Badge bg={v.type === "percentage" ? "info" : "success"}>
                    {v.type === "percentage" ? "Percentage" : "Fixed Amount"}
                  </Badge>
                </td>
                <td className="fw-bold">
                  {v.type === "percentage" ? `${v.value}%` : formatCurrency(v.value)}
                </td>
                <td>{formatCurrency(v.minOrderValue)}</td>
                <td>{v.expirationDate || "Never"}</td>
                <td>{v.used || 0}/{v.usageLimit ? v.usageLimit : "∞"}</td>
                <td>
                  <Badge bg={status === VOUCHER_STATUS.ACTIVE ? "success" : status === VOUCHER_STATUS.EXPIRED ? "warning" : "secondary"}>
                    {status === VOUCHER_STATUS.ACTIVE ? "Active" : status === VOUCHER_STATUS.EXPIRED ? "Expired" : "Inactive"}
                  </Badge>
                </td>
                <td className="col-actions text-nowrap">
                  <div className="d-inline-flex gap-1 align-items-center">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="btn-action-icon"
                      onClick={() => handleEdit(v)}
                      title={v.isDeleted ? "Voucher is inactive, please restore before editing" : "Edit"}
                      disabled={Boolean(v.isDeleted)}
                    >
                      <FaEdit />
                    </Button>
                    {v.isDeleted ? (
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="btn-action-icon"
                        onClick={() => handleRestore(v.id)}
                        title="Restore Voucher"
                      >
                        <FaUndo />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="btn-action-icon"
                        onClick={() => { setDeleteId(v.id); setShowDeleteModal(true); }}
                        title="Deactivate / Delete"
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
            <tr><td colSpan={9} className="text-center text-muted py-3">No vouchers found.</td></tr>
          )}
        </tbody>
      </Table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-dark">
            {editing ? "Edit Voucher" : "Add New Voucher"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Voucher Code <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. SAVE20"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Title <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. 20% off all orders"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Discount Type</Form.Label>
                  <Form.Select name="type" value={formData.type} onChange={handleChange}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Discount Value <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    min={1}
                    max={formData.type === "percentage" ? 100 : undefined}
                    placeholder={formData.type === "percentage" ? "e.g. 20" : "e.g. 50"}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Minimum Spend ($)</Form.Label>
                  <Form.Control
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    min={0}
                    placeholder="e.g. 100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Expiration Date <small className="text-muted fw-normal">(leave blank for unlimited)</small>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Usage Limit <small className="text-muted fw-normal">(leave blank for unlimited)</small>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    min={1}
                    placeholder="e.g. 50 (or leave blank)"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={Boolean(editing?.isDeleted)}
                  >
                    <option value={VOUCHER_STATUS.ACTIVE}>Active</option>
                    <option value={VOUCHER_STATUS.EXPIRED}>Expired</option>
                    <option value={VOUCHER_STATUS.INACTIVE}>Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
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
        title="Confirm Voucher Deactivation"
        message="Are you sure you want to deactivate this voucher? It will no longer be applicable to new orders."
        confirmText="Deactivate"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AdminVouchers;
