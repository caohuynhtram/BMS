import { useState } from "react";
import { Nav, Button } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBook,
  FaListAlt,
  FaUsers,
  FaShoppingBag,
  FaTicketAlt,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";

const adminLinks = [
  { path: "/admin", label: "Tổng quan", icon: <FaTachometerAlt /> },
  { path: "/admin/books", label: "Quản lý sách", icon: <FaBook /> },
  { path: "/admin/categories", label: "Danh mục", icon: <FaListAlt /> },
  { path: "/admin/users", label: "Người dùng", icon: <FaUsers /> },
  { path: "/admin/orders", label: "Đơn hàng", icon: <FaShoppingBag /> },
  { path: "/admin/vouchers", label: "Mã giảm giá", icon: <FaTicketAlt /> },
];

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="admin-sidebar bg-dark text-white flex-shrink-0 d-flex flex-column"
      style={{
        width: collapsed ? "60px" : "240px",
        height: "100%",
        transition: "width 0.2s ease",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        className={`d-flex align-items-center ${
          collapsed ? "justify-content-center px-0" : "justify-content-between px-3"
        } pt-3 pb-2`}
      >
        {!collapsed && (
          <h5 className="mb-0 text-warning fw-bold" style={{ whiteSpace: "nowrap" }}>
            Trang quản trị
          </h5>
        )}
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          className="d-inline-flex align-items-center justify-content-center p-0"
          style={{
            width: collapsed ? "38px" : "32px",
            height: collapsed ? "38px" : "32px",
            border: "none",
            color: "#adb5bd",
          }}
        >
          {collapsed ? (
            <FaBars style={{ fontSize: "1.15rem" }} />
          ) : (
            <FaChevronLeft style={{ fontSize: "0.95rem" }} />
          )}
        </Button>
      </div>

      <Nav
        className={`flex-column mt-1 ${
          collapsed ? "align-items-center px-0" : "px-2"
        }`}
      >
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Nav.Link
              key={link.path}
              as={Link}
              to={link.path}
              title={collapsed ? link.label : ""}
              className={`text-white d-flex align-items-center ${
                collapsed
                  ? "justify-content-center rounded mb-2 p-0"
                  : "py-2 px-3 rounded mb-1"
              } ${isActive ? "bg-secondary" : ""}`}
              style={{
                width: collapsed ? "38px" : "100%",
                height: collapsed ? "38px" : "auto",
                whiteSpace: "nowrap",
              }}
            >
              <span
                className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: collapsed ? "100%" : "24px",
                  height: collapsed ? "100%" : "24px",
                  fontSize: collapsed ? "1.15rem" : "1.05rem",
                  marginRight: collapsed ? "0" : "10px",
                }}
              >
                {link.icon}
              </span>
              {!collapsed && <span className="fw-medium">{link.label}</span>}
            </Nav.Link>
          );
        })}
      </Nav>
    </div>
  );
};

export default AdminSidebar;

