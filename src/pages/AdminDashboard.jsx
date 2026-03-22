import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, UserCog, Database, Settings, BookOpen, Bell, Search, LogOut, ChevronRight, Plus, Trash2, Upload, X, Download, FileSpreadsheet, Check, Eye, Edit } from 'lucide-react'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Students')
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(null)
  const [viewedRecord, setViewedRecord] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [bulkStep, setBulkStep] = useState('upload') // upload, confirm
  const [bulkData, setBulkData] = useState([])
  const [bulkFile, setBulkFile] = useState(null)
  const [selectedBulkIds, setSelectedBulkIds] = useState(new Set())
  const [newRecord, setNewRecord] = useState({ registerNo: '', admissionNo: '', umisNo: '', name: '', fatherName: '', nationalityReligionCaste: '', dob: '', dateOfAdmission: '', course: '', branch: '', mediumOfInstruction: 'English', batchStart: '', batchEnd: '' })
  const [newUser, setNewUser] = useState({ name: '', role: 'Office', username: '', email: '' })
  const [currentPageStudents, setCurrentPageStudents] = useState(1)
  const [currentPageUsers, setCurrentPageUsers] = useState(1)
  const rowsPerPage = 10

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('ace_students') || '[]')
    setStudents(saved)
    const savedUsers = JSON.parse(localStorage.getItem('ace_users') || '[]')
    if (savedUsers.length === 0) {
      const defaults = [
        { id: 'U1', name: 'Principal Dr. S. K.', role: 'Principal', username: 'principal', status: 'Active' },
        { id: 'U2', name: 'Office Registrar', role: 'Office', username: 'office', status: 'Active' },
      ]
      setUsers(defaults)
      localStorage.setItem('ace_users', JSON.stringify(defaults))
    } else {
      setUsers(savedUsers)
    }
  }, [])

  const handleAddSubmit = (e) => {
    e.preventDefault()
    let updated;
    if (isEditing) {
      updated = students.map(s => s.id === newRecord.id ? newRecord : s)
    } else {
      updated = [...students, { ...newRecord, id: 'ST' + Date.now() }]
    }
    setStudents(updated)
    localStorage.setItem('ace_students', JSON.stringify(updated))
    setShowAddModal(false)
    setIsEditing(false)
    setNewRecord({ registerNo: '', admissionNo: '', umisNo: '', name: '', fatherName: '', nationalityReligionCaste: '', dob: '', dateOfAdmission: '', course: '', branch: '', mediumOfInstruction: 'English', batchStart: '', batchEnd: '' })
  }

  const handleEditStudent = (student) => {
    setNewRecord(student)
    setIsEditing(true)
    setShowAddModal(true)
  }

  const deleteStudent = (id) => {
    const updated = students.filter(s => s.id !== id)
    setStudents(updated)
    localStorage.setItem('ace_students', JSON.stringify(updated))
  }

  const handleAddUserSubmit = (e) => {
    e.preventDefault()
    let updated;
    if (isEditing) {
      updated = users.map(u => u.id === newUser.id ? { ...newUser, password: newUser.password || 'password123' } : u)
    } else {
      updated = [...users, { ...newUser, id: 'U' + Date.now(), status: 'Active', password: 'password123' }]
    }
    setUsers(updated)
    localStorage.setItem('ace_users', JSON.stringify(updated))
    setShowUserModal(false)
    setIsEditing(false)
    setNewUser({ name: '', role: 'Office', username: '', email: '' })
  }

  const handleEditUser = (user) => {
    setNewUser(user)
    setIsEditing(true)
    setShowUserModal(true)
  }

  const deleteUser = (id) => {
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    localStorage.setItem('ace_users', JSON.stringify(updated))
  }

  const handleBulkSimulate = () => {
    const dummyImport = [
      { id: 'B1', registerNo: '21CS005', name: 'James Wilson', course: 'B.Tech', branch: 'IT', batchStart: '2021', batchEnd: '2025' },
      { id: 'B2', registerNo: '21CS001', name: 'Duplicate Record', course: 'B.Tech', branch: 'CS', batchStart: '2021', batchEnd: '2025' }, // Duplicate
      { id: 'B3', registerNo: '21CS012', name: 'Sarah Parker', course: 'B.E', branch: 'ECE', batchStart: '2021', batchEnd: '2025' },
    ]
    setBulkData(dummyImport)
    const initialSelected = new Set(dummyImport.map(d => d.id))
    setSelectedBulkIds(initialSelected)
    setBulkStep('confirm')
  }

  const confirmBulkImport = () => {
    const toAdd = bulkData.filter(d => selectedBulkIds.has(d.id) && !students.some(s => s.registerNo === d.registerNo))
    const updated = [...students, ...toAdd.map(d => ({ ...d, id: 'ST' + Math.random().toString(36).substr(2, 9) }))]
    setStudents(updated)
    localStorage.setItem('ace_students', JSON.stringify(updated))
    setShowBulkModal(false)
    setBulkStep('upload')
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand"><BookOpen className="brand-icon" /><span>ACE Admin</span></div>
        <nav className="sidebar-nav">
          {['Dashboard', 'Students', 'Users', 'Records', 'Settings'].map((name) => (
            <button key={name} onClick={() => setActiveTab(name)} className={`nav-item ${activeTab === name ? 'active' : ''}`}>
              {name === 'Dashboard' && <LayoutDashboard size={18} />}
              {name === 'Students' && <Users size={18} />}
              {name === 'Users' && <UserCog size={18} />}
              {name === 'Records' && <Database size={18} />}
              {name === 'Settings' && <Settings size={18} />}
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => window.location.href = '/'}>
            <LogOut size={20} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header-compact">
          <div className="header-breadcrumbs">
            <span className="crumb">Portal</span> <ChevronRight size={14} /> <span className="crumb active">{activeTab}</span>
          </div>
          <div className="header-actions">
            <div className="user-profile-small">
              <div className="profile-img-small">AD</div>
              <div className="profile-info-compact">
                <span className="p-name">System Admin</span>
              </div>
            </div>
          </div>
        </header>

        <section className="view-content">
          {activeTab === 'Students' ? (
            <div className="content-table-view">
              <div className="table-header-complex">
                <div className="table-header-top-row">
                  <h3>Database Records</h3>
                  <div className="table-header-controls">
                    <div className="compact-search-box">
                      <Search size={16} />
                      <input type="text" placeholder={`Search names or numbers...`} />
                    </div>
                    <div className="action-buttons-group">
                      <button className="bulk-btn" onClick={() => setShowBulkModal(true)}><Upload size={16} /> Bulk</button>
                      <button className="add-primary-btn" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Student</button>
                    </div>
                  </div>
                </div>
                
                <div className="table-header-filter-row">
                  <div className="filter-group-flex">
                    <select className="filter-select-small"><option>All Batches</option><option>2021-2025</option><option>2020-2024</option></select>
                    <select className="filter-select-small"><option>All Branches</option><option>B.E</option><option>B.Tech</option><option>M.Tech</option></select>
                    <select className="filter-select-small"><option>All Courses</option><option>CSE</option><option>IT</option><option>ECE</option><option>EEE</option><option>Mechanical</option></select>
                    <select className="filter-select-small"><option>All Genders</option><option>Male</option><option>Female</option></select>
                    
                    <div className="reg-no-range-filter">
                      <span className="range-lbl">Reg No:</span>
                      <input type="text" placeholder="Start" className="range-input" />
                      <span>-</span>
                      <input type="text" placeholder="End" className="range-input" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="dummy-table">
                <div className="row student-header">
                  <span>Reg No</span>
                  <span>Name</span>
                  <span>Course</span>
                  <span>Branch</span>
                  <span>Batch</span>
                  <span>Actions</span>
                </div>
                {students.slice((currentPageStudents - 1) * rowsPerPage, currentPageStudents * rowsPerPage).map((s) => (
                  <div key={s.id} className="row student-row">
                    <span>{s.registerNo}</span>
                    <span className="font-bold">{s.name}</span>
                    <span>{s.course}</span>
                    <span>{s.branch}</span>
                    <span>{s.batchStart} - {s.batchEnd}</span>
                    <div className="table-actions-cell">
                      <button className="action-icon-btn view" onClick={() => { setViewedRecord(s); setShowViewModal('student'); }} title="View"><i className="fa-solid fa-eye" style={{ fontSize: '11px' }}></i></button>
                      <button className="action-icon-btn edit" onClick={() => handleEditStudent(s)} title="Edit"><i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px' }}></i></button>
                      <button className="action-icon-btn delete" onClick={() => deleteStudent(s.id)} title="Delete"><i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i></button>
                    </div>
                  </div>
                ))}
                {students.length === 0 && <p className="empty-msg">No students enrolled yet.</p>}
              </div>
              {students.length > 0 && (
                <div className="table-pagination-footer">
                  <div className="pagination-info">
                    Showing {Math.min(students.length, (currentPageStudents - 1) * rowsPerPage + 1)} to {Math.min(students.length, currentPageStudents * rowsPerPage)} of {students.length} entries
                  </div>
                  <div className="pagination-controls">
                    <button className="pag-btn" disabled={currentPageStudents === 1} onClick={() => setCurrentPageStudents(p => p - 1)}><i className="fa-solid fa-chevron-left"></i></button>
                    {Array.from({ length: Math.ceil(students.length / rowsPerPage) }).map((_, i) => (
                      <button key={i} className={`pag-btn ${currentPageStudents === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPageStudents(i + 1)}>{i + 1}</button>
                    ))}
                    <button className="pag-btn" disabled={currentPageStudents >= Math.ceil(students.length / rowsPerPage)} onClick={() => setCurrentPageStudents(p => p + 1)}><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'Users' ? (
            <div className="content-table-view">
              <div className="table-header-complex">
                <div className="table-header-top-row">
                  <h3>Internal User Accounts</h3>
                  <div className="table-header-controls">
                    <div className="compact-search-box">
                      <Search size={16} />
                      <input type="text" placeholder={`Search by name...`} />
                    </div>
                    <div className="action-buttons-group">
                      <button className="add-primary-btn" onClick={() => setShowUserModal(true)}><Plus size={18} /> Add User</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dummy-table">
                <div className="row user-header">
                  <span>Full Name</span>
                  <span>Username</span>
                  <span>Portal Permission</span>
                  <span>Email Address</span>
                  <span>Actions</span>
                </div>
                {users.slice((currentPageUsers - 1) * rowsPerPage, currentPageUsers * rowsPerPage).map((u) => (
                  <div key={u.id} className="row user-row">
                    <span className="font-bold">{u.name}</span>
                    <span className="user-tag">@{u.username}</span>
                    <div className="role-badge-cell">
                      <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                    </div>
                    <span>{u.email || 'N/A'}</span>
                    <div className="table-actions-cell">
                      <button className="action-icon-btn view" onClick={() => { setViewedRecord(u); setShowViewModal('user'); }} title="View"><i className="fa-solid fa-eye" style={{ fontSize: '11px' }}></i></button>
                      <button className="action-icon-btn edit" onClick={() => handleEditUser(u)} title="Edit"><i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px' }}></i></button>
                      <button className="action-icon-btn delete" onClick={() => deleteUser(u.id)} title="Delete"><i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i></button>
                    </div>
                  </div>
                ))}
              </div>
              {users.length > 0 && (
                <div className="table-pagination-footer">
                  <div className="pagination-info">
                    Showing {Math.min(users.length, (currentPageUsers - 1) * rowsPerPage + 1)} to {Math.min(users.length, currentPageUsers * rowsPerPage)} of {users.length} entries
                  </div>
                  <div className="pagination-controls">
                    <button className="pag-btn" disabled={currentPageUsers === 1} onClick={() => setCurrentPageUsers(p => p - 1)}><i className="fa-solid fa-chevron-left"></i></button>
                    {Array.from({ length: Math.ceil(users.length / rowsPerPage) }).map((_, i) => (
                      <button key={i} className={`pag-btn ${currentPageUsers === i + 1 ? 'active' : ''}`} onClick={() => setCurrentPageUsers(i + 1)}>{i + 1}</button>
                    ))}
                    <button className="pag-btn" disabled={currentPageUsers >= Math.ceil(users.length / rowsPerPage)} onClick={() => setCurrentPageUsers(p => p + 1)}><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="placeholder-view">Select "Students" tab to manage records.</div>
          )}
        </section>
      </main>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-container-fixed">
            <div className="modal-header-fixed">
              <h2>Bulk Record Import</h2>
              <button className="close-action-flex" onClick={() => {setShowBulkModal(false); setBulkStep('upload');}}><X size={16} /><span>Close</span></button>
            </div>
            
            {bulkStep === 'upload' ? (
              <div className="modal-form-wrapper">
                <div className="modal-scroll-area">
                  <div className="bulk-upload-dropzone">
                    <FileSpreadsheet size={48} className="drop-icon" />
                    <h4>{bulkFile ? bulkFile.name : 'Select Excel File'}</h4>
                    <p>{bulkFile ? 'File verified. Click process to continue.' : 'Formats supported: .xlsx, .csv'}</p>
                    
                    <div className="bulk-actions-row">
                      <button className="template-download-btn"><Download size={14} /> Template</button>
                      <button className="file-select-primary" onClick={() => document.getElementById('bulk-file-input').click()}>
                        <Plus size={16} /> Choose File
                      </button>
                      <input id="bulk-file-input" type="file" hidden onChange={(e) => setBulkFile(e.target.files[0])} accept=".xlsx,.csv" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer-static">
                  <button className="confirm-btn-large" disabled={!bulkFile} onClick={handleBulkSimulate}>Process Dataset</button>
                </div>
              </div>
            ) : (
              <div className="modal-form-wrapper">
                <div className="modal-scroll-area">
                  <div className="bulk-preview-info">
                    <Check size={18} />
                    <span>Dataset processed successfully. Review collisions below.</span>
                  </div>
                  <div className="preview-table">
                    <div className="p-row p-header">
                      <input type="checkbox" checked={selectedBulkIds.size === bulkData.length} onChange={() => setSelectedBulkIds(selectedBulkIds.size === bulkData.length ? new Set() : new Set(bulkData.map(d => d.id)))} />
                      <span>Reg No</span>
                      <span>Name</span>
                      <span>Status</span>
                    </div>
                    {bulkData.map((d) => {
                      const isDup = students.some(s => s.registerNo === d.registerNo)
                      return (
                        <div key={d.id} className={`p-row ${isDup ? 'is-duplicate' : ''}`}>
                          <input type="checkbox" checked={selectedBulkIds.has(d.id)} onChange={() => {
                            const next = new Set(selectedBulkIds)
                            next.has(d.id) ? next.delete(d.id) : next.add(d.id)
                            setSelectedBulkIds(next)
                          }} />
                          <span className={isDup ? 'strikethrough' : ''}>{d.registerNo}</span>
                          <span className={isDup ? 'strikethrough' : ''}>{d.name}</span>
                          <span className="status-label">{isDup ? 'Exists (Duplicate)' : 'Ready'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="modal-footer-static">
                  <button className="confirm-btn-large" onClick={confirmBulkImport}>Confirm {selectedBulkIds.size} Records</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {showViewModal && viewedRecord && (
        <div className="modal-overlay">
          <div className="modal-container-fixed" style={{ maxWidth: '450px' }}>
            <div className="modal-header-fixed">
              <h2>Data Profile</h2>
              <button className="close-action-flex" onClick={() => setShowViewModal(null)}><X size={16} /><span>Close</span></button>
            </div>
            <div className="modal-form-wrapper">
              <div className="modal-scroll-area">
                <div className="view-data-grid">
                  {Object.entries(viewedRecord).filter(([k]) => k !== 'id' && k !== 'password').map(([key, val]) => (
                    <div className="view-data-row" key={key}>
                      <span className="v-lbl">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                      <span className="v-val">{val || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container-fixed">
            <div className="modal-header-fixed">
              <h2>{isEditing ? 'Modify Student File' : 'Student Enrollment Form'}</h2>
              <button className="close-action-flex" onClick={() => { setShowAddModal(false); setIsEditing(false); setNewRecord({ registerNo: '', admissionNo: '', umisNo: '', name: '', fatherName: '', nationalityReligionCaste: '', dob: '', dateOfAdmission: '', course: '', branch: '', mediumOfInstruction: 'English', batchStart: '', batchEnd: '' }); }}><span>Close</span><X size={16} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form-wrapper">
              <div className="modal-scroll-area">
                <div className="form-grid-layout">
                  <div className="input-field"><label>Register Number</label><input value={newRecord.registerNo} onChange={e => setNewRecord({...newRecord, registerNo: e.target.value})} placeholder="21CS001" required /></div>
                  <div className="input-field"><label>Admission Number</label><input value={newRecord.admissionNo} onChange={e => setNewRecord({...newRecord, admissionNo: e.target.value})} placeholder="ADM10293" required /></div>
                  <div className="input-field col-span-2"><label>UMIS Number</label><input value={newRecord.umisNo} onChange={e => setNewRecord({...newRecord, umisNo: e.target.value})} placeholder="Unique Management Information System Number" required /></div>
                  <div className="input-field col-span-2"><label>Full Name</label><input value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} placeholder="As per official documents" required /></div>
                  <div className="input-field col-span-2"><label>Father's Name</label><input value={newRecord.fatherName} onChange={e => setNewRecord({...newRecord, fatherName: e.target.value})} placeholder="Legal father's name" required /></div>
                  <div className="input-field col-span-2"><label>Nationality, Religion and Caste</label><input value={newRecord.nationalityReligionCaste} onChange={e => setNewRecord({...newRecord, nationalityReligionCaste: e.target.value})} placeholder="e.g. Indian, Hindu, ABC" required /></div>
                  <div className="input-field"><label>Date of Birth</label><input type="date" value={newRecord.dob} onChange={e => setNewRecord({...newRecord, dob: e.target.value})} required /></div>
                  <div className="input-field"><label>Date of Admission</label><input type="date" value={newRecord.dateOfAdmission} onChange={e => setNewRecord({...newRecord, dateOfAdmission: e.target.value})} required /></div>
                  <div className="input-field"><label>Course</label><input value={newRecord.course} onChange={e => setNewRecord({...newRecord, course: e.target.value})} placeholder="e.g. B.Tech" required /></div>
                  <div className="input-field"><label>Branch</label><input value={newRecord.branch} onChange={e => setNewRecord({...newRecord, branch: e.target.value})} placeholder="e.g. IT" required /></div>
                  <div className="input-field"><label>Medium of Instruction</label><select value={newRecord.mediumOfInstruction} onChange={e => setNewRecord({...newRecord, mediumOfInstruction: e.target.value})}><option>English</option><option>Tamil</option></select></div>
                  <div className="input-field"><label>Batch Range</label><div className="batch-input-row"><input value={newRecord.batchStart} onChange={e => setNewRecord({...newRecord, batchStart: e.target.value})} placeholder="YYYY" /><span>-</span><input value={newRecord.batchEnd} onChange={e => setNewRecord({...newRecord, batchEnd: e.target.value})} placeholder="YYYY" /></div></div>
                </div>
              </div>
              <div className="modal-footer-static">
                <button type="submit" className="confirm-btn-large">{isEditing ? 'Commit Modifications' : 'Enroll Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-container-fixed" style={{ maxWidth: '450px' }}>
            <div className="modal-header-fixed">
              <h2>{isEditing ? 'Update Corporate Account' : 'Add Corporate Account'}</h2>
              <button className="close-action-flex" onClick={() => { setShowUserModal(false); setIsEditing(false); setNewUser({ name: '', role: 'Office', username: '', email: '' }); }}><X size={16} /><span>Close</span></button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="modal-form-wrapper">
              <div className="modal-scroll-area">
                <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="input-field"><label>Full Name</label><input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Dr. Ramesh Babu" required /></div>
                  <div className="input-field"><label>Portal Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="Office">Office Support</option>
                      <option value="Principal">Executive Principal</option>
                    </select>
                  </div>
                  <div className="input-field"><label>Username</label><input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="office_support" required /></div>
                  <div className="input-field"><label>Email Address</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="user@adhiyamaan.in" required /></div>
                </div>
              </div>
              <div className="modal-footer-static">
                <button type="submit" className="confirm-btn-large">{isEditing ? 'Establish Identity Changes' : 'Create Internal Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dashboard-container { display: flex; height: 100vh; width: 100vw; background: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
        .sidebar { width: 260px; min-width: 260px; background: white; color: #1e293b; display: flex; flex-direction: column; padding: 24px 16px; border-right: 1px solid #e2e8f0; }
        .sidebar-brand { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; margin-bottom: 32px; color: #0284c7; padding-left: 8px; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: transparent; border: none; border-radius: 10px; color: #64748b; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; text-align: left; width: 100%; }
        .nav-item:hover { background: #f8fafc; color: #1e293b; }
        .nav-item.active { background: #f0f9ff; color: #0284c7; }
        .logout-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fef2f2; color: #ef4444; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .logout-btn:hover { background: #fee2e2; }
        .main-content { flex: 1; display: flex; flex-direction: column; background: #f8fafc; height: 100vh; overflow-y: auto; overflow-x: hidden; position: relative; }
        .dashboard-header-compact { display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: white; border-bottom: 1px solid #e2e8f0; min-height: 60px; position: sticky; top: 0; z-index: 50; width: 100%; }
        .header-breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; white-space: nowrap; }
        .crumb.active { color: #1e293b; font-weight: 700; }
        .header-actions { display: flex; align-items: center; gap: 24px; min-width: max-content; }
        .user-profile-small { display: flex; align-items: center; gap: 12px; white-space: nowrap; }
        .profile-img-small { width: 36px; height: 36px; min-width: 36px; background: #334155; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
        .profile-info-compact { display: flex; flex-direction: column; text-align: left; }
        .p-name { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.2; }
        .p-role { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .view-content { padding: 32px 40px; width: 100%; max-width: 100%; }
        .content-table-view { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width: 100%; overflow: hidden; }
        .table-header-complex { display: flex; flex-direction: column; background: #fff; border-bottom: 1px solid #e2e8f0; }
        .table-header-top-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-bottom: 1px solid #f1f5f9; min-height: 64px; gap: 20px; }
        .table-header h3 { font-size: 16px; font-weight: 800; color: #1e293b; margin: 0; white-space: nowrap; }
        .table-header-controls { display: flex; align-items: center; gap: 12px; }
        .table-header-filter-row { padding: 8px 24px; background: #fbfcfd; border-bottom: 1px solid #f1f5f9; }
        .filter-group-flex { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .filter-select-small { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; font-weight: 600; color: #475569; outline: none; cursor: pointer; min-width: 110px; transition: 0.2s; }
        .filter-select-small:hover { border-color: #38bdf8; background: #f0f9ff; }
        .reg-no-range-filter { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #64748b; margin-left: auto; }
        .range-input { width: 70px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; outline: none; transition: 0.2s; background: #fff; }
        .range-input:focus { border-color: #38bdf8; background: #f0f9ff; }
        .compact-search-box { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%; min-width: 260px; }
        .compact-search-box input { border: none; background: transparent; outline: none; font-size: 13px; width: 100%; color: #1e293b; }
        .action-buttons-group { display: flex; gap: 8px; }
        .bulk-btn { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e2e8f0; color: #475569; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; }
        .add-primary-btn { display: flex; align-items: center; gap: 6px; background: #38bdf8; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 4px rgba(56, 189, 248, 0.2); }
        .dummy-table { width: 100%; display: flex; flex-direction: column; }
        .row { display: grid; grid-template-columns: 120px 1.5fr 1fr 1fr 140px 86px; padding: 12px 24px; border-bottom: 1px solid #f1f5f9; font-size: 13px; align-items: center; width: 100%; color: #475569; }
        .row.student-header { background: #f8fafc; font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; height: 46px; }
        .row.student-row { transition: 0.15s; }
        .row.student-row:hover { background: #f8fafc; }
        .font-bold { font-weight: 700; color: #1e293b; font-size: 14px; }
        
        .table-actions-cell { display: flex; gap: 4px; justify-content: flex-end; align-items: center; }
        .action-icon-btn {
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          scrollbar-width: thin;
          box-sizing: border-box;
          margin: 0;
          padding: 14px 14px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .action-icon-btn.view { background: #ecfeff; color: #0891b2; border-color: #cffafe; }
        .action-icon-btn.view:hover { background: #cffafe; transform: translateY(-1px); }
        
        .action-icon-btn.edit { background: #eff6ff; color: #2563eb; border-color: #dbeafe; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .action-icon-btn.edit:hover { background: #dbeafe; transform: translateY(-1px); }
        
        .action-icon-btn.delete { background: #fef2f2; color: #dc2626; border-color: #fee2e2; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
        .action-icon-btn.delete:hover { background: #fee2e2; transform: translateY(-1px); }
        
        .action-icon-btn svg { stroke-width: 2.5px; }
        
        .empty-msg { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; width: 100%; }

        /* User Table Specifics */
        .row.user-header, .row.user-row { grid-template-columns: 1.5fr 1.2fr 1.2fr 1.5fr 86px; }
        .user-tag { color: #0284c7; font-weight: 700; font-size: 12px; }
        .role-badge-cell { display: flex; align-items: center; }
        .role-badge { padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
        .role-badge.office { background: #ecfdf5; color: #059669; }
        .role-badge.principal { background: #eef2ff; color: #4338ca; }
        .status-online { color: #22c55e; font-size: 12px; font-weight: 700; white-space: nowrap; }

        /* Modal Specifics */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
        .modal-container-fixed { background: white; width: 100%; max-width: 700px; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; max-height: 85vh; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #e2e8f0; }
        .modal-header-fixed { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
        .modal-header-fixed h2 { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0; }
        .close-action-flex { background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; transition: 0.2s; }
        .modal-form-wrapper { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; width: 100%; }
        .modal-scroll-area { padding: 24px; overflow-y: auto; overflow-x: hidden; flex-grow: 1; width: 100%; }
        .form-grid-layout { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; width: 100%; }
        .input-field { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .input-field.col-span-2 { grid-column: span 2; }
        .input-field label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .input-field input, .input-field select { padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 13px; outline: none; transition: 0.2s; }
        .batch-input-row { display: flex; align-items: center; gap: 8px; }
        .batch-input-row input { flex: 1; text-align: center; }
        .modal-footer-static { padding: 16px 24px; border-top: 1px solid #f1f5f9; background: #fff; flex-shrink: 0; }
        .confirm-btn-large { width: 100%; background: #0f172a; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.2s; }
        .confirm-btn-large:hover { background: #1e293b; transform: translateY(-1px); }
        
        /* Bulk Upload Specifics */
        .bulk-upload-dropzone { border: 2px dashed #e2e8f0; border-radius: 16px; padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; background: #f8fafc; cursor: pointer; transition: 0.2s; }
        .bulk-upload-dropzone:hover { border-color: #38bdf8; background: #f0f9ff; }
        .drop-icon { color: #94a3b8; }
        .bulk-actions-row { display: flex; gap: 12px; margin-top: 12px; }
        .file-select-primary { display: flex; align-items: center; gap: 8px; background: #0f172a; color: white; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
        .confirm-btn-large:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
        .template-download-btn { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #0284c7; cursor: pointer; }
        .bulk-preview-info { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbfcce; border-radius: 10px; padding: 10px 16px; margin-bottom: 20px; color: #166534; font-size: 13px; font-weight: 600; }
        .preview-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .p-row { display: grid; grid-template-columns: 40px 100px 1fr 120px; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; align-items: center; }
        .p-header { background: #f8fafc; font-weight: 800; color: #64748b; font-size: 11px; text-transform: uppercase; }
        .strikethrough { text-decoration: line-through; opacity: 0.5; }
        .is-duplicate { background: #fff1f2; }
        .status-label { font-size: 11px; font-weight: 800; text-transform: uppercase; background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; text-align: center; }
        .is-duplicate .status-label { background: #fee2e2; color: #ef4444; }
        .placeholder-view { padding: 80px; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 24px; }
        .view-data-grid { display: flex; flex-direction: column; gap: 4px; }
        .view-data-row { display: grid; grid-template-columns: 140px 1fr; padding: 10px; border-bottom: 1px dotted #e2e8f0; font-size: 13px; align-items: start; }
        .v-lbl { font-weight: 800; color: #64748b; font-size: 10.5px; opacity: 0.8; }
        .v-val { font-weight: 700; color: #0f172a; word-break: break-all; }

        /* Pagination Refinement */
        .table-pagination-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #fff; border-top: 1px solid #f1f5f9; min-height: 58px; box-sizing: border-box; }
        .pagination-info { font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .pagination-controls { display: flex; align-items: center; gap: 6px; }
        .pag-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 12px; font-weight: 800; }
        .pag-btn:hover:not(:disabled) { border-color: #0284c7; color: #0284c7; background: #f0f9ff; transform: translateY(-1px); }
        .pag-btn.active { background: #0284c7; color: #fff; border-color: #0284c7; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25); }
        .pag-btn:disabled { opacity: 0.3; cursor: not-allowed; background: #f8fafc; }
        .pag-btn i { font-size: 10px; }
      `}} />
    </div>
  )
}

export default AdminDashboard
