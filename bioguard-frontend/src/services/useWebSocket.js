import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';

export const useWebSocket = () => {
  const [status, setStatus] = useState('disconnected');
  const [lastEvent, setLastEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  const connect = useCallback(() => {
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
        setLastEvent(payload);
        setEvents((prev) => [payload, ...prev].slice(0, 50));
      } catch {}
    };

    ws.onclose = () => {
      setStatus('reconnecting');
      timerRef.current = setTimeout(connect, 5000);
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