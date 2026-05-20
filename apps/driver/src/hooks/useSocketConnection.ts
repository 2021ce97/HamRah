import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Exponential backoff configuration
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // ms

interface QueuedEvent {
  eventName: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionManager {
  connect: () => void;
  disconnect: () => void;
  emit: (eventName: string, payload: any) => Promise<void>;
  on: (eventName: string, handler: Function) => void;
  off: (eventName: string, handler: Function) => void;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnectionAttempt: number;
  hasQueuedEvents: boolean;
}

export function useSocketConnection(authToken: string): ConnectionManager {
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectionAttempt, setReconnectionAttempt] = useState(0);
  const [hasQueuedEvents, setHasQueuedEvents] = useState(false);
  const eventQueueRef = useRef<QueuedEvent[]>([]);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manualReconnectRef = useRef<boolean>(false);

  // Schedule reconnection with exponential backoff
  const scheduleReconnection = useCallback((attemptNumber: number) => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Get delay for this attempt (use last delay if we exceed array length)
    const delayIndex = Math.min(attemptNumber, RECONNECT_DELAYS.length - 1);
    const delay = RECONNECT_DELAYS[delayIndex];

    console.log(`Scheduling reconnection attempt ${attemptNumber + 1} in ${delay}ms`);
    setConnectionStatus('reconnecting');
    setReconnectionAttempt(attemptNumber + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      
      if (socketRef.current && !socketRef.current.connected) {
        console.log(`Attempting reconnection ${attemptNumber + 1}`);
        socketRef.current.connect();
      }
    }, delay);
  }, []);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(BACKEND_URL, {
      auth: { token: authToken },
      reconnection: false, // Disable automatic reconnection, we'll handle it manually
      transports: ['websocket', 'polling'], // Fallback to polling for poor networks
      autoConnect: false,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setConnectionStatus('connected');
      setIsConnected(true);
      setReconnectionAttempt(0);

      // Flush queued events
      flushEventQueue();

      // Re-subscribe to all event handlers
      restoreEventSubscriptions(socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      setIsConnected(false);

      // Start manual reconnection with exponential backoff
      // Only reconnect if it's not a manual disconnect
      if (reason !== 'io client disconnect') {
        scheduleReconnection(0);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      
      // If we're not already scheduling a reconnection, start the process
      if (!reconnectTimeoutRef.current && !socket.connected) {
        const currentAttempt = reconnectionAttempt;
        scheduleReconnection(currentAttempt);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = socket;
    socket.connect();
  }, [authToken, scheduleReconnection]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setReconnectionAttempt(0);
    }
  }, []);

  // Emit event with queuing support
  const emit = useCallback(async (eventName: string, payload: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not initialized'));
        return;
      }

      if (socketRef.current.connected) {
        socketRef.current.emit(eventName, payload, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        });
      } else {
        // Queue event for later transmission
        const queuedEvent: QueuedEvent = {
          eventName,
          payload,
          timestamp: Date.now(),
          retryCount: 0,
        };
        eventQueueRef.current.push(queuedEvent);
        console.log('Event queued:', eventName);
        resolve(); // Resolve immediately, will retry on reconnection
      }
    });
  }, []);

  // Register event listener
  const on = useCallback((eventName: string, handler: Function) => {
    if (!socketRef.current) {
      console.warn('Socket not initialized, handler will be registered on connect');
    }

    // Store handler for re-subscription on reconnect
    if (!eventHandlersRef.current.has(eventName)) {
      eventHandlersRef.current.set(eventName, new Set());
    }
    eventHandlersRef.current.get(eventName)!.add(handler);

    // Register with socket if connected
    if (socketRef.current) {
      socketRef.current.on(eventName, handler as any);
    }
  }, []);

  // Unregister event listener
  const off = useCallback((eventName: string, handler: Function) => {
    // Remove from stored handlers
    const handlers = eventHandlersRef.current.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlersRef.current.delete(eventName);
      }
    }

    // Unregister from socket
    if (socketRef.current) {
      socketRef.current.off(eventName, handler as any);
    }
  }, []);

  // Flush queued events when connection is restored
  const flushEventQueue = useCallback(() => {
    if (!socketRef.current?.connected || eventQueueRef.current.length === 0) {
      return;
    }

    console.log('Flushing event queue:', eventQueueRef.current.length, 'events');

    const queue = [...eventQueueRef.current];
    eventQueueRef.current = [];

    queue.forEach((queuedEvent) => {
      if (queuedEvent.retryCount < 3) {
        socketRef.current!.emit(queuedEvent.eventName, queuedEvent.payload, (response: any) => {
          if (response?.error) {
            console.error('Failed to send queued event:', queuedEvent.eventName, response.error);
            // Re-queue if retry count not exceeded
            if (queuedEvent.retryCount < 2) {
              eventQueueRef.current.push({
                ...queuedEvent,
                retryCount: queuedEvent.retryCount + 1,
              });
            }
          }
        });
      } else {
        console.error('Event exceeded retry limit:', queuedEvent.eventName);
      }
    });
  }, []);

  // Restore event subscriptions after reconnection
  const restoreEventSubscriptions = useCallback((socket: Socket) => {
    eventHandlersRef.current.forEach((handlers, eventName) => {
      handlers.forEach((handler) => {
        socket.on(eventName, handler as any);
      });
    });
    console.log('Restored', eventHandlersRef.current.size, 'event subscriptions');
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (authToken) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [authToken, connect, disconnect]);

  return {
    connect,
    disconnect,
    emit,
    on,
    off,
    isConnected,
    connectionStatus,
    reconnectionAttempt,
  };
}
