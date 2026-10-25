# 📚 INFINIA STORE — Bookstore Web Application

> **Đồ án môn học:** FER202 - Front-End Web Development with ReactJS  
> **Ứng dụng:** Nền tảng thương mại điện tử chuyên biệt cho mua bán & quản lý sách trực tuyến (Single Page Application - SPA).

---

# 💡 Ý Tưởng Ứng Dụng (Case Study & Business Analysis)

### 1. Bối cảnh & Lý do chọn đề tài
Trong thời đại chuyển đổi số, nhu cầu tiếp cận tri thức và mua sắm sách trực tuyến ngày càng phổ biến. Tuy nhiên, các nền tảng thương mại điện tử truyền thống thường gặp nhiều hạn chế:
* **Trải nghiệm gián đoạn:** Việc tải lại toàn bộ trang (Full page reload) mỗi khi chuyển mục hoặc lọc sách gây trễ và giảm sự tập trung của độc giả.
* **Sai lệch tồn kho thời gian thực:** Thiếu sự ràng buộc kiểm tra số lượng tồn kho khả dụng dẫn đến tình trạng khách hàng đặt hàng vượt quá số lượng thực tế trong kho, gây phát sinh hủy đơn hàng.
* **Quy trình quản trị thiếu đồng bộ:** Khó khăn trong việc thống kê doanh thu thực tế, cập nhật tình trạng đơn hàng và điều phối kho sách.

Dự án **INFINIA STORE** ra đời nhằm giải quyết toàn diện các vấn đề trên thông qua giải pháp **Single Page Application (SPA)** hiện đại được phát triển bằng **React 19 & Vite 8**. Hệ thống mang đến trải nghiệm mượt mà, phản hồi tức thì và quy trình nghiệp vụ mua bán - quản trị kho sách khép kín.

### 2. Đối tượng phục vụ & Mục tiêu bài toán
* **Dành cho Khách hàng (Customer):**
  - **Khám phá sách dễ dàng:** Tìm kiếm sách tức thì với công nghệ Debounce không dấu (`matchesSearch`), lọc sách đa tầng theo thể loại, khoảng giá và sắp xếp linh hoạt.
  - **Giỏ hàng & Quản lý tồn kho 3 lớp:** Ràng buộc chặt chẽ số lượng sách mua không vượt quá lượng tồn kho (`stock`), tự động cảnh báo khi sách hết hàng hoặc tồn kho thay đổi.
  - **Khuyến mãi & Thanh toán mượt mà:** Áp dụng mã ưu đãi (Voucher) với thuật toán kiểm tra điều kiện giảm giá, hoàn tất đơn hàng và theo dõi hành trình đơn.
  - **Tương tác độc giả:** Lưu trữ danh sách yêu thích (Wishlist) và viết nhận xét, đánh giá sao (1–5 sao) cho sách sau khi nhận hàng.
* **Dành cho Quản trị viên (Admin & Staff):**
  - **Thống kê kinh doanh trực quan (Dashboard):** Theo dõi tức thời Doanh thu thực tế, Tổng số đơn hàng hoàn tất, Số lượng khách hàng và Top 5 sách bán chạy nhất (Best Sellers).
  - **Quản lý kho sách toàn diện (Catalog Management):** Thêm, chỉnh sửa, điều chỉnh số lượng tồn kho, áp dụng xóa mềm (Soft Delete) và khôi phục sách an toàn.
  - **Điều phối đơn hàng 6 trạng thái:** Xử lý vòng đời đơn hàng (`Pending` ➔ `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` / `Cancelled`) kèm cơ chế tự động hoàn kho khi hủy đơn.

### 3. Quy tắc nghiệp vụ cốt lõi (Core Business Rules)
1. **Kiểm soát tính toàn vẹn tồn kho (Inventory Integrity):** Tồn kho được kiểm tra tại 3 cấp: tại Trang chi tiết sách, khi tăng giảm trong Giỏ hàng, và tại thời điểm Xác nhận thanh toán. Khi đơn hàng hủy hoặc khách trả hàng, tồn kho tự động được hoàn trả nguyên trạng.
2. **Quy tắc tính doanh thu chuẩn:** Doanh thu hệ thống chỉ ghi nhận từ các đơn hàng giao thành công (`Delivered`). Các đơn đang giao hoặc đã hủy không được tính vào doanh thu.
3. **Phân quyền và bảo mật tuyến đường:** Tích hợp Route Guards (`ProtectedRoute`, `AdminRoute`) bảo vệ các trang quản trị và thông tin cá nhân. Tự động đính kèm JWT token qua Axios Interceptors.
4. **Công nghệ mở rộng:** Tích hợp SDK EmailJS gửi mã xác thực OTP 6 số bảo mật trực tiếp về Gmail thật khi người dùng yêu cầu đặt lại mật khẩu.

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

# 📁 Project Structure & Architectural Responsibilities

## 1. Sơ đồ cây thư mục chi tiết

