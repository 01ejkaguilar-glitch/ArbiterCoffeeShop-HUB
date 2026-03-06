import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './Toast.css';

const ToastContext = createContext();

/**
 * useToast - Hook to access toast functions
 * @returns {Object} Toast functions (success, error, warning, info)
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * ToastProvider - Context provider for toast notifications
 * Wrap your app with this component
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * ToastContainer - Renders toast notifications
 */
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Toast - Individual toast notification
 */
const Toast = ({ toast, onClose }) => {
  const { message, type } = toast;

  const icons = {
    success: <FaCheckCircle aria-hidden="true" />,
    error: <FaTimesCircle aria-hidden="true" />,
    warning: <FaExclamationTriangle aria-hidden="true" />,
    info: <FaInfoCircle aria-hidden="true" />
  };

  const variants = {
    initial: { 
      opacity: 0, 
      y: -20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      x: 100,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <motion.div
      className={`app-toast app-toast-${type}`}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      role="alert"
      aria-live="assertive"
    >
      <div className="app-toast-icon">
        {icons[type]}
      </div>
      <div className="app-toast-message">{message}</div>
      <button
        className="app-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <FaTimes aria-hidden="true" />
      </button>
    </motion.div>
  );
};

export default ToastProvider;
