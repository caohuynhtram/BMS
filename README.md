# 📚 Bookstore Management System (BMS) - FER202

Dự án đồ án kết thúc môn FER202 - Xây dựng ứng dụng web quản lý và mua bán sách trực tuyến.

## 🎯 Mục tiêu dự án
- Ứng dụng Single Page Application xây dựng trên nền tảng React 19 và Vite.
- Quản lý trạng thái toàn cục (State Management) với Redux Toolkit.
- Tương tác Mock RESTful API backend bằng JSON-Server.
- Giao diện thân thiện người dùng tối ưu trên đa thiết bị với Bootstrap 5.

## 👥 Thành viên nhóm thực hiện
1. Lê Hoàng Nhẩn (Nhóm trưởng)
2. Nguyễn Thị Hồng Kiều
3. Cao Huỳnh Trâm
4. Trang Tiến Đạt
5. Phạm Tuấn Kiệt

## 🚀 Hướng dẫn cài đặt & Chạy dự án

```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi động Mock REST API Server (port 5000)
npm run server

# 3. Khởi động ứng dụng React Vite Client (port 5173)
npm run dev

# 4. Chạy đồng thời cả Client và Server
npm run dev:all
```

## 📐 Kiến trúc & Công nghệ

### Redux State Management
- `authSlice`: Quản lý thông tin đăng nhập, token và phân quyền người dùng.
- `bookSlice`: Quản lý danh mục sách, bộ lọc tìm kiếm và chi tiết sách.
- `cartSlice`: Quản lý giỏ hàng, số lượng và đồng bộ `localStorage`.
- `orderSlice`: Quản lý lịch sử đặt hàng và trạng thái đơn mua.
- `wishlistSlice`: Quản lý danh sách sách yêu thích.

## 🔌 Danh sách API Endpoints (JSON-Server)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET/POST` | `/books` | Danh sách và thêm mới sách |
| `GET/PUT/DELETE` | `/books/:id` | Chi tiết, cập nhật và xóa sách |
| `GET/POST` | `/categories` | Danh mục thể loại sách |
| `GET/POST` | `/vouchers` | Quản lý mã giảm giá |
| `GET/POST` | `/orders` | Quản lý đơn đặt hàng |
| `GET/POST` | `/users` | Quản lý tài khoản người dùng |
