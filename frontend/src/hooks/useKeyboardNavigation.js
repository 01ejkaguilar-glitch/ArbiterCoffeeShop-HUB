import { useEffect, useCallback } from 'react';

/**
 * Custom hook for handling ESC key press
 * @param {Function} onEscape - Callback function to execute when ESC is pressed
 * @param {boolean} enabled - Whether the handler is active (default: true)
 */
export const useEscapeKey = (onEscape, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, enabled]);
};

/**
 * Custom hook for trapping focus within a modal or dropdown
 * @param {React.RefObject} containerRef - Reference to the container element
 * @param {boolean} isActive - Whether focus trap is active
 */
export const useFocusTrap = (containerRef, isActive = true) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocusedElement = document.activeElement;

    // Focus first element when trap activates
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (event) => {
      if (event.key !== 'Tab' && event.keyCode !== 9) return;

      if (event.shiftKey) {
        // Shift + Tab: Moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Cleanup: Restore focus when trap is removed
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [containerRef, isActive]);
};

/**
 * Custom hook for handling arrow key navigation in lists or dropdowns
 * @param {React.RefObject} containerRef - Reference to the container element
 * @param {string} itemSelector - CSS selector for navigable items (default: '[role="menuitem"]')
 * @param {boolean} isActive - Whether arrow navigation is active
 */
export const useArrowNavigation = (
  containerRef,
  itemSelector = '[role="menuitem"]',
  isActive = true
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event) => {
      const items = Array.from(container.querySelectorAll(itemSelector));
      const currentIndex = items.indexOf(document.activeElement);

      let nextIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex]?.focus();
          break;

        case 'ArrowUp':
          event.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[nextIndex]?.focus();
          break;

        case 'Home':
          event.preventDefault();
          items[0]?.focus();
          break;

        case 'End':
          event.preventDefault();
          items[items.length - 1]?.focus();
          break;

        default:
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector, isActive]);
};

/**
 * Custom hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handler functions
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * 
 * Example usage:
 * useKeyboardShortcuts({
 *   'ctrl+k': handleSearch,
 *   'ctrl+/': handleHelp,
 *   'esc': handleClose
 * });
 */
export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Build key combination string
      let combination = '';
      if (ctrl) combination += 'ctrl+';
      if (shift) combination += 'shift+';
      if (alt) combination += 'alt+';
      combination += key;

      // Also check without modifiers
      const handler = shortcuts[combination] || shortcuts[key];

      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Custom hook for announcing content to screen readers
 * @returns {Function} announce - Function to announce messages
 */
export const useScreenReaderAnnounce = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return announce;
};

const keyboardNavigation = {
  useEscapeKey,
  useFocusTrap,
  useArrowNavigation,
  useKeyboardShortcuts,
  useScreenReaderAnnounce,
};

export default keyboardNavigation;
