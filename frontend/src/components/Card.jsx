import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      {children}
    </div>
  );
};

export default Card;