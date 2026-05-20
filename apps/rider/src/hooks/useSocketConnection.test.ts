/**
 * Unit tests for useSocketConnection hook
 * 
 * Tests the exponential backoff reconnection logic
 * Requirements: 2.3, 2.5
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSocketConnection } from './useSocketConnection';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

describe('useSocketConnection - Exponential Backoff Reconnection', () => {
  let mockSocket: any;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockOn: jest.Mock;
  let mockEmit: jest.Mock;
  let mockOff: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    
    mockConnect = jest.fn();
    mockDisconnect = jest.fn();
    mockOn = jest.fn();
    mockEmit = jest.fn();
    mockOff = jest.fn();

    mockSocket = {
      connected: false,
      connect: mockConnect,
      disconnect: mockDisconnect,
      on: mockOn,
      emit: mockEmit,
      off: mockOff,
      id: 'test-socket-id',
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('should track reconnection attempt count', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Simulate disconnect
    act(() => {
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    // Wait for first reconnection attempt
    act(() => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0]);
    });

    await waitFor(() => {
      expect(result.current.reconnectionAttempt).toBe(1);
      expect(result.current.connectionStatus).toBe('reconnecting');
    });
  });

  test('should use exponential backoff delays: [1000, 2000, 5000, 10000, 30000]', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Simulate disconnect
    act(() => {
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    // Test each delay in the sequence
    for (let i = 0; i < RECONNECT_DELAYS.length; i++) {
      const delay = RECONNECT_DELAYS[i];
      
      // Advance time by the expected delay
      act(() => {
        jest.advanceTimersByTime(delay);
      });

      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledTimes(i + 2); // +1 for initial connect, +1 for this attempt
      });

      // Simulate connection error to trigger next attempt
      if (i < RECONNECT_DELAYS.length - 1) {
        act(() => {
          const errorHandler = mockOn.mock.calls.find(
            (call) => call[0] === 'connect_error'
          )?.[1];
          errorHandler?.(new Error('Connection failed'));
        });
      }
    }
  });

  test('should cap at maximum delay of 30000ms for subsequent attempts', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Simulate disconnect
    act(() => {
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    // Go through all delays
    for (let i = 0; i < RECONNECT_DELAYS.length; i++) {
      act(() => {
        jest.advanceTimersByTime(RECONNECT_DELAYS[i]);
      });

      if (i < RECONNECT_DELAYS.length - 1) {
        act(() => {
          const errorHandler = mockOn.mock.calls.find(
            (call) => call[0] === 'connect_error'
          )?.[1];
          errorHandler?.(new Error('Connection failed'));
        });
      }
    }

    // Now test that subsequent attempts use the max delay (30000ms)
    const connectCallsBefore = mockConnect.mock.calls.length;

    // Simulate another connection error
    act(() => {
      const errorHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'connect_error'
      )?.[1];
      errorHandler?.(new Error('Connection failed'));
    });

    // Advance by less than max delay - should not reconnect
    act(() => {
      jest.advanceTimersByTime(29000);
    });

    expect(mockConnect).toHaveBeenCalledTimes(connectCallsBefore);

    // Advance to max delay - should reconnect
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledTimes(connectCallsBefore + 1);
    });
  });

  test('should reset reconnection attempt count on successful connection', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Simulate disconnect
    act(() => {
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    // Wait for first reconnection attempt
    act(() => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0]);
    });

    await waitFor(() => {
      expect(result.current.reconnectionAttempt).toBe(1);
    });

    // Simulate successful connection
    act(() => {
      mockSocket.connected = true;
      const connectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();
    });

    await waitFor(() => {
      expect(result.current.reconnectionAttempt).toBe(0);
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('should display connection status indicator states', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Initial state should be disconnected
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);

    // Simulate successful connection
    act(() => {
      mockSocket.connected = true;
      const connectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate disconnect
    act(() => {
      mockSocket.connected = false;
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('reconnecting');
      expect(result.current.isConnected).toBe(false);
    });
  });

  test('should not reconnect on manual disconnect', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    const connectCallsBefore = mockConnect.mock.calls.length;

    // Simulate manual disconnect
    act(() => {
      result.current.disconnect();
    });

    // Advance timers - should not trigger reconnection
    act(() => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0] * 2);
    });

    expect(mockConnect).toHaveBeenCalledTimes(connectCallsBefore);
    expect(result.current.connectionStatus).toBe('disconnected');
  });

  test('should clear reconnection timeout on manual disconnect', async () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Simulate disconnect to start reconnection
    act(() => {
      const disconnectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.('transport close');
    });

    // Verify reconnection is scheduled
    expect(result.current.connectionStatus).toBe('reconnecting');

    // Manually disconnect before reconnection happens
    act(() => {
      result.current.disconnect();
    });

    const connectCallsBefore = mockConnect.mock.calls.length;

    // Advance timers past the reconnection delay
    act(() => {
      jest.advanceTimersByTime(RECONNECT_DELAYS[0] * 2);
    });

    // Should not have attempted reconnection
    expect(mockConnect).toHaveBeenCalledTimes(connectCallsBefore);
  });
});

describe('useSocketConnection - Connection Status Display', () => {
  test('should expose connectionStatus for UI display', () => {
    const { result } = renderHook(() => useSocketConnection('test-token'));

    // Verify the hook exposes the required properties for ConnectionStatusIndicator
    expect(result.current).toHaveProperty('connectionStatus');
    expect(result.current).toHaveProperty('isConnected');
    expect(result.current).toHaveProperty('reconnectionAttempt');

    // Verify types
    expect(['connected', 'disconnected', 'reconnecting']).toContain(
      result.current.connectionStatus
    );
    expect(typeof result.current.isConnected).toBe('boolean');
    expect(typeof result.current.reconnectionAttempt).toBe('number');
  });
});
