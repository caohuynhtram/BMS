# 📚 Bookstore Web Application

Ứng dụng web **Bookstore Web Application** được phát triển trong khuôn khổ bài tập FER ReactJS.

Dự án này minh họa kiến trúc **frontend** hiện đại, bao gồm:

- Kiến trúc React component
- Quản lý global state sử dụng Redux Toolkit
- Tích hợp API với Axios
- Phát triển UI với Bootstrap / React Bootstrap
- Mock backend sử dụng json-server

---

# 🚀 Tech Stack

## Frontend

- React
- Redux Toolkit
- React Redux
- Redux Persist
- React Router
- Axios
- Bootstrap
- React Bootstrap
- React Toastify

## Backend (Mock)

- json-server

## Development Tools

- Vite / Create React App
- ESLint
- Prettier

---

# 👥 System Roles

Hệ thống hỗ trợ hai vai trò chính:

### Customer (User)

Người dùng có thể:

- Xem danh sách sách
- Tìm kiếm sách
- Thêm sách vào cart
- Áp dụng voucher
- Đặt hàng (place order)
- Theo dõi lịch sử đơn hàng (order history)
- Quản lý wishlist
- Cập nhật profile

### Administrator (Admin)

Admin có thể quản lý hệ thống bookstore:

- Quản lý user
- Quản lý book
- Quản lý category
- Quản lý order
- Quản lý voucher
- Xem thống kê doanh thu

---

# 🏗 System Architecture

Ứng dụng tuân theo kiến trúc **React SPA architecture** điển hình.

User Interface (React Bootstrap)
↓
Pages
↓
Reusable Components
↓
Redux Store
↓
Axios API Layer
↓
json-server (Mock Backend)

Các layer chính:
- UI Layer
- Page Layer
- Component Layer
- Redux State Management
- API Layer (Axios)
- Mock Backend (json-server)

---

# 📄 Main Features

## Authentication

- Register
- Login
- Logout
- Phân quyền theo role (User / Admin)

Authentication state được lưu trữ trong **Redux** và tùy chọn trong **localStorage**.

---

## Book Catalog

Người dùng có thể:

- Xem danh sách sách
- Tìm kiếm sách
- Lọc sách theo category
- Sắp xếp sách theo giá
- Xem chi tiết sách (book detail)
- Pagination

---

## Book Detail

Hiển thị:

- Book image
- Title
- Author
- Category
- Price
- Description
- Stock availability
- Ratings
- Reviews

Hành động:

- Add to cart
- Add to wishlist
- Write review

---

## Wishlist

Người dùng có thể:

- Thêm sách vào wishlist
- Xóa sách khỏi wishlist
- Xem trang wishlist

---

## Shopping Cart

Người dùng có thể:

- Thêm sách vào cart
- Cập nhật số lượng
- Xóa item
- Clear cart

Các tính năng của cart:

- Tính tổng tiền (total price calculation)
- Hỗ trợ voucher
- Kiểm tra tồn kho (stock validation)

---

## Voucher System

Người dùng có thể áp dụng voucher trong quá trình checkout.

Thuộc tính của voucher:

- code
- title
- type (percentage / fixed)
- value
- minimum order value
- expiration date
- usage limit

---

## Orders

Người dùng có thể:

- Place order
- Cancel order
- Confirm received order
- Request return

Luồng trạng thái đơn hàng (Order status flow):
Pending
Confirmed
Shipping
Delivered
Cancelled
Returned

---

## Order History

Người dùng có thể:

- Xem order history
- Xem order details
- Theo dõi order status

---

## User Profile

Người dùng có thể quản lý:

- Name
- Email
- Address
- Phone
- Password

---

# 🛠 Admin Dashboard

Admin có thể quản lý các thành phần sau:

### User Management

- Xem danh sách user
- Tìm kiếm user
- Block / activate account

### Book Management

- Create book
- Edit book
- Delete book
- Search book

### Category Management

- Create category
- Edit category
- Delete category

### Order Management

- Xem danh sách order
- Update order status

### Voucher Management

- Create voucher
- Edit voucher
- Delete voucher

### Statistics

Tổng quan dashboard bao gồm:

- Total revenue
- Total orders
- Best selling books

---

# 📁 Project Structure

