import React, { useState, useEffect, useCallback } from 'react';
import { useLock } from '../../context/LockContext';
import { Delete } from 'lucide-react';

// Define a key for localStorage
const PIN_STORAGE_KEY = 'app_lock_pin';

const LockScreen = () => {
  const { unlockScreen } = useLock();
  
  // State for the current mode: 'unlock', 'setup_enter', or 'setup_confirm'
  const [mode, setMode] = useState('unlock'); 
  const [correctPin, setCorrectPin] = useState('');
  
  // State for the PIN input
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // State for the setup process
  const [firstPin, setFirstPin] = useState('');

  // On component mount, check for a saved PIN in localStorage
  useEffect(() => {
    const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (savedPin) {
      setCorrectPin(savedPin);
      setMode('unlock');
    } else {
      setMode('setup_enter'); // No PIN found, enter setup mode
    }
  }, []);
  
  // Function to handle number inputs (from pad or keyboard)
  const handleNumberClick = useCallback((num) => {
    setError(''); // Clear error on new input
    if (pin.length < 4) {
      setPin((prevPin) => prevPin + num);
    }
  }, [pin]);

  // Function to handle delete/backspace
  const handleDelete = useCallback(() => {
    setPin((prevPin) => prevPin.slice(0, -1));
  }, []);

  // Handle PIN verification and setup logic
  useEffect(() => {
    if (pin.length !== 4) return;

    // --- Unlock Mode Logic ---
    if (mode === 'unlock') {
      if (pin === correctPin) {
        unlockScreen();
      } else {
        setError('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1000);
      }
    }

    // --- Setup Mode: First Entry ---
    if (mode === 'setup_enter') {
      setFirstPin(pin);
      setPin('');
      setMode('setup_confirm');
    }
    
    // --- Setup Mode: Confirm Entry ---
    if (mode === 'setup_confirm') {
      if (pin === firstPin) {
        localStorage.setItem(PIN_STORAGE_KEY, pin);
        setCorrectPin(pin);
        alert('PIN saved successfully!');
        unlockScreen();
      } else {
        setError('PINs do not match. Please start over.');
        setTimeout(() => {
          setPin('');
          setFirstPin('');
          setError('');
          setMode('setup_enter');
        }, 1500);
      }
    }
  }, [pin, mode, correctPin, firstPin, unlockScreen]);

  // Add keyboard support for PIN entry
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key >= '0' && event.key <= '9') {
        handleNumberClick(event.key);
      } else if (event.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNumberClick, handleDelete]);

  // Handler for the "Forgot PIN" option
  const handleForgotPin = () => {
    if (window.confirm('Are you sure you want to reset your PIN? This will log you out to re-verify your identity.')) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      alert('Your PIN has been cleared. You will be asked to set a new one the next time you lock the screen.');
      unlockScreen(); // In a real app, you would redirect to a logout/login page here.
    }
  };
  
  // Dynamic UI Text based on the current mode
  const getUIText = () => {
    switch (mode) {
      case 'setup_enter':
        return { title: 'Create a 4-Digit PIN', subtitle: 'This PIN will be used to unlock your screen.' };
      case 'setup_confirm':
        return { title: 'Confirm Your PIN', subtitle: 'Please enter the same PIN again.' };
      default:
        return { title: 'Screen Locked', subtitle: 'Enter your 4-digit PIN to unlock' };
    }
  };
  
  const { title, subtitle } = getUIText();

  const PinDots = () => (
    <div className="flex justify-center space-x-4 my-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            pin.length > i ? 'bg-white' : 'bg-gray-500'
          } ${error ? 'animate-shake border-2 border-red-500' : ''}`}
        ></div>
      ))}
    </div>
  );

  const NumberPad = () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return (
      <div className="grid grid-cols-3 gap-4">
        {numbers.map((num) => (
          <button key={num} onClick={() => handleNumberClick(num.toString())} className="p-4 bg-white/10 rounded-full text-2xl font-bold hover:bg-white/20 transition-colors">
            {num}
          </button>
        ))}
        {/* "Forgot PIN" button replaces the placeholder on the left */}
        <button onClick={handleForgotPin} className="p-4 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors">
          Forgot PIN
        </button>
        <button onClick={() => handleNumberClick('0')} className="p-4 bg-white/10 rounded-full text-2xl font-bold hover:bg-white/20 transition-colors">
          0
        </button>
        <button onClick={handleDelete} className="p-4 flex justify-center items-center bg-white/10 rounded-full text-2xl font-bold hover:bg-white/20 transition-colors">
          <Delete size={28} />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center text-white">
      <div className="max-w-xs w-full p-6 rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-300">{subtitle}</p>
        <PinDots />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <NumberPad />
        {/* Bypass option for development/admin use */}
        <button onClick={unlockScreen} className="mt-6 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Bypass (Dev)
        </button>
      </div>
    </div>
  );
};

export default LockScreen;