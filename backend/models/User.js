const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'hr', 'admin'], default: 'candidate' },
  phone: { type: String },
  address: { type: String },
  profilePicture: { type: String }, // Cloudinary URL
  resume: { type: String },         // Cloudinary URL
  coverLetter: { type: String },    // Cloudinary URL
  skills: [{ type: String }],
  experience: { type: String },
  education: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);