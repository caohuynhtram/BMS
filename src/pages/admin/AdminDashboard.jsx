import { useState, useEffect } from "react";
import { Row, Col, Card, Table } from "react-bootstrap";
import orderApi from "../../api/orderApi";
import bookApi from "../../api/bookApi";
import userApi from "../../api/userApi";
import axiosClient from "../../api/axiosClient";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import { formatCurrency } from "../../utils/helpers";
import { FaDollarSign, FaShoppingBag, FaUsers, FaBook } from "react-icons/fa";

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalBooks: 0,
    bestSellers: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, booksRes, usersRes, orderItemsRes] = await Promise.all([
          orderApi.getAll(),
          bookApi.getAll(),
          userApi.getAll(),
          axiosClient.get("/orderItems"),
        ]);

        const orders = ordersRes.data || [];
        const books = booksRes.data || [];
        const users = (usersRes.data || []).filter((u) => u.role !== "admin");
        const orderItems = orderItemsRes.data || [];

        const deliveredOrders = orders.filter((o) => o.status === "Delivered");
        const deliveredOrderIds = new Set(deliveredOrders.map((o) => String(o.id)));

        const totalRevenue = deliveredOrders.reduce(
          (sum, o) => sum + (Number(o.totalPrice) || 0),
          0
        );

        const bookSales = {};
        orderItems
          .filter((item) => deliveredOrderIds.has(String(item.orderId)))
          .forEach((item) => {
            const bId = String(item.bookId);
            bookSales[bId] = (bookSales[bId] || 0) + (Number(item.quantity) || 0);
          });

        const bestSellers = Object.entries(bookSales)
          .sort(([, a], [, b]) => b - a)
          .map(([bookId, qty]) => {
            const book = books.find((b) => String(b.id) === String(bookId));
            const snapshotItem = orderItems.find((i) => String(i.bookId) === String(bookId) && i.title);
            return {
              id: bookId,
              title: book?.title || snapshotItem?.title || `Book #${bookId}`,
              sold: qty,
            };
          });

        setStats({
          totalRevenue,
          totalOrders: deliveredOrders.length,
          totalUsers: users.length,
          totalBooks: books.filter((b) => !b.isDeleted && b.status !== "Inactive").length,
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
    { title: "Tổng doanh thu", value: formatCurrency(stats.totalRevenue), icon: <FaDollarSign />, color: "success" },
    { title: "Đơn hàng hoàn tất", value: stats.totalOrders, icon: <FaShoppingBag />, color: "primary" },
    { title: "Tổng số khách hàng", value: stats.totalUsers, icon: <FaUsers />, color: "info" },
    { title: "Sách đang mở bán", value: stats.totalBooks, icon: <FaBook />, color: "warning" },
  ];

  const totalPages = Math.ceil(stats.bestSellers.length / ITEMS_PER_PAGE);
  const paginatedBestSellers = stats.bestSellers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <h2 className="fw-bold mb-4 text-dark">Tổng quan quản trị</h2>
      <Row className="g-4 mb-4">
        {statCards.map((card) => (
          <Col sm={6} lg={3} key={card.title}>
            <Card className={`shadow-sm border-0 border-start border-4 border-${card.color} bg-white`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted small mb-1">{card.title}</p>
                    <h3 className="fw-bold mb-0 text-dark">{card.value}</h3>
                  </div>
                  <div className={`text-${card.color} fs-1 opacity-50 d-inline-flex align-items-center justify-content-center`}>
                    {card.icon}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-0 bg-white">
        <Card.Body>
          <h5 className="fw-bold mb-3 text-dark">
            Top sách bán chạy nhất
          </h5>
          {stats.bestSellers.length > 0 ? (
            <>
              <Table striped bordered hover responsive className="mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "80px" }}>STT</th>
                    <th>Tên sách</th>
                    <th className="text-end" style={{ width: "180px" }}>Số lượng đã bán</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBestSellers.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="fw-bold">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="fw-semibold text-dark">{item.title}</td>
                      <td className="fw-bold text-success text-end">{item.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <p className="text-muted mb-0">Chưa có dữ liệu bán hàng.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;
