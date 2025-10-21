import React from 'react';

const BrandLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">IC</span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Impact Compendium</span>
        <span className="text-xs text-muted-foreground">CGIAR Alliance</span>
      </div>
    </div>
  );
};

export default BrandLogo;
