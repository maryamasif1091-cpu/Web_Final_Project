const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, hrOnly } = require('../middleware/authMiddleware');

// Get all active jobs
router.get('/', async (req, res) => {
  try {
    const { branch, department, search } = req.query;
    let filter = { isActive: true };
    if (branch) filter.branch = branch;
    if (department) filter.department = new RegExp(department, 'i');
    if (search) filter.title = new RegExp(search, 'i');
    const jobs = await Job.find(filter).populate('branch', 'name city').sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('branch', 'name city');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create job (HR/Admin)
router.post('/', protect, hrOnly, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update job (HR/Admin)
router.put('/:id', protect, hrOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete job (HR/Admin)
router.delete('/:id', protect, hrOnly, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;