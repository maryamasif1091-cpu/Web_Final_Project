import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import API from '../api/axios.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function HRDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({})
  const [jobs, setJobs] = useState([])
  const [branches, setBranches] = useState([])
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJobForm, setShowJobForm] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [jobForm, setJobForm] = useState({ title: '', department: '', description: '', requirements: '', type: 'Full-time', seats: 1, salary: '', branch: '', deadline: '' })
  const [selectedApp, setSelectedApp] = useState(null)
  const [ivForm, setIvForm] = useState({ date: '', time: '', location: 'Online', message: '' })
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' })

  const depts = ['Engineering', 'Frontend', 'Backend', 'Design', 'Infrastructure', 'QA', 'Management', 'HR']
  const statusOptions = ['Submitted', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Selected']

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, j, b, a, iv] = await Promise.all([
        API.get('/admin/stats'), API.get('/jobs'), API.get('/branches'),
        API.get('/applications/all'), API.get('/interviews/all')
      ])
      setStats(s.data); setJobs(j.data); setBranches(b.data)
      setApplications(a.data); setInterviews(iv.data)
    } catch {}
    setLoading(false)
  }

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingJob) { await API.put(`/jobs/${editingJob._id}`, jobForm); toast.success('Job updated!') }
      else { await API.post('/jobs', jobForm); toast.success('Job created!') }
      setShowJobForm(false); setEditingJob(null)
      resetJobForm()
      const { data } = await API.get('/jobs')
      setJobs(data)
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const resetJobForm = () => setJobForm({ title: '', department: '', description: '', requirements: '', type: 'Full-time', seats: 1, salary: '', branch: '', deadline: '' })

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return
    await API.delete(`/jobs/${id}`)
    setJobs(j => j.filter(x => x._id !== id))
    toast.success('Job deleted')
  }

  const handleStatus = async (appId, status) => {
    try {
      await API.put(`/applications/${appId}/status`, { status })
      setApplications(a => a.map(x => x._id === appId ? { ...x, status } : x))
      toast.success(`Status: ${status}`)
    } catch { toast.error('Error') }
  }

  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    try {
      await API.post('/interviews', { applicationId: selectedApp._id, ...ivForm })
      toast.success('Interview scheduled & email sent!')
      setSelectedApp(null)
      loadAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    try {
      await API.post(`/applications/${selectedApp._id}/message`, msgForm)
      toast.success('Email sent!')
      setSelectedApp(null)
    } catch { toast.error('Error') }
  }

  const editJob = (job) => {
    setEditingJob(job)
    setJobForm({ ...job, branch: job.branch?._id || job.branch, deadline: job.deadline?.split('T')[0] || '' })
    setShowJobForm(true)
  }

  const tabs = [
    { id: 'overview', label: ' Overview' },
    { id: 'jobs', label: ' Jobs' },
    { id: 'applications', label: ' Applications' },
    { id: 'interviews', label: ' Interviews' },
  ]

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title">HR Portal</h1>
          <p className="page-subtitle">Welcome, {user?.name}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <>
            {/* Overview */}
            {activeTab === 'overview' && (
              <div>
                <div className="grid-4" style={{ marginBottom: '28px' }}>
                  {[
                    { label: 'Active Jobs', value: stats.totalJobs, bg: '#e8f0fe' },
                    {  label: 'Applications', value: stats.totalApplications, bg: '#e3f9f0' },
                    {  label: 'Candidates', value: stats.totalCandidates, bg: '#fef3c7' },
                    {  label: 'Interviews', value: interviews.length, bg: '#ede9fe' },
                  ].map(s => (
                    <div className="stat-card" key={s.label}>
                      <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                      <div className="stat-value">{s.value ?? 0}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Status Breakdown</h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {(stats.statusCounts || []).map(s => (
                      <div key={s._id} style={{ padding: '12px 20px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800' }}>{s.count}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{s._id}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Jobs */}
            {activeTab === 'jobs' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Manage Jobs</h2>
                  <button className="btn btn-primary" onClick={() => { setEditingJob(null); resetJobForm(); setShowJobForm(true) }}>
                    + Add Job
                  </button>
                </div>

                {showJobForm && (
                  <div className="card" style={{ marginBottom: '24px', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '20px' }}>{editingJob ? 'Edit Job' : 'Add New Job'}</h3>
                    <form onSubmit={handleJobSubmit}>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Job Title *</label>
                          <input className="form-control" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Department *</label>
                          <select className="form-control" value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} required>
                            <option value="">Select...</option>
                            {depts.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Branch *</label>
                          <select className="form-control" value={jobForm.branch} onChange={e => setJobForm({ ...jobForm, branch: e.target.value })} required>
                            <option value="">Select...</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Type</label>
                          <select className="form-control" value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}>
                            {['Full-time', 'Part-time', 'Contract', 'Internship'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Seats</label>
                          <input className="form-control" type="number" min="1" value={jobForm.seats} onChange={e => setJobForm({ ...jobForm, seats: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Salary</label>
                          <input className="form-control" value={jobForm.salary} onChange={e => setJobForm({ ...jobForm, salary: e.target.value })} placeholder="e.g. 80,000 - 120,000 PKR" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Deadline</label>
                          <input className="form-control" type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Description *</label>
                          <textarea className="form-control" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1/-1' }}>
                          <label className="form-label">Requirements</label>
                          <textarea className="form-control" value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary">{editingJob ? 'Update' : 'Create Job'}</button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowJobForm(false)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="card table-container">
                  <table>
                    <thead><tr><th>Title</th><th>Dept</th><th>Branch</th><th>Type</th><th>Seats</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {jobs.map(j => (
                        <tr key={j._id}>
                          <td><strong>{j.title}</strong></td>
                          <td>{j.department}</td>
                          <td>{j.branch?.name}</td>
                          <td>{j.type}</td>
                          <td>{j.seats}</td>
                          <td><span className={`badge ${j.isActive ? 'badge-green' : 'badge-gray'}`}>{j.isActive ? 'Active' : 'Closed'}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-outline btn-sm" onClick={() => editJob(j)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteJob(j._id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Applications */}
            {activeTab === 'applications' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>All Applications ({applications.length})</h2>

                {/* Interview Modal */}
                {selectedApp?.mode === 'interview' && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: '700', fontSize: '18px' }}> Schedule Interview</h3>
                        <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1 }}>✕</button>
                      </div>
                      <div style={{ background: 'var(--primary-light)', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '700' }}> {selectedApp.candidate?.name}</p>
                        <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginTop: '2px' }}>{selectedApp.candidate?.email} |  {selectedApp.job?.title}</p>
                      </div>
                      <form onSubmit={handleScheduleInterview}>
                        <div className="grid-2">
                          <div className="form-group">
                            <label className="form-label">Date *</label>
                            <input className="form-control" type="date" value={ivForm.date} onChange={e => setIvForm({ ...ivForm, date: e.target.value })} required />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Time *</label>
                            <input className="form-control" type="time" value={ivForm.time} onChange={e => setIvForm({ ...ivForm, time: e.target.value })} required />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Location</label>
                          <input className="form-control" value={ivForm.location} onChange={e => setIvForm({ ...ivForm, location: e.target.value })} placeholder="Online / Office address" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Message to Candidate</label>
                          <textarea className="form-control" value={ivForm.message} onChange={e => setIvForm({ ...ivForm, message: e.target.value })} placeholder="Any special instructions for the candidate..." style={{ minHeight: '100px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn btn-primary"> Schedule &amp; Send Email</button>
                          <button type="button" className="btn btn-outline" onClick={() => setSelectedApp(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Message Modal */}
                {selectedApp?.mode === 'message' && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: '500px', maxWidth: '95vw' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: '700', fontSize: '18px' }}> Send Email</h3>
                        <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1 }}></button>
                      </div>
                      <div style={{ background: 'var(--secondary-light)', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '700' }}>To: {selectedApp.candidate?.name}</p>
                        <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginTop: '2px' }}>{selectedApp.candidate?.email}</p>
                      </div>
                      <form onSubmit={handleSendMessage}>
                        <div className="form-group">
                          <label className="form-label">Subject *</label>
                          <input className="form-control" value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} placeholder="Email subject..." required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Message *</label>
                          <textarea className="form-control" value={msgForm.message} onChange={e => setMsgForm({ ...msgForm, message: e.target.value })} required style={{ minHeight: '140px' }} placeholder="Type your message here..." />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn btn-secondary"> Send Email</button>
                          <button type="button" className="btn btn-outline" onClick={() => setSelectedApp(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Resume Viewer Modal */}
                {selectedApp?.mode === 'resume' && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', width: '92vw', height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
                        <div>
                          <h3 style={{ fontWeight: '700', fontSize: '16px' }}> Resume — {selectedApp.candidate?.name}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{selectedApp.job?.title}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <a href={selectedApp.resume} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"> Download</a>
                          <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--gray-600)', lineHeight: 1 }}></button>
                        </div>
                      </div>
                      <iframe src={selectedApp.resume} style={{ flex: 1, border: 'none', width: '100%' }} title="Resume Viewer" />
                    </div>
                  </div>
                )}

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Job</th>
                        <th>Branch</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Resume</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map(app => (
                        <tr key={app._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={app.candidate?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.candidate?.name || 'U')}&background=1a56db&color=fff&size=32`}
                                alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '14px' }}>{app.candidate?.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{app.candidate?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>{app.job?.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{app.job?.department}</div>
                          </td>
                          <td>{app.job?.branch?.name}<br /><span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{app.job?.branch?.city}</span></td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td>
                            <select
                              className="form-control"
                              style={{ padding: '6px 8px', fontSize: '12px', minWidth: '145px', cursor: 'pointer' }}
                              value={app.status}
                              onChange={e => handleStatus(app._id, e.target.value)}
                            >
                              {statusOptions.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>
                            {app.resume
                              ? <button className="btn btn-outline btn-sm" onClick={() => setSelectedApp({ ...app, mode: 'resume' })}> View</button>
                              : <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>—</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                              <button
                                onClick={() => { setIvForm({ date: '', time: '', location: 'Online', message: '' }); setSelectedApp({ ...app, mode: 'interview' }) }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#e8f0fe', color: '#1a56db', border: '1px solid #1a56db', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                 Interview
                              </button>
                              <button
                                onClick={() => { setMsgForm({ subject: '', message: '' }); setSelectedApp({ ...app, mode: 'message' }) }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#e3f9f0', color: '#0e9f6e', border: '1px solid #0e9f6e', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                 Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interviews */}
            {activeTab === 'interviews' && (
              <div className="card table-container">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>All Interviews ({interviews.length})</h2>
                <table>
                  <thead><tr><th>Candidate</th><th>Job</th><th>Date</th><th>Time</th><th>Location</th></tr></thead>
                  <tbody>
                    {interviews.map(iv => (
                      <tr key={iv._id}>
                        <td>
                          <strong>{iv.candidate?.name}</strong><br />
                          <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{iv.candidate?.email}</span>
                        </td>
                        <td>{iv.job?.title}</td>
                        <td>{new Date(iv.date).toDateString()}</td>
                        <td>{iv.time}</td>
                        <td>{iv.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}