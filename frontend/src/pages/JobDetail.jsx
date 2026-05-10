import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import API from '../api/axios.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [resume, setResume] = useState(null)
  const [coverLetter, setCoverLetter] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    API.get(`/jobs/${id}`)
      .then(r => { setJob(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!resume) return toast.error('Please upload your resume')
    setApplying(true)
    const fd = new FormData()
    fd.append('jobId', id)
    fd.append('resume', resume)
    if (coverLetter) fd.append('coverLetter', coverLetter)
    try {
      await API.post('/applications', fd)
      toast.success('Application submitted successfully!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    }
    setApplying(false)
  }

  if (loading) return <div className="loading">Loading job details...</div>
  if (!job) return <div className="empty"><h3>Job not found</h3></div>

  const infoItems = [
    { label: 'Branch', value: job.branch?.name },
    { label: 'City', value: job.branch?.city },
    { label: 'Type', value: job.type },
    { label: 'Seats', value: `${job.seats} open` },
    { label: 'Salary', value: job.salary || 'Not disclosed' },
    { label: 'Deadline', value: job.deadline ? new Date(job.deadline).toDateString() : 'Open' },
  ]

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>{job.title}</h1>
              <p style={{ color: 'var(--primary)', fontWeight: '600' }}>{job.department}</p>
            </div>
            {user?.role === 'candidate' && !showForm && (
              <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>Apply Now</button>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            {infoItems.map(item => (
              <div key={item.label} style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '600', marginBottom: '4px' }}>{item.label.toUpperCase()}</p>
                <p style={{ fontWeight: '700', color: 'var(--gray-800)' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '12px' }}>Job Description</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>{job.description}</p>
          </div>

          {job.requirements && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '12px' }}>Requirements</h3>
              <p style={{ color: 'var(--gray-600)', lineHeight: '1.8' }}>{job.requirements}</p>
            </div>
          )}

          {/* Apply Form */}
          {showForm && user?.role === 'candidate' && (
            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '24px', marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Submit Application</h3>
              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label className="form-label">Resume (PDF) *</label>
                  <input className="form-control" type="file" accept=".pdf"
                    onChange={e => setResume(e.target.files[0])} required />
                  <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>PDF format only</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Letter (PDF/DOCX) — Optional</label>
                  <input className="form-control" type="file" accept=".pdf,.docx"
                    onChange={e => setCoverLetter(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Not logged in */}
          {!user && (
            <div style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: 'var(--radius)', textAlign: 'center', marginTop: '16px' }}>
              <p style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Please <a href="/login" style={{ textDecoration: 'underline' }}>login</a> or{' '}
                <a href="/register" style={{ textDecoration: 'underline' }}>register</a> to apply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}