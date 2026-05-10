import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import API from '../api/axios.jsx'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([API.get('/admin/users'), API.get('/branches')]).then(([u, b]) => {
      setUsers(u.data); setBranches(b.data); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleRoleChange = async (id, role) => {
    try {
      const { data } = await API.put(`/admin/users/${id}/role`, { role })
      setUsers(u => u.map(x => x._id === id ? data : x))
      toast.success('Role updated')
    } catch { toast.error('Error') }
  }

  const handleAddBranch = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post('/branches', branchForm)
      setBranches(b => [...b, data])
      setBranchForm({ name: '', city: '', address: '' })
      toast.success('Branch added!')
    } catch { toast.error('Error adding branch') }
  }

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch?')) return
    await API.delete(`/branches/${id}`)
    setBranches(b => b.filter(x => x._id !== id))
    toast.success('Branch deleted')
  }

  return (
    <div style={{ padding: '32px 0' }}>
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">System administration</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}> Users</button>
          <button onClick={() => setActiveTab('branches')} className={`btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-outline'}`}> Branches</button>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <>
            {/* Users */}
            {activeTab === 'users' && (
              <div className="card table-container">
                <h2 style={{ fontWeight: '700', marginBottom: '20px' }}>All Users ({users.length})</h2>
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Change Role</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'hr' ? 'badge-blue' : 'badge-green'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <select className="form-control"
                            style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }}
                            value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                            {['candidate', 'hr', 'admin'].map(r => <option key={r}>{r}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Branches */}
            {activeTab === 'branches' && (
              <div>
                <div className="card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>Add New Branch</h3>
                  <form onSubmit={handleAddBranch}>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Branch Name *</label>
                        <input className="form-control" value={branchForm.name}
                          onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                          placeholder="Islamabad HQ" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City *</label>
                        <input className="form-control" value={branchForm.city}
                          onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
                          placeholder="Islamabad" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Address</label>
                        <input className="form-control" value={branchForm.address}
                          onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                          placeholder="Blue Area, F-6" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Add Branch</button>
                  </form>
                </div>

                <div className="card">
                  <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>All Branches ({branches.length})</h3>
                  <div className="grid-2">
                    {branches.map(b => (
                      <div key={b._id} style={{
                        padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--radius)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{b.name}</strong>
                          <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{b.city} — {b.address}</p>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBranch(b._id)}>Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}