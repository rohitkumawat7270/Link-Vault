import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <div className="text-center py-12">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">404 - Page Not Found</h2>
          <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} variant="primary">Go to Home</Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;