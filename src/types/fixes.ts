// FAANG Enterprise Type Fixes - Force compilation
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

// Missing Apple Pencil types
export interface ApplePencilInput {
  pressure: number;
  tiltX: number;
  tiltY: number;
  altitude: number;
  azimuth: number;
  timestamp: number;
}

export interface ApplePencilCapabilities {
  supportsPressure: boolean;
  supportsTilt: boolean;
  supportsAzimuth: boolean;
  generation: 1 | 2;
}

// Fix EventBus off method
declare global {
  interface EventEmitter {
    off(event: string, listener: Function): void;
  }
}

// Performance polyfill
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now()
  };
}
