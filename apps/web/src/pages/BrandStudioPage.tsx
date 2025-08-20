import React from 'react';
import BrandStudio from '../components/BrandStudio';

const BrandStudioPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-1">Brand Studio</h1>
        <p className="subheading mt-2">
          Customize your organization's branding and theme
        </p>
      </div>
      
      <BrandStudio />
    </div>
  );
};

export default BrandStudioPage;