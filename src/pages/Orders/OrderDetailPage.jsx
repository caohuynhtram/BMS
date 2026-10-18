import React, { useEffect, useState } from "react";
import { Container, Card, Badge, Table, Button, Image } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetail, cancelOrder, confirmReceipt, returnOrder } from "../../redux/slices/orderSlice";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import bookApi from "../../api/bookApi";
import { toast } from "react-toastify";
import { FaCheckCircle, FaUndo, FaStar } from "react-icons/fa";

const statusColors = {
  Pending: "warning",
  Confirmed: "info",
  Shipping: "primary",
  Delivered: "success",
  Cancelled: "danger",
  Returned: "secondary",
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading } = useSelector((state) => state.order);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    dispatch(fetchOrderDetail(id));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await bookApi.getAll();
        setBooks(res.data);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      }
    };
    fetchBooks();
  }, []);

  const getBookInfo = (bookId) => {
    return books.find((b) => String(b.id) === String(bookId));
  };

  const handleCancel = async () => {
    try {
      await dispatch(cancelOrder(id)).unwrap();
      toast.success("Order cancelled");
    } catch (err) {
      toast.error("Failed to cancel order");
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      await dispatch(confirmReceipt(id)).unwrap();
      toast.success("Order received! Thank you.");
    } catch (err) {
      toast.error("Failed to confirm receipt");
    }
  };

  const handleReturn = async () => {
    try {
      await dispatch(returnOrder(id)).unwrap();
      toast.success("Return request submitted");
    } catch (err) {
      toast.error("Failed to submit return request");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!currentOrder)
    return (
      <Container className="py-5 text-center">
        <h3>Order not found</h3>
      </Container>
    );

  return (
    <Container className="py-4">
      <Link to="/orders" className="text-decoration-none mb-3 d-inline-block">
        ← Back to Orders
      </Link>
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Order #{currentOrder.id}</h3>
              <small className="text-muted">
                Placed on: {currentOrder.createdAt}
              </small>
            </div>
            <Badge
              bg={statusColors[currentOrder.status] || "secondary"}
              className="fs-6"
            >
              {currentOrder.status}
            </Badge>
          </div>

          <h5 className="fw-bold mb-3">Order Items</h5>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Image</th>
                <th>Book</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                {currentOrder.status === "Delivered" && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {currentOrder.items?.map((item) => {
                const bookInfo = getBookInfo(item.bookId);
                return (
                  <tr key={item.id}>
                    <td>
                      {bookInfo?.image ? (
                        <Image
                          src={bookInfo.image}
                          alt={bookInfo?.title}
                          rounded
                          style={{ width: "60px", height: "80px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{ width: "60px", height: "80px", background: "#eee" }}
                          className="d-flex align-items-center justify-content-center rounded"
                        >
                          <small className="text-muted">N/A</small>
                        </div>
                      )}
                    </td>
                    <td className="align-middle">
                      {bookInfo ? (
                        <Link to={`/books/${item.bookId}`} className="text-decoration-none fw-bold">
                          {bookInfo.title}
                        </Link>
                      ) : (
                        `Book #${item.bookId}`
                      )}
                      {bookInfo && (
                        <div className="text-muted small">{bookInfo.author}</div>
                      )}
                    </td>
                    <td className="align-middle">${item.price}</td>
                    <td className="align-middle">{item.quantity}</td>
                    <td className="align-middle fw-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    {currentOrder.status === "Delivered" && (
                      <td className="align-middle">
                        <Link
                          to={`/books/${item.bookId}`}
                          className="btn btn-outline-warning btn-sm"
                        >
                          <FaStar className="me-1" /> Review
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <div className="text-end">
            <h4 className="fw-bold text-primary">
              Total: ${currentOrder.totalPrice?.toFixed(2)}
            </h4>
          </div>

          {/* Action buttons based on status */}
          <div className="mt-3 d-flex gap-2">
            {currentOrder.status === "Pending" && (
              <Button variant="danger" onClick={handleCancel}>
                Cancel Order
              </Button>
            )}
            {currentOrder.status === "Shipping" && (
              <Button variant="success" onClick={handleConfirmReceipt}>
                <FaCheckCircle className="me-2" />
                Confirm Receipt
              </Button>
            )}
            {currentOrder.status === "Delivered" && (
              <Button variant="outline-secondary" onClick={handleReturn}>
                <FaUndo className="me-2" />
                Request Return
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetailPage;