```text
FER202/
├── public/                         # Tài nguyên tĩnh phục vụ trực tiếp cho Client (không qua Vite đóng gói)
│   ├── images/                     # Ảnh bìa sách minh họa và banner
│   ├── favicon.svg                 # Biểu tượng Favicon trên tab trình duyệt
│   └── icons.svg                   # Bộ biểu tượng SVG dùng chung
│
├── data/                           # Cơ sở dữ liệu Mock REST API (json-server)
│   └── db.json                     # Cơ sở dữ liệu mẫu chuẩn hóa 100% kiểu dữ liệu (9 bảng thực thể)
│
├── src/                            # Mã nguồn ứng dụng React (Vite)
│   ├── api/                        # Tầng dịch vụ kết nối HTTP (Axios Service Layer)
│   │   ├── axiosClient.js          # Cấu hình Axios Base URL, timeout & response interceptors
│   │   ├── authApi.js              # Endpoint đăng nhập, đăng ký, cập nhật profile
│   │   ├── bookApi.js              # Endpoint sách, thể loại danh mục và đánh giá sách
│   │   ├── orderApi.js             # Endpoint đơn hàng, chi tiết đơn & orderItems
│   │   ├── userApi.js              # Endpoint quản lý người dùng, phân quyền & khóa tài khoản
│   │   └── voucherApi.js           # Endpoint quản lý mã giảm giá, tra cứu theo code
│   │
│   ├── components/                 # Các Component giao diện tái sử dụng (Shared UI Components)
│   │   ├── AdminSidebar.jsx        # Menu điều hướng bên trái trang Admin (hỗ trợ thu gọn/mở rộng)
│   │   ├── BookCard.jsx            # Thẻ sách (hiển thị ảnh, giá, sao, tồn kho, nút mua nhanh & wishlist)
│   │   ├── BookGrid.jsx            # Lưới responsive trình bày danh sách BookCard
│   │   ├── CartSummary.jsx         # Hộp tóm tắt tổng tiền, discount và nút chuyển sang checkout
│   │   ├── ConfirmModal.jsx        # Hộp thoại Modal xác nhận thao tác quan trọng (Hủy, Xóa, Khóa, Trả hàng)
│   │   ├── Footer.jsx              # Chân trang thông tin thương hiệu, chính sách & liên kết
│   │   ├── Header.jsx              # Thanh điều hướng trên cùng, badge giỏ hàng, menu tài khoản & logout
│   │   ├── LoadingSpinner.jsx      # Vòng xoay chờ khi đang nạp dữ liệu từ API hoặc Suspense Lazy Load
│   │   ├── OtpVerificationForm.jsx # Form nhập và xác thực mã OTP 6 số (giao diện đẹp, tự focus, đếm ngược)
│   │   ├── Pagination.jsx          # Thanh phân trang điều hướng trang trước/sau & chọn trang
│   │   ├── RatingStars.jsx         # Hiển thị số sao đánh giá (1-5 sao) trực quan
│   │   ├── ReviewSection.jsx       # Form gửi đánh giá và danh sách nhận xét kèm tỷ lệ sao
│   │   ├── ScrollToTop.jsx         # Tự động cuộn lên đầu trang khi chuyển đổi route URL
│   │   └── SearchBar.jsx           # Thanh tìm kiếm từ khóa tích hợp Debounce chống spam request
│   │
│   ├── layouts/                    # Khung bố cục giao diện phân tầng độc lập (Shared Layout Wrappers)
│   │   ├── AdminLayout.jsx         # Layout quản trị (Sidebar trái cố định, header & nội dung cuộn độc lập)
│   │   └── CustomerLayout.jsx      # Layout khách hàng (Header, Footer & Suspense container nạp trang con)
│   │
│   ├── routes/                     # Các bộ lọc kiểm soát truy cập tuyến đường (Route Guards)
│   │   ├── AdminRoute.jsx          # Bảo vệ Admin Portal (yêu cầu đăng nhập & quyền hạn admin / staff)
│   │   └── ProtectedRoute.jsx      # Bảo vệ trang cá nhân (yêu cầu đăng nhập & chặn user bị khóa blocked)
│   │
│   ├── pages/                      # Các màn hình trang chính (Page Views)
│   │   ├── admin/                  # Khu vực dành riêng cho Quản trị viên & Nhân viên (Admin Portal)
│   │   │   ├── AdminBooks.jsx      # Quản lý kho sách (Thêm/Sửa/Xóa mềm/Khôi phục, lọc status, phân trang)
│   │   │   ├── AdminCategories.jsx # Quản lý thể loại sách (Thêm/Sửa/Xóa mềm/Khôi phục, chống trùng tên)
│   │   │   ├── AdminDashboard.jsx  # Thống kê tổng doanh thu Delivered, tổng đơn, user và Top 5 bán chạy
│   │   │   ├── AdminOrders.jsx     # Quản lý đơn hàng, đổi trạng thái, tự động hoàn kho/voucher khi hủy
│   │   │   ├── AdminUsers.jsx      # Quản lý người dùng, tạo tài khoản Staff, phân quyền role, khóa user
│   │   │   └── AdminVouchers.jsx   # Quản lý voucher (%/cố định, hạn dùng, giới hạn, chống trùng mã)
│   │   │
│   │   └── customer/               # Khu vực dành cho Khách hàng mua sắm (Storefront)
│   │       ├── BookDetailPage.jsx     # Chi tiết sách, kiểm tra tồn kho, review (chỉ đơn Delivered được viết)
│   │       ├── BookListPage.jsx       # Danh mục sách toàn cửa hàng, lọc thể loại, tìm kiếm & sắp xếp
│   │       ├── CartPage.jsx           # Giỏ hàng, nút tăng/giảm kẹp kho, đối chiếu giá/kho mới nhất từ server
│   │       ├── CheckoutPage.jsx       # Chốt đơn, nhập địa chỉ, áp voucher, đối chiếu kho trước khi đặt
│   │       ├── ForgotPasswordPage.jsx # Quên mật khẩu qua email & xác minh OTP, chặn tài khoản bị suspended
│   │       ├── HomePage.jsx           # Trang chủ với hero banner, sách nổi bật & danh mục
│   │       ├── LoginPage.jsx          # Đăng nhập, chặn tài khoản blocked, đồng bộ cart & wishlist
│   │       ├── NotFoundPage.jsx       # Trang thông báo 404 thân thiện khi đường dẫn không tồn tại
│   │       ├── OrderDetailPage.jsx    # Chi tiết tiến trình đơn, snapshot người nhận, bảo mật quyền xem
│   │       ├── ProfilePage.jsx        # Quản lý thông tin cá nhân, đổi mật khẩu & tab lịch sử đơn hàng
│   │       ├── RegisterPage.jsx       # Đăng ký tài khoản mới, validate regex tên/SĐT/địa chỉ/mật khẩu
│   │       └── WishlistPage.jsx       # Danh sách sách yêu thích, chuyển vào giỏ theo tồn kho thực tế
│   │
│   ├── redux/                      # Quản lý Global State (Redux Toolkit + Redux Persist)
│   │   ├── authSlice.js            # State đăng nhập, thông tin user & quyền hạn (Admin/Staff/Customer)
│   │   ├── cartSlice.js            # State giỏ hàng, số lượng kẹp kho, đồng bộ dữ liệu với API
│   │   ├── orderSlice.js           # Luồng đặt hàng, hủy đơn, hoàn kho, hoàn voucher & cập nhật trạng thái
│   │   ├── store.js                # Cấu hình Redux Store kết hợp các Slice & Redux Persist lưu localStorage
│   │   └── wishlistSlice.js        # State danh sách sách yêu thích, thêm/xóa/dọn sạch khi đăng xuất
│   │
│   ├── utils/                      # Thư viện hàm xử lý thuần túy (Pure Business Helpers)
│   │   ├── cartUtils.js            # Logic tính discount (không vượt subtotal, tròn 2 số thập phân), hạn UTC+7
│   │   ├── emailService.js         # Tích hợp EmailJS gửi mã OTP khôi phục mật khẩu, che mờ email riêng tư
│   │   └── helpers.js              # Hằng số hệ thống, format tiền tệ ($10,000.00), ngày local, regex validate
│   │
│   ├── assets/                     # Tài nguyên media cục bộ (hero.png, logo svgs)
│   ├── App.css                     # Stylesheet bổ trợ giao diện
│   ├── App.jsx                     # Routing phân tầng (Layouts, Guards, Suspense Lazy Load, ToastContainer)
│   ├── index.css                   # Stylesheet giao diện toàn cục & Bootstrap overrides
│   └── main.jsx                    # Điểm khởi chạy ứng dụng vào DOM (ReactDOM, Provider, BrowserRouter)
│
├── .gitignore                      # Khai báo các file/thư mục loại trừ khỏi Git (node_modules, dist)
├── eslint.config.js                # Cấu hình kiểm tra chuẩn code ESLint Flat Config
├── index.html                      # Template HTML khởi tạo của Vite
├── jsconfig.json                   # Cấu hình hỗ trợ gợi ý đường dẫn code trong VS Code
├── package.json                    # Danh sách thư viện phụ thuộc & scripts chạy dự án
├── README.md                       # Tài liệu mô tả kiến trúc, hướng dẫn cài đặt & vận hành dự án
└── vite.config.js                  # Cấu hình môi trường và bộ đóng gói biên dịch Vite
```

