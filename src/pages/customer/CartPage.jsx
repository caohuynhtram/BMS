import { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Button, Image, Form, Badge, Alert, InputGroup } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { removeFromCart, updateQuantity, clearCart, syncCartToApi, fetchCart } from "../../redux/cartSlice";
import CartSummary from "../../components/CartSummary";
import ConfirmModal from "../../components/ConfirmModal";
import bookApi from "../../api/bookApi";
import { formatCurrency } from "../../utils/helpers";
import { toast } from "react-toastify";
import { FaTrashAlt, FaArrowLeft, FaTrash, FaExclamationTriangle } from "react-icons/fa";

// Gộp CartItem vào thẳng CartPage
const CartItemRow = ({ item, onUpdateQuantity, onRemove }) => {
  const stockLimit = item.stock != null ? item.stock : 999;
  const isInactive = item.isDeleted || item.status === "Inactive";
  const isOutOfStock = !isInactive && (item.stock <= 0 || item.status === "Out of Stock");
  const isInvalid = isInactive || isOutOfStock;

  const [localQty, setLocalQty] = useState(String(item.quantity));

  useEffect(() => {
    setLocalQty(String(item.quantity));
  }, [item.quantity]);

  const handleQtyChange = (e) => {
    setLocalQty(e.target.value);
  };

  const commitQty = () => {
    let val = parseInt(localQty, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (stockLimit && val > stockLimit) {
      val = stockLimit;
    }
    setLocalQty(String(val));
    if (val !== item.quantity) {
      onUpdateQuantity(item.bookId, val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      commitQty();
      e.target.blur();
    }
  };

  return (
    <Row className={`align-items-center py-3 border-bottom g-3 ${isInvalid ? "bg-light text-muted" : ""}`}>
      <Col xs={2}>
        <Image
          src={item.image}
          alt={item.title}
          fluid
          rounded
          style={{ maxHeight: "80px", objectFit: "cover" }}
        />
      </Col>
      <Col xs={4}>
        <h6 className="mb-1 fw-bold text-dark">{item.title}</h6>
        <small className="text-muted d-block">{item.author}</small>
        {isInactive ? (
          <Badge bg="danger" className="mt-1">Ngừng kinh doanh</Badge>
        ) : isOutOfStock ? (
          <Badge bg="warning" text="dark" className="mt-1">Hết hàng</Badge>
        ) : (
          <small className="text-muted">
            Kho: <Badge bg="light" text="dark" className="border">Còn {item.stock} cuốn</Badge>
          </small>
        )}
      </Col>
      <Col xs={2} className="text-center">
        <span className="fw-bold text-primary">{formatCurrency(item.price)}</span>
      </Col>
      <Col xs={2}>
        <InputGroup size="sm" className="justify-content-center">
          <Button
            variant="outline-secondary"
            disabled={isInvalid || item.quantity <= 1}
            onClick={() => onUpdateQuantity(item.bookId, item.quantity - 1)}
          >
            -
          </Button>
          <Form.Control
            type="number"
            min={1}
            max={Math.max(1, stockLimit)}
            value={localQty}
            onChange={handleQtyChange}
            onBlur={commitQty}
            onKeyDown={handleKeyDown}
            disabled={isInvalid}
            className="text-center px-1"
            style={{ maxWidth: "55px" }}
            aria-label="Item quantity"
          />
          <Button
            variant="outline-secondary"
            disabled={isInvalid || item.quantity >= stockLimit}
            onClick={() => onUpdateQuantity(item.bookId, item.quantity + 1)}
          >
            +
          </Button>
        </InputGroup>
      </Col>
      <Col xs={1} className="text-center">
        <strong className="text-dark">{formatCurrency(item.price * item.quantity)}</strong>
      </Col>
      <Col xs={1} className="text-center">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onRemove(item.bookId)}
          title="Xóa khỏi giỏ hàng"
        >
          <FaTrash />
        </Button>
      </Col>
    </Row>
  );
};

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice, totalQuantity } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [showClearModal, setShowClearModal] = useState(false);
  const [syncWarnings, setSyncWarnings] = useState([]);

  // Tự động tải lại giỏ hàng và dữ liệu sách mới nhất từ server khi vào trang
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCart(user.id));
    }
  }, [dispatch, user?.id]);

  // Tự động đối chiếu dữ liệu tồn kho mới nhất từ server khi vào trang giỏ hàng
  useEffect(() => {
    let isMounted = true;
    const syncWithServer = async () => {
      try {
        const booksRes = await bookApi.getAll();
        if (!isMounted) return;
        const latestBooks = booksRes.data || [];
        const warnings = [];

        items.forEach((item) => {
          // Đối chiếu theo bookId hoặc tên sách để tự động nhận diện đúng sách
          const fresh = latestBooks.find(
            (b) => String(b.id) === String(item.bookId) || (item.title && b.title === item.title)
          );
          if (!fresh || fresh.isDeleted || fresh.status === "Inactive") {
            warnings.push(`"${item.title}" đã ngừng kinh doanh. Vui lòng xóa khỏi giỏ hàng.`);
          } else {
            if (Number(fresh.price) !== Number(item.price)) {
              warnings.push(`Giá cuốn "${item.title}" đã cập nhật từ ${formatCurrency(item.price)} sang ${formatCurrency(fresh.price)}.`);
            }
            if (fresh.stock <= 0 || fresh.status === "Out of Stock") {
              warnings.push(`"${item.title}" hiện đã hết hàng. Vui lòng bỏ sản phẩm này để tiếp tục thanh toán.`);
            } else if (item.quantity > fresh.stock) {
              warnings.push(`"${item.title}" trong kho chỉ còn ${fresh.stock} cuốn (bạn đang chọn ${item.quantity}). Vui lòng giảm số lượng để tiếp tục thanh toán.`);
            }
          }
        });

        setSyncWarnings(warnings);
      } catch (err) {
        console.error("Cart sync check failed:", err);
      }
    };

    if (items.length > 0) {
      syncWithServer();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const combinedWarnings = useMemo(() => {
    const list = [...syncWarnings];
    items.forEach((item) => {
      const isItemInactive = item.isDeleted || item.status === "Inactive";
      const isItemOutOfStock = !isItemInactive && (item.stock != null && item.stock <= 0 || item.status === "Out of Stock");
      const isItemOverStock = !isItemInactive && !isItemOutOfStock && item.stock != null && item.quantity > item.stock;

      if (isItemInactive) {
        const msg = `"${item.title}" đã ngừng kinh doanh. Vui lòng xóa khỏi giỏ hàng.`;
        if (!list.includes(msg)) list.push(msg);
      } else if (isItemOutOfStock) {
        const msg = `"${item.title}" hiện đã hết hàng. Vui lòng bỏ sản phẩm này để tiếp tục thanh toán.`;
        if (!list.includes(msg)) list.push(msg);
      } else if (isItemOverStock) {
        const msg = `"${item.title}" trong kho chỉ còn ${item.stock} cuốn (bạn đang chọn ${item.quantity}). Vui lòng giảm số lượng để tiếp tục thanh toán.`;
        if (!list.includes(msg)) list.push(msg);
      }
    });
    return list;
  }, [items, syncWarnings]);

  const syncCart = (updatedItems) => {
    if (user?.id) {
      const apiItems = updatedItems.map((i) => ({
        bookId: String(i.bookId),
        quantity: i.quantity,
      }));
      dispatch(syncCartToApi({ userId: user.id, items: apiItems }));
    }
  };

  const handleUpdateQuantity = (bookId, quantity) => {
    const item = items.find((i) => String(i.bookId) === String(bookId));
    let validQty = quantity;
    if (validQty < 1) return;

    if (item && item.stock != null && validQty > item.stock) {
      toast.warning(`Chỉ còn ${item.stock} cuốn trong kho.`);
      validQty = item.stock;
    }

    dispatch(updateQuantity({ bookId, quantity: validQty }));
    const updatedItems = items.map((i) =>
      String(i.bookId) === String(bookId) ? { ...i, quantity: validQty } : i
    );
    syncCart(updatedItems);
  };

  const handleRemove = (bookId) => {
    dispatch(removeFromCart(bookId));
    toast.info("Đã xóa sản phẩm khỏi giỏ hàng.");
    const updatedItems = items.filter((i) => String(i.bookId) !== String(bookId));
    syncCart(updatedItems);
  };

  const handleConfirmClearCart = () => {
    dispatch(clearCart());
    toast.info("Đã làm trống giỏ hàng.");
    syncCart([]);
    setShowClearModal(false);
  };

  const hasInvalidItem = useMemo(() => {
    return items.some(
      (item) =>
        item.isDeleted ||
        item.status === "Inactive" ||
        item.status === "Out of Stock" ||
        (item.stock != null && item.stock <= 0) ||
        (item.stock != null && item.quantity > item.stock)
    );
  }, [items]);

  const handleProceedToCheckout = () => {
    if (hasInvalidItem) {
      toast.error("Vui lòng xóa sản phẩm hết hàng hoặc ngừng bán trước khi đặt hàng!");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3 fw-bold text-dark">Giỏ hàng của bạn đang trống</h3>
        <p className="text-muted">Hãy khám phá thêm các cuốn sách hay và thêm vào giỏ nhé!</p>
        <Button as={Link} to="/books" variant="primary">
          <FaArrowLeft className="me-2" />
          Tiếp tục mua sách
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 text-dark">Giỏ hàng của bạn</h2>
        <div className="d-flex align-items-center gap-2">
          <Button
            as={Link}
            to="/books"
            variant="outline-secondary"
            size="sm"
            className="btn-back d-inline-flex align-items-center"
          >
            <FaArrowLeft className="me-2 flex-shrink-0" />
            <span>Tiếp tục xem sách</span>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="d-inline-flex align-items-center"
          >
            <FaTrashAlt className="me-2 flex-shrink-0" />
            <span>Làm trống giỏ</span>
          </Button>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          <Row className="text-muted small fw-bold pb-2 border-bottom d-none d-md-flex">
            <Col xs={2}>Hình ảnh</Col>
            <Col xs={4}>Sản phẩm</Col>
            <Col xs={2} className="text-center">Đơn giá</Col>
            <Col xs={2}>Số lượng</Col>
            <Col xs={1} className="text-center">Thành tiền</Col>
            <Col xs={1}></Col>
          </Row>
          {items.map((item) => (
            <CartItemRow
              key={item.bookId}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
            />
          ))}
        </Col>

        <Col lg={4}>
          <CartSummary
            items={items}
            totalPrice={totalPrice}
            totalQuantity={totalQuantity}
            disableCheckout={hasInvalidItem}
            onCheckoutClick={handleProceedToCheckout}
          />
        </Col>
      </Row>

    </Container>
  );
};

export default CartPage;
