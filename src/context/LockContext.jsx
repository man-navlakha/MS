
import { createContext, useState, useContext } from 'react';

// Create the context
const LockContext = createContext();

// Create the provider component
export const LockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);

  const lockScreen = () => {
    setIsLocked(true);
  };

  const unlockScreen = () => {
    setIsLocked(false);
  };

  return (
    <LockContext.Provider value={{ isLocked, lockScreen, unlockScreen }}>
      {children}
    </LockContext.Provider>
  );
};
// Create a custom hook for easy access to the context
export const useLock = () => {
  return useContext(LockContext);
};