---

## 2. Chi tiết mục đích và trách nhiệm của từng thư mục

### 🔹 `data/` (Mock Backend Database)
* **Mục đích**: Đóng vai trò là cơ sở dữ liệu giả lập cho toàn bộ ứng dụng, được phục vụ qua `json-server` tại cổng `5000`.
* **Trách nhiệm chi tiết**:
  * Chứa file `db.json` bao gồm 9 bảng dữ liệu: `users`, `categories`, `books`, `reviews`, `wishlists`, `carts`, `orders`, `orderItems`, `vouchers`.
  * Đảm bảo tính toàn vẹn dữ liệu (Data Integrity): Toàn bộ khóa chính và khóa ngoại (`id`, `userId`, `bookId`, `orderId`, v.v.) được lưu ở định dạng chuỗi (`string`) để đồng nhất với cơ chế tự sinh ID của `json-server`. Các trường định lượng (`price`, `stock`, `quantity`, `totalPrice`, `used`, `usageLimit`) được lưu ở định dạng số thuần (`number`).

### 🔹 `src/api/` (API Service Layer)
* **Mục đích**: Tách biệt hoàn toàn tầng giao tiếp mạng (HTTP Requests) ra khỏi giao diện React Components, tuân thủ nguyên lý Single Responsibility.
* **Trách nhiệm chi tiết**:
  * `axiosClient.js`: Tạo instance Axios chuẩn hóa `baseURL` (`http://localhost:5000`), cấu hình headers `Content-Type: application/json`, timeout và xử lý đón bắt response tập trung.
  * `authApi.js`: Cung cấp các hàm gọi API đăng nhập (`/users?email=...`), đăng ký mới (`POST /users`), cập nhật thông tin cá nhân/đổi mật khẩu (`PATCH /users/:id`).
  * `bookApi.js`: Quản lý sách (`/books`), danh mục (`/categories`), đánh giá (`/reviews`).
  * `orderApi.js`: Quản lý đơn hàng (`/orders`), các sản phẩm trong đơn (`/orderItems`), lọc đơn theo người dùng (`/orders?userId=...`).
  * `userApi.js`: Dành cho trang quản trị để lấy danh sách người dùng (`/users`), tạo tài khoản Staff, cập nhật trạng thái hoạt động/khóa (`status: "active" | "blocked"`).
  * `voucherApi.js`: Lấy toàn bộ mã voucher, tra cứu mã theo code in hoa (`/vouchers?code=...`), cập nhật lượt sử dụng (`used`).

### 🔹 `src/components/` (Shared UI Components)
* **Mục đích**: Chứa các thành phần giao diện dùng chung, có tính độc lập cao, nhận dữ liệu qua `props` và có thể tái sử dụng ở nhiều màn hình khác nhau.
* **Trách nhiệm chi tiết**:
  * `AdminSidebar.jsx`: Thanh menu bên trái dành riêng cho trang Admin, có nút thu gọn/mở rộng để tối ưu không gian hiển thị trên màn hình nhỏ.
  * `BookCard.jsx`: Hiển thị thông tin tổng quan của sách, kiểm tra trạng thái hết hàng/xóa mềm, nút thêm vào giỏ hàng có kiểm tra tồn kho, nút yêu thích.
  * `BookGrid.jsx`: Bố cục dạng lưới (Responsive CSS Grid/Row) tự co giãn từ 1 đến 4 cột tùy kích thước màn hình để hiển thị danh sách `BookCard`.
  * `CartSummary.jsx`: Hộp tóm tắt tiền gồm tổng phụ, giảm giá voucher, tổng thanh toán cuối cùng; tự động vô hiệu hóa nút chuyển sang thanh toán nếu trong giỏ có sản phẩm không hợp lệ.
  * `ConfirmModal.jsx`: Modal thông báo dùng chung trước các hành động nhạy cảm như xóa sách, hủy đơn hàng, yêu cầu hoàn trả, khóa tài khoản nhằm bảo vệ trải nghiệm người dùng (UX).
  * `Header.jsx` & `Footer.jsx`: Bố cục điều hướng đầu trang và chân trang; tự động thay đổi menu theo trạng thái đăng nhập và vai trò (Admin / Customer).
  * `LoadingSpinner.jsx`: Hiển thị vòng xoay tải dữ liệu đồng nhất trên toàn hệ thống và làm fallback cho `React.Suspense`.
  * `OtpVerificationForm.jsx`: Giao diện nhập mã OTP gồm 6 ô số rời rạc, hỗ trợ tự động nhảy ô tiếp theo, tự động paste mã từ clipboard, hiển thị bộ đếm ngược thời gian hết hạn và nút gửi lại mã.
  * `Pagination.jsx`: Thanh điều hướng phân trang độc lập, tính toán trang đầu, trang cuối, trang kế tiếp.
  * `RatingStars.jsx`: Hiển thị số sao đánh giá vàng/xám theo số thực từ 0 đến 5.
  * `ReviewSection.jsx`: Hiển thị tỷ lệ đánh giá sao (Rating Breakdown) và form viết nhận xét của khách hàng.
  * `ScrollToTop.jsx`: Lắng nghe sự kiện thay đổi của đường dẫn URL (`useLocation`) để tự động cuộn trình duyệt lên vị trí đỉnh trang (`window.scrollTo`), nâng cao trải nghiệm điều hướng trong Single Page Application.
  * `SearchBar.jsx`: Thanh tìm kiếm tích hợp debounce để hạn chế việc gửi truy vấn liên tục khi người dùng đang gõ phím.

### 🔹 `src/layouts/` (Layout Wrappers)
* **Mục đích**: Đóng gói khung hiển thị giao diện dùng chung theo từng vai trò, phân tách hoàn toàn khỏi file cấu hình định tuyến `App.jsx`.
* **Trách nhiệm chi tiết**:
  * `CustomerLayout.jsx`: Bọc ngoài toàn bộ giao diện khách hàng với `Header`, `Footer`, và tích hợp thẻ `React.Suspense` làm fallback mượt mà khi người dùng di chuyển giữa các trang lazy load.
  * `AdminLayout.jsx`: Bọc giao diện quản trị Admin với menu sidebar cố định bên trái, header cố định và khu vực hiển thị nội dung bên phải cuộn độc lập.

### 🔹 `src/routes/` (Route Guards & Access Control)
* **Mục đích**: Quản lý tập trung các bộ lọc bảo vệ an toàn tuyến đường, kiểm tra phiên đăng nhập và quyền hạn người dùng trước khi cấp quyền hiển thị màn hình.
* **Trách nhiệm chi tiết**:
  * `ProtectedRoute.jsx`: Kiểm tra trạng thái đăng nhập (`isAuthenticated`). Chuyển hướng người dùng chưa đăng nhập về trang `/login` (kèm lưu lại vị trí trang trước đó) và ngăn chặn truy cập đối với tài khoản đang bị khóa (`status: "blocked"`).
  * `AdminRoute.jsx`: Kiểm tra quyền hạn chuyên biệt cho khu vực quản trị. Chỉ cho phép các tài khoản có vai trò `role: "admin"` hoặc `role: "staff"` đang ở trạng thái hoạt động truy cập. Tự động đẩy người dùng thông thường về trang chủ `/`.

