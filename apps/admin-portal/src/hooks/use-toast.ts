import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function useToast() {
  const toast = ({ title, description, variant, action }: ToastProps) => {
    const message = title || description || '';
    const fullMessage = title && description ? `${title}\n${description}` : message;

    if (variant === 'destructive') {
      sonnerToast.error(fullMessage, {
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      });
    } else {
      sonnerToast.success(fullMessage, {
        action: action ? {
          label: action.label,
          onClick: action.onClick,
        } : undefined,
      });
    }
  };

  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

