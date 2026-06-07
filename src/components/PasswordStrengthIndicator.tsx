import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const calculateStrength = (pwd: string) => {
    let strength = 0;
    
    // Length check
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;

    // Complexity checks
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[a-z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;

    return strength;
  };

  const strength = calculateStrength(password);

  const strengthLabels = [
    'Very Weak',
    'Weak',
    'Moderate',
    'Strong',
    'Very Strong'
  ];

  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-700'
  ];

  return (
    <div className="mt-2">
      <div className="flex space-x-1 h-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div 
            key={index} 
            className={`flex-1 rounded-full transition-colors duration-300 ${
              index < strength ? strengthColors[strength - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {password && (
        <p className={`text-xs mt-1 ${strengthColors[strength - 1]}`}>
          {strengthLabels[strength - 1]} Password
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;