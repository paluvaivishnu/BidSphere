import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinAuction = useCallback((auctionId) => {
    socketRef.current?.emit('join-auction', auctionId);
  }, []);

  const leaveAuction = useCallback((auctionId) => {
    socketRef.current?.emit('leave-auction', auctionId);
  }, []);

  // Each on* helper registers the listener on the LIVE socket at the time of the call.
  // Because callers wrap these in useEffect with [connected, ...] deps,
  // the socket is always ready by the time these run.
  const onBidUpdate = useCallback((cb) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('bid-update', cb);
    return () => s.off('bid-update', cb);
  }, []);

  const onAuctionEnded = useCallback((cb) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on('auction-ended', cb);
    return () => s.off('auction-ended', cb);
  }, []);

  const onBidActivity = useCallback((cb) => {
    const s = socketRef.current;
    if (!s) {
      console.warn('[Socket] onBidActivity called before socket ready');
      return () => {};
    }
    console.log('[Socket] bid-activity listener ON');
    s.on('bid-activity', cb);
    return () => {
      console.log('[Socket] bid-activity listener OFF');
      s.off('bid-activity', cb);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, joinAuction, leaveAuction, onBidUpdate, onAuctionEnded, onBidActivity }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