```
fer202-assignment/
├── public/                     # Tài nguyên tĩnh
│   ├── favicon.ico
│   └── logo.png
│
├── src/                        # Mã nguồn ứng dụng React
│   ├── api/                    # Cấu hình & gọi API (Axios Services)
│   │   ├── axiosClient.js      # Base Axios instance (Interceptors token/lỗi)
│   │   ├── authApi.js          # API Đăng nhập, Đăng ký, Profile
│   │   ├── bookApi.js          # API Lấy danh sách sách, Chi tiết & Bộ lọc
│   │   ├── cartApi.js          # API Giỏ hàng & Áp dụng Voucher
│   │   └── orderApi.js         # API Tạo & Quản lý đơn hàng
│   │
│   ├── assets/                 # Images & Stylesheet
│   │   ├── images/             # Banner, Logo, Ảnh mặc định
│   │   └── styles/             # Stylesheet custom (CSS/SCSS)
│   │
│   ├── components/             # Các Component tái sử dụng
│   │   ├── common/             # Component dùng chung toàn ứng dụng
│   │   │   ├── Header.jsx      # Thanh header & ô tìm kiếm
│   │   │   ├── Footer.jsx      # Chân trang
│   │   │   ├── Navbar.jsx      # Menu điều hướng danh mục
│   │   │   ├── Loading.jsx     # Hiệu ứng tải trang (Spinner/Skeleton)
│   │   │   ├── Pagination.jsx  # Bộ phân trang
│   │   │   └── PrivateRoute.jsx# Bảo vệ Route (Auth Guard / Admin Guard)
│   │   │
│   │   ├── book/               # Component hiển thị Sách
│   │   │   ├── BookCard.jsx    # Thẻ hiển thị 1 quyển sách
│   │   │   ├── BookList.jsx    # Danh sách hiển thị BookCard
│   │   │   ├── BookFilter.jsx  # Bộ lọc theo danh mục & khoảng giá
│   │   │   ├── BookSort.jsx    # Dropdown sắp xếp (Giá / Phổ biến)
│   │   │   └── ReviewList.jsx  # Danh sách đánh giá & bình luận
│   │   │
│   │   ├── cart/               # Component Giỏ hàng
│   │   │   ├── CartItem.jsx    # Sản phẩm trong giỏ (nút tăng/giảm số lượng)
│   │   │   ├── CartSummary.jsx # Bảng tổng tiền & nút Thanh toán
│   │   │   └── VoucherInput.jsx# Ô nhập & áp dụng mã giảm giá
│   │   │
│   │   └── admin/              # Component giao diện Admin
│   │       ├── Sidebar.jsx     # Menu điều hướng trang Admin
│   │       ├── StatsCard.jsx   # Thẻ thống kê doanh thu & đơn hàng
│   │       ├── UserTable.jsx   # Bảng quản lý người dùng
│   │       ├── BookFormModal.jsx# Form popup thêm / sửa sách
│   │       └── OrderTable.jsx  # Bảng quản lý đơn hàng
│   │
│   ├── pages/                  # Các trang giao diện chính (Views)
│   │   ├── Home/               # Thư mục chứa Trang chủ & các trang chính
│   │   │   ├── HomePage.js     # Trang chủ (Hero Banner, Sách nổi bật)
│   │   │   ├── BookListPage.js # Trang danh sách sách & tìm kiếm
│   │   │   ├── LoginPage.js    # Trang đăng nhập
│   │   │   ├── RegisterPage.js # Trang đăng ký tài khoản
│   │   │   └── WishlistPage.js # Trang danh sách sách yêu thích
│   │   ├── BookDetail/         # Thư mục trang Chi tiết sách
│   │   │   └── BookDetailPage.js
│   │   ├── Cart/               # Thư mục trang Giỏ hàng
│   │   │   └── CartPage.js
│   │   ├── Checkout/           # Thư mục trang Thanh toán
│   │   │   └── CheckoutPage.js
│   │   ├── Orders/             # Thư mục trang Đơn hàng
│   │   │   └── OrdersPage.js
│   │   ├── Profile/            # Thư mục trang Hồ sơ cá nhân
│   │   │   └── ProfilePage.js
│   │   └── Admin/              # Thư mục trang Quản trị viên
│   │       ├── AdminDashboardPage.js
│   │       ├── ManageBooksPage.js
│   │       ├── ManageOrdersPage.js
│   │       └── ManageUsersPage.js
│   │
│   ├── redux/                  # State Management (Redux Toolkit)
│   │   ├── store.js            # Cấu hình Redux Store gốc
│   │   └── slices/             # Redux Slices cho từng tính năng
│   │       ├── authSlice.js    # State Đăng nhập, Token & Phân quyền
│   │       ├── bookSlice.js    # State Sách, Tìm kiếm & Lọc
│   │       ├── cartSlice.js    # State Giỏ hàng & Voucher
│   │       └── orderSlice.js   # State Đơn hàng
│   │
│   ├── hooks/                  # React Custom Hooks
│   │   ├── useAuth.js          # Hook kiểm tra trạng thái đăng nhập
│   │   └── useCart.js          # Hook thao tác nhanh với giỏ hàng
│   │
│   ├── routes/                 # Cấu hình Routing
│   │   └── AppRoutes.jsx       # Định nghĩa Public, Private & Admin Routes
│   │
│   ├── utils/                  # Hàm tiện ích & Hằng số
│   │   ├── formatters.js       # Format tiền tệ VND, định dạng ngày tháng
│   │   ├── validators.js       # Validate dữ liệu form
│   │   └── constants.js        # Hằng số (API URL, Roles, Status)
│   │
│   ├── App.jsx                 # Component chính (Router Provider, Toast)
│   └── main.jsx                # Entry point gắn ứng dụng vào DOM (Vite)
│
├── db.json                     # Cơ sở dữ liệu giả lập (json-server)
├── package.json                # Quản lý dependencies & npm scripts
├── vite.config.js              # Cấu hình Vite
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

# ⚙️ Installation & Setup

## 1. Clone repository
## 2. Install dependencies

```bash
npm install
```

### Run Frontend

```bash
npm start
```

### Run Backend (json-server)

```bash
npx json-server --watch db.json --port 5000
```
