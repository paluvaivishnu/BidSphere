let io;

const initializeSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join an auction room
    socket.on('join-auction', (auctionId) => {
      socket.join(auctionId);
      console.log(`Socket ${socket.id} joined auction room: ${auctionId}`);
    });

    // Leave an auction room
    socket.on('leave-auction', (auctionId) => {
      socket.leave(auctionId);
      console.log(`Socket ${socket.id} left auction room: ${auctionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
