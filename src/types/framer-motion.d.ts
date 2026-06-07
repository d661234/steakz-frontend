declare module 'framer-motion' {
  import React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    variants?: any;
    custom?: any;
    style?: React.CSSProperties;
    className?: string;
    onHoverStart?: (event: MouseEvent) => void;
    onHoverEnd?: (event: MouseEvent) => void;
  }

  export const motion: {
    [key: string]: React.FC<React.PropsWithChildren<MotionProps>>;
  };
}