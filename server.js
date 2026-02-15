require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Important: Middleware must come BEFORE routes
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/signals', require('./routes/signals'));
app.use('/reports', require('./routes/reports'));
app.use('/news', require('./routes/news'));
app.use('/prices', require('./routes/prices'));
app.use('/subscriptions', require('./routes/subscriptions')); // if you have it

// Test route
app.get('/', (req, res) => res.send('FixSignal Backend is Live!'));

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => console.log('User disconnected'));
});

app.set('io', io);

// Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});