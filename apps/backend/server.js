require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hamrah';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Basic API Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'HamRah Backend API' });
});

// Mount Routes
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const walletRoutes = require('./routes/wallet');
const navigationRoutes = require('./routes/navigation');

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/navigation', navigationRoutes);

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });

  // Example Event: Driver location update
  socket.on('updateLocation', (data) => {
    // Broadcast location to nearby riders or active ride channel
    console.log(`Location update from ${socket.id}:`, data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
