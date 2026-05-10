import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.jsx'
import './Jobs.css'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', branch: '', department: '' })

  const departments = ['Engineering', 'Frontend', 'Backend', 'Design', 'Infrastructure', 'QA', 'Management']
  const typeColor = { 'Full-time': 'badge-green', 'Part-time': 'badge-blue', 'Contract': 'badge-yellow', 'Internship': 'badge-gray' }

  useEffect(() => {
    API.get('/branches').then(r => setBranches(r.data)).catch(() => {})
    fetchJobs()
  }, [])

  const fetchJobs = async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.search) params.set('search', f.search)
      if (f.branch) params.set('branch', f.branch)
      if (f.department) params.set('department', f.department)
      const { data } = await API.get(`/jobs?${params}`)
      setJobs(data)
    } catch {}
    setLoading(false)
  }

  const handleFilter = (key, val) => {
    const updated = { ...filters, [key]: val }
    setFilters(updated)
    fetchJobs(updated)
  }

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title">Browse Jobs</h1>
          <p className="page-subtitle">{jobs.length} opportunities available</p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="filters-grid">
            <input className="form-control" placeholder=" Search job title..."
              value={filters.search} onChange={e => handleFilter('search', e.target.value)} />
            <select className="form-control" value={filters.branch} onChange={e => handleFilter('branch', e.target.value)}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className="form-control" value={filters.department} onChange={e => handleFilter('department', e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty"><h3>No jobs found</h3><p>Try adjusting your filters</p></div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(job => (
              <div className="job-card card" key={job._id}>
                <div className="job-card-header">
                  <div className="job-dept-icon">{job.department?.[0] || 'J'}</div>
                  <span className={`badge ${typeColor[job.type] || 'badge-gray'}`}>{job.type}</span>
                </div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-dept">{job.department}</p>
                <div className="job-meta">
                  <span> {job.branch?.name}</span>
                  <span> {job.branch?.city}</span>
                  <span> {job.seats} seat{job.seats > 1 ? 's' : ''}</span>
                </div>
                {job.salary && <div className="job-salary"> {job.salary}</div>}
                <p className="job-desc">{job.description?.slice(0, 100)}...</p>
                {job.deadline && (
                  <p className="job-deadline"> Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                )}
                <Link to={`/jobs/${job._id}`} className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                  View &amp; Apply
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}