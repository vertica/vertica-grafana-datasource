// jest.setup.js

// Polyfill TextEncoder for jsdom environment
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder } = require('util');
    global.TextEncoder = TextEncoder;
  }
  
  // Mock matchMedia for window.matchMedia used by some components
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Mock HTMLCanvasElement.prototype.getContext used by some components
  HTMLCanvasElement.prototype.getContext = () => {};
  
  // Import jest-dom to extend Jest's expect with matchers for DOM elements
  import '@testing-library/jest-dom';
  
  // Import Grafana's Jest setup
  import './.config/jest-setup';
  