import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, ClipboardList, Database, Bell, Search, LogOut, ChevronRight, Plus, Trash2, Upload, X, Download, FileSpreadsheet, Check, Eye, Edit, FileUp } from 'lucide-react'

const OfficeDashboard = () => {
  // Sync core logic with Admin
  const [activeTab, setActiveTab] = useState('Students')
  const [students, setStudents] = useState([])
  const [requests, setRequests] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(null)
  const [viewedRecord, setViewedRecord] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [tcMode, setTcMode] = useState('single') // single, range, batch
  const [tcStep, setTcStep] = useState(1) // 1: Selection, 2: Verify, 3: Generation
  const [showTcDetailsModal, setShowTcDetailsModal] = useState(false)
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [bulkStep, setBulkStep] = useState('upload') // upload, confirm
  const [bulkData, setBulkData] = useState([])
  const [bulkFile, setBulkFile] = useState(null)
  const [selectedBulkIds, setSelectedBulkIds] = useState(new Set())
  const [newRecord, setNewRecord] = useState({ registerNo: '', admissionNo: '', umisNo: '', name: '', fatherName: '', nationalityReligionCaste: '', dob: '', dateOfAdmission: '', course: '', branch: '', mediumOfInstruction: 'English', batchStart: '', batchEnd: '' })
  const [currentPageStudents, setCurrentPageStudents] = useState(1)
  const [currentPageRecords, setCurrentPageRecords] = useState(1)
  const [currentPageTcVerify, setCurrentPageTcVerify] = useState(1)
  const [currentPageTcGenerate, setCurrentPageTcGenerate] = useState(1)
  const [currentPageDashboard, setCurrentPageDashboard] = useState(1)
  const [tcPromotion, setTcPromotion] = useState('yes')
  const [tcCompleted, setTcCompleted] = useState('yes')
  const [tcFeesPaid, setTcFeesPaid] = useState('yes')
  const [tcLeftDate, setTcLeftDate] = useState('')
  const [tcApplyDate, setTcApplyDate] = useState('')
  const [tcConduct, setTcConduct] = useState('Good')
  const [tcScholarship, setTcScholarship] = useState('no')
  const [tcScholarshipScheme, setTcScholarshipScheme] = useState('')
  const rowsPerPage = 10

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem('ace_students') || '[]')
    setStudents(savedStudents)
    const savedRequests = JSON.parse(localStorage.getItem('ace_tc_requests') || '[]')
    setRequests(savedRequests)
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

  const handleDownloadTC = (record) => {
    setViewedRecord(record);
    setShowDocumentPreview(true);
    setTimeout(() => {
      window.print();
    }, 800);
  }

  const handleViewTC = (record) => {
    setViewedRecord(record);
    setShowDocumentPreview(true);
  }

  const deleteStudent = (id) => {
    const updated = students.filter(s => s.id !== id)
    setStudents(updated)
    localStorage.setItem('ace_students', JSON.stringify(updated))
  }

  const handleBulkSimulate = () => {
    const dummyImport = [
      { id: 'B1', registerNo: '21CS005', name: 'James Wilson', course: 'B.Tech', branch: 'IT', batchStart: '2021', batchEnd: '2025' },
      { id: 'B2', registerNo: '21CS001', name: 'Duplicate Record', course: 'B.Tech', branch: 'CS', batchStart: '2021', batchEnd: '2025' },
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

  const resetTcDetails = () => {
    setTcPromotion('yes');
    setTcCompleted('yes');
    setTcFeesPaid('yes');
    setTcLeftDate('');
    setTcApplyDate('');
    setTcConduct('Good');
    setTcScholarship('no');
    setTcScholarshipScheme('');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand"><ClipboardList className="brand-icon" style={{color: '#0284c7'}} /><span style={{color: '#0284c7'}}>ACE Office</span></div>
        <nav className="sidebar-nav">
          {[
            { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { name: 'Generate TC', icon: <FileUp size={18} /> },
            { name: 'Students', icon: <Users size={18} /> },
            { name: 'Records', icon: <Database size={18} /> },
          ].map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`nav-item ${activeTab === item.name ? 'active' : ''}`}>
              {item.icon}<span>{item.name}</span>
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
              <div className="profile-img-small" style={{ background: '#0284c7' }}>OF</div>
              <div className="profile-info-compact">
                <span className="p-name">Office Admin</span>
              </div>
            </div>
          </div>
        </header>

        <section className="view-content">
          {activeTab === 'Dashboard' ? (
            <div className="dashboard-overview">
              <div className="dashboard-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}><Users size={24} /></div>
                  <div className="stat-info"><h3>Total Enrolled</h3><p>4,128</p></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}><ClipboardList size={24} /></div>
                  <div className="stat-info"><h3>Pending Auth</h3><p>24</p></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}><Check size={24} /></div>
                  <div className="stat-info"><h3>Issued TCs</h3><p>412</p></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}><Bell size={24} /></div>
                  <div className="stat-info"><h3>Rejected</h3><p>3</p></div>
                </div>
              </div>

              <div className="content-table-view" style={{ marginTop: '32px' }}>
                <div className="table-header-complex">
                  <div className="table-header-top-row">
                    <div className="table-header">
                      <h3>Recent Certificate Requests</h3>
                    </div>
                    <button className="confirm-btn-large" onClick={() => setActiveTab('Records')} style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }}>View Registry</button>
                  </div>
                </div>
                <div className="dummy-table">
                  <div className="row header-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 120px' }}>
                    <span>Register No</span>
                    <span>Full Name</span>
                    <span>Request Date</span>
                    <span>Branch</span>
                    <span>Status</span>
                  </div>
                  {[
                    { reg: '21EC045', name: 'Arun Kumar', date: 'Today, 09:30', branch: 'ECE', status: 'AWAITING AUTH' },
                    { reg: '21ME092', name: 'Siddharth Menon', date: 'Today, 09:12', branch: 'MECH', status: 'AWAITING AUTH' },
                    { reg: '21IT024', name: 'Sneha Patel', date: 'Yesterday', branch: 'IT', status: 'DISBURSED' }
                  ].slice((currentPageDashboard - 1) * rowsPerPage, currentPageDashboard * rowsPerPage).map((row, idx) => (
                    <div key={idx} className="row student-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 120px' }}>
                      <span>{row.reg}</span>
                      <span className="font-bold">{row.name}</span>
                      <span>{row.date}</span>
                      <span>{row.branch}</span>
                      <div style={{ display: 'flex' }}>
                        <span style={{ 
                          background: row.status === 'DISBURSED' ? '#ecfdf5' : '#fef3c7', 
                          color: row.status === 'DISBURSED' ? '#059669' : '#d97706', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '10px', 
                          fontWeight: '800' 
                        }}>{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="table-pagination-footer">
                  <div className="pagination-info">Showing {Math.min(3, (currentPageDashboard - 1) * rowsPerPage + 1)} to {Math.min(3, currentPageDashboard * rowsPerPage)} of 3 entries</div>
                  <div className="pagination-controls">
                    <button className="pag-btn" disabled><i className="fa-solid fa-chevron-left"></i></button>
                    <button className="pag-btn active">1</button>
                    <button className="pag-btn" disabled><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Generate TC' ? (
            <div className="tc-generation-view">
              <div className="tc-card">
                <div className="tc-stepper-wrapper">
                  {[{id: 1, label: 'SELECTION'}, {id: 2, label: 'VERIFICATION'}, {id: 3, label: 'GENERATION'}].map((step, idx) => (
                    <div key={step.id} style={{ display: 'contents' }}>
                       <div className="stepper-node-group">
                          <div className={`stepper-ring ${tcStep >= step.id ? 'active' : ''}`}>
                             <div className={`stepper-circle ${tcStep >= step.id ? 'active' : ''}`}>{step.id}</div>
                          </div>
                          <span className={`stepper-label ${tcStep >= step.id ? 'active' : ''}`}>{step.label}</span>
                       </div>
                       {idx < 2 && <div className={`stepper-connector ${tcStep > step.id ? 'active' : ''}`}></div>}
                    </div>
                  ))}
                </div>

                {tcStep === 1 && (
                  <div className="step-content">
                    <div className="tc-scope-selector" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '24px' }}>
                       <label style={{ marginBottom: '12px', display: 'block' }}>Selection Mode</label>
                       <div className="radio-card-group">
                         <label className={`radio-card ${tcMode === 'single' ? 'active' : ''}`}>
                           <input type="radio" value="single" checked={tcMode === 'single'} onChange={() => setTcMode('single')} hidden />
                           <span>Single Student</span>
                         </label>
                         <label className={`radio-card ${tcMode === 'range' ? 'active' : ''}`}>
                           <input type="radio" value="range" checked={tcMode === 'range'} onChange={() => setTcMode('range')} hidden />
                           <span>Number Range</span>
                         </label>
                         <label className={`radio-card ${tcMode === 'batch' ? 'active' : ''}`}>
                           <input type="radio" value="batch" checked={tcMode === 'batch'} onChange={() => setTcMode('batch')} hidden />
                           <span>Full Batch</span>
                         </label>
                       </div>
                    </div>

                    <div className="tc-dynamic-inputs">
                      {tcMode === 'single' && (
                         <div className="input-field">
                           <label>Student Register Number</label>
                           <input type="text" placeholder="e.g. 21CS001" className="glass-input-field" />
                         </div>
                      )}

                      {tcMode === 'range' && (
                         <div className="form-grid-layout">
                           <div className="input-field">
                             <label>Start Register Number</label>
                             <input type="text" placeholder="e.g. 21CS001" className="glass-input-field" />
                           </div>
                           <div className="input-field">
                             <label>End Register Number</label>
                             <input type="text" placeholder="e.g. 21CS050" className="glass-input-field" />
                           </div>
                         </div>
                      )}

                      {tcMode === 'batch' && (
                         <div className="form-grid-layout">
                           <div className="input-field">
                             <label>Target Course</label>
                             <select className="glass-input-field"><option>B.E</option><option>B.Tech</option></select>
                           </div>
                           <div className="input-field">
                             <label>Target Branch</label>
                             <select className="glass-input-field"><option>CSE</option><option>ECE</option><option>IT</option><option>MECH</option></select>
                           </div>
                           <div className="input-field col-span-2">
                             <label>Batch Range</label>
                             <div className="batch-input-row">
                               <input placeholder="2021" className="glass-input-field" style={{ textAlign: 'center' }} />
                               <span style={{ fontWeight: '800', color: '#94a3b8' }}>-</span>
                               <input placeholder="2025" className="glass-input-field" style={{ textAlign: 'center' }} />
                             </div>
                           </div>
                         </div>
                      )}
                    </div>

                    <div className="tc-actions" style={{ marginTop: '32px', display: 'flex', justifySelf: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
                       <button className="confirm-btn-large" onClick={() => setTcStep(2)} style={{ width: 'auto', padding: '12px 32px' }}>Next: Verification</button>
                    </div>
                  </div>
                )}

                {tcStep === 2 && (
                  <div className="step-content">
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>Enrich Transfer Certificate Details</h4>
                      <p className="view-subtitle" style={{ fontSize: '13px' }}>Matched 1 record. Provide the specific TC data for this student.</p>
                    </div>
                    
                    <div className="dummy-table" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="row student-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <span>Reg No</span>
                        <span>Name</span>
                        <span>Course</span>
                        <span>Branch</span>
                        <span>Batch</span>
                        <span>Actions</span>
                      </div>
                      {[
                        { reg: '21CS001', name: 'Rahul Sharma', course: 'B.Tech', branch: 'CSE', batch: '2021 - 2025' }
                      ].slice((currentPageTcVerify - 1) * rowsPerPage, currentPageTcVerify * rowsPerPage).map((row, idx) => (
                        <div key={idx} className="row student-row">
                          <span>{row.reg}</span>
                          <span className="font-bold">{row.name}</span>
                          <span>{row.course}</span>
                          <span>{row.branch}</span>
                          <span>{row.batch}</span>
                          <div className="table-actions-cell" style={{ justifyContent: 'flex-start' }}>
                            <button 
                              className="action-icon-btn view" 
                              onClick={() => { 
                                setViewedRecord({
                                  registerNo: row.reg,
                                  admissionNo: 'ADM21894',
                                  name: row.name,
                                  fatherName: 'Suresh Sharma',
                                  nationalityReligionCaste: 'Indian, Hindu',
                                  dob: '2003-05-15',
                                  dateOfAdmission: '2021-08-10',
                                  course: row.course,
                                  branch: row.branch,
                                  batchStart: '2021',
                                  batchEnd: '2025',
                                  eligibilityStatus: 'Valid for TC'
                                }); 
                                setShowViewModal('student'); 
                              }} 
                              title="View Full Identity Profile"
                            >
                              <i className="fa-solid fa-eye" style={{ fontSize: '11px' }}></i>
                            </button>
                            <button 
                              className="action-icon-btn edit" 
                              onClick={() => setShowTcDetailsModal(true)} 
                              title="Add Transfer Certificate Details"
                            >
                              <i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px' }}></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="table-pagination-footer" style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                      <div className="pagination-info">Showing 1 to 1 of 1 entries</div>
                      <div className="pagination-controls">
                        <button className="pag-btn" disabled><i className="fa-solid fa-chevron-left"></i></button>
                        <button className="pag-btn active">1</button>
                        <button className="pag-btn" disabled><i className="fa-solid fa-chevron-right"></i></button>
                      </div>
                    </div>

                    <div className="tc-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                       <button className="template-download-btn" onClick={() => setTcStep(1)} style={{ padding: '12px 24px' }}>Back</button>
                       <button className="confirm-btn-large" onClick={() => setTcStep(3)} style={{ width: 'auto', padding: '12px 32px' }}>Next: Verify & Generate</button>
                    </div>
                  </div>
                )}

                {tcStep === 3 && (
                  <div className="step-content">
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800' }}>Final Verification & Generation</h4>
                      <p className="view-subtitle" style={{ fontSize: '13px' }}>Review finalized entries and generate the official PDF documents.</p>
                    </div>

                    <div className="dummy-table" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="row student-header" style={{ gridTemplateColumns: '120px 1.5fr 1fr 1fr 140px 120px', borderBottom: '1px solid #e2e8f0' }}>
                        <span>Reg No</span>
                        <span>Name</span>
                        <span>Course</span>
                        <span>Branch</span>
                        <span>Batch</span>
                        <span style={{textAlign: 'center'}}>Preview</span>
                      </div>
                      {[
                        { reg: '21CS001', name: 'Rahul Sharma', course: 'B.Tech', branch: 'CSE', batch: '2021 - 2025' }
                      ].slice((currentPageTcGenerate - 1) * rowsPerPage, currentPageTcGenerate * rowsPerPage).map((row, idx) => (
                        <div key={idx} className="row student-row" style={{ gridTemplateColumns: '120px 1.5fr 1fr 1fr 140px 120px' }}>
                          <span>{row.reg}</span>
                          <span className="font-bold">{row.name}</span>
                          <span>{row.course}</span>
                          <span>{row.branch}</span>
                          <span>{row.batch}</span>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button 
                              className="template-download-btn" 
                              onClick={() => handleViewTC({
                                registerNo: row.reg,
                                admissionNo: 'ADM21894',
                                name: row.name,
                                fatherName: 'Suresh Sharma',
                                nationalityReligionCaste: 'Indian, Hindu',
                                dob: '2003-05-15',
                                dateOfAdmission: '2021-08-10',
                                course: row.course,
                                branch: row.branch,
                                batchStart: '2021',
                                batchEnd: '2025',
                                eligibilityStatus: 'Valid for TC'
                              })} 
                              style={{ padding: '6px 12px', margin: '0 auto', fontSize: '11px', display: 'flex', gap: '6px', cursor: 'pointer' }}
                            >
                              <i className="fa-regular fa-file-pdf" style={{ fontSize: '13px' }}></i> View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="table-pagination-footer" style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                      <div className="pagination-info">Showing 1 to 1 of 1 entries</div>
                      <div className="pagination-controls">
                        <button className="pag-btn" disabled><i className="fa-solid fa-chevron-left"></i></button>
                        <button className="pag-btn active">1</button>
                        <button className="pag-btn" disabled><i className="fa-solid fa-chevron-right"></i></button>
                      </div>
                    </div>

                    <div className="tc-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
                       <button className="template-download-btn" onClick={() => setTcStep(2)} style={{ padding: '12px 24px' }}>Back to Details</button>
                       <button className="confirm-btn-large" onClick={() => setTcStep(4)} style={{ width: 'auto', padding: '12px 32px' }}>Request Principal Approval</button>
                    </div>
                  </div>
                )}

                {tcStep === 4 && (
                  <div className="step-content" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ width: '80px', height: '80px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <Check size={40} color="#3b82f6" />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>Approval Requested</h3>
                    <p className="view-subtitle" style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto 32px' }}>TC requests sent to Principal for authorization.</p>
                    <button className="confirm-btn-large" onClick={() => { setTcStep(1); setTcMode('single'); resetTcDetails(); }} style={{ width: 'auto', padding: '12px 32px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>Begin New Workflow</button>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Students' ? (
            <div className="content-table-view">
              <div className="table-header-complex">
                <div className="table-header-top-row">
                  <h3>Database Records</h3>
                  <div className="table-header-controls">
                    <div className="compact-search-box">
                      <Search size={16} />
                      <input type="text" placeholder="Search names or numbers..." />
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
          ) : activeTab === 'Records' ? (
            <div className="content-table-view">
              <div className="table-header-complex">
                <div className="table-header-top-row">
                  <div className="table-header">
                    <h3>Disbursed Certificates</h3>
                  </div>
                  <div className="table-header-controls">
                    <div className="compact-search-box" style={{ minWidth: '320px' }}>
                      <Search size={14} color="#94a3b8" />
                      <input type="text" placeholder="Search dispersed certificates by register number..." />
                    </div>
                  </div>
                </div>
              </div>
              <div className="dummy-table">
                <div className="row header-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 130px' }}>
                  <span>Register No</span>
                  <span>Full Name</span>
                  <span>Issue Date</span>
                  <span>Principal Approval</span>
                  <span>Status</span>
                  <span>Options</span>
                </div>
                {[
                  { reg: '21CS001', name: 'Rahul Sharma', date: '14/05/2026', auth: 'Auth - 14/05 09:30', status: 'DISBURSED' },
                  { reg: '21IT024', name: 'Sneha Patel', date: '12/05/2026', auth: 'Auth - 12/05 14:15', status: 'DISBURSED' }
                ].slice((currentPageRecords - 1) * rowsPerPage, currentPageRecords * rowsPerPage).map((row, idx) => (
                  <div key={idx} className="row student-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 130px' }}>
                    <span>{row.reg}</span>
                    <span className="font-bold">{row.name}</span>
                    <span>{row.date}</span>
                    <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '700' }}>{row.auth}</span>
                    <div>
                      <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{row.status}</span>
                    </div>
                    <div className="table-actions-cell" style={{ justifyContent: 'flex-start' }}>
                      <button className="action-icon-btn view" onClick={() => setShowDocumentPreview(true)} title="View Official Certificate"><i className="fa-solid fa-file-invoice" style={{ fontSize: '12px' }}></i></button>
                      <button className="action-icon-btn download" title="Download Authorized Copy"><i className="fa-solid fa-download" style={{ fontSize: '12px' }}></i></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="table-pagination-footer">
                <div className="pagination-info">Showing 1 to 2 of 2 entries</div>
                <div className="pagination-controls">
                   <button className="pag-btn" disabled><i className="fa-solid fa-chevron-left"></i></button>
                   <button className="pag-btn active">1</button>
                   <button className="pag-btn" disabled><i className="fa-solid fa-chevron-right"></i></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="placeholder-view">Content for {activeTab} section.</div>
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

      {/* TC Specific Details Modal */}
      {showTcDetailsModal && (
        <div className="modal-overlay">
          <div className="modal-container-fixed" style={{ maxWidth: '580px' }}>
            <div className="modal-header-fixed">
              <h2>Transfer Certificate Parameters</h2>
              <button className="close-action-flex" onClick={() => {setShowTcDetailsModal(false); resetTcDetails();}}><X size={16} /><span>Close</span></button>
            </div>
            <div className="modal-form-wrapper">
              <div className="modal-scroll-area">
                 <p className="view-subtitle" style={{marginBottom: '28px'}}>Configure official administrative parameters required for the student's transfer certificate disbursement.</p>
                 <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
                    
                    <div className="input-field col-span-2">
                      <label>1. Whether Qualified for Promotion to a higher class (or) not</label>
                      <div className="radio-card-group">
                        <button type="button" className={`radio-card ${tcPromotion === 'yes' ? 'active' : ''}`} onClick={() => setTcPromotion('yes')}>
                          <div className="radio-dot"></div>
                          <span>Yes</span>
                        </button>
                        <button type="button" className={`radio-card ${tcPromotion === 'no' ? 'active' : ''}`} onClick={() => setTcPromotion('no')}>
                          <div className="radio-dot"></div>
                          <span>No</span>
                        </button>
                      </div>
                    </div>

                    <div className="input-field col-span-2">
                      <label>2. Whether the Course has been completed (or) not</label>
                      <div className="radio-card-group">
                        <button type="button" className={`radio-card ${tcCompleted === 'yes' ? 'active' : ''}`} onClick={() => setTcCompleted('yes')}>
                          <div className="radio-dot"></div>
                          <span>Yes</span>
                        </button>
                        <button type="button" className={`radio-card ${tcCompleted === 'no' ? 'active' : ''}`} onClick={() => setTcCompleted('no')}>
                          <div className="radio-dot"></div>
                          <span>No</span>
                        </button>
                      </div>
                    </div>

                    <div className="input-field col-span-2">
                      <label>3. Whether the student has paid all the fees due to the college</label>
                      <div className="radio-card-group">
                        <button type="button" className={`radio-card ${tcFeesPaid === 'yes' ? 'active' : ''}`} onClick={() => setTcFeesPaid('yes')}>
                          <div className="radio-dot"></div>
                          <span>Yes</span>
                        </button>
                        <button type="button" className={`radio-card ${tcFeesPaid === 'no' ? 'active' : ''}`} onClick={() => setTcFeesPaid('no')}>
                          <div className="radio-dot"></div>
                          <span>No</span>
                        </button>
                      </div>
                    </div>

                    <div className="form-grid-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="input-field">
                        <label>3. Date student LEFT college</label>
                        <input type="date" className="glass-input-field" value={tcLeftDate} onChange={e => setTcLeftDate(e.target.value)} />
                      </div>
                      <div className="input-field">
                        <label>4. Date of TC Application</label>
                        <input type="date" className="glass-input-field" value={tcApplyDate} onChange={e => setTcApplyDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="input-field">
                      <label>5. Character and Conduct</label>
                      <input type="text" className="glass-input-field" placeholder="e.g. Good, Exemplary" value={tcConduct} onChange={e => setTcConduct(e.target.value)} />
                    </div>

                    <div className="input-field">
                      <label>6. Whether the Student received any Scholarship?</label>
                      <div className="radio-card-group" style={{ marginTop: '8px' }}>
                        <label className={`radio-card ${tcScholarship === 'yes' ? 'active' : ''}`} style={{ padding: '10px' }}>
                          <input type="radio" name="scholar" value="yes" checked={tcScholarship === 'yes'} onChange={() => setTcScholarship('yes')} hidden />
                          <span>Yes, Recipient</span>
                        </label>
                        <label className={`radio-card ${tcScholarship === 'no' ? 'active' : ''}`} style={{ padding: '10px' }}>
                          <input type="radio" name="scholar" value="no" checked={tcScholarship === 'no'} onChange={() => setTcScholarship('no')} hidden />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {tcScholarship === 'yes' && (
                      <div className="input-field" style={{ animation: 'fadeIn 0.3s' }}>
                        <label>Name of the Scholarship Scheme</label>
                        <input type="text" className="glass-input-field" placeholder="Enter scholarship program name..." value={tcScholarshipScheme} onChange={e => setTcScholarshipScheme(e.target.value)} />
                      </div>
                    )}
                 </div>
              </div>
              <div className="modal-footer-static">
                 <button className="confirm-btn-large" onClick={() => setShowTcDetailsModal(false)}>Commit Parameters</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document View Preview Modal */}
      {showDocumentPreview && (
        <div className="modal-overlay">
          <div className="modal-container-fixed" style={{ maxWidth: '900px', width: '95%', height: '95vh', maxHeight: '95vh' }}>
            <div className="modal-header-fixed">
              <h2>Official Document Preview</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="close-action-flex" style={{ background: '#0f172a', color: 'white' }} onClick={() => window.print()}><Download size={16} /><span>Save as PDF</span></button>
                <button className="close-action-flex" onClick={() => setShowDocumentPreview(false)}><X size={16} /><span>Close</span></button>
              </div>
            </div>
            <div className="modal-form-wrapper" style={{ background: '#cbd5e1', padding: '0', overflowY: 'auto', display: 'block' }}>
              <div 
                className="certificate-paper-mockup" 
                style={{ 
                  background: 'white', 
                  width: '100%', 
                  maxWidth: '800px',
                  padding: '50px 60px', 
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
                  borderRadius: '2px', 
                  border: '1px solid #94a3b8', 
                  minHeight: '1000px',
                  position: 'relative',
                  color: '#000',
                  margin: '40px auto',
                  boxSizing: 'border-box'
                }}
              >
                 <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0', top: '0', width: '70px', height: '70px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#94a3b8' }}>LOGO</div>
                    <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#b91c1c', margin: '0', letterSpacing: '0.02em' }}>ADHIYAMAAN COLLEGE OF ENGINEERING</h1>
                    <p style={{ fontSize: '13px', fontWeight: '800', margin: '2px 0 4px' }}>(AUTONOMOUS)</p>
                    <p style={{ fontSize: '10px', margin: '0', fontWeight: '600', color: '#334155' }}>Affiliated to Anna University - Chennai & Approved by AICTE - New Delhi</p>
                    <p style={{ fontSize: '10px', margin: '2px 0', fontWeight: '600', color: '#334155' }}>Accredited by NAAC - UGC - New Delhi</p>
                    <p style={{ fontSize: '11px', fontWeight: '700', margin: '4px 0' }}>Dr. M.G.R. Nagar, HOSUR - 635 130, Krishnagiri Dt., Tamil Nadu, India.</p>
                    <p style={{ fontSize: '9px', margin: '2px 0', fontWeight: '600' }}>Ph: 04344-260570, 281001, 002, 003, 020 &nbsp; Fax: 04344-230573</p>
                    <p style={{ fontSize: '9px', margin: '2px 0', fontWeight: '600' }}>E-mail: principal@adhiyamaan.ac.in &nbsp; Website: www.adhiyamaan.ac.in</p>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: '800' }}>
                    <span>S.No: 1245</span>
                    <div style={{ textAlign: 'right' }}>
                      <div>Admission No: ADM21894</div>
                      <div style={{ marginTop: '2px' }}>UMIS No: {viewedRecord?.umisNo || 'UMIS847291'}</div>
                    </div>
                 </div>

                 <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '900', textDecoration: 'underline', margin: '0', letterSpacing: '0.05em' }}>TRANSFER CERTIFICATE</h2>
                 </div>
                 
                 <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000' }}>
                    <tbody>
                      {[
                        { num: '1.', lbl: 'Name of the Student', val: viewedRecord?.name || 'Rahul Sharma' },
                        { num: '2.', lbl: 'Name of the Father / Guardian', val: viewedRecord?.fatherName || 'Suresh Sharma' },
                        { num: '3.', lbl: 'Nationality, Religion and Caste', val: viewedRecord?.nationalityReligionCaste || 'Indian, Hindu' },
                        { num: '4.', lbl: 'Date of Birth in words as entered in the Admission Register', val: 'FIFTEEN MAY TWO THOUSAND THREE' },
                        { num: '5.', lbl: 'Date of Admission', val: viewedRecord?.dateOfAdmission || '10-08-2021' },
                        { num: '6.', lbl: 'Course to which the student was Admitted', val: viewedRecord?.course || 'B.Tech' },
                        { num: '7.', lbl: 'Branch of Study', val: viewedRecord?.branch || 'CSE' },
                        { num: '8.', lbl: 'Whether the Course has been completed (or) not', val: tcCompleted?.toUpperCase() || 'YES' },
                        { num: '9.', lbl: 'Medium of Instruction', val: viewedRecord?.mediumOfInstruction || 'English' },
                        { num: '10.', lbl: 'Whether Qualified for promotion to a higher class (or) not', val: tcPromotion?.toUpperCase() || 'YES' },
                        { num: '11.', lbl: 'Whether the student has paid all the fees due to the college', val: tcFeesPaid === 'yes' ? 'YES' : 'NO' },
                        { num: '12.', lbl: 'Date on which the Student actually left the College', val: tcLeftDate || '14/05/2026' },
                        { num: '13.', lbl: 'Date on which application for Transfer Certificate was made', val: tcApplyDate || '10/05/2026' },
                        { num: '14.', lbl: 'Character and Conduct', val: tcConduct || 'GOOD' },
                        { num: '15.', lbl: 'Scholarship', val: tcScholarship === 'yes' ? `YES (${tcScholarshipScheme || 'Government Scheme'})` : 'NO' }
                      ].map((item, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid #000', padding: '10px 12px', width: '30px', fontSize: '13px', fontWeight: '800' }}>{item.num}</td>
                          <td style={{ border: '1px solid #000', padding: '10px 12px', fontSize: '13px', fontWeight: '800' }}>{item.lbl}</td>
                          <td style={{ border: '1px solid #000', padding: '10px 12px', fontSize: '14px', fontWeight: '900', color: '#1e40af' }}>{item.val}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '100px' }}>
                    <div style={{ textAlign: 'center', width: '150px' }}>
                      <div style={{ fontWeight: '900', fontSize: '13px' }}>Jr. Asst</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '150px' }}>
                      <div style={{ fontWeight: '900', fontSize: '13px' }}>Principal</div>
                    </div>
                 </div>

                 <div style={{ marginTop: '80px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', margin: '0', letterSpacing: '0.01em', fontWeight: '600' }}>
                      Digitally verified and system-generated document. No physical signature or seal required.
                    </p>
                    <p style={{ fontSize: '9px', color: '#94a3b8', margin: '4px 0 0', fontWeight: '800' }}>
                      AUTHENTICATED: {new Date().toLocaleDateString('en-GB')} | {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                 </div>
              </div>
            </div>
            <div className="modal-footer-static">
               <button className="confirm-btn-large" onClick={() => setShowDocumentPreview(false)}>Return to Workflow</button>
            </div>
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
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
        .stat-card { background: white; padding: 24px; border-radius: 16px; display: flex; align-items: center; gap: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: #cbd5e1; }
        .stat-icon-wrap { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-info h3 { font-size: 13px; color: #64748b; font-weight: 700; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-info p { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1; }

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
        
        .action-icon-btn.download { background: #f3e8ff; color: #8b5cf6; border-color: #f3e8ff; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); }
        .action-icon-btn.download:hover { background: #e9d5ff; transform: translateY(-1px); }
        
        .action-icon-btn svg { stroke-width: 2.5px; }
        
        .empty-msg { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; width: 100%; }

        /* Pagination Refinement */
        .table-pagination-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #fff; border-top: 1px solid #f1f5f9; }
        .pagination-info { font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        .pagination-controls { display: flex; align-items: center; gap: 6px; }
        .pag-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 12px; font-weight: 800; }
        .pag-btn:hover:not(:disabled) { border-color: #0284c7; color: #0284c7; background: #f0f9ff; transform: translateY(-1px); }
        .pag-btn.active { background: #0284c7; color: #fff; border-color: #0284c7; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25); }
        .pag-btn:disabled { opacity: 0.3; cursor: not-allowed; background: #f8fafc; }
        .pag-btn i { font-size: 10px; }

        @media print {
            body { background: white !important; }
            .dashboard-container, .modal-header-fixed, .modal-footer-static, .close-action-flex { display: none !important; }
            .modal-overlay { position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; backdrop-filter: none !important; display: block !important; }
            .modal-container-fixed { position: absolute !important; inset: 0 !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; border: none !important; box-shadow: none !important; display: block !important; border-radius: 0 !important; }
            .modal-form-wrapper { padding: 0 !important; background: white !important; display: block !important; overflow: visible !important; }
            .certificate-paper-mockup { margin: 0 auto !important; border: none !important; box-shadow: none !important; width: 210mm !important; min-height: 297mm !important; padding: 15mm !important; padding-top: 20mm !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

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
        /* TC Generation View */
        .tc-generation-view { width: 100%; padding-top: 20px; }
        .tc-card { background: white; padding: 40px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .tc-scope-selector { display: flex; flex-direction: column; }
        .tc-scope-selector label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .glass-input-field { padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fbfcfd; font-size: 14px; outline: none; width: 100%; transition: 0.2s; color: #1e293b; font-weight: 600; }
        .glass-input-field:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        
        .tc-stepper-wrapper { display: flex; align-items: flex-start; justify-content: center; margin: 32px 0 48px; }
        .stepper-node-group { display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; z-index: 2; width: 120px; }
        .stepper-ring { width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .stepper-ring.active { background: rgba(37,99,235,0.15); }
        .stepper-circle { width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; color: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; transition: 0.3s; }
        .stepper-circle.active { background: #2563eb; color: white; }
        .stepper-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; text-align: center; }
        .stepper-label.active { color: #2563eb; }
        .stepper-connector { flex: 1; height: 2px; background: #e2e8f0; margin: 21px -30px 0; z-index: 1; transition: 0.3s; }
        .stepper-connector.active { background: #2563eb; }

        .radio-card-group { display: flex; gap: 12px; }
        .radio-card { flex: 1; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center; cursor: pointer; transition: 0.2s; background: #fff; font-size: 13px; font-weight: 700; color: #475569; display: flex; justify-content: center; align-items: center; }
        .radio-card:hover { border-color: #cbd5e1; background: #f8fafc; }
        .radio-card.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}

export default OfficeDashboard