### 🔹 `src/pages/admin/` (Admin Portal)
* **Mục đích**: Khu vực quản trị hệ thống, được bảo vệ nghiêm ngặt qua `AdminRoute` (chỉ user có `role: "admin"` mới được truy cập). Toàn bộ các trang này được tải theo dạng **Code-splitting (React.lazy)** để tối ưu tốc độ tải trang ban đầu.
* **Trách nhiệm chi tiết**:
  * `AdminDashboard.jsx`: Báo cáo thời gian thực về Tổng doanh thu (chỉ tính các đơn hàng ở trạng thái `Delivered`), Tổng số đơn hàng, Tổng khách hàng, Số lượng sách đang mở bán, và Top 5 sách bán chạy nhất (fallback an toàn cho cả sách đã bị xóa mềm).
  * `AdminBooks.jsx`: Quản lý kho sách (Thêm sách mới, Cập nhật thông tin, Xóa mềm `isDeleted: true`, Khôi phục sách, tự động chuyển trạng thái `Out of Stock` khi tồn kho bằng 0, phân trang và tìm kiếm).
  * `AdminCategories.jsx`: Quản lý danh mục thể loại sách, kiểm tra chống trùng tên thể loại khi tạo mới.
  * `AdminOrders.jsx`: Quản lý danh sách đơn hàng, xem chi tiết sản phẩm, cập nhật trạng thái đơn theo đúng quy tắc chuyển trạng thái. Tự động hoàn trả tồn kho và hoàn trả lượt dùng voucher vào database khi hủy đơn. Ngăn chặn Admin tự chuyển đơn từ `Delivered` sang `Returned`.
  * `AdminUsers.jsx`: Quản lý người dùng, tạo tài khoản Staff mới (kiểm tra chống trùng email), cập nhật quyền hạn (Role), khóa hoặc kích hoạt tài khoản.
  * `AdminVouchers.jsx`: Quản lý mã giảm giá, thiết lập loại voucher (giảm theo % hoặc cố định), kiểm tra chống trùng mã voucher, quản lý hạn dùng và giới hạn số lượt sử dụng.

### 🔹 `src/pages/customer/` (Customer Storefront)
* **Mục đích**: Toàn bộ luồng trải nghiệm mua sắm của khách hàng từ tìm kiếm sách đến thanh toán và theo dõi đơn hàng.
* **Trách nhiệm chi tiết**:
  * `HomePage.jsx`: Trang chủ hiển thị hero banner, sách nổi bật, sách mới và liên kết nhanh đến các thể loại phổ biến. Tự động loại bỏ sách thuộc danh mục đã bị xóa mềm.
  * `BookListPage.jsx`: Danh mục toàn bộ sách với bộ lọc thể loại đa năng, thanh tìm kiếm từ khóa, sắp xếp theo giá tăng/giảm hoặc đánh giá sao, tích hợp phân trang.
  * `BookDetailPage.jsx`: Chi tiết sách đầy đủ. Kiểm tra nếu sách hoặc danh mục chứa sách đã bị xóa mềm sẽ hiển thị 404 Not Found. Kiểm tra điều kiện viết đánh giá: Chỉ những khách hàng đã nhận sách (thuộc đơn hàng `Delivered`) và chưa từng đánh giá cuốn sách này mới được phép gửi đánh giá.
  * `CartPage.jsx`: Quản lý giỏ hàng. Tự động tải lại giỏ hàng và dữ liệu sách mới nhất từ server khi vào trang để phát hiện kịp thời các thay đổi về giá hoặc tồn kho. Hỗ trợ tăng/giảm số lượng có kẹp mốc tồn kho tối đa. Vô hiệu hóa nút thanh toán nếu có sản phẩm hết hàng trong giỏ.
  * `CheckoutPage.jsx`: Quy trình thanh toán đặt hàng. Nhập thông tin người nhận hàng với kiểm tra định dạng tên, SĐT 10 số VN, địa chỉ. Áp dụng mã giảm giá (tự động gợi ý voucher còn hạn/còn lượt hoặc nhập tay). Trước khi tạo đơn, tự động đối chiếu tồn kho và giá tiền thực tế trên server để chống gian lận dữ liệu.
  * `OrderDetailPage.jsx`: Xem chi tiết đơn hàng đã đặt, snapshot thông tin người nhận, danh sách cuốn sách đã mua. Hỗ trợ các nút thao tác: Hủy đơn (Pending), Xác nhận đã nhận hàng (Shipping -> Delivered), Yêu cầu trả hàng (Delivered -> Returned). Bảo mật kiểm tra: Chặn khách hàng xem đơn hàng của người dùng khác (Access Denied).
  * `ProfilePage.jsx`: Quản lý thông tin tài khoản cá nhân, đổi mật khẩu (yêu cầu mật khẩu cũ và kiểm tra 6-18 ký tự), tích hợp tab lịch sử đơn hàng cá nhân (My Orders).
  * `WishlistPage.jsx`: Danh sách cuốn sách yêu thích, hỗ trợ chuyển nhanh vào giỏ hàng với đầy đủ cơ chế kiểm tra tồn kho thực tế.
  * `LoginPage.jsx`: Đăng nhập hệ thống, kiểm tra chống đăng nhập đối với tài khoản bị Admin khóa (`status: "blocked"`), tự động tải lại giỏ hàng và danh sách yêu thích khi đăng nhập thành công.
  * `RegisterPage.jsx`: Đăng ký tài khoản người dùng mới với đầy đủ kiểm tra định dạng dữ liệu (Tên và địa chỉ >= 2 từ, SĐT 10 chữ số đúng đầu mạng VN, mật khẩu 6-18 ký tự). Kiểm tra chống trùng email đã đăng ký.
  * `ForgotPasswordPage.jsx`: Khôi phục mật khẩu thông qua xác thực email. Kiểm tra chặn khôi phục đối với tài khoản đang bị Admin khóa; cho phép đặt lại mật khẩu mới an toàn.
  * `NotFoundPage.jsx`: Trang báo lỗi 404 thân thiện kèm nút điều hướng quay về trang chủ khi người dùng truy cập vào URL không hợp lệ.

