require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/signals', require('./routes/signals'));
app.use('/reports', require('./routes/reports'));
app.use('/news', require('./routes/news'));
app.use('/prices', require('./routes/prices'));
app.use('/auto-signals', require('./routes/auto-signals'));
app.use('/subscriptions', require('./routes/subscriptions'));


// Basic test route
app.get('/', (req, res) => res.send('Backend ready!'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => console.log('User disconnected'));
});

// Make io available to routes (e.g., for emitting in signals route)
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));