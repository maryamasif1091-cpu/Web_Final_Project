const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, adminOnly, hrOnly } = require('../middleware/authMiddleware');

// Dashboard stats
router.get('/stats', protect, hrOnly, async (req, res) => {
  try {
    const [totalJobs, totalApplications, totalCandidates, statusCounts] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    res.json({ totalJobs, totalApplications, totalCandidates, statusCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (admin only)
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change user role (admin only)
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { role: req.body.role }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;