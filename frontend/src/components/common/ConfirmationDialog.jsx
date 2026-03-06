/**
 * Reusable Confirmation Dialog Component
 * Used for confirming destructive actions across the application
 */

import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaExclamationTriangle, FaTrash, FaTimes } from 'react-icons/fa';

const ConfirmationDialog = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon: CustomIcon = FaExclamationTriangle,
  isLoading = false
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <CustomIcon className="me-2" style={{ color: variant === 'danger' ? 'var(--color-danger, #C41E3A)' : 'var(--color-warning, #9B6B00)' }} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          <FaTimes className="me-1" />
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            <>
              <FaTrash className="me-1" />
              {confirmText}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationDialog;
