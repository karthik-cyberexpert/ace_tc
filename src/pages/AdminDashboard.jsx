import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Users, UserCog, Database, Settings, LogOut, ChevronRight, Plus, Trash2, Upload, X, Search, FileText, Download, CheckCircle2, AlertCircle, Eye, Edit, Filter, RotateCcw, ShieldCheck } from 'lucide-react'
import { API_BASE_URL } from '../config'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [users, setUsers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showUserViewModal, setShowUserViewModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [recordSearch, setRecordSearch] = useState('')
  const [uploadSearch, setUploadSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [recordPage, setRecordPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [recentPage, setRecentPage] = useState(1)
  const rowsPerPage = 10
  const [showFilters, setShowFilters] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState({ course: '', branch: '', batch: '', status: '' })
  const [uploadFilter, setUploadFilter] = useState('All') // All, Ready, Error
  const [recordBulkIds, setRecordBulkIds] = useState(new Set())
  const [downloadProgress, setDownloadProgress] = useState({ active: false, current: 0, total: 0 })
  const [pdfData, setPdfData] = useState(null)
  const [newRecord, setNewRecord] = useState({ 
    registerNo: '', admissionNo: '', umisNo: '', name: '', 
    fatherName: '', nationality: 'Indian', religion: '', caste: '',
    dob: '', dateOfAdmission: '', course: '', branch: '', 
    mediumOfInstruction: 'English', batchStart: '', batchEnd: '' 
  })
  const [newUser, setNewUser] = useState({ name: '', role: 'Office', username: '', email: '' })

  useEffect(() => {
    fetchStudents();
    fetchRecords();
    fetchUsers();
  }, [])

  useEffect(() => {
    if (activeTab === 'Records' && records.length > 0) {
      const issued = records.filter(r => r.status === 'ISSUED').map(r => r.id);
      setRecordBulkIds(new Set(issued));
    }
  }, [activeTab, records]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }

  const fetchRecords = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/certificates');
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  }

  useEffect(() => { setStudentPage(1); }, [studentSearch])
  useEffect(() => { setRecordPage(1); }, [recordSearch])
  useEffect(() => { setUserPage(1); }, [uploadSearch])

  const Pagination = ({ totalItems, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="pagination" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
        {renderPageNumbers().map((p, i) => (
          <button 
            key={i} 
            className={`page-btn ${p === currentPage ? 'active' : ''}`}
            disabled={p === '...'}
            style={{ 
              width: '42px', height: '42px', borderRadius: '12px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: p === currentPage ? '#2563eb' : '#f8fafc',
              color: p === currentPage ? 'white' : '#64748b',
              border: p === '...' ? 'none' : '1px solid #e2e8f0',
              fontWeight: '700', cursor: p === '...' ? 'default' : 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: p === currentPage ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none'
            }}
            onClick={() => p !== '...' && onPageChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    );
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('SECURITY ALERT: Are you sure you want to reset this staff member\'s credentials to the institutional default (password123)?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}/reset`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert('Credentials restored to default (password123). Onboarding check cleared.');
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  }

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = isEditingUser 
      ? `${API_BASE_URL}/api/users/${newUser.id}` 
      : API_BASE_URL + '/api/users';
    const method = isEditingUser ? 'PUT' : 'POST';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await response.json();
      if (data.success) {
        setShowUserModal(false);
        setIsEditingUser(false);
        setNewUser({ name: '', email: '', role: 'Office', username: '' });
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to save user:', err);
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `${API_BASE_URL}/api/students/${newRecord.id}`
        : API_BASE_URL + '/api/students';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      const data = await response.json();
      if (data.success) {
        fetchStudents();
        setShowAddModal(false);
        setNewRecord({ 
          registerNo: '', admissionNo: '', umisNo: '', name: '', 
          fatherName: '', nationality: 'Indian', religion: '', caste: '',
          dob: '', dateOfAdmission: '', course: '', branch: '', 
          mediumOfInstruction: 'English', batchStart: '', batchEnd: '' 
        });
      }
    } catch (err) {
      console.error('Failed to save student:', err);
    }
  }

  const downloadTemplate = () => {
    const data = [{
      registerNo: '21CS101', name: 'John Doe', fatherName: 'Father Name', 
      nationality: 'Indian', religion: 'Hindu', caste: 'General',
      admissionNo: 'A123', umisNo: 'U456', dob: '2003-01-01', 
      dateOfAdmission: '2021-08-15', course: 'B.Tech', branch: 'Computer Science', 
      mediumOfInstruction: 'English', batchStart: '2021', batchEnd: '2025'
    }];
    const ws = XLSX.utils.json_to_sheet(data, { 
      header: [
        "registerNo", "name", "fatherName", "nationality", "religion", "caste",
        "admissionNo", "umisNo", "dob", "dateOfAdmission", "course", "branch",
        "mediumOfInstruction", "batchStart", "batchEnd"
      ] 
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "ACE_Student_Template.xlsx");
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = new Uint8Array(f.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      const validated = json.map(row => {
        const errors = [];
        if (!row.registerNo) errors.push('Missing Reg No');
        if (!row.name) errors.push('Missing Name');
        if (!row.course) errors.push('Missing Course');
        if (!row.branch) errors.push('Missing Branch');
        if (!row.batchStart || !row.batchEnd) errors.push('Missing Batch Years');
        return { ...row, errors };
      });

      setUploadData(validated);
      setShowUploadModal(true);
    };
    reader.readAsArrayBuffer(file);
  }

  const handleBulkSubmit = async () => {
    const validData = uploadData.filter(r => r.errors.length === 0);
    if (validData.length === 0) return alert('No valid records to upload');
    try {
      const response = await fetch(API_BASE_URL + '/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData)
      });
      const data = await response.json();
      if (data.success) {
        fetchStudents();
        setShowUploadModal(false);
        setUploadData([]);
        alert(`Successfully imported ${data.count} students`);
      }
    } catch (err) {
      console.error('Failed to bulk upload:', err);
    }
  }

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('CRITICAL: Are you sure you want to permanently delete this institutional student record? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  }

  const dateToWords = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const d = date.getDate();
      const m = months[date.getMonth()];
      const y = date.getFullYear();
      
      const numToWords = (n) => {
        const singles = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const singlesCaps = singles.map(s => s.toUpperCase());
        const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
        if (n < 20) return singlesCaps[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + singlesCaps[n % 10] : "");
      };

      const yearToWords = (yr) => {
        const rem = yr % 100;
        const thousand = Math.floor(yr / 1000);
        const hundred = Math.floor((yr % 1000) / 100);
        let s = numToWords(thousand) + " THOUSAND";
        if (hundred > 0) s += " " + numToWords(hundred) + " HUNDRED";
        if (rem > 0) s += " AND " + numToWords(rem);
        return s;
      };

      return `${numToWords(d)} ${m.toUpperCase()} ${yearToWords(y)}`;
    } catch { return dateStr; }
  };

  const handleDownloadPDF = async (record) => {
    setPdfData(record);
    setTimeout(async () => {
      const element = document.getElementById('invisible-tc');
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`${record.auth_code || record.id}.pdf`);
      setPdfData(null);
    }, 100);
  }

  const handleDownloadZip = async () => {
    const selected = records.filter(r => recordBulkIds.has(r.id));
    if (selected.length === 0) return alert('No records selected for download');
    
    setDownloadProgress({ active: true, current: 0, total: selected.length });
    const zip = new JSZip();
    
    for (let i = 0; i < selected.length; i++) {
      const record = selected[i];
      setDownloadProgress(prev => ({ ...prev, current: i + 1 }));
      setPdfData(record);
      
      await new Promise(r => setTimeout(r, 150));
      const element = document.getElementById('invisible-tc');
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      const pdfBlob = pdf.output('blob');
      zip.file(`${record.auth_code || record.id}.pdf`, pdfBlob);
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE_Admin_Records_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    
    setPdfData(null);
    setDownloadProgress({ active: false, current: 0, total: 0 });
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('CRITICAL: Are you sure you want to permanently revoke authorization for this staff member? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} className="text-primary" />
          <span>ACE Admin</span>
        </div>
        
        <nav className="nav">
          <button onClick={() => setActiveTab('Overview')} className={`nav-link ${activeTab === 'Overview' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>
          <button onClick={() => setActiveTab('Students')} className={`nav-link ${activeTab === 'Students' ? 'active' : ''}`}>
            <Users size={18} />
            <span>Students</span>
          </button>
          <button onClick={() => setActiveTab('Records')} className={`nav-link ${activeTab === 'Records' ? 'active' : ''}`}>
            <Database size={18} />
            <span>Records</span>
          </button>
          <button onClick={() => setActiveTab('Users')} className={`nav-link ${activeTab === 'Users' ? 'active' : ''}`}>
            <UserCog size={18} />
            <span>Staff Users</span>
          </button>
          <button onClick={() => setActiveTab('Settings')} className={`nav-link ${activeTab === 'Settings' ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => window.location.href = '/'}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="content">
        <header className="content-header">
          <div className="breadcrumb">
            <span className="text-muted">Portal</span>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium">{activeTab}</span>
          </div>
          <div className="header-user">
            <div className="avatar">AD</div>
            <span className="font-medium">System Administrator</span>
          </div>
        </header>

        <div className="scroll-area">
          {activeTab === 'Overview' && (
            <div className="overview-grid">
              <div className="stat-card card">
                <div className="stat-icon"><Users className="text-primary" /></div>
                <div className="stat-info">
                  <span className="text-muted font-small">Total Students</span>
                  <h2 className="stat-value">{students.length}</h2>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-icon"><UserCog className="text-primary" /></div>
                <div className="stat-info">
                  <span className="text-muted font-small">System Users</span>
                  <h2 className="stat-value">{users.length}</h2>
                </div>
              </div>
              <div className="stat-card card">
                <div className="stat-icon"><FileText className="text-primary" /></div>
                <div className="stat-info">
                  <span className="text-muted font-small">Pending Reports</span>
                  <h2 className="stat-value">0</h2>
                </div>
              </div>
              
              <div className="recent-activity card" style={{ gridColumn: 'span 3' }}>
                <h3 className="mb-4">System Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="dot"></div>
                    <div className="activity-body">
                      <p className="font-medium">Admin Database Initialized</p>
                      <span className="text-muted font-small">System established successfully</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="data-view card">
              <div className="view-header mb-4">
                <h2>Student Records</h2>
                <div className="header-actions">
                  <div className="search-input">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search students..." 
                      value={studentSearch} 
                      onChange={e => setStudentSearch(e.target.value)} 
                    />
                  </div>
                  <button 
                    className={`btn ${showFilters ? 'btn-primary' : ''}`} 
                    style={{ border: showFilters ? 'none' : '1px solid #e2e8f0', background: showFilters ? '#2563eb' : 'white', color: showFilters ? 'white' : '#64748b' }}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={16} />
                    <span>Filter</span>
                  </button>
                  <button className="btn" style={{ border: '1px solid #e2e8f0' }} onClick={downloadTemplate}>
                    <Download size={16} />
                    <span>Template</span>
                  </button>
                  <label className="btn" style={{ border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>Bulk Upload</span>
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileSelect} />
                  </label>
                  <button className="btn btn-primary" onClick={() => { setIsEditing(false); setShowAddModal(true); }}>
                    <Plus size={16} />
                    <span>New Student</span>
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="filter-row mb-6 mt-4" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group mb-0">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Course</label>
                    <select className="input" style={{ height: '44px', borderRadius: '10px' }} value={filterCriteria.course} onChange={e => setFilterCriteria({...filterCriteria, course: e.target.value})}>
                      <option value="">All Courses</option>
                      {[...new Set(students.map(s => s.course))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Branch</label>
                    <select className="input" style={{ height: '44px', borderRadius: '10px' }} value={filterCriteria.branch} onChange={e => setFilterCriteria({...filterCriteria, branch: e.target.value})}>
                      <option value="">All Branches</option>
                      {[...new Set(students.map(s => s.branch))].filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Batch Period</label>
                    <select className="input" style={{ height: '44px', borderRadius: '10px' }} value={filterCriteria.batch} onChange={e => setFilterCriteria({...filterCriteria, batch: e.target.value})}>
                      <option value="">All Batches</option>
                      {[...new Set(students.map(s => `${s.batchStart}-${s.batchEnd}`))].filter(b => b !== '-').map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <button className="btn hover-bg-slate" style={{ background: '#f1f5f9', color: '#475569', height: '44px', borderRadius: '10px' }} onClick={() => setFilterCriteria({ course: '', branch: '', batch: '' })}>
                    <RotateCcw size={16} />
                    <span>Reset Filter</span>
                  </button>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Course & Branch</th>
                    <th>Batch</th>
                    <th className="text-center" style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter(s => {
                      const matchesSearch = (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(studentSearch.toLowerCase());
                      const matchesCourse = !filterCriteria.course || s.course === filterCriteria.course;
                      const matchesBranch = !filterCriteria.branch || s.branch === filterCriteria.branch;
                      const matchesBatch = !filterCriteria.batch || `${s.batchStart}-${s.batchEnd}` === filterCriteria.batch;
                      return matchesSearch && matchesCourse && matchesBranch && matchesBatch;
                    })
                    .slice((studentPage - 1) * rowsPerPage, studentPage * rowsPerPage)
                    .map(s => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.registerNo}</td>
                      <td className="font-medium">{s.name}</td>
                      <td>{s.course} - {s.branch}</td>
                      <td>{s.batchStart}-{s.batchEnd}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn hover-bg-blue" 
                            style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setSelectedStudent(s); setShowViewModal(true); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="icon-btn hover-bg-amber" 
                            style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setNewRecord(s); setIsEditing(true); setShowAddModal(true); }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="icon-btn hover-bg-red" 
                            style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDeleteStudent(s.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.filter(s => (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-row">No student records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={students.filter(s => (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(studentSearch.toLowerCase())).length} 
                currentPage={studentPage} 
                onPageChange={setStudentPage} 
              />
            </div>
          )}

          {activeTab === 'Records' && (
            <div className="data-view card">
              <div className="view-header mb-4">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h2 className="text-xl font-bold text-slate-900">Certificate Records</h2>
                  <p className="text-slate-400 font-small">Institutional archive of generated Transfer Certificates</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {recordBulkIds.size > 0 && (
                    <button className="btn btn-primary" onClick={handleDownloadZip} style={{ gap: '8px', fontSize: '13px' }}>
                      <Download size={16} /> Download Selected ({recordBulkIds.size})
                    </button>
                  )}
                  <div className="search-input">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search history..." 
                      value={recordSearch} 
                      onChange={e => setRecordSearch(e.target.value)} 
                    />
                  </div>
                  <button className={`btn ${showFilters ? 'btn-primary' : ''}`} style={{ border: '1px solid #e2e8f0', background: showFilters ? '#2563eb' : 'white', color: showFilters ? 'white' : '#64748b' }} onClick={() => setShowFilters(!showFilters)}><Filter size={18} /></button>
                </div>
              </div>

              {showFilters && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Course</label>
                    <select className="input h-10" value={filterCriteria.course} onChange={e => { setFilterCriteria(prev => ({ ...prev, course: e.target.value })); setRecordPage(1); }}>
                      <option value="">All Courses</option>
                      {Array.from(new Set(records.map(a => a.course).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                    <select className="input h-10" value={filterCriteria.branch} onChange={e => { setFilterCriteria(prev => ({ ...prev, branch: e.target.value })); setRecordPage(1); }}>
                      <option value="">All Branches</option>
                      {Array.from(new Set(records.filter(a => !filterCriteria.course || a.course === filterCriteria.course).map(a => a.branch).filter(Boolean))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Batch</label>
                    <select className="input h-10" value={filterCriteria.batch} onChange={e => { setFilterCriteria(prev => ({ ...prev, batch: e.target.value })); setRecordPage(1); }}>
                       <option value="">All Batches</option>
                       {Array.from(new Set(records.map(a => `${a.batchStart}-${a.batchEnd}`).filter(b => b !== 'undefined-undefined'))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <select className="input h-10" value={filterCriteria.status} onChange={e => { setFilterCriteria(prev => ({ ...prev, status: e.target.value })); setRecordPage(1); }}>
                      <option value="">All Status</option>
                      <option value="AWAITING AUTH">Pending</option>
                      <option value="ISSUED">Issued</option>
                    </select>
                  </div>
                  <button className="btn" style={{ marginTop: '18px', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => { setFilterCriteria({ course: '', branch: '', batch: '', status: '' }); setRecordSearch(''); }}>Reset</button>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={records.filter(r => {
                          const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                          const searchMatch = term.includes(recordSearch.toLowerCase());
                          const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                          const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                          const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                          const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                          return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                        }).length > 0 && records.filter(r => {
                          const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                          const searchMatch = term.includes(recordSearch.toLowerCase());
                          const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                          const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                          const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                          const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                          return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                        }).every(r => recordBulkIds.has(r.id))}
                        onChange={(e) => {
                          const currentFiltered = records.filter(r => {
                            const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                            const searchMatch = term.includes(recordSearch.toLowerCase());
                            const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                            const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                            const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                            const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                            return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                          });
                          const newIds = new Set(recordBulkIds);
                          if (e.target.checked) currentFiltered.forEach(r => newIds.add(r.id));
                          else currentFiltered.forEach(r => newIds.delete(r.id));
                          setRecordBulkIds(newIds);
                        }}
                      />
                    </th>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Batch</th>
                    <th className="text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records
                    .filter(r => {
                      const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                      const searchMatch = term.includes(recordSearch.toLowerCase());
                      const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                      const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                      const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                      const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                      return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                    })
                    .slice((recordPage - 1) * rowsPerPage, recordPage * rowsPerPage)
                    .map((r, i) => (
                    <tr key={i} className={recordBulkIds.has(r.id) ? 'row-selected' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={recordBulkIds.has(r.id)} 
                          onChange={() => {
                            const newIds = new Set(recordBulkIds);
                            if (newIds.has(r.id)) newIds.delete(r.id);
                            else newIds.add(r.id);
                            setRecordBulkIds(newIds);
                          }}
                        />
                      </td>
                      <td className="font-bold text-slate-600">{r.registerNo || r.reg}</td>
                      <td className="font-bold text-slate-900">{r.studentName || r.name}</td>
                      <td className="text-slate-600 font-medium">{r.course || '---'}</td>
                      <td className="text-slate-600 font-medium">{r.branch || '---'}</td>
                      <td>
                        <span className={`status-badge ${r.status === 'ISSUED' ? 'success' : 'warning'}`}>
                          {r.status === 'ISSUED' ? 'Issued' : 'Pending'}
                        </span>
                      </td>
                      <td className="text-slate-500">{`${r.batchStart}-${r.batchEnd}`}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="icon-btn" style={{ color: '#2563eb' }} onClick={() => window.open(`/tc-view/${r.id}`, '_blank')} title="View Certificate"><Eye size={18} /></button>
                          {r.status === 'ISSUED' && (
                            <button className="icon-btn" style={{ color: '#10b981' }} onClick={() => handleDownloadPDF(r)} title="Download TC"><Download size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {records.filter(r => {
                    const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                    const searchMatch = term.includes(recordSearch.toLowerCase());
                    const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                    const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                    const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                    const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                    return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                  }).length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">No certificate records found matching your query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={records.filter(r => {
                    const term = (r.studentName || r.name || '').toLowerCase() + (r.registerNo || r.reg || '').toLowerCase();
                    const searchMatch = term.includes(recordSearch.toLowerCase());
                    const courseMatch = !filterCriteria.course || r.course === filterCriteria.course;
                    const branchMatch = !filterCriteria.branch || r.branch === filterCriteria.branch;
                    const batchMatch = !filterCriteria.batch || `${r.batchStart}-${r.batchEnd}` === filterCriteria.batch;
                    const statusMatch = !filterCriteria.status || r.status === filterCriteria.status;
                    return searchMatch && courseMatch && branchMatch && batchMatch && statusMatch;
                }).length} 
                currentPage={recordPage} 
                onPageChange={setRecordPage} 
              />
            </div>
          )}

          {activeTab === 'Users' && (
            <div className="data-view card">
              <div className="view-header mb-4">
                <h2>Staff Management</h2>
                <div className="header-actions">
                  <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                    <UserCog size={16} />
                    <span> Add User</span>
                  </button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-center" style={{ width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(u => (u.name || '').toLowerCase().includes(uploadSearch.toLowerCase()) || (u.username || '').toLowerCase().includes(uploadSearch.toLowerCase()))
                    .slice((userPage - 1) * rowsPerPage, userPage * rowsPerPage)
                    .map(u => (
                    <tr key={u.id}>
                      <td className="font-medium">{u.name}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn hover-bg-blue" 
                            style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setSelectedUser(u); setShowUserViewModal(true); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="icon-btn hover-bg-amber" 
                            style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setNewUser(u); setIsEditingUser(true); setShowUserModal(true); }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="icon-btn hover-bg-red" 
                            style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { if(confirm('Are you sure you want to delete this user?')) handleDeleteUser(u.id); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => (u.name || '').toLowerCase().includes(uploadSearch.toLowerCase()) || (u.username || '').toLowerCase().includes(uploadSearch.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-row">No users found matching your query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={users.filter(u => (u.name || '').toLowerCase().includes(uploadSearch.toLowerCase()) || (u.username || '').toLowerCase().includes(uploadSearch.toLowerCase())).length} 
                currentPage={userPage} 
                onPageChange={setUserPage} 
              />
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="card" style={{ maxWidth: '600px' }}>
              <h2 className="mb-4">System Settings</h2>
              <div className="form-group mb-4">
                <label>Institution Name</label>
                <input type="text" className="input" defaultValue="ACE College of Engineering" />
              </div>
              <div className="form-group mb-4">
                <label>Primary Contact Email</label>
                <input type="email" className="input" defaultValue="support@ace.edu" />
              </div>
              <div className="form-group mb-4">
                <label>Default TC Prefix</label>
                <input type="text" className="input" defaultValue="ACE/TC/" />
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          )}
        </div>
      </main>

      {/* Invisible PDF Renderer - Exact clone of TransferCertificate.jsx */}
      {pdfData && (
        <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
          <div id="invisible-tc" style={{ 
            background: 'white', padding: '10px 40px', height: '297mm', width: '210mm', 
            border: '1px solid #000', color: '#000', position: 'relative', fontFamily: 'Times New Roman, serif',
            boxSizing: 'border-box', overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', marginBottom: '20px', paddingBottom: '8px', borderBottom: '2px solid #000' }}>
              <div style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', width: '75px', height: '75px', display: 'flex', alignItems: 'center' }}>
                <img src="/logo.png" alt="ACE Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'center', paddingLeft: '80px' }}>
                <h1 style={{ fontSize: '24px', color: '#000', fontWeight: '900', marginBottom: '1px', lineHeight: '1.2' }}>ADHIYAMAAN COLLEGE OF ENGINEERING</h1>
                <p style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '14px', color: '#000', marginBottom: '4px' }}>(AUTONOMOUS)</p>
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0' }}>Affiliated to Anna University- Chennai & Approved by AICTE - New Delhi,</p>
                <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0' }}>Accredited by NAAC - UGC - New Delhi.</p>
                <p style={{ fontSize: '13px', fontWeight: '800', marginTop: '4px' }}>Dr. M.G.R. Nagar, HOSUR - 635 130, Krishnagiri Dt., Tamil Nadu, India.</p>
                <p style={{ fontSize: '11px', margin: '0' }}>Ph: 04344 - 260570, 261001, 002, 003, 020  Fax: 04344 - 260573</p>
                <p style={{ fontSize: '11px', margin: '0' }}>E-mail: principal@adhiyamaan.ac.in  Website: www.adhiyamaan.ac.in</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
               <div>S.No : {pdfData.auth_code || '---'}</div>
               <div style={{ textAlign: 'right' }}>
                  Admission No. : <span style={{ borderBottom: '1px solid #000', padding: '0 10px' }}>{pdfData.admissionNo || '---'}</span><br/>
                  UMIS ID. : <span style={{ borderBottom: '1px solid #000', padding: '0 10px' }}>{pdfData.umisNo || '---'}</span>
               </div>
            </div>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', textDecoration: 'underline' }}>TRANSFER CERTIFICATE</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '14px' }}>
              <tbody>
                {[
                  { l: '1.', q: 'Name of the Student', v: pdfData.studentName },
                  { l: '2.', q: 'Name of the Father / Guardian', v: pdfData.fatherName },
                  { l: '3.', q: 'Nationality, Religion and Caste', v: `${pdfData.nationality || 'INDIAN'}, ${pdfData.religion || '---'} & ${pdfData.caste || '---'}` },
                  { l: '4.', q: 'Date of Birth in words as entered in the Admission Register', v: dateToWords(pdfData.dob) },
                  { l: '5.', q: 'Date of Admission', v: pdfData.dateOfAdmission },
                  { l: '6.', q: 'Course to which the student was Admitted', v: pdfData.course },
                  { l: '7.', q: 'Branch of Study', v: pdfData.branch },
                  { l: '8.', q: 'Whether the Course has been completed (or) not', v: (pdfData.tcCompleted || '---').toUpperCase() },
                  { l: '9.', q: 'Medium of Instruction', v: (pdfData.mediumOfInstruction || 'ENGLISH').toUpperCase() },
                  { l: '10.', q: 'Whether Qualified for promotion to a higher class (or) not', v: (pdfData.tcPromotion || '---').toUpperCase() },
                  { l: '11.', q: 'Whether the student has paid all the fees due to the college', v: (pdfData.tcFeesPaid || '---').toUpperCase() },
                  { l: '12.', q: 'Date on which the Student actually left the College', v: pdfData.tcLeftDate },
                  { l: '13.', q: 'Date on which application for Transfer Certificate was made', v: pdfData.tcApplyDate },
                  { l: '14.', q: 'Character and Conduct', v: (pdfData.tcConduct || 'GOOD').toUpperCase() },
                  { l: '15.', q: 'Scholarship', v: (pdfData.tcScholarship || 'no').toUpperCase() },
                  ...(pdfData.tcScholarship === 'yes' ? [{ l: '16.', q: 'Name of the Scholarship', v: pdfData.tcScholarshipScheme || '---' }] : [])
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ width: '40px', padding: '5px 10px', borderRight: '1px solid #000', fontWeight: 'bold' }}>{row.l}</td>
                    <td style={{ width: '400px', padding: '5px 10px', borderRight: '2px solid #000', fontWeight: 'bold' }}>{row.q}</td>
                    <td style={{ padding: '5px 10px', fontWeight: '900' }}>{row.v || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <p>Jr. Asst</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '4px' }}>Principal</p>
                <div style={{ fontSize: '9px', padding: '4px 8px', border: '1px solid #059669', color: '#059669', borderRadius: '4px' }}>DIGITALLY SIGNED</div>
              </div>
            </div>
            <div style={{ marginTop: '50px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', textAlign: 'center' }}>
               <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', fontStyle: 'italic' }}>Note: This is a system generated Transfer Certificate. No physical seal or signature is required for its validity as per institutional digital record policy.</p>
            </div>
          </div>
        </div>
      )}

      {downloadProgress.active && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="card text-center py-10 px-20">
            <ShieldCheck size={48} className="text-blue-600 mb-4 mx-auto" />
            <h2 className="text-2xl font-bold mb-2">Generating Batch Archive</h2>
            <p className="text-slate-500 mb-8">Processing {downloadProgress.current} of {downloadProgress.total} certificates...</p>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      )}


      <style dangerouslySetInnerHTML={{ __html: `
        .admin-layout {
          display: flex;
          height: 100vh;
          background: #f8fafc;
        }

        .sidebar {
          width: 240px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          padding: 24px 0;
        }

        .brand {
          padding: 0 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          font-weight: 700;
          font-size: 1.125rem;
          color: #0f172a;
        }

        .nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 12px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          color: #64748b;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .nav-link:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .nav-link.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .sidebar-footer {
          padding: 0 12px;
          margin-top: auto;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          color: #ef4444;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: #fef2f2;
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .content-header {
          height: 64px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: #2563eb;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .scroll-area {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: #f0f7ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 4px 0 0;
        }

        .font-small { font-size: 0.75rem; }
        .font-medium { font-weight: 500; }
        
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          gap: 16px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          margin-top: 6px;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-input {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0 12px;
          width: 280px;
          height: 40px;
        }

        .search-input svg { color: #94a3b8; }
        .search-input input {
          border: none;
          background: transparent;
          padding: 8px;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .data-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #f1f5f9;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.05em;
        }

        .data-table td {
          padding: 16px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
          color: #334155;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-danger { color: #ef4444; }
        
        .icon-btn {
          background: transparent;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #64748b;
          transition: color 0.1s;
        }

        .icon-btn:hover { color: #0f172a; }
        .icon-btn.text-danger:hover { color: #dc2626; }

        .empty-row {
          text-align: center;
          padding: 40px !important;
          color: #94a3b8;
        }

        .placeholder-card {
          padding: 48px;
          text-align: center;
          border: 1px dashed #cbd5e1;
          background: transparent;
        }

        .table-grid-records {
          display: grid;
          grid-template-columns: 120px 1.5fr 1fr 1fr 120px;
          align-items: center;
        }

        .role-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .role-badge.admin { background: #fee2e2; color: #991b1b; }
        .role-badge.office { background: #dcfce7; color: #166534; }
        .role-badge.principal { background: #e0f2fe; color: #075985; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
        }
      `}} />

      {/* User Modal */}
      {showUserViewModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="view-header mb-8" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                <p className="text-slate-400 font-medium tracking-wide">Institutional Staff Dossier • @{selectedUser.username}</p>
              </div>
              <button className="icon-btn" onClick={() => setShowUserViewModal(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {[
                { label: 'Display Name', value: selectedUser.name },
                { label: 'Username', value: `@${selectedUser.username}` },
                { label: 'Email Address', value: selectedUser.email || 'Not Configured' },
                { label: 'Access Role', value: selectedUser.role },
                { label: 'Status', value: 'Authorized Academic' },
                { label: 'Last Managed', value: new Date().toLocaleDateString() }
              ].map((item, idx) => (
                <div key={idx} className="data-field">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-base font-bold text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" style={{ padding: '0 48px', height: '52px', borderRadius: '12px' }} onClick={() => setShowUserViewModal(false)}>Close Staff Dossier</button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="view-header mb-6">
              <h2 className="text-lg font-bold">{isEditingUser ? 'Edit Staff Profile' : 'Authorize New Staff'}</h2>
              <button className="icon-btn" onClick={() => { setShowUserModal(false); setIsEditingUser(false); }}><X /></button>
            </div>
            <form onSubmit={handleUserSubmit}>
              <div className="form-group mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Display Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Username <span style={{ color: '#94a3b8', fontWeight: '400', textTransform: 'none', fontSize: '11px' }}>(optional)</span></label>
                <input type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} placeholder="Leave blank to auto-generate" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                <input required type="email" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="form-group mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Authorization Role <span style={{ color: '#dc2626' }}>*</span></label>
                <select className="input" style={{ height: '44px', borderRadius: '10px' }} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option>Admin</option>
                  <option>Office</option>
                  <option>Principal</option>
                </select>
              </div>
              
              {isEditingUser && (
                <div className="p-4" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
                  <p className="text-xs font-medium text-slate-500 mb-3">Institutional Security Actions</p>
                  <button 
                    type="button" 
                    className="btn" 
                    style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '13px', fontWeight: '600' }}
                    onClick={() => handleResetPassword(newUser.id)}
                  >
                    Reset Credentials to Default
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn" style={{ flex: 1, border: '1px solid #e2e8f0', height: '48px', borderRadius: '12px' }} onClick={() => { setShowUserModal(false); setIsEditingUser(false); }}>Discard Changes</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '48px', borderRadius: '12px', fontWeight: '700' }}>{isEditingUser ? 'Save Changes' : 'Authorize Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student View Modal */}
      {showViewModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }}>
            <div className="view-header mb-8" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.name}</h2>
                <p className="text-slate-400 font-medium tracking-wide">Institutional Student Dossier • {selectedStudent.registerNo}</p>
              </div>
              <button className="icon-btn" onClick={() => setShowViewModal(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
              {[
                { label: 'Register No', value: selectedStudent.registerNo },
                { label: 'Admission No', value: selectedStudent.admissionNo },
                { label: 'UMIS ID', value: selectedStudent.umisNo || '---' },
                { label: 'Father\'s Name', value: selectedStudent.fatherName },
                { label: 'Nationality', value: selectedStudent.nationality },
                { label: 'Religion', value: selectedStudent.religion },
                { label: 'Caste', value: selectedStudent.caste },
                { label: 'Date of Birth', value: selectedStudent.dob },
                { label: 'Admission Date', value: selectedStudent.dateOfAdmission },
                { label: 'Course', value: selectedStudent.course },
                { label: 'Branch', value: selectedStudent.branch },
                { label: 'Medium', value: selectedStudent.mediumOfInstruction },
                { label: 'Batch Start', value: selectedStudent.batchStart },
                { label: 'Batch End', value: selectedStudent.batchEnd },
                { label: 'Status', value: 'Active Academic' }
              ].map((item, idx) => (
                <div key={idx} className="data-field">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-base font-bold text-slate-800">{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" style={{ padding: '0 48px', height: '52px', borderRadius: '12px' }} onClick={() => setShowViewModal(false)}>Close Dossier</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="view-header mb-4">
              <h2>{isEditing ? 'Edit Student' : 'New Student'}</h2>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', paddingRight: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Register Number <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.registerNo} onChange={e => setNewRecord({...newRecord, registerNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Admission No <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.admissionNo} onChange={e => setNewRecord({...newRecord, admissionNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">UMIS ID <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.umisNo} onChange={e => setNewRecord({...newRecord, umisNo: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Student Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Father's Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.fatherName} onChange={e => setNewRecord({...newRecord, fatherName: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nationality <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.nationality} onChange={e => setNewRecord({...newRecord, nationality: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Religion <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.religion} onChange={e => setNewRecord({...newRecord, religion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Caste <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.caste} onChange={e => setNewRecord({...newRecord, caste: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Course / Degree <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.course} onChange={e => setNewRecord({...newRecord, course: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Department (Branch) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.branch} onChange={e => setNewRecord({...newRecord, branch: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Medium <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.mediumOfInstruction} onChange={e => setNewRecord({...newRecord, mediumOfInstruction: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Batch Start <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.batchStart} onChange={e => setNewRecord({...newRecord, batchStart: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Batch End <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.batchEnd} onChange={e => setNewRecord({...newRecord, batchEnd: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-6">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Date of Birth <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="date" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.dob} onChange={e => setNewRecord({...newRecord, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Admission Date <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="date" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newRecord.dateOfAdmission} onChange={e => setNewRecord({...newRecord, dateOfAdmission: e.target.value})} />
                </div>
              </div>
            </form>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn" style={{ flex: 1, border: '1px solid #e2e8f0', height: '48px', borderRadius: '12px' }} onClick={() => setShowAddModal(false)}>Cancel Action</button>
              <button onClick={handleAddSubmit} className="btn btn-primary" style={{ flex: 1, height: '48px', borderRadius: '12px', fontWeight: '700' }}>{isEditing ? 'Sync Institutional Record' : 'Create New Profile'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }}>
            <div className="view-header mb-6">
              <div>
                <h2 className="text-xl font-bold">Import Preview</h2>
                <p className="text-muted font-small">Diagnostic overview of {uploadData.length} records</p>
              </div>
              <button className="icon-btn" onClick={() => setShowUploadModal(false)}><X size={24} /></button>
            </div>
            
            <div className="header-actions mb-4" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div className="search-input" style={{ flex: 1 }}>
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Filter preview by name or reg no..." 
                  value={uploadSearch}
                  onChange={e => setUploadSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="text-muted font-bold font-small uppercase tracking-wider">Show:</span>
                <select 
                  className="input" 
                  style={{ width: '140px', height: '40px', fontSize: '0.8rem' }}
                  value={uploadFilter}
                  onChange={e => setUploadFilter(e.target.value)}
                >
                  <option value="All">All Records</option>
                  <option value="Ready">Ready Only</option>
                  <option value="Error">Errors Only</option>
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }} className="mb-6">
              <table className="data-table" style={{ marginTop: 0, minWidth: '1800px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 12px', width: '120px' }}>Reg No</th>
                    <th style={{ width: '200px' }}>Student Name</th>
                    <th style={{ width: '180px' }}>Father's Name</th>
                    <th style={{ width: '120px' }}>Nationality</th>
                    <th style={{ width: '120px' }}>Religion</th>
                    <th style={{ width: '120px' }}>Caste</th>
                    <th style={{ width: '120px' }}>Adm No</th>
                    <th style={{ width: '120px' }}>UMIS ID</th>
                    <th style={{ width: '120px' }}>DOB</th>
                    <th style={{ width: '120px' }}>Adm Date</th>
                    <th style={{ width: '150px' }}>Course</th>
                    <th style={{ width: '150px' }}>Branch</th>
                    <th style={{ width: '100px' }}>Medium</th>
                    <th style={{ width: '100px' }}>Start</th>
                    <th style={{ width: '100px' }}>End</th>
                    <th style={{ width: '150px', position: 'sticky', right: 0, background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadData
                    .filter(row => {
                      const matchesSearch = (row.name?.toLowerCase() || '').includes(uploadSearch.toLowerCase()) || 
                                          (row.registerNo?.toLowerCase() || '').includes(uploadSearch.toLowerCase());
                      const matchesStatus = uploadFilter === 'All' || 
                                          (uploadFilter === 'Ready' && row.errors.length === 0) ||
                                          (uploadFilter === 'Error' && row.errors.length > 0);
                      return matchesSearch && matchesStatus;
                    })
                    .map((row, i) => {
                      const hasError = row.errors.length > 0;
                      return (
                        <tr key={i} style={{ 
                          background: hasError ? '#fee2e2' : '#dcfce7',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <td className="font-bold text-slate-700">{row.registerNo || '---'}</td>
                          <td className="font-bold text-slate-900">{row.name || '---'}</td>
                          <td className="text-slate-600">{row.fatherName || '---'}</td>
                          <td className="text-slate-600">{row.nationality || '---'}</td>
                          <td className="text-slate-600">{row.religion || '---'}</td>
                          <td className="text-slate-600">{row.caste || '---'}</td>
                          <td className="text-slate-600">{row.admissionNo || '---'}</td>
                          <td className="text-slate-600">{row.umisNo || '---'}</td>
                          <td className="text-slate-600">{row.dob || '---'}</td>
                          <td className="text-slate-600">{row.dateOfAdmission || '---'}</td>
                          <td className="text-slate-600">{row.course || '---'}</td>
                          <td className="text-slate-600">{row.branch || '---'}</td>
                          <td className="text-slate-600">{row.mediumOfInstruction || '---'}</td>
                          <td className="text-slate-600">{row.batchStart || '---'}</td>
                          <td className="text-slate-600">{row.batchEnd || '---'}</td>
                          <td style={{ 
                            position: 'sticky', 
                            right: 0, 
                            background: hasError ? '#fee2e2' : '#dcfce7',
                            borderLeft: '1px solid rgba(0,0,0,0.05)'
                          }}>
                            {hasError ? (
                              <div style={{ color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} />
                                <span className="font-bold" style={{ fontSize: '11px' }}>{row.errors[0]}</span>
                              </div>
                            ) : (
                              <div style={{ color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={14} />
                                <span className="font-bold" style={{ fontSize: '11px' }}>Ready</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {uploadData.length === 0 && (
                    <tr><td colSpan="16" className="text-center py-12 text-slate-400">No records to preview</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', padding: '16px 0 8px', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn" style={{ height: '48px', padding: '0 32px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }} onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ height: '48px', padding: '0 32px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}
                onClick={handleBulkSubmit}
                disabled={uploadData.filter(r => r.errors.length === 0).length === 0}
              >
                <CheckCircle2 size={18} />
                <span>Import {uploadData.filter(r => r.errors.length === 0).length} Valid Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

