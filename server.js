const express = require('express');
const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const io = require('socket.io')(http, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.static('public')); // serve HTML, CSS, JS from /public

const users = {}; // socket.id => user info

// User Connection
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // User Registration
  socket.on('register-user', (userInfo) => {
    if (!userInfo.name || !userInfo.age || !userInfo.gender || !userInfo.countryCode || !userInfo.region) {
      socket.emit('error', { message: 'Invalid user information. Please fill all fields.' });
      return;
    }

    // Register user
    users[socket.id] = { id: socket.id, ...userInfo };
    console.log('Registered:', users[socket.id]);

    // Emit user list to all clients
    sendUserList();
  });

  // Private Message
  socket.on('private-message', ({ to, message }) => {
    const fromUser = users[socket.id];
    if (io.sockets.sockets.get(to)) {
      // Send private message with timestamp
      io.to(to).emit('private-message', {
        from: socket.id,
        fromName: fromUser.name,
        message,
        timestamp: Date.now() // Add timestamp to message
      });
    } else {
      socket.emit('error', { message: 'User not found.' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
    sendUserList();
  });

  // Send updated user list to all clients
  function sendUserList() {
    const userList = Object.values(users).map(u => ({
      id: u.id,
      name: u.name
    }));
    io.emit('user-list', userList);
  }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
