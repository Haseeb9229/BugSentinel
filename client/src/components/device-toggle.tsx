import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface DeviceToggleProps {
  deviceType: 'mobile' | 'desktop';
  onDeviceChange: (deviceType: 'mobile' | 'desktop') => void;
  className?: string;
}

export function DeviceToggle({ deviceType, onDeviceChange, className = '' }: DeviceToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onDeviceChange('desktop')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            deviceType === 'desktop'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Desktop</span>
        </button>
        
        <button
          onClick={() => onDeviceChange('mobile')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            deviceType === 'mobile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile</span>
        </button>
      </div>
    </div>
  );
} 