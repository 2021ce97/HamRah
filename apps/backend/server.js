require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const SocketServer = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

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

// Initialize Socket.IO Server for Real-Time Ride Matching
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const socketServer = new SocketServer(server, JWT_SECRET);

// Initialize RideMatcher and TimeoutManager
const RideMatcher = require('./socket/rideMatcher');
const TimeoutManager = require('./socket/timeoutManager');

socketServer.rideMatcher = new RideMatcher();
socketServer.timeoutManager = new TimeoutManager(socketServer);

socketServer.initialize();

// Make socketServer available to other modules if needed
app.set('socketServer', socketServer);

console.log('✅ RideMatcher initialized');
console.log('✅ TimeoutManager initialized');

// Example: Legacy updateLocation event handler (can be moved to dedicated module later)
socketServer.getIO().on('connection', (socket) => {
  socket.on('updateLocation', (data) => {
    // Broadcast location to nearby riders or active ride channel
    console.log(`Location update from ${socket.id}:`, data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready for real-time ride matching`);
});
