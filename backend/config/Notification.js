const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['application_received', 'status_update', 'interview_scheduled', 'custom_message'],
    default: 'custom_message'
  },
  isRead: { type: Boolean, default: false },
  relatedJob: { type: String }, // job title for display
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);