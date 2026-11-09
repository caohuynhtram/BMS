import { useEffect, useState } from "react";
import { Container, Card, Table, Button, Image } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderDetail, cancelOrder, confirmReceipt, returnOrder } from "../../redux/orderSlice";
import LoadingSpinner from "../../components/LoadingSpinner";
import ConfirmModal from "../../components/ConfirmModal";
import bookApi from "../../api/bookApi";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaCheckCircle, FaUndo, FaArrowLeft, FaTimesCircle, FaLock, FaMapMarkerAlt, FaPhone, FaUser } from "react-icons/fa";

const statusBadgeClasses = {
  Pending: "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  Confirmed: "bg-info-subtle text-info-emphasis border border-info-subtle",
  Shipping: "bg-primary-subtle text-primary-emphasis border border-primary-subtle",
  Delivered: "bg-success-subtle text-success-emphasis border border-success-subtle",
  Cancelled: "bg-danger-subtle text-danger-emphasis border border-danger-subtle",
  "Return Requested": "bg-warning-subtle text-warning-emphasis border border-warning-subtle",
  Returned: "bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle",
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.auth);
  const [books, setBooks] = useState([]);

  // Modal xác nhận thao tác đơn hàng
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    dispatch(fetchOrderDetail(id));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await bookApi.getAll();
        setBooks(res.data || []);
      } catch (err) {
        console.error("Failed to fetch books:", err);
      }
    };
    fetchBooks();
  }, []);

  const getBookInfo = (bookId) => {
    return books.find((b) => String(b.id) === String(bookId));
  };

  const handleConfirmCancel = () => {
    setConfirmModal({
      show: true,
      title: "Xác nhận hủy đơn hàng",
      message: "Bạn có chắc chắn muốn hủy đơn hàng này không? Số lượng sách sẽ được tự động hoàn lại vào kho.",
      confirmText: "Hủy đơn hàng",
      cancelText: "Đóng",
      onConfirm: async () => {
        try {
          await dispatch(cancelOrder(id)).unwrap();
          toast.success("Đã hủy đơn hàng thành công.");
        } catch (err) {
          toast.error(typeof err === "string" ? err : "Không thể hủy đơn hàng lúc này. Vui lòng thử lại sau.");
        }
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleConfirmReceipt = () => {
    setConfirmModal({
      show: true,
      title: "Xác nhận đã nhận hàng",
      message: "Bạn xác nhận đã nhận đầy đủ các sản phẩm trong đơn hàng này đúng không?",
      confirmText: "Đã nhận hàng",
      cancelText: "Chưa nhận",
      confirmVariant: "success",
      onConfirm: async () => {
        try {
          await dispatch(confirmReceipt(id)).unwrap();
          toast.success("Cảm ơn bạn đã xác nhận nhận hàng!");
        } catch (err) {
          toast.error("Xác nhận nhận hàng chưa thành công. Vui lòng thử lại sau.");
        }
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleReturn = () => {
    setConfirmModal({
      show: true,
      title: "Yêu cầu trả hàng / hoàn tiền",
      message: "Bạn có chắc chắn muốn gửi yêu cầu trả hàng cho đơn này không?",
      confirmText: "Gửi yêu cầu",
      cancelText: "Hủy bỏ",
      onConfirm: async () => {
        try {
          await dispatch(returnOrder(id)).unwrap();
          toast.success("Đã gửi yêu cầu trả hàng thành công. Bộ phận hỗ trợ sẽ liên hệ với bạn sớm!");
        } catch (err) {
          toast.error("Gửi yêu cầu trả hàng chưa thành công. Vui lòng thử lại sau.");
        }
        setConfirmModal((prev) => ({ ...prev, show: false }));
      },
    });
  };

  if (loading) return <LoadingSpinner />;

  if (!currentOrder) {
    return (
      <Container className="py-5 text-center">
        <h3 className="fw-bold text-dark mb-3">Không tìm thấy đơn hàng</h3>
        <p className="text-muted mb-4">Đơn hàng bạn đang tìm kiếm không tồn tại hoặc mã đơn không chính xác.</p>
        <Button as={Link} to="/profile?tab=orders" variant="primary">
          <FaArrowLeft className="me-2" /> Quay lại danh sách đơn hàng
        </Button>
      </Container>
    );
  }

  const isAdmin = user?.role === "admin";
  const isAuthorized = isAdmin || String(currentOrder.userId) === String(user?.id);
  if (!isAuthorized) {
    return (
      <Container className="py-5 text-center">
        <div className="py-5">
          <FaLock className="text-danger mb-3" style={{ fontSize: "3.5rem" }} />
          <h3 className="fw-bold text-dark mb-2">Không có quyền truy cập</h3>
          <p className="text-muted mb-4">
            Bạn không có quyền xem thông tin chi tiết đơn hàng của người dùng khác.
          </p>
          <Button as={Link} to="/profile?tab=orders" variant="primary">
            <FaArrowLeft className="me-2" /> Quay lại đơn hàng của tôi
          </Button>
        </div>
      </Container>
    );
  }

  // Tính subtotal và discount nếu chưa lưu trong order cũ
  const itemsSubtotal = (currentOrder.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const subtotal = currentOrder.subtotal != null ? currentOrder.subtotal : itemsSubtotal;
  const discountAmount = currentOrder.discountAmount != null
    ? currentOrder.discountAmount
    : Math.max(0, subtotal - Number(currentOrder.totalPrice || 0));

  return (
    <Container className="py-4">
      <Card className="shadow-sm border-0 bg-white">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="fw-bold text-dark mb-1">
                Đơn hàng #{String(currentOrder.orderCode || currentOrder.id).replace(/^#/, "")}
              </h3>
              <small className="text-muted">
                Ngày đặt: {formatDate(currentOrder.createdAt) || currentOrder.createdAt}
              </small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${statusBadgeClasses[currentOrder.status] || "bg-light text-secondary border"} fs-6 px-3 py-2`}>
                {currentOrder.status === "Pending" ? "Chờ xử lý" :
                 currentOrder.status === "Confirmed" ? "Đã xác nhận" :
                 currentOrder.status === "Shipping" ? "Đang giao" :
                 currentOrder.status === "Delivered" ? "Đã giao" :
                 currentOrder.status === "Cancelled" ? "Đã hủy" :
                 currentOrder.status === "Return Requested" ? "Đang yêu cầu trả hàng" :
                 currentOrder.status === "Returned" ? "Đã trả hàng" : currentOrder.status}
              </span>
              <Button
                as={Link}
                to="/profile?tab=orders"
                variant="outline-secondary"
                size="sm"
                className="btn-back d-inline-flex align-items-center"
              >
                <FaArrowLeft className="me-2 flex-shrink-0" />
                <span>Quay lại đơn hàng của tôi</span>
              </Button>
            </div>
          </div>

          {/* Snapshot thông tin người nhận lúc đặt hàng */}
          <Card className="bg-light border-0 mb-4">
            <Card.Body>
              <h6 className="fw-bold text-dark mb-3">Thông tin nhận hàng</h6>
              <div className="row g-2">
                <div className="col-md-4">
                  <span className="text-muted d-block small"><FaUser className="me-1" /> Người nhận:</span>
                  <strong className="text-dark">{currentOrder.recipientName || user?.name || "N/A"}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-muted d-block small"><FaPhone className="me-1" /> Điện thoại:</span>
                  <strong className="text-dark">{currentOrder.phone || user?.phone || "N/A"}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-muted d-block small"><FaMapMarkerAlt className="me-1" /> Địa chỉ giao hàng:</span>
                  <strong className="text-dark">{currentOrder.shippingAddress || user?.address || "N/A"}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>

          <h5 className="fw-bold text-dark mb-3">Danh sách sản phẩm</h5>
          <Table responsive hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: "80px" }}>Hình ảnh</th>
                <th>Tên sách</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th className="text-end">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(currentOrder.items || []).map((item) => {
                const bookInfo = getBookInfo(item.bookId);
                const displayImage = bookInfo?.image || item.image;
                const displayTitle = bookInfo?.title || item.title;

                return (
                  <tr key={item.id || item.bookId}>
                    <td>
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={displayTitle}
                          rounded
                          style={{ width: "50px", height: "65px", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/books/book-1.jpg";
                          }}
                        />
                      ) : (
                        <div
                          style={{ width: "50px", height: "65px", background: "#eee" }}
                          className="d-flex align-items-center justify-content-center rounded"
                        >
                          <small>N/A</small>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{displayTitle}</div>
                      {bookInfo?.author && (
                        <small className="text-muted">{bookInfo.author}</small>
                      )}
                    </td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td className="text-end fw-bold text-primary">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* Dòng tiền Discount/Voucher */}
          <div className="border-top pt-3 mt-3">
            <div className="row justify-content-end">
              <div className="col-md-5">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tạm tính:</span>
                  <span className="fw-semibold text-dark">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Mã giảm giá:</span>
                    <span className="fw-semibold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong className="fs-5 text-dark">Tổng tiền:</strong>
                  <strong className="fs-5 text-primary">
                    {formatCurrency(currentOrder.totalPrice)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {(currentOrder.status === "Pending" || currentOrder.status === "Shipping" || currentOrder.status === "Delivered") && (
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              {currentOrder.status === "Pending" && (
                <Button variant="outline-danger" size="sm" onClick={handleConfirmCancel} className="d-inline-flex align-items-center">
                  <FaTimesCircle className="me-2 flex-shrink-0" />
                  <span>Hủy đơn hàng</span>
                </Button>
              )}
              {currentOrder.status === "Shipping" && (
                <Button variant="success" size="sm" onClick={handleConfirmReceipt} className="d-inline-flex align-items-center">
                  <FaCheckCircle className="me-2 flex-shrink-0" />
                  <span>Đã nhận được hàng</span>
                </Button>
              )}
              {currentOrder.status === "Delivered" && (
                <Button variant="outline-secondary" size="sm" onClick={handleReturn} className="d-inline-flex align-items-center">
                  <FaUndo className="me-2 flex-shrink-0" />
                  <span>Yêu cầu trả hàng</span>
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={confirmModal.show}
        onClose={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmVariant={confirmModal.confirmVariant}
      />
    </Container>
  );
};

export default OrderDetailPage;

