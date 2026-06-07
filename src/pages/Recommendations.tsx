import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

interface RecommendationItem {
  id: string;
  item_name: string;
  description?: string;
  price?: number;
  category?: string;
}

const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const response = await api.get('/customer/recommendations');
        setRecommendations(response.data);
      } catch (error: unknown) {
        toast.error('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Recommendations</h1>
      {loading && <p className="text-gray-600">Fetching your personalised menu recommendations...</p>}

      {!loading && recommendations.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600">No recommendations are available at the moment. Check back later.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{item.item_name}</h2>
              {item.category && <span className="text-sm text-gray-500 uppercase">{item.category}</span>}
            </div>
            <p className="text-gray-600 mb-4">{item.description || 'A top-rated dish based on your preferences.'}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">{item.price ? `$${item.price.toFixed(2)}` : 'Market price'}</span>
              <button
                onClick={() => toast.success('Reorder flow not implemented yet.')}
                className="rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
