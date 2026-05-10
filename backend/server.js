const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/jobs',         require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/branches',     require('./routes/branchRoutes'));
app.use('/api/interviews',   require('./routes/interviewRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));

// Test route
app.get('/', (req, res) => res.json({ message: ' TalentFlow ATS API Running' }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB Connected');
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch(err => console.error(' DB Error:', err.message));