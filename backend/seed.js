const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Branch = require('./models/Branch');
const Job = require('./models/Job');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clear existing
  await User.deleteMany({});
  await Branch.deleteMany({});
  await Job.deleteMany({});

  // Create branches
  const branches = await Branch.insertMany([
    { name: 'Islamabad HQ', city: 'Islamabad', address: 'Blue Area, Islamabad' },
    { name: 'Lahore Office', city: 'Lahore', address: 'DHA Phase 5, Lahore' },
    { name: 'Karachi Office', city: 'Karachi', address: 'Clifton, Karachi' },
    { name: 'Remote Office', city: 'Remote', address: 'Work from Home' },
  ]);

  // Create admin user
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@company.com',
    password: 'Admin@123',
    role: 'admin'
  });

  // Create HR user
  const hr = await User.create({
    name: 'HR Manager',
    email: 'hr@company.com',
    password: 'Hr@12345',
    role: 'hr'
  });

  // Create sample jobs
  await Job.insertMany([
    {
      title: 'Full Stack Developer',
      department: 'Engineering',
      description: 'We are looking for an experienced Full Stack Developer to join our team.',
      requirements: '3+ years of experience with React, Node.js, and MongoDB.',
      type: 'Full-time',
      seats: 3,
      salary: '80,000 - 120,000 PKR',
      branch: branches[0]._id,
      postedBy: hr._id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'React.js Developer',
      department: 'Frontend',
      description: 'Join our frontend team and build beautiful user interfaces.',
      requirements: '2+ years of React.js experience.',
      type: 'Full-time',
      seats: 2,
      salary: '60,000 - 90,000 PKR',
      branch: branches[1]._id,
      postedBy: hr._id,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'Node.js Backend Developer',
      department: 'Backend',
      description: 'Build scalable APIs and backend services.',
      requirements: '2+ years Node.js, Express, MongoDB.',
      type: 'Full-time',
      seats: 2,
      salary: '70,000 - 100,000 PKR',
      branch: branches[2]._id,
      postedBy: hr._id,
    },
    {
      title: 'UI/UX Designer',
      department: 'Design',
      description: 'Design stunning user experiences for our products.',
      requirements: 'Figma, Adobe XD experience.',
      type: 'Full-time',
      seats: 1,
      salary: '50,000 - 80,000 PKR',
      branch: branches[3]._id,
      postedBy: hr._id,
    },
    {
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      description: 'Manage cloud infrastructure and CI/CD pipelines.',
      requirements: 'AWS, Docker, Kubernetes experience.',
      type: 'Full-time',
      seats: 1,
      salary: '100,000 - 150,000 PKR',
      branch: branches[0]._id,
      postedBy: hr._id,
    },
  ]);

  console.log(' Seed data inserted!');
  console.log('Admin: admin@company.com / Admin@123');
  console.log('HR:    hr@company.com / Hr@12345');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });