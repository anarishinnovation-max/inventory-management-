import toast from "react-hot-toast";

/**
 * Shows a global toast notification with a consistent style.
 * @param message The message to display.
 * @param type The type of toast: 'info', 'success', or 'error'.
 */
export const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
    default:
      toast(message, {
        icon: 'ℹ️',
      });
      break;
  }
};
