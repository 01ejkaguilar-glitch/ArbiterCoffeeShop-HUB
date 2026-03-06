import { useState, useCallback } from 'react';

/**
 * Simple toast notification hook used by Workforce components.
 * Returns { toast, showToast } where toast is { type, msg } | null.
 */
export function useToast(duration = 3500) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}
