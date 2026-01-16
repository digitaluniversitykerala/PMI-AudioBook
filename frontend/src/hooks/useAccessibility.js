import { useEffect, useState, useCallback } from 'react';

// Custom hook for accessibility features
export const useAccessibility = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    setHighContrast(localStorage.getItem('highContrast') === 'true');
    setLargeText(localStorage.getItem('largeText') === 'true');
    setScreenReaderMode(localStorage.getItem('screenReaderMode') === 'true');
    setVoiceEnabled(localStorage.getItem('voiceEnabled') !== 'false'); // Default to true
    
    // Apply classes to body
    if (localStorage.getItem('highContrast') === 'true') document.body.classList.add('high-contrast');
    if (localStorage.getItem('largeText') === 'true') document.body.classList.add('large-text');
  }, []);

  const announce = useCallback((message, priority = 'polite', shouldSpeak = false) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    if (shouldSpeak && voiceEnabled) {
      speak(message);
    }
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, [voiceEnabled]);

  const toggleHighContrast = useCallback(() => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue);
    if (newValue) {
      document.body.classList.add('high-contrast');
      announce('High contrast mode enabled', 'polite', true);
    } else {
      document.body.classList.remove('high-contrast');
      announce('High contrast mode disabled', 'polite', true);
    }
  }, [highContrast, announce]);

  const toggleLargeText = useCallback(() => {
    const newValue = !largeText;
    setLargeText(newValue);
    localStorage.setItem('largeText', newValue);
    if (newValue) {
      document.body.classList.add('large-text');
      announce('Large text mode enabled', 'polite', true);
    } else {
      document.body.classList.remove('large-text');
      announce('Large text mode disabled', 'polite', true);
    }
  }, [largeText, announce]);

  const toggleVoiceEnabled = useCallback(() => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem('voiceEnabled', newValue);
    announce(newValue ? 'Voice feedback enabled' : 'Voice feedback disabled', 'polite', true);
  }, [voiceEnabled, announce]);

  const toggleScreenReaderMode = useCallback(() => {
    const newValue = !screenReaderMode;
    setScreenReaderMode(newValue);
    localStorage.setItem('screenReaderMode', newValue);
    announce(newValue ? 'Screen reader mode enabled' : 'Screen reader mode disabled', 'polite', true);
  }, [screenReaderMode, announce]);

  return {
    highContrast,
    largeText,
    screenReaderMode,
    voiceEnabled,
    toggleHighContrast,
    toggleLargeText,
    toggleVoiceEnabled,
    toggleScreenReaderMode,
    announce
  };
};

// Voice feedback utility
export const speak = (text, options = {}) => {
  if ('speechSynthesis' in window) {
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
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!elements || elements.length === 0) return;
      
      if (e.key === 'Tab') {
        // Let normal tab work but sync our index
        return;
      }

      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setFocusIndex((prev) => (prev + 1) % elements.length);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements]);

  useEffect(() => {
    if (focusIndex >= 0 && elements && elements[focusIndex]) {
      elements[focusIndex].focus();
    }
  }, [focusIndex, elements]);

  return { focusIndex, setFocusIndex };
};