import React, { createContext, useContext, useState, ReactNode } from 'react';

type DeviceType = 'mobile' | 'desktop';

interface DeviceContextType {
  deviceType: DeviceType;
  setDeviceType: (deviceType: DeviceType) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  return (
    <DeviceContext.Provider value={{ deviceType, setDeviceType }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
} 