import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: ((value: boolean) => void) | null;
  confirm: (title: string, message: string) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
  confirm: (title, message) => {
    return new Promise((resolve) => {
      set({ isOpen: true, title, message, resolve });
    });
  },
  onConfirm: () => {
    const { resolve } = get();
    if (resolve) resolve(true);
    set({ isOpen: false, resolve: null });
  },
  onCancel: () => {
    const { resolve } = get();
    if (resolve) resolve(false);
    set({ isOpen: false, resolve: null });
  },
}));

/**
 * Hook to trigger a premium confirmation dialog.
 * Returns a function: (title: string, message: string) => Promise<boolean>
 */
export const useConfirm = () => {
  return useConfirmStore((state) => state.confirm);
};
