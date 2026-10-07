import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../../redux/slices/authSlice";
import authApi from "../../api/authApi";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Check if email already exists
      const emailCheck = await (await import("../../api/axiosClient")).default.get(
        `/users?email=${formData.email}`
      );
      if (emailCheck.data.length > 0) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      const res = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "user",
        phone: formData.phone,
        address: formData.address,
        status: "active",
      });

      // --- KHỞI TẠO CART VÀ WISHLIST TRỐNG CHO USER MỚI ---
      // Việc này giúp luồng code của team làm chức năng Giỏ hàng và Yêu thích nhẹ đi rất nhiều
      const axiosClient = (await import("../../api/axiosClient")).default;
      await axiosClient.post("/carts", {
        userId: res.data.id,
        items: []
      });
      await axiosClient.post("/wishlists", {
        userId: res.data.id,
        items: [] // Thay vì items thì wishlists trong một số db có thể cấu trúc khác, nhưng mảng trống là an toàn nhất
      });
      // ---------------------------------------------------

      dispatch(register(res.data));
      toast.success("Registration successful!");
      navigate("/");
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4 fw-bold">Register</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? "Registering..." : "Register"}
                </Button>
              </Form>
              <div className="text-center mt-3">
                <span className="text-muted">Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
