import React from 'react';

const Loader = ({ fullScreen = false, text = "Loading..." }) => {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative">
        {/* Pulsing ring behind the logo */}
        <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
        
        {/* Logo container with spinning border */}
        <div className="w-20 h-20 relative rounded-full border-4 border-transparent border-t-primary-500 border-r-primary-500 animate-spin"></div>
        
        {/* The actual logo fixed in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="SSMS Logo" 
            className="w-14 h-14 object-contain rounded-full shadow-sm bg-white dark:bg-slate-900" 
          />
        </div>
      </div>
      {text && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      {loaderContent}
    </div>
  );
};

export default Loader;
