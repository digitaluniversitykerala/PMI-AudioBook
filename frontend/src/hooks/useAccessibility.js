import { useEffect, useState, useCallback } from 'react';

// Custom hook for accessibility features
export const useAccessibility = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedLargeText = localStorage.getItem('largeText') === 'true';
    const savedScreenReader = localStorage.getItem('screenReaderMode') === 'true';
    
    setHighContrast(savedHighContrast);
    setLargeText(savedLargeText);
    setScreenReaderMode(savedScreenReader);
    
    // Apply classes to body
    if (savedHighContrast) document.body.classList.add('high-contrast');
    if (savedLargeText) document.body.classList.add('large-text');
  }, []);

  const toggleHighContrast = useCallback(() => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue);
    
    if (newValue) {
      document.body.classList.add('high-contrast');
      announce('High contrast mode enabled');
    } else {
      document.body.classList.remove('high-contrast');
      announce('High contrast mode disabled');
    }
  }, [highContrast]);

  const toggleLargeText = useCallback(() => {
    const newValue = !largeText;
    setLargeText(newValue);
    localStorage.setItem('largeText', newValue);
    
    if (newValue) {
      document.body.classList.add('large-text');
      announce('Large text mode enabled');
    } else {
      document.body.classList.remove('large-text');
      announce('Large text mode disabled');
    }
  }, [largeText]);

  const toggleScreenReaderMode = useCallback(() => {
    const newValue = !screenReaderMode;
    setScreenReaderMode(newValue);
    localStorage.setItem('screenReaderMode', newValue);
    announce(newValue ? 'Screen reader mode enabled' : 'Screen reader mode disabled');
  }, [screenReaderMode]);

  // Screen reader announcement function
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    highContrast,
    largeText,
    screenReaderMode,
    toggleHighContrast,
    toggleLargeText,
    toggleScreenReaderMode,
    announce
  };
};

// Voice feedback utility
export const speak = (text, options = {}) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';
    
    window.speechSynthesis.speak(utterance);
  }
};

// Keyboard navigation helper
export const useKeyboardNavigation = (elements) => {
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!elements || elements.length === 0) return;
      
      switch(e.key) {
        case 'ArrowDown':
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            setFocusIndex((prev) => (prev + 1) % elements.length);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((prev) => (prev - 1 + elements.length) % elements.length);
          break;
        case 'Home':
          e.preventDefault();
          setFocusIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusIndex(elements.length - 1);
          break;
      }
    };

    if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      setFocusIndex((prev) => (prev - 1 + elements.length) % elements.length);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements]);

  useEffect(() => {
    if (elements && elements[focusIndex]) {
      elements[focusIndex].focus();
    }
  }, [focusIndex, elements]);

  return { focusIndex, setFocusIndex };
};