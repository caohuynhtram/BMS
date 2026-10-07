import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import AdminSidebar from "../../components/layout/AdminSidebar";
import orderApi from "../../api/orderApi";
import bookApi from "../../api/bookApi";
import userApi from "../../api/userApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaDollarSign, FaShoppingBag, FaUsers, FaBook } from "react-icons/fa";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalBooks: 0,
    bestSellers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, booksRes, usersRes, orderItemsRes] = await Promise.all([
          orderApi.getAll(),
          bookApi.getAll(),
          userApi.getAll(),
          (await import("../../api/axiosClient")).default.get("/orderItems"),
        ]);

        const orders = ordersRes.data;
        const books = booksRes.data;
        const users = usersRes.data.filter((u) => u.role !== "admin");
        const orderItems = orderItemsRes.data;

        // Total revenue from delivered orders
        const totalRevenue = orders
          .filter((o) => o.status === "Delivered")
          .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        // Best sellers by quantity sold
        const bookSales = {};
        orderItems.forEach((item) => {
          bookSales[item.bookId] = (bookSales[item.bookId] || 0) + item.quantity;
        });
        const bestSellers = Object.entries(bookSales)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([bookId, qty]) => {
            const book = books.find((b) => String(b.id) === String(bookId));
            return { title: book?.title || `Book #${bookId}`, sold: qty };
          });

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalBooks: books.length,
          bestSellers,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: <FaDollarSign />, color: "success" },
    { title: "Total Orders", value: stats.totalOrders, icon: <FaShoppingBag />, color: "primary" },
    { title: "Total Users", value: stats.totalUsers, icon: <FaUsers />, color: "info" },
    { title: "Total Books", value: stats.totalBooks, icon: <FaBook />, color: "warning" },
  ];

  return (
    <div className="d-flex">
      <AdminSidebar />
      <Container fluid className="p-4">
        <h2 className="fw-bold mb-4">Admin Dashboard</h2>
        <Row className="g-4 mb-4">
          {statCards.map((card, idx) => (
            <Col sm={6} lg={3} key={idx}>
              <Card className={`shadow-sm border-0 border-start border-4 border-${card.color}`}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">{card.title}</p>
                      <h3 className="fw-bold mb-0">{card.value}</h3>
                    </div>
                    <div className={`text-${card.color} fs-1 opacity-50`}>
                      {card.icon}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Best Sellers */}
        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="fw-bold mb-3">Best Selling Books</h5>
            {stats.bestSellers.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Book</th>
                    <th>Units Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bestSellers.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{item.title}</td>
                      <td>{item.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted">No sales data yet.</p>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AdminDashboard;
