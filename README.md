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

## 💳 Quy trình Đặt hàng & Thanh toán
1. Người dùng chọn sách và thêm vào giỏ hàng.
2. Kiểm tra danh sách giỏ hàng và nhập mã voucher giảm giá (nếu có).
3. Điền thông tin giao hàng và chọn phương thức thanh toán.
4. Đơn hàng được tạo với trạng thái ban đầu là `Pending`.
5. Quản trị viên cập nhật trạng thái đơn sang `Processing`, `Shipped` hoặc `Delivered`.

## ⭐ Đánh giá & Phản hồi
- Khách hàng đã đăng nhập có thể gửi đánh giá từ 1 đến 5 sao kèm bình luận.
- Điểm đánh giá trung bình được tính toán tự động và hiển thị trên thẻ sách và trang chi tiết sách.

## 🛠️ Build & Kiểm thử

```bash
# Kiểm tra định dạng mã nguồn và lỗi cú pháp
npm run lint

# Tạo bản build tối ưu hóa cho môi trường Production
npm run build

# Chạy thử bản build production trên máy cục bộ
npm run preview
```

## 🗄️ Cấu trúc Cơ sở Dữ liệu (db.json)
- `books`: Chứa thông tin sách, tác giả, giá tiền, số lượng tồn kho, danh mục và xếp hạng.
- `categories`: Danh sách thể loại sách.
- `vouchers`: Mã giảm giá, loại giảm giá (phần trăm / cố định) và hạn mức.
- `users`: Tài khoản người dùng và vai trò (`customer` / `admin`).
- `orders`: Thông tin đơn mua, sản phẩm mua, giá trị tổng và trạng thái giao hàng.
- `reviews`: Đánh giá phản hồi của độc giả về từng cuốn sách.

## ✅ Bảng kiểm thử Tính năng (QA Checklist)
- [x] Đăng ký / Đăng nhập / Đăng xuất tài khoản người dùng và quản trị viên.
- [x] Bảo vệ định tuyến (ProtectedRoute & AdminRoute).
- [x] Danh mục sách với tìm kiếm realtime, phân trang và lọc theo thể loại.
- [x] Trang chi tiết sách với hình ảnh, mô tả, đánh giá sao.
- [x] Thêm vào giỏ hàng, cập nhật số lượng, xóa sản phẩm và lưu `localStorage`.
- [x] Áp dụng mã giảm giá voucher hợp lệ và tính toán tổng tiền thanh toán.
- [x] Đặt hàng, theo dõi lịch sử đơn hàng và chi tiết hóa đơn.
- [x] Trang quản trị: CRUD sách, danh mục thể loại, mã voucher và danh sách người dùng.
- [x] Dashboard thống kê doanh thu, số lượng đơn hàng và số sách bán chạy.
