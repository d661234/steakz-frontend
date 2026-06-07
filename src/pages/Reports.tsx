import React from 'react';
import { useAuth } from '../context/AuthContext';

const Reports: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      {user && (
        <div>
          <p>Welcome, {user.firstName || user.email}</p>
          {/* Add reporting functionality */}
        </div>
      )}
    </div>
  );
};

export default Reports;