# 📖 Hướng Dẫn Cấu Trúc Dữ Liệu `db.json` (Chuẩn Dự Án)

Tài liệu này liệt kê toàn bộ cấu trúc dữ liệu chính xác theo file **`db.json`** của dự án Bookstore.

---

## 🚀 1. Khởi Chạy Backend API (`json-server`)

```bash
npx json-server --watch db.json --port 5000
```

---

## 📋 2. Cấu Trúc Các Resource Đã Cấu Hình

| Resource | Đường dẫn API | Mô tả |
| :--- | :--- | :--- |
| `users` | `http://localhost:5000/users` | Quản lý người dùng & phân quyền (`admin` / `user`) |
| `categories` | `http://localhost:5000/categories` | Danh mục sản phẩm (Programming, Technology, Business,...) |
| `books` | `http://localhost:5000/books` | Danh sách sách, giá tiền, kho hàng, đánh giá |
| `reviews` | `http://localhost:5000/reviews` | Đánh giá & nhận xét sách theo từng user |
| `wishlists` | `http://localhost:5000/wishlists` | Danh sách yêu thích của người dùng |
| `carts` | `http://localhost:5000/carts` | Giỏ hàng tạm thời |
| `orders` | `http://localhost:5000/orders` | Đơn hàng đã mua & trạng thái (Delivered, Returned, Cancelled...) |
| `orderItems` | `http://localhost:5000/orderItems` | Chi tiết các cuốn sách nằm trong từng đơn hàng |
| `vouchers` | `http://localhost:5000/vouchers` | Mã giảm giá (`SALE10`, `NEWUSER5`) |

---

## 🔑 3. Tài Khoản Mặc Định Đã Tạo Trong `db.json`

| Vai trò | Email đăng nhập | Mật khẩu | Tên hiển thị |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bookstore.com` | `123456` | Admin |
| **User (Khách hàng)** | `john@example.com` | `123456` | John Doe |
| **User (Test)** | `test2@gmail.com` | `123456` | test |
