import { ReactNode } from 'react';

export interface DataPoint {
  name: string;
  value: number;
}

export interface DataVisualizationProps {
  data: DataPoint[];
  title: string;
  color?: string;
}

export interface InteractiveCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
}