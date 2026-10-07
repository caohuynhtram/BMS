import React from "react";
import { Navbar, Nav, Container, Badge, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { clearCart } from "../../redux/slices/cartSlice";
import { FaShoppingCart, FaHeart, FaUser, FaBook, FaTachometerAlt } from "react-icons/fa";

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container>
        <Navbar.Brand
          as={Link}
          to={isAdmin ? "/admin" : "/"}
          className="d-flex align-items-center fw-bold"
        >
          <FaBook className="me-2" />
          INFINIA STORE {isAdmin && <Badge bg="warning" text="dark" className="ms-2 fs-6">Admin</Badge>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {isAdmin ? (
              <>
                <Nav.Link as={Link} to="/admin">
                  <FaTachometerAlt className="me-1" /> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/books">Books</Nav.Link>
                <Nav.Link as={Link} to="/admin/categories">Categories</Nav.Link>
                <Nav.Link as={Link} to="/admin/users">Users</Nav.Link>
                <Nav.Link as={Link} to="/admin/orders">Orders</Nav.Link>
                <Nav.Link as={Link} to="/admin/vouchers">Vouchers</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/books">Books</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                {/* Only show Cart & Wishlist for regular users */}
                {!isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/wishlist" className="d-flex align-items-center">
                      <FaHeart className="me-1" /> Wishlist
                    </Nav.Link>
                    <Nav.Link as={Link} to="/cart" className="d-flex align-items-center">
                      <FaShoppingCart className="me-1" />
                      Cart
                      {totalQuantity > 0 && (
                        <Badge bg="danger" pill className="ms-1">
                          {totalQuantity}
                        </Badge>
                      )}
                    </Nav.Link>
                  </>
                )}
                <NavDropdown
                  title={
                    <span>
                      <FaUser className="me-1" />
                      {user?.name || "User"}
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  {!isAdmin && (
                    <>
                      <NavDropdown.Item as={Link} to="/profile">
                        Profile
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/orders">
                        My Orders
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                    </>
                  )}
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
