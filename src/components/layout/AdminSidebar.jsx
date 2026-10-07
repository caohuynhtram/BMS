import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBook,
  FaListAlt,
  FaUsers,
  FaShoppingBag,
  FaTicketAlt,
} from "react-icons/fa";

const adminLinks = [
  { path: "/admin", label: "Dashboard", icon: <FaTachometerAlt /> },
  { path: "/admin/books", label: "Books", icon: <FaBook /> },
  { path: "/admin/categories", label: "Categories", icon: <FaListAlt /> },
  { path: "/admin/users", label: "Users", icon: <FaUsers /> },
  { path: "/admin/orders", label: "Orders", icon: <FaShoppingBag /> },
  { path: "/admin/vouchers", label: "Vouchers", icon: <FaTicketAlt /> },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="admin-sidebar bg-dark text-white min-vh-100 p-3" style={{ width: "240px" }}>
      <h5 className="text-center mb-4 mt-2 text-warning fw-bold">Admin Panel</h5>
      <Nav className="flex-column">
        {adminLinks.map((link) => (
          <Nav.Link
            key={link.path}
            as={Link}
            to={link.path}
            className={`text-white d-flex align-items-center gap-2 py-2 px-3 rounded mb-1 ${
              location.pathname === link.path ? "bg-secondary" : ""
            }`}
          >
            {link.icon}
            {link.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};

export default AdminSidebar;
