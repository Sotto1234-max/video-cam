// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());
app.use(express.static('public')); // assumes your HTML is in /public

const users = {};

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('register-user', (userData) => {
    users[socket.id] = userData;
    users[socket.id].id = socket.id;
    io.emit('user-list', Object.values(users));
  });

  socket.on('private-message', ({ to, message }) => {
    if (io.sockets.sockets.get(to)) {
      io.to(to).emit('private-message', {
        from: socket.id,
        fromName: users[socket.id]?.name || 'Unknown',
        message,
      });
    }
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('user-list', Object.values(users));
    console.log('Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
