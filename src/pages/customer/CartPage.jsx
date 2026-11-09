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
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/books/book-1.jpg";
          }}
        />
      </Col>
      <Col xs={4}>
        <h6 className="mb-1 fw-bold text-dark">{item.title}</h6>
        <small className="text-muted d-block">{item.author}</small>
        {isInactive ? (
          <Badge bg="danger" className="mt-1">Discontinued</Badge>
        ) : isOutOfStock ? (
          <Badge bg="warning" text="dark" className="mt-1">Out of Stock</Badge>
        ) : (
          <small className="text-muted">
            Stock: <Badge bg="light" text="dark" className="border">{item.stock} in stock</Badge>
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
          title="Remove from cart"
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
            warnings.push(`"${item.title}" has been discontinued. Please remove it from your cart.`);
          } else {
            if (Number(fresh.price) !== Number(item.price)) {
              warnings.push(`Price for "${item.title}" updated from ${formatCurrency(item.price)} to ${formatCurrency(fresh.price)}.`);
            }
            if (fresh.stock <= 0 || fresh.status === "Out of Stock") {
              warnings.push(`"${item.title}" is currently out of stock. Please remove this item to proceed with checkout.`);
            } else if (item.quantity > fresh.stock) {
              warnings.push(`Only ${fresh.stock} copies of "${item.title}" left in stock (you have ${item.quantity} in cart). Please reduce quantity to proceed.`);
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
        const msg = `"${item.title}" has been discontinued. Please remove it from your cart.`;
        if (!list.includes(msg)) list.push(msg);
      } else if (isItemOutOfStock) {
        const msg = `"${item.title}" is currently out of stock. Please remove this item to proceed with checkout.`;
        if (!list.includes(msg)) list.push(msg);
      } else if (isItemOverStock) {
        const msg = `Only ${item.stock} copies of "${item.title}" left in stock (you have ${item.quantity} in cart). Please reduce quantity to proceed.`;
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
      toast.warning(`Only ${item.stock} books left in stock.`);
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
    toast.info("Item removed from cart.");
    const updatedItems = items.filter((i) => String(i.bookId) !== String(bookId));
    syncCart(updatedItems);
  };

  const handleConfirmClearCart = () => {
    dispatch(clearCart());
    toast.info("Cart cleared.");
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
      toast.error("Please remove out of stock or discontinued items before checking out!");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h3 className="mb-3 fw-bold text-dark">Your cart is empty</h3>
        <p className="text-muted">Explore our great books and add them to your cart!</p>
        <Button as={Link} to="/books" variant="primary">
          <FaArrowLeft className="me-2" />
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="fw-bold mb-0 text-dark">Your Shopping Cart</h2>
        <div className="d-flex align-items-center gap-2">
          <Button
            as={Link}
            to="/books"
            variant="outline-secondary"
            size="sm"
            className="btn-back d-inline-flex align-items-center"
          >
            <FaArrowLeft className="me-2 flex-shrink-0" />
            <span>Continue Shopping</span>
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="d-inline-flex align-items-center"
          >
            <FaTrashAlt className="me-2 flex-shrink-0" />
            <span>Clear Cart</span>
          </Button>
        </div>
      </div>

      {combinedWarnings.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Cart Notice:</strong>
          <ul className="mb-0 mt-1 ps-3">
            {combinedWarnings.map((msg, idx) => (
              <li key={`${idx}-${msg}`}>{msg}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Row className="g-4">
        <Col lg={8}>
          <Row className="text-muted small fw-bold pb-2 border-bottom d-none d-md-flex">
            <Col xs={2}>Image</Col>
            <Col xs={4}>Product</Col>
            <Col xs={2} className="text-center">Price</Col>
            <Col xs={2}>Quantity</Col>
            <Col xs={1} className="text-center">Total</Col>
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

      <ConfirmModal
        show={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClearCart}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear All"
        cancelText="Keep Items"
      />
    </Container>
  );
};

export default CartPage;