### 🔹 `src/redux/` (Global State Management)
* **Mục đích**: Quản lý trạng thái tập trung của toàn bộ ứng dụng sử dụng Redux Toolkit, kết hợp Redux Persist để lưu trữ phiên làm việc xuống `localStorage`.
* **Trách nhiệm chi tiết**:
  * `store.js`: Cấu hình Redux store trung tâm, kết hợp các reducers và thiết lập cơ chế lưu trữ bền vững (Persistence) cho `auth` và `cart`.
  * `authSlice.js`: Lưu trạng thái đăng nhập (`isAuthenticated`), đối tượng người dùng hiện tại (`user`), xử lý `login`, `logout`, `register`, `updateProfile`.
  * `cartSlice.js`: Lưu danh sách sản phẩm trong giỏ, tổng số lượng (`totalQuantity`), tổng tiền (`totalPrice`), hỗ trợ các action `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, và `syncCartToApi` để đồng bộ xuống database.
  * `orderSlice.js`: Chứa các async thunk phức tạp: `fetchOrders`, `fetchOrderDetail`, `createOrder` (tạo đơn, trừ tồn kho sách, tăng số lần dùng voucher), `cancelOrder` (hủy đơn, hoàn lại tồn kho, hoàn lại voucher), `confirmReceipt`, `returnOrder`, và `updateOrderStatus` dành cho Admin.
  * `wishlistSlice.js`: Quản lý danh sách sách yêu thích, hỗ trợ `fetchWishlist`, `addWishlistItem`, `removeWishlistItem`, và `clearWishlist` khi đăng xuất.

### 🔹 `src/utils/` (Pure Utilities & Domain Logic)
* **Mục đích**: Chứa toàn bộ các hàm xử lý logic thuần túy (Pure Functions) dùng chung, không phụ thuộc vào React Component hay State, dễ dàng kiểm thử và bảo trì.
* **Trách nhiệm chi tiết**:
  * `helpers.js`:
    * Chứa các hằng số trạng thái hệ thống: `ORDER_STATUS`, `USER_ROLES`, `BOOK_STATUS`, `VOUCHER_STATUS`.
    * Định dạng tiền tệ: `formatCurrency(amount)` hiển thị chuẩn quốc tế `$10,000.00`.
    * Xử lý ngày tháng: `getLocalDateString()` trả về ngày local `YYYY-MM-DD` loại bỏ hoàn toàn lỗi lệch ngày do múi giờ UTC+7.
    * Các hàm kiểm tra định dạng (Validators): `isValidEmail`, `isValidPhone` (đầu số nhà mạng Việt Nam 03, 05, 07, 08, 09), `isValidPassword` (6-18 ký tự), `isValidFullName`, `isValidAddress`.
    * Bộ lọc sách: `filterBooks` hỗ trợ lọc theo thể loại, tìm kiếm từ khóa, khoảng giá và sắp xếp.
  * `cartUtils.js`:
    * `calculateDiscount(totalAmount, voucher)`: Tính toán số tiền giảm giá chính xác theo % hoặc số tiền cố định, kẹp mức giảm không vượt quá tổng tiền sản phẩm và làm tròn 2 chữ số thập phân (`Math.round(val * 100) / 100`).
    * `calculateOrderTotal(subtotal, shippingFee, discount)`: Tính tổng tiền thanh toán cuối cùng.
    * `isVoucherExpired(expirationDate)`: Kiểm tra hạn dùng voucher chính xác đến cuối ngày `23:59:59` giờ Việt Nam (UTC+7).
    * `isVoucherValid(voucher)`: Kiểm tra điều kiện áp dụng toàn diện (không bị xóa mềm, trạng thái Active, còn hạn và còn lượt dùng).
  * `emailService.js`:
    * Tích hợp dịch vụ bên thứ ba **EmailJS** gửi trực tiếp mã OTP khôi phục mật khẩu vào hòm thư Gmail của khách hàng mà không cần backend SMTP phức tạp.
    * `generateOTP()`: Sinh chuỗi mã OTP ngẫu nhiên gồm 6 chữ số an toàn.
    * `maskEmail(email)`: Ẩn một phần ký tự trong địa chỉ hòm thư (ví dụ `wt***ne@gmail.com`) để đảm bảo quyền riêng tư người dùng.
    * `isEmailJsConfigured()`: Kiểm tra tính sẵn sàng của bộ biến môi trường Vite (`VITE_EMAILJS_*`).

### 🔹 Cấu hình gốc dự án (Root Files)
* `App.jsx`: Bộ khung điều hướng trung tâm, phân chia layout (`CustomerLayout` và `AdminLayout`), thiết lập bảo vệ tuyến đường (`ProtectedRoute`, `AdminRoute`), tối ưu hóa tải trang với `React.lazy()` và tích hợp thanh thông báo `ToastContainer` toàn cục.
* `main.jsx`: Điểm gắn ứng dụng React vào DOM, bọc các Provider (`Provider store`, `PersistGate`, `BrowserRouter`).
* `jsconfig.json`: Định nghĩa cấu hình đường dẫn gốc (`"baseUrl": "src"`) giúp VS Code hỗ trợ gợi ý code thông minh và điều hướng nhanh giữa các file.
* `eslint.config.js`: Cấu hình bộ quy tắc kiểm tra chất lượng code ESLint chuẩn flat config mới nhất.
* `vite.config.js`: Cấu hình bộ đóng gói và máy chủ phát triển Vite.

---

---

# ⚙️ Installation & Setup

## 1. Clone repository
## 2. Install dependencies

```bash
npm install
```

### Run Frontend (Mở Terminal 1)

```bash
npm run dev
# hoặc: npm start
```

### Run Backend JSON Server (Mở Terminal 2 riêng biệt)

```bash
npm run server
# hoặc: npx json-server data/db.json --port 5000
```

---

## ✅ Quality Assurance & Verification Checklist

- [x] **Authentication:** Login, Register, Logout and Route Guards (User & Admin).
- [x] **Product Catalog:** Category live filters, search bar debounce, pagination and book detail view.
- [x] **Shopping & Cart:** Add/Remove items, dynamic quantity adjustment and local storage sync.
- [x] **Order Workflow:** Checkout flow, discount voucher application, tracking history and status transitions.
- [x] **Reviews & Ratings:** Interactive rating stars and review list submission.
- [x] **Admin Management:** Inventory management (CRUD books), category maintenance, voucher control and user status toggling.

---

---

# 🎯 Bảng Ánh Xạ Chuẩn Đầu Ra Môn Học (LO1 – LO8 Mapping)

Dự án **INFINIA STORE** đáp ứng trọn vẹn 100% tất cả các Chuẩn đầu ra (Learning Outcomes - LO) của môn học **FER202**:

| Chuẩn Đầu Ra | Yêu Cầu Của Môn Học | Minh Chứng Triển Khai Thực Tế Trong Dự Án | Đánh Giá |
| :---: | :--- | :--- | :---: |
| **LO1** | **Hiểu và giải thích được nguyên lý kiến trúc React Component và Virtual DOM** | • Ứng dụng kiến trúc React Component phân cấp rõ ràng: `layouts`, `pages`, `components` dùng chung.<br>• Virtual DOM Diffing thông qua thuộc tính `key={book.id}`, `key={order.id}` khi render danh sách để tối ưu hiệu năng render. | **ĐẠT** |
| **LO2** | **Xây dựng giao diện Web tương tác và responsive với JSX và CSS Framework** | • Sử dụng **React-Bootstrap 2.10** và **Bootstrap 5.3** xây dựng giao diện responsive hoàn chỉnh trên Mobile, Tablet, Desktop.<br>• Thiết kế giao diện thân thiện: Modal xác nhận (`ConfirmModal`), Drawer Menu (`AdminSidebar`), Badge trạng thái, Thẻ sách (`BookCard`), Form validation. | **ĐẠT** |
| **LO3** | **Quản lý Component State, Props và các React Hooks cơ bản & nâng cao** | • Sử dụng `useState` cho state cục bộ và state form.<br>• Sử dụng `useEffect` cho side-effects, data fetching và đồng bộ URL params.<br>• Áp dụng `useMemo` tối ưu hóa bộ lọc sách đa tầng tránh re-render thừa.<br>• Sử dụng `useRef` xử lý auto-focus 6 ô nhập mã OTP (`OtpVerificationForm`). | **ĐẠT** |
| **LO4** | **Thiết lập điều hướng đơn trang (SPA Routing) và kiểm soát quyền truy cập** | • Cấu hình **React Router DOM v7** với các tuyến đường lồng nhau (Nested Routes).<br>• Triển khai Route Guards: `ProtectedRoute` (chặn khách vãng lai, lưu đường dẫn cũ `location.state.from`) và `AdminRoute` (chặn người dùng thường và tài khoản bị khóa `status: blocked`). | **ĐẠT** |
| **LO5** | **Quản lý Global State tập trung với Redux Toolkit và Redux Persist** | • Cấu hình **Redux Toolkit (`@reduxjs/toolkit`)** với 4 slices nghiệp vụ: `authSlice`, `cartSlice`, `orderSlice`, `wishlistSlice`.<br>• Tích hợp **`redux-persist`** lưu cache state vào `localStorage`, F5 không mất dữ liệu, triệt tiêu lỗi truyền props lòng vòng (Props Drilling). | **ĐẠT** |
| **LO6** | **Tích hợp RESTful API với Axios và xử lý bất đồng bộ (Async/Await)** | • Xây dựng tầng mạng trung tâm `axiosClient.js` tích hợp Request Interceptor tự động gắn `Bearer token` và Response Interceptor bắt mã lỗi `401/403`.<br>• Sử dụng `createAsyncThunk` và `Promise.all` gọi song song 4 API tại `AdminDashboard`. | **ĐẠT** |
| **LO7** | **Xây dựng đầy đủ các chức năng CRUD và quy tắc nghiệp vụ thực tế** | • Đầy đủ thao tác **Create, Read, Update, Delete** trên 6 module: Sách, Danh mục, Đơn hàng, Voucher, Khách hàng và Đánh giá.<br>• Logic nghiệp vụ chuyên sâu: Kiểm soát tồn kho 3 lớp, voucher giảm giá, xóa mềm (Soft Delete), vòng đời đơn 6 trạng thái, hủy đơn tự động hoàn kho và voucher. | **ĐẠT** |
| **LO8** | **Quản lý mã nguồn dự án chuyên nghiệp với Git và làm việc nhóm** | • Áp dụng mô hình **Git-Flow** với các nhánh: `main`, `develop`, và 6 nhánh `feature/*`.<br>• Lịch sử commit minh bạch, phân bổ đóng góp đều đặn giữa các thành viên trải dài qua các tuần làm bài.<br>• 100% commit có code thật, không có commit rỗng, tuân thủ Conventional Commits. | **ĐẠT** |

---

# 👥 Bảng Phân Công & Tỷ Lệ Đóng Góp Thành Viên (100%)

> **Tiêu chuẩn đáp ứng yêu cầu môn học:** Mỗi thành viên đều đảm nhiệm trọn vẹn **ít nhất 2 Pages**, **nhiều Components dùng chung**, **State & API tương ứng** và đóng góp tích cực, đồng đều trong suốt quá trình phát triển dự án.

| STT | Họ và Tên | Vai Trò | Pages Phụ Trách | Components & Layouts | Logic Nghiệp Vụ, State & API | Đóng Góp |
| :---: | :--- | :---: | :--- | :--- | :--- | :---: |
| **1** | **Lê Hoàng Nhẩn** | Nhóm trưởng *(Lead)* | • `AdminDashboard.jsx`<br>• `AdminBooks.jsx` | • `CustomerLayout.jsx`<br>• `AdminLayout.jsx`<br>• `AdminSidebar.jsx`<br>• `ConfirmModal.jsx`<br>• `LoadingSpinner.jsx`<br>• `ScrollToTop.jsx` | • Setup Vite 8 + React 19, tối ưu `manualChunks`<br>• Thiết kế Schema 9 bảng CSDL `db.json`<br>• `axiosClient.js` (Interceptors gắn JWT, bắt 401/403)<br>• Root Redux `store.js` + Redux Persist lưu cache<br>• Thuật toán tính Tổng doanh thu từ đơn `Delivered`<br>• Thuật toán Top 5 Best Sellers bán chạy nhất<br>• Quản lý kho sách, Xóa mềm & Khôi phục sách | **20%** |
| **2** | **Nguyễn Thị Hồng Kiều** | Thành viên | • `LoginPage.jsx`<br>• `RegisterPage.jsx`<br>• `ForgotPasswordPage.jsx`<br>• `ProfilePage.jsx` | • `AdminUsers.jsx`<br>• `Header.jsx`<br>• `Footer.jsx`<br>• `OtpVerificationForm.jsx` | • `authSlice.js` & `authApi.js` (Đăng nhập/Đăng ký)<br>• Tích hợp SDK EmailJS gửi mã OTP qua Gmail thật<br>• Bảo vệ URL với `ProtectedRoute` & `AdminRoute`<br>• Quản lý tài khoản User, toggle Khóa/Mở Block | **20%** |
| **3** | **Cao Huỳnh Trâm** | Thành viên | • `HomePage.jsx`<br>• `BookListPage.jsx`<br>• `BookDetailPage.jsx` | • `AdminCategories.jsx`<br>• `BookCard.jsx`<br>• `BookGrid.jsx`<br>• `SearchBar.jsx`<br>• `Pagination.jsx` | • `bookApi.js` (Lấy dữ liệu sách & danh mục)<br>• Live Search Debounce không dấu `matchesSearch`<br>• Bộ lọc đa tầng (Danh mục, Tìm kiếm, Sắp xếp)<br>• Phân trang dữ liệu tự động 8 sách / trang<br>• Quản lý Thể loại, kiểm tra trùng tên & Xóa mềm | **20%** |
| **4** | **Trang Tiến Đạt** | Thành viên | • `CartPage.jsx`<br>• `CheckoutPage.jsx` | • `AdminVouchers.jsx`<br>• `CartSummary.jsx`<br>• `CartItemRow` | • `cartSlice.js` & `voucherApi.js`<br>• Kiểm soát tồn kho: Chặn tăng quá stock, giữ min=1<br>• Cảnh báo tồn kho thời gian thực trên giỏ hàng<br>• Thuật toán áp Voucher kiểm tra hạn & lượt dùng<br>• Xử lý thanh toán, tự động trừ tồn kho sách | **20%** |
| **5** | **Phạm Tuấn Kiệt** | Thành viên | • `WishlistPage.jsx`<br>• `OrderDetailPage.jsx` | • `AdminOrders.jsx`<br>• `RatingStars.jsx`<br>• `ReviewSection.jsx` | • `wishlistSlice.js` & `orderSlice.js` & `orderApi.js`<br>• Đánh giá sao 1-5 sao, tính điểm sao trung bình<br>• Vòng đời 6 bước duyệt đơn hàng `AdminOrders`<br>• Thuật toán tự động hoàn kho khi Hủy/Trả đơn hàng | **20%** |

---

# 📚 Danh Sách Tài Liệu Tham Khảo & Công Cụ AI Đã Dùng

Theo hướng dẫn của giảng viên tại Mục 6.1 về việc công khai minh bạch tài liệu tham khảo và công cụ hỗ trợ trong đồ án môn học:

### 1. Tài liệu tham khảo chính thống:
* **React 19 Official Documentation:** [https://react.dev/](https://react.dev/) — Tham khảo các nguyên lý về React Component, State, Props và các Hooks hiện đại.
* **Redux Toolkit Official Guide:** [https://redux-toolkit.js.org/](https://redux-toolkit.js.org/) — Hướng dẫn xây dựng Redux Slice, Reducer và Async Thunk.
* **React-Bootstrap Documentation:** [https://react-bootstrap.netlify.app/](https://react-bootstrap.netlify.app/) — Tham khảo hệ thống Component Grid, Modal, Form, Table.
* **React Router DOM v7 Guide:** [https://reactrouter.com/](https://reactrouter.com/) — Cấu hình hệ thống tuyến đường và phân quyền Route Guards.
* **EmailJS Browser SDK Documentation:** [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/) — Hướng dẫn tích hợp gửi mã OTP bảo mật qua hòm thư điện tử Gmail.
* **json-server Repository:** [https://github.com/typicode/json-server](https://github.com/typicode/json-server) — Hướng dẫn thiết lập REST Mock API cho việc phát triển frontend độc lập.

### 2. Công cụ AI hỗ trợ:
* **ChatGPT (OpenAI) / GitHub Copilot:** Sử dụng để tra cứu cú pháp JavaScript ES6+, tham khảo cách đặt tên hàm theo chuẩn Conventional và hỗ trợ phân tích các thông báo lỗi cú pháp trong quá trình phát triển mã nguồn. Toàn bộ logic nghiệp vụ, cấu trúc dữ liệu và giao diện đã được nhóm sinh viên trực tiếp thiết kế, kiểm thử và làm chủ 100%.
