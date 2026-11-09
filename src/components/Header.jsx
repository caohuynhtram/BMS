import { Navbar, Nav, Container, Badge, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";
import { clearWishlist } from "../redux/wishlistSlice";
import { clearOrders } from "../redux/orderSlice";
import { formatUserDisplayName } from "../utils/helpers";
import { FaShoppingCart, FaHeart, FaUser, FaBook } from "react-icons/fa";

const Header = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearWishlist());
    dispatch(clearOrders());
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow-sm header-navbar" style={{ zIndex: 1020 }}>
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand
          as={Link}
          to={isAdmin ? "/admin" : "/"}
          className="d-flex align-items-center fw-bold"
        >
          <FaBook className="me-2" />
          INFINIA STORE
          {isAdmin && <Badge bg="warning" text="dark" className="ms-2 fs-6">Admin</Badge>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {!isAdmin && (
              <>
                <Nav.Link as={Link} to="/home">Home</Nav.Link>
                <Nav.Link as={Link} to="/books">Books</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Nav.Link as={Link} to="/wishlist" className="d-inline-flex align-items-center me-2">
                      <span className="header-nav-icon-wrapper">
                        <FaHeart style={{ fontSize: "1.15rem" }} />
                        {wishlistItems && wishlistItems.length > 0 && (
                          <span className="header-icon-badge">
                            {wishlistItems.length}
                          </span>
                        )}
                      </span>
                      <span>Wishlist</span>
                    </Nav.Link>
                    <Nav.Link as={Link} to="/cart" className="d-inline-flex align-items-center me-2">
                      <span className="header-nav-icon-wrapper">
                        <FaShoppingCart style={{ fontSize: "1.15rem" }} />
                        {totalQuantity > 0 && (
                          <span className="header-icon-badge">
                            {totalQuantity}
                          </span>
                        )}
                      </span>
                      <span>Cart</span>
                    </Nav.Link>
                  </>
                )}
                <NavDropdown
                  title={
                    <span className="d-inline-flex align-items-center">
                      <FaUser className="me-2 flex-shrink-0" />
                      <span>{formatUserDisplayName(user)}</span>
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    My Account
                  </NavDropdown.Item>
                  {!isAdmin && (
                    <NavDropdown.Item as={Link} to="/profile?tab=orders">
                      My Orders
                    </NavDropdown.Item>
                  )}
                  {isAdmin && (
                    <NavDropdown.Item as={Link} to="/admin">
                      Admin Dashboard
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
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
