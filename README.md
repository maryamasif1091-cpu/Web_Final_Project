# Recruitment & Applicant Tracking System (ATS)

A full-stack web application for managing the complete hiring process of a software house with multiple branches (Islamabad, Lahore, Karachi, Remote). The system automates job posting, candidate applications, interview scheduling, and email communication through three separate role-based portals for Candidates, HR, and Admin users.

## Live Links
- Frontend: 
- Backend API:https://web-final-project-fx4i.onrender.com

## Tech Stack
- Frontend: React.js + Vite
- Backend: Node.js + Express.js
- Database: MongoDB Atlas
- File Storage: Cloudinary
- Email Service: Gmail SMTP
- Authentication: JWT + Role-based Access Control
- Version Control: Git / GitHub
- Hosting: Vercel (Frontend) + Render (Backend)

## Features

### Public Career Portal
- View all available jobs
- Search and filter jobs by branch or department
- View complete job details
- Apply online without login

### Candidate Portal
- Register and login
- Edit profile information
- Upload Resume via Cloudinary (PDF only)
- Upload Cover Letter via Cloudinary (PDF or DOCX)
- Apply for jobs
- View all applied jobs
- Track application status (Submitted, Under Review, Shortlisted, Interview Scheduled, Rejected, Selected)

### HR Portal
- Add, edit and delete job listings
- Set available seats and assign branch location
- View and manage all applicants
- Shortlist or reject candidates
- View resumes and candidate details from Cloudinary
- Schedule interviews with date, time and custom message
- Send email notifications (Shortlist, Interview Invitation, Rejection, Custom Message)

### Admin Portal
- Full system control
- Branch management (Islamabad, Lahore, Karachi, Remote)
- User management and oversight
- Analytics dashboard with charts

## Database Collections
- Users
- Jobs
- Branches
- Applications (stores Cloudinary URLs for resume and cover letter)
- Interviews

## Project Structure
```
Web_Final_Project/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── email.js
│   │   └── Notification.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Application.js
│   │   ├── Branch.js
│   │   ├── Interview.js
│   │   ├── Job.js
│   │   ├── Notification.js
│   │   └── User.js
│   ├── routes/
│   ├── server.js
│   ├── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Navbar.css
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CandidateDashboard.jsx
│   │   │   ├── CandidateDashboard.css
│   │   │   ├── Home.jsx
│   │   │   ├── Home.css
│   │   │   ├── HRDashboard.jsx
│   │   │   ├── JobDetail.jsx
│   │   │   ├── Jobs.jsx
│   │   │   ├── Jobs.css
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Auth.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend
```
cd backend
npm install
node server.js
```
Create .env file in backend folder:
```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GMAIL_USER=your_email
GMAIL_PASS=your_app_password
```

### Frontend
```
cd frontend
npm install
npm run dev
```
Create .env file in frontend folder:
```
VITE_API_URL=http://localhost:5001
```
