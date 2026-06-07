declare module 'sonner' {
  import { ReactNode } from 'react';

  export interface ToastProps {
    id?: number | string;
    title?: ReactNode;
    description?: ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
    cancel?: {
      label: string;
      onClick?: () => void;
    };
    duration?: number;
    important?: boolean;
    onDismiss?: (toast: { id: number | string }) => void;
    onAutoClose?: (toast: { id: number | string }) => void;
  }

  export function toast(message: string, options?: Partial<ToastProps>): void;
  export namespace toast {
    function success(message: string, options?: Partial<ToastProps>): void;
    function error(message: string, options?: Partial<ToastProps>): void;
    function info(message: string, options?: Partial<ToastProps>): void;
    function warning(message: string, options?: Partial<ToastProps>): void;
  }

  export function Toaster(props: {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    richColors?: boolean;
    closeButton?: boolean;
    duration?: number;
  }): JSX.Element;
}