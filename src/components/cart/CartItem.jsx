import React from "react";
import { Row, Col, Image, Button, Form } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <Row className="align-items-center py-3 border-bottom g-3">
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
        <h6 className="mb-1 fw-bold">{item.title}</h6>
        <small className="text-muted">{item.author}</small>
      </Col>
      <Col xs={2} className="text-center">
        <span className="fw-bold text-primary">${item.price}</span>
      </Col>
      <Col xs={2}>
        <Form.Control
          type="number"
          min={1}
          max={item.stock}
          value={item.quantity}
          onChange={(e) =>
            onUpdateQuantity(item.bookId, parseInt(e.target.value) || 1)
          }
          size="sm"
        />
      </Col>
      <Col xs={1} className="text-center">
        <strong>${(item.price * item.quantity).toFixed(2)}</strong>
      </Col>
      <Col xs={1} className="text-center">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onRemove(item.bookId)}
        >
          <FaTrash />
        </Button>
      </Col>
    </Row>
  );
};

export default CartItem;
