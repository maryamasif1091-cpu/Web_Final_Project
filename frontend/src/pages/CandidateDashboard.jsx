import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import API from '../api/axios.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './CandidateDashboard.css'

export default function CandidateDashboard() {
  const { user, login } = useAuth()
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')
  const [editMode, setEditMode] = useState(false)
  const [profile, setProfile] = useState({ name: '', phone: '', address: '', experience: '', education: '', skills: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [picFile, setPicFile] = useState(null)
  const [uploading, setUploading] = useState({ resume: false, cover: false, pic: false })
  const [selectedNotif, setSelectedNotif] = useState(null)

  useEffect(() => {
    setProfile({ ...user, skills: user?.skills?.join(', ') || '' })
    Promise.all([
      API.get('/applications/my'),
      API.get('/interviews/my'),
      API.get('/applications/notifications/my'),
    ]).then(([a, i, n]) => {
      setApplications(a.data)
      setInterviews(i.data)
      setNotifications(n.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkRead = async (id) => {
    await API.put(`/applications/notifications/${id}/read`).catch(() => {})
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllRead = async () => {
    await API.put('/applications/notifications/read-all').catch(() => {})
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  const openNotif = (notif) => {
    setSelectedNotif(notif)
    if (!notif.isRead) handleMarkRead(notif._id)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.put('/auth/profile', {
        ...profile,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean)
      })
      login({ ...user, ...data })
      toast.success('Profile updated!')
      setEditMode(false)
    } catch { toast.error('Update failed') }
  }

  const handleUpload = async (type) => {
    const fileMap = { resume: resumeFile, cover: coverFile, pic: picFile }
    const file = fileMap[type]
    if (!file) return toast.error('Please select a file first')
    const endpointMap = { resume: '/auth/upload/resume', cover: '/auth/upload/coverletter', pic: '/auth/upload/picture' }
    const fieldMap = { resume: 'resume', cover: 'coverLetter', pic: 'profilePicture' }
    const fd = new FormData()
    fd.append(fieldMap[type], file)
    setUploading(u => ({ ...u, [type]: true }))
    try {
      const { data } = await API.post(endpointMap[type], fd)
      const updateMap = {
        resume: { resume: data.resume || data.url },
        cover: { coverLetter: data.coverLetter || data.url },
        pic: { profilePicture: data.profilePicture || data.url }
      }
      login({ ...user, ...updateMap[type] })
      const labels = { resume: 'Resume', cover: 'Cover Letter', pic: 'Profile Picture' }
      toast.success(labels[type] + ' uploaded to Cloudinary!')
      if (type === 'resume') setResumeFile(null)
      if (type === 'cover') setCoverFile(null)
      if (type === 'pic') setPicFile(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Check Cloudinary credentials.')
    }
    setUploading(u => ({ ...u, [type]: false }))
  }

  const statusClass = {
    'Submitted': 'status-Submitted',
    'Under Review': 'status-Under-Review',
    'Shortlisted': 'status-Shortlisted',
    'Interview Scheduled': 'status-Interview-Scheduled',
    'Rejected': 'status-Rejected',
    'Selected': 'status-Selected'
  }

  const notifTypeLabel = {
    application_received: 'Applied',
    status_update: 'Status Update',
    interview_scheduled: 'Interview',
    custom_message: 'Message'
  }

  const tabs = [
    { id: 'applications', label: 'My Applications' },
    { id: 'notifications', label: 'Inbox', badge: unreadCount },
    { id: 'interviews', label: 'Interviews' },
    { id: 'profile', label: 'Profile' },
  ]

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container">
        <div className="dashboard-layout">

          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <div className="card sidebar-profile">
              <div className="profile-pic-wrapper">
                <img
                  src={user?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'U') + '&background=1a56db&color=fff&size=100'}
                  alt="avatar"
                  className="profile-pic"
                />
              </div>
              <h3 style={{ fontWeight: '700', marginTop: '8px' }}>{user?.name}</h3>
              <p style={{ color: 'var(--gray-400)', fontSize: '13px' }}>{user?.email}</p>
              <span className="badge badge-blue" style={{ marginTop: '8px' }}>Candidate</span>
            </div>

            <div className="card" style={{ padding: '12px' }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={'sidebar-tab' + (activeTab === t.id ? ' active' : '')}
                >
                  <span>{t.label}</span>
                  {t.badge > 0 && <span className="notif-badge">{t.badge}</span>}
                </button>
              ))}
              <Link to="/jobs" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                Browse Jobs
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="dashboard-main">

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="card">
                <h2 className="tab-title">My Applications ({applications.length})</h2>
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : applications.length === 0 ? (
                  <div className="empty">
                    <h3>No applications yet</h3>
                    <p>Find your dream job and apply today!</p>
                    <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Jobs</Link>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Job</th>
                          <th>Branch</th>
                          <th>Applied On</th>
                          <th>Status</th>
                          <th>Resume</th>
                          <th>Cover Letter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app._id}>
                            <td>
                              <strong>{app.job?.title}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                                {app.job?.department} - {app.job?.type}
                              </div>
                            </td>
                            <td>
                              {app.job?.branch?.name}
                              <br />
                              <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{app.job?.branch?.city}</span>
                            </td>
                            <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <span className={'status-badge ' + statusClass[app.status]}>{app.status}</span>
                            </td>
                            <td>
                              {app.resume
                                ? <a href={app.resume} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
                                : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                            </td>
                            <td>
                              {app.coverLetter
                                ? <a href={app.coverLetter} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
                                : <span style={{ color: 'var(--gray-400)' }}>-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Inbox Tab */}
            {activeTab === 'notifications' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 className="tab-title" style={{ marginBottom: 0 }}>
                    Inbox
                    {unreadCount > 0 && (
                      <span className="notif-badge" style={{ marginLeft: '10px', fontSize: '13px', padding: '2px 10px' }}>
                        {unreadCount} new
                      </span>
                    )}
                  </h2>
                  {unreadCount > 0 && (
                    <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>Mark all read</button>
                  )}
                </div>

                {/* Notification Detail Modal */}
                {selectedNotif && (
                  <div className="modal-overlay" onClick={() => setSelectedNotif(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                      <div className="modal-header">
                        <div style={{ flex: 1 }}>
                          <span className="notif-type-pill">
                            {notifTypeLabel[selectedNotif.type] || 'Message'}
                          </span>
                          <h3 style={{ fontWeight: '700', fontSize: '17px', marginTop: '10px' }}>
                            {selectedNotif.subject}
                          </h3>
                          {selectedNotif.relatedJob && (
                            <p style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
                              Job: {selectedNotif.relatedJob}
                            </p>
                          )}
                          <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>
                            {new Date(selectedNotif.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button onClick={() => setSelectedNotif(null)} className="modal-close">X</button>
                      </div>
                      <div className="notif-body" dangerouslySetInnerHTML={{ __html: selectedNotif.message }} />
                      <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
                        From: <strong>TalentFlow HR Team</strong>
                      </p>
                    </div>
                  </div>
                )}

                {notifications.length === 0 ? (
                  <div className="empty">
                    <h3>Inbox is empty</h3>
                    <p>HR notifications will appear here when you apply for jobs</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map(notif => (
                      <div
                        key={notif._id}
                        onClick={() => openNotif(notif)}
                        className={'notif-item' + (!notif.isRead ? ' unread' : '')}
                      >
                        <div className="notif-type-pill">{notifTypeLabel[notif.type] || 'Message'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <p style={{ fontWeight: notif.isRead ? '500' : '700', fontSize: '14px', color: 'var(--gray-800)' }}>
                              {notif.subject}
                            </p>
                            {!notif.isRead && <span className="notif-badge" style={{ flexShrink: 0 }}>NEW</span>}
                          </div>
                          {notif.relatedJob && (
                            <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                              {notif.relatedJob}
                            </p>
                          )}
                          <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '3px' }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interviews Tab */}
            {activeTab === 'interviews' && (
              <div className="card">
                <h2 className="tab-title">Scheduled Interviews ({interviews.length})</h2>
                {interviews.length === 0 ? (
                  <div className="empty">
                    <h3>No interviews yet</h3>
                    <p>Keep applying — interviews will show here</p>
                  </div>
                ) : interviews.map(iv => (
                  <div key={iv._id} className="interview-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ fontWeight: '700', fontSize: '16px' }}>{iv.job?.title}</h4>
                      <span className="badge badge-blue">{iv.job?.department}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '12px' }}>
                      <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                        <strong>Date:</strong> {new Date(iv.date).toDateString()}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                        <strong>Time:</strong> {iv.time}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                        <strong>Location:</strong> {iv.location}
                      </div>
                    </div>
                    {iv.message && (
                      <div style={{ marginTop: '12px', padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--primary)' }}>
                        Note: {iv.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 className="tab-title" style={{ marginBottom: 0 }}>My Profile</h2>
                  <button className="btn btn-outline" onClick={() => setEditMode(!editMode)}>
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div className="grid-2">
                    {[
                      { label: 'Full Name', key: 'name', placeholder: 'John Doe' },
                      { label: 'Phone', key: 'phone', placeholder: '+92 300 0000000' },
                      { label: 'Address', key: 'address', placeholder: 'City, Pakistan' },
                      { label: 'Experience', key: 'experience', placeholder: '3 years' },
                    ].map(f => (
                      <div className="form-group" key={f.key}>
                        <label className="form-label">{f.label}</label>
                        <input
                          className="form-control"
                          value={profile[f.key] || ''}
                          placeholder={f.placeholder}
                          onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                    ))}
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Education</label>
                      <input className="form-control" value={profile.education || ''} disabled={!editMode}
                        placeholder="BS Computer Science" onChange={e => setProfile({ ...profile, education: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Skills (comma separated)</label>
                      <input className="form-control" value={profile.skills || ''} disabled={!editMode}
                        placeholder="React.js, Node.js, MongoDB" onChange={e => setProfile({ ...profile, skills: e.target.value })} />
                    </div>
                  </div>
                  {editMode && <button type="submit" className="btn btn-primary">Save Changes</button>}
                </form>

                {/* Cloudinary Uploads */}
                <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--gray-200)' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '20px' }}>
                    Documents (Stored on Cloudinary)
                  </h3>
                  <div className="grid-2" style={{ gap: '20px' }}>

                    {/* Resume */}
                    <div className="upload-box">
                      <div className="upload-icon-label">PDF</div>
                      <h4>Resume</h4>
                      <p>PDF format only</p>
                      <input type="file" accept=".pdf" id="resume-input" style={{ display: 'none' }}
                        onChange={e => setResumeFile(e.target.files[0])} />
                      <label htmlFor="resume-input" className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                        Choose PDF
                      </label>
                      {resumeFile && (
                        <p style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '6px' }}>
                          Selected: {resumeFile.name}
                        </p>
                      )}
                      <button className="btn btn-primary btn-sm"
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                        onClick={() => handleUpload('resume')} disabled={uploading.resume || !resumeFile}>
                        {uploading.resume ? 'Uploading...' : 'Upload to Cloudinary'}
                      </button>
                      {user?.resume && (
                        <a href={user.resume} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"
                          style={{ marginTop: '8px', width: '100%', justifyContent: 'center', display: 'flex' }}>
                          View Current Resume
                        </a>
                      )}
                    </div>

                    {/* Cover Letter */}
                    <div className="upload-box">
                      <div className="upload-icon-label">DOC</div>
                      <h4>Cover Letter</h4>
                      <p>PDF or DOCX format</p>
                      <input type="file" accept=".pdf,.docx" id="cover-input" style={{ display: 'none' }}
                        onChange={e => setCoverFile(e.target.files[0])} />
                      <label htmlFor="cover-input" className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                        Choose File
                      </label>
                      {coverFile && (
                        <p style={{ fontSize: '12px', color: 'var(--secondary)', marginTop: '6px' }}>
                          Selected: {coverFile.name}
                        </p>
                      )}
                      <button className="btn btn-primary btn-sm"
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                        onClick={() => handleUpload('cover')} disabled={uploading.cover || !coverFile}>
                        {uploading.cover ? 'Uploading...' : 'Upload to Cloudinary'}
                      </button>
                      {user?.coverLetter && (
                        <a href={user.coverLetter} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"
                          style={{ marginTop: '8px', width: '100%', justifyContent: 'center', display: 'flex' }}>
                          View Current Cover Letter
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div className="upload-box" style={{ marginTop: '20px' }}>
                    <h4>Profile Picture</h4>
                    <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '10px' }}>JPG, PNG, WEBP - Max 10MB</p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="file" accept="image/*" id="pic-input-main" style={{ display: 'none' }}
                        onChange={e => setPicFile(e.target.files[0])} />
                      <label htmlFor="pic-input-main" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                        Choose Image
                      </label>
                      {picFile && (
                        <span style={{ fontSize: '13px', color: 'var(--secondary)' }}>Selected: {picFile.name}</span>
                      )}
                      <button className="btn btn-primary" onClick={() => handleUpload('pic')} disabled={uploading.pic || !picFile}>
                        {uploading.pic ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    </div>
                    {user?.profilePicture && (
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={user.profilePicture} alt="profile"
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>Current profile photo</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}