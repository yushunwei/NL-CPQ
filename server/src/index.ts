import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { env } from './config/env';

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: env.CLIENT_URL, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('quote:join', (quoteId: string) => {
    socket.join(`quote:${quoteId}`);
    const room = io.sockets.adapter.rooms.get(`quote:${quoteId}`);
    const onlineCount = room ? room.size : 0;
    io.to(`quote:${quoteId}`).emit('quote:users', { quoteId, onlineCount });
  });

  socket.on('quote:leave', (quoteId: string) => {
    socket.leave(`quote:${quoteId}`);
  });

  socket.on('quote:updated', (data: { quoteId: number; changedBy: string }) => {
    socket.to(`quote:${data.quoteId}`).emit('quote:updated', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

server.listen(env.PORT, () => {
  console.log(`[Server] Noblelift CPQ running on http://localhost:${env.PORT}`);
});

export { io };
