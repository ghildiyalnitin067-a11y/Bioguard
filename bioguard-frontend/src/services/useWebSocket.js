import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

/**
 * useWebSocket — connects to backend WS and streams real-time events.
 * Returns: { lastEvent, events, status, reconnect }
 */
export const useWebSocket = () => {
  const [status,    setStatus]    = useState('disconnected');
  const [lastEvent, setLastEvent] = useState(null);
  const [events,    setEvents]    = useState([]);
  const wsRef    = useRef(null);
  const timerRef = useRef(null);

  const connect = useCallback(function connectFn() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      clearTimeout(timerRef.current);
    };

    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        // Only keep last 50 events to prevent memory bloat
        setLastEvent(payload);
        setEvents((prev) => [payload, ...prev].slice(0, 50));
      } catch (err) {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setStatus('reconnecting');
      // Auto-reconnect after 5s
      timerRef.current = setTimeout(connectFn, 5000);
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, lastEvent, events, reconnect: connect };
};
