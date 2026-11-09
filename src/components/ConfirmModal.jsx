import PropTypes from "prop-types";
import { Modal, Button } from "react-bootstrap";

const ConfirmModal = ({
  show,
  onClose,
  onConfirm,
  title = "Confirmation",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
}) => {
  return (
    <Modal show={show} onHide={loading ? undefined : onClose} centered>
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="fw-bold text-dark">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-secondary">{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
          {loading ? "Processing..." : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.string,
  loading: PropTypes.bool,
};

export default ConfirmModal;
