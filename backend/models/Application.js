const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: String, required: true },       // Cloudinary URL
  coverLetter: { type: String },                  // Cloudinary URL
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Selected'],
    default: 'Submitted',
  },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);