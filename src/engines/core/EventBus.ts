// src/engines/core/EventBus.ts
export class EventBus {
    private static instance: EventBus;
    private listeners: Map<string, Array<(data: any) => void>> = new Map();
  
    static getInstance(): EventBus {
      if (!EventBus.instance) {
        EventBus.instance = new EventBus();
      }
      return EventBus.instance;
    }
  
    on(event: string, callback: (data: any) => void): () => void {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(callback);
      
      return () => this.off(event, callback);
    }
  
    off(event: string, callback: (data: any) => void): void {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  
    emit(event: string, data?: any): void {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    }
  }
  
  export const eventBus = EventBus.getInstance();