const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const { protect, hrOnly } = require('../middleware/authMiddleware');
const { sendEmail } = require('../config/email');

// Schedule interview (HR/Admin)
router.post('/', protect, hrOnly, async (req, res) => {
  try {
    const { applicationId, date, time, location, message } = req.body;
    const app = await Application.findById(applicationId)
      .populate('candidate', 'name email').populate('job', 'title');

    const interview = await Interview.create({
      application: applicationId,
      candidate: app.candidate._id,
      job: app.job._id,
      date, time, location, message,
      scheduledBy: req.user._id
    });

    // Update application status
    await Application.findByIdAndUpdate(applicationId, { status: 'Interview Scheduled' });

    // Send email
    await sendEmail(
      app.candidate.email,
      `Interview Scheduled - ${app.job.title}`,
      `<h2>Dear ${app.candidate.name},</h2>
       <p>Your interview for <strong>${app.job.title}</strong> has been scheduled.</p>
       <ul>
         <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
         <li><strong>Time:</strong> ${time}</li>
         <li><strong>Location:</strong> ${location || 'Online'}</li>
       </ul>
       ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
       <p>Best Regards,<br>HR Team</p>`
    );

    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all interviews (HR/Admin)
router.get('/all', protect, hrOnly, async (req, res) => {
  try {
    const interviews = await Interview.find()
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .sort('-createdAt');
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my interviews (candidate)
router.get('/my', protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ candidate: req.user._id })
      .populate('job', 'title department').sort('-date');
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;