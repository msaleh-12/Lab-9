const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const JWT_SECRET = 'your_jwt_secret'; // In production, store this securely

// In-memory data stores for demo purposes
let users = [];
let events = [];
let userIdCounter = 1;
let eventIdCounter = 1;

// Middleware to protect routes using JWT authentication
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// ----- Authentication Endpoints ----- //

// Signup: Create a new user (plain text password for demo purposes)
app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const newUser = { id: userIdCounter++, username, password };
  users.push(newUser);
  res.status(201).json({ message: 'User created' });
});

// Login: Authenticate user and issue a JWT token
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ----- Event Endpoints ----- //

// Create a new event (protected route)
app.post('/api/events', authMiddleware, (req, res) => {
  const { name, description, date, time, category, reminder } = req.body;
  const newEvent = {
    id: eventIdCounter++,
    name,
    description,
    date,
    time,
    category,
    reminder: reminder || false,
    userId: req.user.id
  };
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// Get events with optional filtering and sorting (protected route)
app.get('/api/events', authMiddleware, (req, res) => {
  const { sortBy, category, reminder } = req.query;
  // Filter events belonging to the authenticated user
  let userEvents = events.filter(event => event.userId === req.user.id);

  // Apply category filter if provided
  if (category) {
    userEvents = userEvents.filter(event => event.category === category);
  }
  // Apply reminder filter if provided
  if (reminder !== undefined) {
    userEvents = userEvents.filter(event => event.reminder === (reminder === 'true'));
  }
  // Apply sorting based on query parameter
  if (sortBy === 'date') {
    userEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === 'category') {
    userEvents.sort((a, b) => a.category.localeCompare(b.category));
  } else if (sortBy === 'reminder') {
    userEvents.sort((a, b) => a.reminder - b.reminder);
  }
  res.json(userEvents);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for potential testing
module.exports = app;
