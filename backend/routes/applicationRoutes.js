const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { protect, hrOnly } = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../config/email');

//  HELPERS
const saveNotif = async (recipientId, subject, message, type, relatedJob, senderId) => {
  try {
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      subject,
      message,
      type,
      relatedJob
    });
  } catch (err) {
    console.error(' Notification save error:', err.message);
  }
};

const validateFile = (file, type) => {
  const limits = {
    resume: { maxSize: 5 * 1024 * 1024, mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    coverLetter: { maxSize: 3 * 1024 * 1024, mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }
  };

  const limit = limits[type];
  if (!limit) return { valid: false, error: 'Invalid file type' };
  if (!limit.mimes.includes(file.mimetype)) return { valid: false, error: `Invalid ${type} format` };
  if (file.size > limit.maxSize) return { valid: false, error: `${type} file too large` };
  return { valid: true };
};
//  CREATE APPLICATION
router.post('/', protect, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 }
]), async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if already applied
    const existing = await Application.findOne({
      job: jobId,
      candidate: req.user._id
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Resume is required
    if (!req.files?.resume?.[0]) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    // Validate resume file
    const resumeValidation = validateFile(req.files.resume[0], 'resume');
    if (!resumeValidation.valid) {
      return res.status(400).json({ message: resumeValidation.error });
    }

    console.log(` Uploading application resume for user: ${req.user._id}`);

    // Upload resume to Cloudinary
    const resumeResult = await uploadToCloudinary(req.files.resume[0].buffer, {
      folder: 'ats/resumes',
      resource_type: 'auto',
      public_id: `resume_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    //  CRITICAL: Extract ONLY the secure_url
    const resumeUrl = resumeResult.secure_url;
    console.log(` Resume uploaded: ${resumeUrl}`);

    let coverLetterUrl = null;

    // Handle optional cover letter
    if (req.files?.coverLetter?.[0]) {
      const coverValidation = validateFile(req.files.coverLetter[0], 'coverLetter');
      if (!coverValidation.valid) {
        return res.status(400).json({ message: coverValidation.error });
      }

      console.log(` Uploading application cover letter for user: ${req.user._id}`);

      const coverLetterResult = await uploadToCloudinary(req.files.coverLetter[0].buffer, {
        folder: 'ats/cover-letters',
        resource_type: 'auto',
        public_id: `cover_${req.user._id}_${Date.now()}`,
        overwrite: true
      });

      //  CRITICAL: Extract ONLY the secure_url
      coverLetterUrl = coverLetterResult.secure_url;
      console.log(` Cover letter uploaded: ${coverLetterUrl}`);
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
      resume: resumeUrl,        // Store as string URL
      coverLetter: coverLetterUrl, // Store as string URL
      status: 'Submitted'
    });

    // Populate job info for email
    await application.populate({
      path: 'job',
      select: 'title',
      populate: { path: 'branch', select: 'name city' }
    });

    // Send confirmation email
    const job = application.job;
    const subject = `Application Received - ${job.title}`;
    const htmlMessage = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1a56db;">Application Received!</h2>
      <p>Dear <strong>${req.user.name}</strong>,</p>
      <p>Your application for <strong>${job.title}</strong> at ${job.branch?.name} has been submitted successfully.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
        <p><b>Position:</b> ${job.title}</p>
        <p><b>Location:</b> ${job.branch?.name}, ${job.branch?.city}</p>
        <p><b>Status:</b> <span style="color:#1a56db;font-weight:700;">Submitted</span></p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">We will review your application and get back to you soon.<br/><br/>Best Regards,<br/><b>TalentFlow HR Team</b></p>
    </div>`;

    try {
      await sendEmail(req.user.email, subject, htmlMessage);
    } catch (emailErr) {
      console.error(' Email send error:', emailErr.message);
      // Continue even if email fails
    }

    // Save notification
    await saveNotif(
      req.user._id,
      subject,
      `Your application for <strong>${job.title}</strong> has been submitted`,
      'application_received',
      job.title
    );

    console.log(` Application created: ${application._id}`);

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (err) {
    console.error(' Application creation error:', err.message);
    res.status(500).json({
      message: 'Application submission failed',
      error: err.message
    });
  }
});

// UPLOAD RESUME TO EXISTING APPLICATION

router.put('/:id/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify ownership
    if (application.candidate.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own applications' });
    }

    // Validate file
    const validation = validateFile(req.file, 'resume');
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log(` Updating resume for application: ${req.params.id}`);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ats/resumes',
      resource_type: 'auto',
      public_id: `resume_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    //  CRITICAL: Extract ONLY the secure_url
    const resumeUrl = result.secure_url;
    console.log(`✓ Resume updated: ${resumeUrl}`);

    // Update application
    application.resume = resumeUrl;
    await application.save();

    res.json({
      message: 'Resume updated successfully',
      resume: resumeUrl,
      application
    });
  } catch (err) {
    console.error(' Resume update error:', err.message);
    res.status(500).json({
      message: 'Resume update failed',
      error: err.message
    });
  }
});
//  UPLOAD COVER LETTER TO EXISTING APPLICATION
router.put('/:id/coverletter', protect, upload.single('coverLetter'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify ownership
    if (application.candidate.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own applications' });
    }

    // Validate file
    const validation = validateFile(req.file, 'coverLetter');
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log(` Updating cover letter for application: ${req.params.id}`);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ats/cover-letters',
      resource_type: 'auto',
      public_id: `cover_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    //  CRITICAL: Extract ONLY the secure_url
    const coverLetterUrl = result.secure_url;
    console.log(` Cover letter updated: ${coverLetterUrl}`);

    // Update application
    application.coverLetter = coverLetterUrl;
    await application.save();

    res.json({
      message: 'Cover letter updated successfully',
      coverLetter: coverLetterUrl,
      application
    });
  } catch (err) {
    console.error(' Cover letter update error:', err.message);
    res.status(500).json({
      message: 'Cover letter update failed',
      error: err.message
    });
  }
});
//  GET MY APPLICATIONS

