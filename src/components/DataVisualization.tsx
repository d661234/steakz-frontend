import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DataVisualizationProps, DataPoint } from '../types/components';

const DataVisualization: React.FC<DataVisualizationProps> = ({ 
  data, 
  title, 
  color = '#3B82F6' 
}) => {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const animationFrames = data.map((item, index) => ({
      ...item,
      value: 0,
      delay: index * 100
    }));

    setAnimatedData(animationFrames);

    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-opacity duration-500">
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={animatedData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }}
          />
          <Bar 
            dataKey="value" 
            fill={color} 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DataVisualization;