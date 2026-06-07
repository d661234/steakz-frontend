import React, { useState } from 'react';
import { InteractiveCardProps } from '../types/components';

const InteractiveCard: React.FC<InteractiveCardProps> = ({ 
  title, 
  description, 
  icon,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-xl shadow-lg bg-white p-6 cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-[0_10px_20px_rgba(0,0,0,0.12)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center mb-4">
        <div
          className="transition-transform duration-500"
          style={{ transform: isHovered ? 'rotate(360deg) scale(1.2)' : 'rotate(0deg) scale(1)' }}
        >
          {icon}
        </div>
        <h3 className="ml-4 text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <p
        className={`text-gray-600 transition-opacity duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
      >
        {description}
      </p>
    </div>
  );
};

export default InteractiveCard;