import React, { useState, useEffect } from "react";
import { Container, Table, Button, Badge } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import userApi from "../../api/userApi";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-toastify";
import { FaBan, FaCheck } from "react-icons/fa";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data.filter((u) => u.role !== "admin"));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    try {
      await userApi.updateStatus(user.id, newStatus);
      toast.success(`User ${newStatus === "active" ? "activated" : "blocked"}`);
      fetchUsers();
    } catch (err) { toast.error("Failed to update status"); }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <h2 className="fw-bold mb-4">User Management</h2>
        <div className="mb-3" style={{ maxWidth: "400px" }}>
          <SearchBar onSearch={setSearchQuery} placeholder="Search users..." />
        </div>
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
              <th>Address</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.address}</td>
                <td>
                  <Badge bg={user.status === "active" ? "success" : "danger"}>
                    {user.status}
                  </Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant={user.status === "active" ? "outline-danger" : "outline-success"}
                    onClick={() => handleToggleStatus(user)}
                  >
                    {user.status === "active" ? <><FaBan className="me-1" /> Block</> : <><FaCheck className="me-1" /> Activate</>}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default AdminUsers;
