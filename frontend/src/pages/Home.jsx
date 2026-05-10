import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import API from '../api/axios.jsx'
import './Home.css'

export default function Home() {
  const [jobCount, setJobCount] = useState(0)

  useEffect(() => {
    API.get('/jobs').then(r => setJobCount(r.data.length)).catch(() => {})
  }, [])

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge"> #1 Recruitment Platform</div>
          <h1 className="hero-title">
            Find Your Dream Job at<br />
            <span className="hero-highlight">Top Software Companies</span>
          </h1>
          <p className="hero-desc">
            Apply to leading tech companies, track your applications in real-time,
            and land your next role faster with TalentFlow ATS.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="btn btn-primary btn-lg">Browse Jobs</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Create Account</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>{jobCount}+</strong><span>Active Jobs</span></div>
            <div className="hero-stat"><strong>4</strong><span>City Offices</span></div>
            <div className="hero-stat"><strong>100%</strong><span>Free to Apply</span></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-sub">A complete recruitment ecosystem for candidates and hiring teams</p>
        <div className="grid-3" style={{ marginTop: '40px' }}>
          {[
            {  title: 'Smart Job Search', desc: 'Filter jobs by city, department, and type. Find exactly what you\'re looking for.' },
            {  title: 'Easy Applications', desc: 'Upload your resume to Cloudinary, apply in seconds, track every step.' },
            {  title: 'Real-time Tracking', desc: 'Know your application status instantly — from submission to selection.' },
            {  title: 'Email Notifications', desc: 'Get notified for shortlisting, interview schedules, and decisions automatically.' },
            {  title: 'Multi-Branch', desc: 'Opportunities across Islamabad, Lahore, Karachi, and Remote offices.' },
            {  title: 'Secure & Private', desc: 'JWT authentication and role-based access keeps your data safe.' },
          ].map(f => (
            <div className="feature-card card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Branches */}
      <section className="branches-section">
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>Our Offices</h2>
          <div className="grid-4" style={{ marginTop: '32px' }}>
            {[
              {  name: 'Islamabad' },
              {  name: 'Lahore' },
              {  name: 'Karachi' },
              {  name: 'Remote' },
            ].map(b => (
              <div className="branch-card" key={b.name}>
                <span style={{ fontSize: '32px' }}>{b.icon}</span>
                <strong>{b.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section container">
        <div className="cta-box">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of professionals finding their dream jobs.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/jobs" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              View Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}