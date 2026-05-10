const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

//  VALIDATION HELPERS

const validateEmail = (email) => {
  const emailRegex = /^[a-z0-9][a-z0-9._%+\-]*@[a-z0-9.\-]+\.[a-z]{2,}$/;
  return emailRegex.test(email);
};

const validateFile = (file, type) => {
  const limits = {
    resume: { maxSize: 5 * 1024 * 1024, mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    coverLetter: { maxSize: 3 * 1024 * 1024, mimes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    picture: { maxSize: 10 * 1024 * 1024, mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] }
  };

  const limit = limits[type];
  if (!limit) return { valid: false, error: 'Invalid file type' };
  if (!limit.mimes.includes(file.mimetype)) return { valid: false, error: `Invalid file type. Allowed: ${limit.mimes.join(', ')}` };
  if (file.size > limit.maxSize) return { valid: false, error: `File too large. Max: ${limit.maxSize / 1024 / 1024}MB` };
  return { valid: true };
};
// AUTHENTICATION
// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailLower = email.toLowerCase().trim();
    
    if (!validateEmail(emailLower)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password,
      role: 'candidate'
    });

    console.log(` User registered: ${user._id} (${user.email})`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error(' Register error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(` User logged in: ${user._id} (${user.email})`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      profilePicture: user.profilePicture,
      resume: user.resume,
      coverLetter: user.coverLetter,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error(' Login error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});
// PROFILE MANAGEMENT

// Get profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(' Get profile error:', err.message);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, skills, experience, education } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (skills) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (experience) updateData.experience = experience.trim();
    if (education) updateData.education = education.trim();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    console.log(` Profile updated: ${req.user._id}`);

    res.json(user);
  } catch (err) {
    console.error(' Update profile error:', err.message);
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
});

//  FILE UPLOADS
// Upload profile picture
router.post('/upload/picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const validation = validateFile(req.file, 'picture');
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log(` Uploading profile picture for user: ${req.user._id}`);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ats/profiles',
      resource_type: 'image',
      public_id: `profile_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    // CRITICAL: Extract ONLY the secure_url
    const pictureUrl = result.secure_url;

    console.log(` Profile picture uploaded: ${pictureUrl}`);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: pictureUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: pictureUrl,
      user
    });
  } catch (err) {
    console.error(' Picture upload error:', err.message);
    res.status(500).json({ message: 'Profile picture upload failed', error: err.message });
  }
});

// Upload resume
router.post('/upload/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const validation = validateFile(req.file, 'resume');
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log(` Uploading resume for user: ${req.user._id}`);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ats/resumes',
      resource_type: 'auto', // Auto-detect PDF/DOCX
      public_id: `resume_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    //  CRITICAL: Extract ONLY the secure_url
    const resumeUrl = result.secure_url;

    console.log(` Resume uploaded: ${resumeUrl}`);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resume: resumeUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Resume uploaded successfully',
      resume: resumeUrl,
      user
    });
  } catch (err) {
    console.error(' Resume upload error:', err.message);
    res.status(500).json({ message: 'Resume upload failed', error: err.message });
  }
});

// Upload cover letter
router.post('/upload/coverletter', protect, upload.single('coverLetter'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const validation = validateFile(req.file, 'coverLetter');
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    console.log(` Uploading cover letter for user: ${req.user._id}`);

    // Get file extension
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ats/cover-letters',
      resource_type: 'auto',
      public_id: `cover_${req.user._id}_${Date.now()}`,
      overwrite: true
    });

    //  CRITICAL: Extract ONLY the secure_url
    const coverLetterUrl = result.secure_url;

    console.log(` Cover letter uploaded: ${coverLetterUrl}`);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { coverLetter: coverLetterUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Cover letter uploaded successfully',
      coverLetter: coverLetterUrl,
      user
    });
  } catch (err) {
    console.error(' Cover letter upload error:', err.message);
    res.status(500).json({ message: 'Cover letter upload failed', error: err.message });
  }
});
// PASSWORD MANAGEMENT

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    console.log(` Password changed for user: ${req.user._id}`);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(' Change password error:', err.message);
    res.status(500).json({ message: 'Password change failed', error: err.message });
  }
});

module.exports = router;