router.get('/my', protect, async (req, res) => {
  try {
    const apps = await Application.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        select: 'title department salary type',
        populate: { path: 'branch', select: 'name city' }
      })
      .sort('-createdAt');

    res.json(apps);
  } catch (err) {
    console.error(' Get my applications error:', err.message);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// NOTIFICATIONS
// Get my notifications
router.get('/notifications/my', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt');

    res.json(notifications);
  } catch (err) {
    console.error(' Get notifications error:', err.message);
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    console.error(' Mark read error:', err.message);
    res.status(500).json({ message: 'Error updating notification', error: err.message });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(' Mark all read error:', err.message);
    res.status(500).json({ message: 'Error updating notifications', error: err.message });
  }
});

//  HR ROUTES=

// Get all applications (HR only)
router.get('/all', protect, hrOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.jobId) filter.job = req.query.jobId;
    if (req.query.status) filter.status = req.query.status;

    const apps = await Application.find(filter)
      .populate('candidate', 'name email phone profilePicture skills experience')
      .populate({
        path: 'job',
        select: 'title department type',
        populate: { path: 'branch', select: 'name city' }
      })
      .sort('-createdAt');

    res.json(apps);
  } catch (err) {
    console.error(' Get all applications error:', err.message);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// Update application status (HR only)
router.put('/:id/status', protect, hrOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const validStatuses = ['Submitted', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Selected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('candidate', 'name email').populate('job', 'title');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log(` Application status updated: ${req.params.id} -> ${status}`);

    // Email templates for each status
    const statusEmails = {
      'Under Review': {
        subj: `Application Under Review - ${app.job.title}`,
        msg: `Your application for <strong>${app.job.title}</strong> is currently being reviewed by our HR team.`,
        color: '#1a56db'
      },
      'Shortlisted': {
        subj: `You've been Shortlisted! - ${app.job.title}`,
        msg: `Congratulations! You have been <strong>shortlisted</strong> for <strong>${app.job.title}</strong>.`,
        color: '#0e9f6e'
      },
      'Interview Scheduled': {
        subj: `Interview Scheduled - ${app.job.title}`,
        msg: `Your interview for <strong>${app.job.title}</strong> has been scheduled. Please check your email for details.`,
        color: '#6d28d9'
      },
      'Rejected': {
        subj: `Application Update - ${app.job.title}`,
        msg: `Thank you for applying for <strong>${app.job.title}</strong>. We appreciate your interest but will not be moving forward at this time.`,
        color: '#e02424'
      },
      'Selected': {
        subj: `Congratulations! You've been Selected - ${app.job.title}`,
        msg: `We are delighted to inform you that you have been <strong>selected</strong> for <strong>${app.job.title}</strong>!`,
        color: '#0e9f6e'
      }
    };

    if (statusEmails[status]) {
      const { subj, msg, color } = statusEmails[status];
      const htmlMessage = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:${color};">Application Status Update</h2>
        <p>Dear <strong>${app.candidate.name}</strong>,</p>
        <p>${msg}</p>
        <div style="background:#f3f4f6;padding:14px;border-radius:8px;margin:16px 0;border-left:4px solid ${color};">
          <p><b>Position:</b> ${app.job.title}</p>
          <p><b>Status:</b> <span style="color:${color};font-weight:700;">${status}</span></p>
        </div>
        <p style="color:#9ca3af;font-size:13px;">Best Regards,<br/><b>TalentFlow HR Team</b></p>
      </div>`;

      try {
        await sendEmail(app.candidate.email, subj, htmlMessage);
      } catch (emailErr) {
        console.error(' Status email send error:', emailErr.message);
      }

      await saveNotif(
        app.candidate._id,
        subj,
        msg,
        'status_update',
        app.job.title,
        req.user._id
      );
    }

    res.json({ message: 'Status updated successfully', application: app });
  } catch (err) {
    console.error(' Status update error:', err.message);
    res.status(500).json({ message: 'Status update failed', error: err.message });
  }
});

// Send custom message to candidate (HR only)
router.post('/:id/message', protect, hrOnly, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const app = await Application.findById(req.params.id)
      .populate('candidate', 'name email')
      .populate('job', 'title');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const htmlMessage = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#1a56db;">Message from HR Team</h2>
      <p>Dear <strong>${app.candidate.name}</strong>,</p>
      <p style="color:#6b7280;font-size:13px;">Regarding: <strong>${app.job.title}</strong></p>
      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:16px 0;border-left:4px solid #1a56db;">
        <p>${message}</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;">Best Regards,<br/><b>TalentFlow HR Team</b></p>
    </div>`;

    try {
      await sendEmail(app.candidate.email, subject, htmlMessage);
    } catch (emailErr) {
      console.error(' Message email send error:', emailErr.message);
    }

    await saveNotif(
      app.candidate._id,
      subject,
      message,
      'custom_message',
      app.job.title,
      req.user._id
    );

    console.log(` Message sent to candidate: ${app.candidate._id}`);

    res.json({ message: 'Email sent and notification saved' });
  } catch (err) {
    console.error(' Send message error:', err.message);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

module.exports = router;