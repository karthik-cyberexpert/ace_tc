import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Users, ClipboardList, Database, Bell, Search, LogOut, ChevronRight, Plus, Trash2, Upload, X, Download, Check, Eye, Edit, FileUp, Settings, CheckCircle2, AlertCircle, Filter, RotateCcw, ShieldCheck, Printer } from 'lucide-react'
import { API_BASE_URL } from '../config'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'

const OfficeDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState([])
  const [uploadErrors, setUploadErrors] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [recordSearch, setRecordSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [recordPage, setRecordPage] = useState(1)
  const [uploadPage, setUploadPage] = useState(1)
  const [recentPage, setRecentPage] = useState(1)
  const rowsPerPage = 10
  const [uploadSearch, setUploadSearch] = useState('')
  const [uploadFilter, setUploadFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState({ course: '', branch: '', batch: '', status: '' })
  const [tcSearch, setTcSearch] = useState('')
  const [tcPage, setTcPage] = useState(1)
  const [tcFormData, setTcFormData] = useState({})
  const [scholarshipModal, setScholarshipModal] = useState({ show: false, index: -1, name: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [tcSingleSearch, setTcSingleSearch] = useState('')
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set())
  const [recordBulkIds, setRecordBulkIds] = useState(new Set())
  const [downloadProgress, setDownloadProgress] = useState({ active: false, current: 0, total: 0 })
  const pdfRef = useRef(null)
  const [pdfData, setPdfData] = useState(null)

  const hasExistingTC = (regNo) => {
    return records.some(r => (r.registerNo === regNo || r.reg === regNo) && (r.status === 'AWAITING AUTH' || r.status === 'ISSUED' || r.status === 'READY'));
  };

  useEffect(() => { setStudentPage(1); }, [studentSearch])
  useEffect(() => { setRecordPage(1); }, [recordSearch])
  useEffect(() => { setStudentPage(1); }, [filterCriteria])
  useEffect(() => { setUploadPage(1); }, [uploadSearch, uploadFilter])
  useEffect(() => { setTcPage(1); }, [tcSearch])

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
  const [newStudent, setNewStudent] = useState({ 
    registerNo: '', admissionNo: '', umisNo: '', name: '', 
    fatherName: '', nationality: 'Indian', religion: '', caste: '',
    dob: '', dateOfAdmission: '', course: '', branch: '', 
    mediumOfInstruction: 'English', batchStart: '', batchEnd: '' 
  })
  const [tcStep, setTcStep] = useState(0) // 0 is Mode Selection
  const [genMode, setGenMode] = useState('Single') // 'Single' or 'Bulk'
  const [bulkFilter, setBulkFilter] = useState({ course: '', branch: '', batch: '' })

  const departments = [...new Set(students.map(s => s.branch))].filter(Boolean)
  const batches = [...new Set(students.map(s => `${s.batchStart}-${s.batchEnd}`))].filter(b => b !== 'undefined-undefined')

  const downloadTemplate = () => {
    const data = [{
      "registerNo": "21CS101",
      "name": "John Student",
      "fatherName": "Parent Name",
      "dob": "2003-05-20",
      "dateOfAdmission": "2021-08-15",
      "admissionNo": "ADM001",
      "umisNo": "UMIS998",
      "course": "BE",
      "branch": "Computer Science",
      "batchStart": "2021",
      "batchEnd": "2025",
      "nationality": "Indian",
      "religion": "Hindu",
      "caste": "BC",
      "mediumOfInstruction": "English"
    }];
    const ws = XLSX.utils.json_to_sheet(data, { 
      header: [
        "registerNo", "name", "fatherName", "dob", "dateOfAdmission",
        "admissionNo", "umisNo", "course", "branch", "batchStart", "batchEnd",
        "nationality", "religion", "caste", "mediumOfInstruction"
      ] 
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students_Template");
    XLSX.writeFile(wb, "ACE_Bulk_Registration_Template.xlsx");
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

  useEffect(() => {
    fetchStudents();
    fetchRecords();
  }, [])

  useEffect(() => {
    if (activeTab === 'Records' && records.length > 0) {
      const issued = records.filter(r => r.status === 'ISSUED').map(r => r.id);
      setRecordBulkIds(new Set(issued));
    }
  }, [activeTab, records]);

  useEffect(() => {
    if (departments.length > 0 && !bulkFilter.branch) {
      setBulkFilter(prev => ({ ...prev, branch: departments[0] }))
    }
    if (batches.length > 0 && !bulkFilter.batch) {
      setBulkFilter(prev => ({ ...prev, batch: batches[0] }))
    }
  }, [students])

  const fetchStudents = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `${API_BASE_URL}/api/students/${newStudent.id}`
        : API_BASE_URL + '/api/students';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await response.json();
      if (data.success) {
        fetchStudents();
        setShowAddModal(false);
        setNewStudent({ 
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

  const handleFinalize = async () => {
    setIsProcessing(true);
    try {
      const selections = genMode === 'Single' ? [selectedStudent] : students.filter(s => tcFormData[s.registerNo] && tcFormData[s.registerNo].tcSelected);
      
      const payload = selections.map(s => ({
        student_id: s.id,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'AWAITING AUTH',
        ...tcFormData[s.registerNo]
      }));

      const response = await fetch(API_BASE_URL + '/api/certificates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        fetchRecords();
        setTcStep(4);
      } else {
        alert('Failed to submit requests: ' + data.error);
      }
    } catch (err) {
      console.error('Finalize failed:', err);
      alert('Network error while finalizing requests');
    } finally {
      setIsProcessing(false);
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
    // Wait for render
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
      
      await new Promise(r => setTimeout(r, 150)); // Allow render
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
    link.download = `ACE_TC_Records_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    
    setPdfData(null);
    setDownloadProgress({ active: false, current: 0, total: 0 });
  }

  const handleEditStudent = (student) => {
    setNewStudent(student);
    setIsEditing(true);
    setShowAddModal(true);
  }

  return (
    <div className="office-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} className="text-primary" />
          <span>ACE Office</span>
        </div>
        
        <nav className="nav">
          <button onClick={() => setActiveTab('Overview')} className={`nav-link ${activeTab === 'Overview' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>
          <button onClick={() => setActiveTab('Generate TC')} className={`nav-link ${activeTab === 'Generate TC' ? 'active' : ''}`}>
            <Plus size={18} />
            <span>Generate TC</span>
          </button>
          <button onClick={() => setActiveTab('Records')} className={`nav-link ${activeTab === 'Records' ? 'active' : ''}`}>
            <Database size={18} />
            <span>Records</span>
          </button>
          <button onClick={() => setActiveTab('Students')} className={`nav-link ${activeTab === 'Students' ? 'active' : ''}`}>
            <Users size={18} />
            <span>Students</span>
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
            <span className="text-muted">Office Portal</span>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium">{activeTab}</span>
          </div>
          <div className="header-user">
            <div className="avatar">OC</div>
            <span className="font-medium">Office Clerk</span>
          </div>
        </header>

        <div className="scroll-area">
          {activeTab === 'Overview' && (
            <div className="overview-container">
              <div className="overview-grid">
                <div className="stat-card card">
                  <div className="stat-icon" style={{ background: '#eff6ff' }}><Users size={20} className="text-blue-600" /></div>
                  <div className="stat-info">
                    <div className="stat-label text-slate-400 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>Total Students</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{students.length}</div>
                  </div>
                </div>
                <div className="stat-card card">
                  <div className="stat-icon" style={{ background: '#fef2f2' }}><ClipboardList size={20} className="text-red-600" /></div>
                  <div className="stat-info">
                    <div className="stat-label text-slate-400 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>Pending Auth</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{records.filter(r => r.status === 'AWAITING AUTH').length}</div>
                  </div>
                </div>
                <div className="stat-card card">
                  <div className="stat-icon" style={{ background: '#f0fdf4' }}><Check size={20} className="text-green-600" /></div>
                  <div className="stat-info">
                    <div className="stat-label text-slate-400 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>Issued TCs</div>
                    <div className="stat-value" style={{ fontSize: '1.5rem' }}>{records.filter(r => r.status === 'ISSUED').length}</div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: '32px' }}>
                <div className="view-header mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Recent Institutional Action</h2>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Branch</th>
                      <th>Batch</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records
                      .slice((recentPage - 1) * rowsPerPage, recentPage * rowsPerPage)
                      .map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium text-slate-600">{r.registerNo || r.reg}</td>
                        <td className="font-bold text-slate-900">{r.studentName || r.name}</td>
                        <td className="text-slate-600">{r.course || '---'}</td>
                        <td className="text-slate-600">{r.branch || '---'}</td>
                        <td className="text-slate-500 font-medium">
                          {r.batchStart && r.batchEnd ? `${r.batchStart}-${r.batchEnd}` : '---'}
                        </td>
                        <td className="text-center">
                          <button 
                            className="icon-btn" 
                            style={{ color: '#2563eb' }} 
                            onClick={() => window.open(`/tc-view/${r.id}`, '_blank')}
                            title="View Certificate"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400">No recent activity records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination 
                  totalItems={records.length} 
                  currentPage={recentPage} 
                  onPageChange={setRecentPage} 
                />
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="card">
              <div className="view-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="text-xl font-bold text-slate-900">Student Records</h2>
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
                  <button className="btn btn-primary" onClick={() => { setIsEditing(false); setNewStudent({ registerNo: '', admissionNo: '', umisNo: '', name: '', fatherName: '', nationality: 'Indian', religion: '', caste: '', dob: '', dateOfAdmission: '', course: '', branch: '', mediumOfInstruction: 'English', batchStart: '', batchEnd: '' }); setShowAddModal(true); }}>
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
                    .map(student => (
                    <tr key={student.id}>
                      <td className="font-medium text-slate-700">{student.registerNo}</td>
                      <td className="font-medium text-slate-900">{student.name}</td>
                      <td className="text-slate-600">{student.course} - {student.branch}</td>
                      <td className="text-slate-600">{student.batchStart}-{student.batchEnd}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn" 
                            style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setSelectedStudent(student); setShowViewModal(true); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="icon-btn" 
                            style={{ color: '#d97706', background: 'rgba(217, 119, 6, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => { setNewStudent(student); setIsEditing(true); setShowAddModal(true); }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="icon-btn" 
                            style={{ color: '#dc2626', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDeleteStudent(student.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.filter(s => (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">No records matching your synchronisation scope.</td>
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

          {activeTab === 'Generate TC' && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '600px' }}>
                <div style={{ background: '#f8fafc', padding: '32px', borderRight: '1px solid #e2e8f0' }}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Issuance Engine</h4>
                  <div className="vertical-stepper">
                    {[
                      { id: 0, title: 'Selection Mode', desc: 'Individual or Group' },
                      { id: 1, title: genMode === 'Single' ? 'Identity Search' : 'Batch Filter', desc: genMode === 'Single' ? 'Identify student record' : 'Filter by group' },
                      { id: 2, title: genMode === 'Single' ? 'Verify Academic' : 'Verify Batch', desc: genMode === 'Single' ? 'Validate single profile' : 'Validate entire list' },
                      { id: 3, title: 'Submission', desc: 'Final request' }
                    ].map(s => (
                      <div key={s.id} className={`v-step ${tcStep === s.id ? 'active' : ''} ${tcStep > s.id ? 'completed' : ''}`}>
                        <div className="v-step-circle">{tcStep > s.id ? <Check size={14} /> : s.id + 1}</div>
                        <div className="v-step-text">
                          <div className="v-step-title">{s.title}</div>
                          <div className="v-step-desc">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '48px', minWidth: '0', overflow: 'hidden' }}>
                  {tcStep === 0 && (
                    <div className="mode-selection" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '24px 0' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Issuance Mode</h2>
                        <p className="text-slate-400 text-sm">Select the certification scope for this session.</p>
                      </div>

                      <div className="mode-cards" style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
                        <div 
                          className={`mode-card-premium ${genMode === 'Single' ? 'active' : ''}`}
                          onClick={() => setGenMode('Single')}
                          style={{ width: '280px', padding: '32px 24px' }}
                        >
                          <div className="icon-box" style={{ width: '52px', height: '52px' }}><Users size={24} /></div>
                          <div className="card-info">
                            <h4 className="font-bold text-base mb-1">Individual</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">Process certificate for a single student profile with full verification.</p>
                          </div>
                        </div>

                        <div 
                          className={`mode-card-premium ${genMode === 'Bulk' ? 'active' : ''}`}
                          onClick={() => setGenMode('Bulk')}
                          style={{ width: '280px', padding: '32px 24px' }}
                        >
                          <div className="icon-box" style={{ width: '52px', height: '52px' }}><ClipboardList size={24} /></div>
                          <div className="card-info">
                            <h4 className="font-bold text-base mb-1">Batch Generation</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">Process an entire department or academic batch in one go.</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '12px 48px', height: '52px', fontSize: '0.9375rem', borderRadius: '12px' }}
                        onClick={() => setTcStep(1)}
                      >
                        Proceed to {genMode} Configuration
                      </button>
                    </div>
                  )}

                  {tcStep === 1 && genMode === 'Single' && (
                    <div className="search-phase" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Student Identity Search</h2>
                        <p className="text-slate-400 text-xs">Locate the target student record via admission database.</p>
                      </div>
                      
                      <div style={{ width: '100%', maxWidth: '380px' }}>
                        <div className="form-group mb-10">
                          <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">Student Register Number</label>
                          <div style={{ position: 'relative' }}>
                            <Search size={18} className="text-slate-400" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                              type="text" 
                              className="input" 
                              placeholder="e.g. 21CS101" 
                              style={{ paddingLeft: '44px', height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} 
                              value={tcSingleSearch}
                              onChange={e => setTcSingleSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                          <button className="btn btn-primary" style={{ width: '180px', height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} onClick={() => {
                            const student = students.find(s => s.registerNo.toLowerCase() === tcSingleSearch.toLowerCase());
                            if (!student) return alert('Student record not found in institutional database.');
                            if (hasExistingTC(student.registerNo)) return alert('A Transfer Certificate request already exists or has been issued for this student. Regeneration is prohibited.');
                            setSelectedStudent(student);
                            setTcStep(2);
                          }}>Identify Record</button>
                          <button className="btn font-semibold text-slate-400" style={{ width: '180px', height: '48px', fontSize: '0.8125rem' }} onClick={() => { setTcStep(0); setTcSingleSearch(''); }}>Back</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tcStep === 1 && genMode === 'Bulk' && (
                    <div className="bulk-filter-phase" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Group Batch Processing</h2>
                        <p className="text-slate-400 text-xs">Configure parameters for bulk certification of an entire group.</p>
                      </div>

                      <div style={{ width: '100%', maxWidth: '400px' }}>
                        <div className="form-group mb-4">
                          <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">Education Course</label>
                          <select 
                            className="input" 
                            style={{ height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} 
                            value={bulkFilter.course} 
                            onChange={e => setBulkFilter({ course: e.target.value, branch: '', batch: '' })}
                          >
                            <option value="">Select Course</option>
                            {[...new Set(students.map(s => s.course))].filter(Boolean).sort().map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group mb-4">
                          <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">Department / Branch</label>
                          <select 
                            className="input" 
                            style={{ height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} 
                            value={bulkFilter.branch} 
                            onChange={e => setBulkFilter({ ...bulkFilter, branch: e.target.value, batch: '' })}
                            disabled={!bulkFilter.course}
                          >
                            <option value="">{bulkFilter.course ? 'Select Branch' : '--- Choose course first ---'}</option>
                            {[...new Set(students.filter(s => s.course === bulkFilter.course).map(s => s.branch))].filter(Boolean).sort().map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group mb-12">
                          <label className="text-xs text-slate-500 uppercase font-bold mb-2 block tracking-wider">Academy Batch</label>
                          <select 
                            className="input" 
                            style={{ height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} 
                            value={bulkFilter.batch} 
                            onChange={e => setBulkFilter({ ...bulkFilter, batch: e.target.value })}
                            disabled={!bulkFilter.branch}
                          >
                            <option value="">{bulkFilter.branch ? 'Select Batch' : '--- Choose branch first ---'}</option>
                            {[...new Set(students.filter(s => s.course === bulkFilter.course && s.branch === bulkFilter.branch).map(s => `${s.batchStart}-${s.batchEnd}`))].filter(Boolean).sort().map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
                          <button 
                            className="btn btn-primary" 
                            style={{ flex: 1, height: '48px', borderRadius: '12px', fontSize: '0.9375rem' }} 
                            onClick={() => {
                              const filtered = students.filter(s => 
                                s.course === bulkFilter.course && 
                                s.branch === bulkFilter.branch && 
                                `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                                !hasExistingTC(s.registerNo)
                              );
                              setBulkSelectedIds(new Set(filtered.map(s => s.registerNo)));
                              setTcStep(2);
                            }}
                            disabled={!bulkFilter.batch}
                          >
                            Select Batch
                          </button>
                          <button className="btn font-semibold text-slate-400" style={{ height: '48px', fontSize: '0.8125rem' }} onClick={() => setTcStep(0)}>Back</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tcStep === 2 && genMode === 'Single' && (
                    <div className="verification-phase">
                      <h2 className="text-2xl font-bold text-slate-900 mb-8">Record Verification</h2>
                      <div className="scroll-container-fixed horizontal-scroll-fix" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', marginRight: '24px', position: 'relative' }}>
                        <table className="data-table fixed-width-table w-2200">
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              <th style={{ width: '120px' }}>Reg No</th>
                              <th style={{ width: '220px' }}>Student Name</th>
                              <th style={{ width: '180px' }}>Father's Name</th>
                              <th style={{ width: '120px' }}>DOB</th>
                              <th style={{ width: '120px' }}>Adm No</th>
                              <th style={{ width: '120px' }}>UMIS ID</th>
                              <th style={{ width: '150px' }}>Course</th>
                              <th style={{ width: '180px' }}>Branch</th>
                              <th style={{ width: '150px' }}>Batch</th>
                              <th style={{ width: '120px' }}>Nationality</th>
                              <th style={{ width: '120px' }}>Religion</th>
                              <th style={{ width: '120px' }}>Caste</th>
                              <th style={{ width: '120px' }}>Adm Date</th>
                              <th style={{ width: '120px' }}>Medium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStudent ? (
                              <tr>
                                <td className="font-bold text-slate-700">{selectedStudent.registerNo}</td>
                                <td className="font-bold text-slate-900">{selectedStudent.name}</td>
                                <td className="text-slate-600 font-medium">{selectedStudent.fatherName || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.dob || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.admissionNo || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.umisNo || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.course}</td>
                                <td className="text-slate-600">{selectedStudent.branch}</td>
                                <td className="text-slate-600 font-bold">{selectedStudent.batchStart}-{selectedStudent.batchEnd}</td>
                                <td className="text-slate-600">{selectedStudent.nationality || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.religion || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.caste || '---'}</td>
                                <td className="text-slate-600">{selectedStudent.dateOfAdmission || '---'}</td>
                                <td className="text-slate-600 font-bold" style={{ color: '#0ea5e9' }}>{selectedStudent.mediumOfInstruction || 'English'}</td>
                              </tr>
                            ) : (
                              <tr><td colSpan="7" className="text-center py-12 text-slate-400">No student selected</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    <div className="action-buttons-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" style={{ height: '44px', padding: '0 32px', borderRadius: '10px', fontWeight: '700' }} onClick={() => {
                          const initialData = {};
                          if (selectedStudent) {
                            initialData[selectedStudent.registerNo] = { 
                              tcPromotion: 'yes', tcCompleted: 'yes', tcFeesPaid: 'yes', 
                              tcScholarship: 'no', tcScholarshipScheme: '', tcConduct: 'Good',
                              tcLeftDate: new Date().toISOString().split('T')[0],
                              tcApplyDate: new Date().toISOString().split('T')[0]
                            };
                          }
                          setTcFormData(initialData);
                          setTcStep(3); 
                        }}>Generate TC</button>
                        <button className="btn" style={{ height: '44px', padding: '0 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600' }} onClick={() => setTcStep(1)}>Back</button>
                      </div>
                    </div>
                  )}

                  {tcStep === 2 && genMode === 'Bulk' && (
                    <div className="bulk-verify-phase">
                      <div className="mb-8 flex justify-between items-center" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h2 className="text-2xl font-bold text-slate-900">Batch Students Lists</h2>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div className="search-input" style={{ width: '320px', background: 'white' }}>
                            <Search size={18} />
                            <input 
                              type="text" 
                              placeholder="Find specific student..." 
                              value={tcSearch}
                              onChange={e => setTcSearch(e.target.value)}
                            />
                          </div>
                          {(() => {
                            const count = students.filter(s => 
                              (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                              (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                              ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))
                            ).length;
                            return (
                               <div className="stat-pill" style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #dbeafe' }}>
                                <span className="text-lg font-extrabold text-blue-600">{count}</span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{count === 1 ? 'Student' : 'Students'} Verified</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="scroll-container-fixed horizontal-scroll-fix" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', marginRight: '24px', position: 'relative' }}>
                        <table className="data-table fixed-width-table w-2200">
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              <th style={{ width: '40px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={students.filter(s => 
                                    (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                                    (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                                    !hasExistingTC(s.registerNo)
                                  ).every(s => bulkSelectedIds.has(s.registerNo))}
                                  onChange={e => {
                                     const filtered = students.filter(s => 
                                       (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                                       (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                                       !hasExistingTC(s.registerNo)
                                     );
                                     if (e.target.checked) setBulkSelectedIds(new Set(filtered.map(s => s.registerNo)));
                                     else setBulkSelectedIds(new Set());
                                  }}
                                />
                              </th>
                              <th style={{ width: '120px' }}>Reg No</th>
                              <th style={{ width: '220px' }}>Student Name</th>
                              <th style={{ width: '180px' }}>Father's Name</th>
                              <th style={{ width: '120px' }}>DOB</th>
                              <th style={{ width: '120px' }}>Adm No</th>
                              <th style={{ width: '120px' }}>UMIS ID</th>
                              <th style={{ width: '150px' }}>Course</th>
                              <th style={{ width: '180px' }}>Branch</th>
                              <th style={{ width: '150px' }}>Batch</th>
                              <th style={{ width: '120px' }}>Nationality</th>
                              <th style={{ width: '120px' }}>Religion</th>
                              <th style={{ width: '120px' }}>Caste</th>
                              <th style={{ width: '120px' }}>Adm Date</th>
                              <th style={{ width: '120px' }}>Medium</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students
                              .filter(s => 
                                (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                                (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                                ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())) &&
                                !hasExistingTC(s.registerNo)
                              )
                              .slice((tcPage - 1) * rowsPerPage, tcPage * rowsPerPage)
                              .map((s, i) => (
                              <tr key={i} style={{ opacity: !bulkSelectedIds.has(s.registerNo) ? 0.5 : 1 }}>
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={bulkSelectedIds.has(s.registerNo)}
                                    onChange={e => {
                                      const next = new Set(bulkSelectedIds);
                                      if (e.target.checked) next.add(s.registerNo);
                                      else next.delete(s.registerNo);
                                      setBulkSelectedIds(next);
                                    }}
                                  />
                                </td>
                                <td className="font-bold text-slate-700">{s.registerNo}</td>
                                <td className="font-bold text-slate-900">{s.name}</td>
                                <td className="text-slate-600 font-medium">{s.fatherName || '---'}</td>
                                <td className="text-slate-600">{s.dob || '---'}</td>
                                <td className="text-slate-600">{s.admissionNo || '---'}</td>
                                <td className="text-slate-600">{s.umisNo || '---'}</td>
                                <td className="text-slate-600">{s.course}</td>
                                <td className="text-slate-600">{s.branch}</td>
                                <td className="text-slate-600 font-bold">{s.batchStart}-{s.batchEnd}</td>
                                <td className="text-slate-600">{s.nationality || '---'}</td>
                                <td className="text-slate-600">{s.religion || '---'}</td>
                                <td className="text-slate-600">{s.caste || '---'}</td>
                                <td className="text-slate-600">{s.dateOfAdmission || '---'}</td>
                                <td className="text-slate-600 font-bold" style={{ color: '#0ea5e9' }}>{s.mediumOfInstruction || 'English'}</td>
                              </tr>
                            ))}
                            {students.filter(s => (!bulkFilter.branch || s.branch === bulkFilter.branch) && (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) && ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))).length === 0 && (
                              <tr><td colSpan="7" className="text-center py-20 text-slate-400 font-medium">No students meet your search criteria.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <Pagination 
                        totalItems={students.filter(s => 
                          (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                          (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                          ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))
                        ).length}
                        currentPage={tcPage}
                        onPageChange={setTcPage}
                      />
                    
                    <div className="action-buttons-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ height: '44px', padding: '0 32px', borderRadius: '10px', fontWeight: '700' }} 
                          disabled={bulkSelectedIds.size === 0}
                          onClick={() => {
                            const initialData = {};
                            const filtered = students.filter(s => 
                              (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                              (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch) &&
                              bulkSelectedIds.has(s.registerNo)
                            );
                            filtered.forEach(s => {
                              initialData[s.registerNo] = { 
                                tcSelected: true,
                                tcPromotion: 'yes', tcCompleted: 'yes', tcFeesPaid: 'yes', 
                                tcScholarship: 'no', tcScholarshipScheme: '', tcConduct: 'Good',
                                tcLeftDate: new Date().toISOString().split('T')[0],
                                tcApplyDate: new Date().toISOString().split('T')[0]
                              };
                            });
                            setTcFormData(initialData);
                            setTcStep(3);
                          }}
                        >Generate TCs ({bulkSelectedIds.size})</button>
                        <button className="btn" style={{ height: '44px', padding: '0 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600' }} onClick={() => setTcStep(1)}>Back</button>
                      </div>
                    </div>
                  )}

                  {tcStep === 3 && (
                    <div className="details-phase">
                      <div className="mb-8 flex justify-between items-center" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <h2 className="text-2xl font-bold text-slate-900">Certificate Details</h2>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div className="search-input" style={{ width: '320px', background: 'white' }}>
                            <Search size={18} />
                            <input 
                              type="text" 
                              placeholder="Search processing list..." 
                              value={tcSearch}
                              onChange={e => setTcSearch(e.target.value)}
                            />
                          </div>
                          {(() => {
                            const count = (genMode === 'Single' ? [selectedStudent] : students.filter(s => tcFormData[s.registerNo]))
                              .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                              .length;
                            return (
                              <div className="stat-pill" style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #dbeafe' }}>
                                <span className="text-lg font-extrabold text-blue-600">{count}</span>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{count === 1 ? 'Student' : 'Students'} Loading</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="scroll-container-fixed horizontal-scroll-fix" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', marginRight: '0' }}>
                        <table className="data-table fixed-width-table" style={{ minWidth: '1800px', width: '1800px' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 20 }}>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              {genMode === 'Bulk' && <th style={{ width: '40px' }}><Check size={14} /></th>}
                              <th style={{ width: '120px' }}>Reg No</th>
                              <th style={{ width: '200px' }}>Student Name</th>
                              <th style={{ width: '150px' }}>Promotion?</th>
                              <th style={{ width: '150px' }}>Completed?</th>
                              <th style={{ width: '150px' }}>Fees Paid?</th>
                              <th style={{ width: '200px' }}>Scholarship?</th>
                              <th style={{ width: '200px' }}>Conduct</th>
                              <th style={{ width: '180px' }}>Left Date</th>
                              <th style={{ width: '180px' }}>Apply Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(genMode === 'Single' ? [selectedStudent] : students.filter(s => tcFormData[s.registerNo]))
                              .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                              .slice((tcPage - 1) * rowsPerPage, tcPage * rowsPerPage)
                              .map((s, i) => {
                                const data = tcFormData[s.registerNo] || {};
                                const update = (key, val) => setTcFormData(prev => ({
                                  ...prev,
                                  [s.registerNo]: { ...prev[s.registerNo], [key]: val }
                                }));

                                return (
                                  <tr key={i} style={{ opacity: genMode === 'Bulk' && !data.tcSelected ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                                    {genMode === 'Bulk' && (
                                      <td>
                                        <input 
                                          type="checkbox" 
                                          checked={data.tcSelected || false} 
                                          onChange={e => update('tcSelected', e.target.checked)}
                                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                      </td>
                                    )}
                                    <td className="font-bold text-slate-700">{s.registerNo}</td>
                                    <td className="font-bold text-slate-900">{s.name}</td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '12px' }}>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcPromotion === 'yes'} onChange={() => update('tcPromotion', 'yes')} /> Yes</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcPromotion === 'no'} onChange={() => update('tcPromotion', 'no')} /> No</label>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '12px' }}>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcCompleted === 'yes'} onChange={() => update('tcCompleted', 'yes')} /> Yes</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcCompleted === 'no'} onChange={() => update('tcCompleted', 'no')} /> No</label>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', gap: '12px' }}>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcFeesPaid === 'yes'} onChange={() => update('tcFeesPaid', 'yes')} /> Yes</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcFeesPaid === 'no'} onChange={() => update('tcFeesPaid', 'no')} /> No</label>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcScholarship === 'yes'} onChange={() => { update('tcScholarship', 'yes'); setScholarshipModal({ show: true, regNo: s.registerNo, name: data.tcScholarshipScheme || '' }) }} /> Yes</label>
                                          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.tcScholarship === 'no'} onChange={() => update('tcScholarship', 'no')} /> No</label>
                                        </div>
                                        {data.tcScholarship === 'yes' && (
                                          <button 
                                            className="edit-scheme-btn"
                                            onClick={() => setScholarshipModal({ show: true, regNo: s.registerNo, name: data.tcScholarshipScheme || '' })}
                                          >
                                            <Edit size={10} />
                                            <span>{data.tcScholarshipScheme || 'Set Scheme Name'}</span>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <select className="input h-9 text-xs" value={data.tcConduct} onChange={e => update('tcConduct', e.target.value)}>
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good</option>
                                        <option value="Satisfactory">Satisfactory</option>
                                        <option value="Bad">Bad</option>
                                      </select>
                                    </td>
                                    <td><input type="date" className="input h-9 text-xs" value={data.tcLeftDate} onChange={e => update('tcLeftDate', e.target.value)} /></td>
                                    <td><input type="date" className="input h-9 text-xs" value={data.tcApplyDate} onChange={e => update('tcApplyDate', e.target.value)} /></td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>

                      <Pagination 
                        totalItems={(genMode === 'Single' ? [selectedStudent] : students.filter(s => tcFormData[s.registerNo]))
                          .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                          .length
                        }
                        currentPage={tcPage}
                        onPageChange={setTcPage}
                      />

                      <div className="action-buttons-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ height: '44px', padding: '0 32px', borderRadius: '10px', fontWeight: '700', opacity: isProcessing ? 0.7 : 1 }} 
                          onClick={handleFinalize}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Submitting Requests...' : 'Finalize Generation'}
                        </button>
                        <button className="btn" style={{ height: '44px', padding: '0 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600' }} onClick={() => setTcStep(2)} disabled={isProcessing}>Back</button>
                      </div>
                    </div>
                  )}

                  {tcStep === 4 && (
                    <div className="auth-phase text-center py-10">
                      <div className="success-icon-container mb-8" style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <Check size={40} className="text-green-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-4">{genMode === 'Bulk' ? 'Bulk Request Finalized' : 'Request Finalized'}</h2>
                      <p className="text-slate-500 mb-10 max-w-lg mx-auto">
                        {(() => {
                          if (genMode === 'Single') {
                            return `The issuance request for ${selectedStudent?.name || 'the student'} (Reg No: ${selectedStudent?.registerNo || 'N/A'}) has been successfully submitted.`;
                          } else {
                            const count = students.filter(s => 
                              (!bulkFilter.branch || s.branch === bulkFilter.branch) && 
                              (!bulkFilter.batch || `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch)
                            ).length;
                            return `The issuance request for ${count} ${count === 1 ? 'student' : 'students'} from ${bulkFilter.branch || 'selected branches'} (${bulkFilter.batch || 'selected batch'}) has been successfully submitted.`;
                          }
                        })()}
                      </p>
                      <button className="btn btn-primary px-12 h-14" onClick={() => { setActiveTab('Overview'); setTcStep(0); }}>Return to Dashboard</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Records' && (
            <div className="card">
              <div className="view-header mb-6">
                <div>
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

              {/* Table rendering below */}
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
                      <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">No certificate records found matching your query.</td>
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

          {/* Invisible PDF Renderer - Exact clone of TransferCertificate.jsx for pixel-perfect downloads */}
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
                      { l: '15.', q: 'Scholarship', v: pdfData.tcScholarship === 'yes' ? `YES (${pdfData.tcScholarshipScheme || '---'})` : 'NO' }
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
        </div>
      </main>

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
            <div className="view-header mb-6">
              <h2 className="text-lg font-bold">{isEditing ? 'Edit Student' : 'New Registration'}</h2>
              <button className="icon-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', paddingRight: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Register Number <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.registerNo} onChange={e => setNewStudent({...newStudent, registerNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Admission No <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.admissionNo} onChange={e => setNewStudent({...newStudent, admissionNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">UMIS ID <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.umisNo} onChange={e => setNewStudent({...newStudent, umisNo: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Student Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Father's Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.fatherName} onChange={e => setNewStudent({...newStudent, fatherName: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nationality <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.nationality} onChange={e => setNewStudent({...newStudent, nationality: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Religion <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.religion} onChange={e => setNewStudent({...newStudent, religion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Caste <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.caste} onChange={e => setNewStudent({...newStudent, caste: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Course / Degree <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.course} onChange={e => setNewStudent({...newStudent, course: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Department (Branch) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.branch} onChange={e => setNewStudent({...newStudent, branch: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mb-4">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Medium <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.mediumOfInstruction} onChange={e => setNewStudent({...newStudent, mediumOfInstruction: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Batch Start <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.batchStart} onChange={e => setNewStudent({...newStudent, batchStart: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Batch End <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="text" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.batchEnd} onChange={e => setNewStudent({...newStudent, batchEnd: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mb-6">
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Date of Birth <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="date" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Admission Date <span style={{ color: '#dc2626' }}>*</span></label>
                  <input required type="date" className="input" style={{ height: '44px', borderRadius: '10px' }} value={newStudent.dateOfAdmission} onChange={e => setNewStudent({...newStudent, dateOfAdmission: e.target.value})} />
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

      <style dangerouslySetInnerHTML={{ __html: `
        .office-layout {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #f8fafc;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
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
          height: 72px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          flex-shrink: 0;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: #2563eb;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .scroll-area {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          background: #f8fafc;
        }

        .card {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px !important;
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 12px 16px;
          border-bottom: 2px solid #f1f5f9;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .data-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.875rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          height: 40px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 0.875rem;
          transition: all 0.2s;
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
          border-radius: 10px;
          padding: 0 16px;
          width: 320px;
          height: 40px;
          transition: all 0.2s;
        }

        .search-input:focus-within {
          border-color: #2563eb;
          background: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
        }

        .search-input svg { color: #94a3b8; }
        .search-input input {
          border: none;
          background: transparent;
          padding: 8px;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
          color: #0f172a;
        }

        .btn-primary { background: #2563eb; color: white; }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.9375rem;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
        }

        .status-badge.success { background: #f0fdf4; color: #166534; }

        .step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .step-circle.active { background: #2563eb; color: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

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

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .vertical-stepper { display: flex; flex-direction: column; gap: 32px; }
        .v-step { display: flex; gap: 16px; align-items: flex-start; opacity: 0.5; transition: opacity 0.3s; }
        .v-step.active, .v-step.completed { opacity: 1; }
        
        .v-step-circle {
          width: 32px; height: 32px; border-radius: 50%; background: #ffffff; border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #64748b;
          flex-shrink: 0;
        }
        
        .active .v-step-circle { border-color: #2563eb; color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        .completed .v-step-circle { background: #2563eb; border-color: #2563eb; color: white; }
        
        .v-step-title { font-weight: 700; color: #0f172a; font-size: 0.875rem; }
        .v-step-desc { font-size: 0.75rem; color: #64748b; margin-top: 2px; }

        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #475569; font-size: 0.875rem; }
        .text-right { text-align: right; }
        .text-danger { color: #ef4444; }
        .icon-btn { background: transparent; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .w-full { width: 100%; }
        .mb-6 { margin-bottom: 24px; }
        .mb-10 { margin-bottom: 40px; }
        .px-10 { padding-left: 2.5rem; padding-right: 2.5rem; }
        .h-14 { height: 56px; }
        .text-2xl { font-size: 1.5rem; }
        .text-3xl { font-size: 1.875rem; }

        .mode-card-premium {
          width: 320px;
          background: #ffffff;
          padding: 40px 32px;
          border-radius: 24px;
          border: 2px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .mode-card-premium:hover {
          transform: translateY(-8px);
          border-color: #cbd5e1;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .mode-card-premium.active {
          border-color: #2563eb;
          background: #f0f7ff;
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.1);
        }

        .icon-box {
          width: 64px;
          height: 64px;
          background: #f8fafc;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.3s;
        }

        .mode-card-premium.active .icon-box {
          background: #2563eb;
          color: white;
        }
        .fixed-width-table { 
          table-layout: auto !important; 
          margin: 0 !important;
          width: 100% !important;
          min-width: 1500px !important;
          max-width: none !important;
        }

        .w-1500 { width: 1500px !important; min-width: 1500px !important; }
        .w-1800 { width: 1800px !important; min-width: 1800px !important; }
        
        .scroll-container-fixed {
          max-height: 480px !important;
          overflow-x: auto !important;
          width: 100% !important;
          display: block !important;
          scrollbar-width: auto;
          scrollbar-color: #94a3b8 #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .horizontal-scroll-fix {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }

        .edit-scheme-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #eff6ff;
          color: #3b82f6;
          border: 1px solid #dbeafe;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.2s;
          margin-top: 4px;
          cursor: pointer;
        }

        .edit-scheme-btn:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .scroll-container-fixed::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }

        .scroll-container-fixed::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .scroll-container-fixed::-webkit-scrollbar-thumb {
          background-color: #94a3b8;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }

        .table-scroll-wrapper {
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          transition: all 0.3s ease;
        }

        .table-scroll-wrapper:hover {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
        }
      `}} />
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

            <div className="scroll-container-fixed mb-6" style={{ borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0' }}>
              <table className="data-table fixed-width-table w-1800">
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
                                          (uploadFilter === 'Ready' && (row.errors || []).length === 0) ||
                                          (uploadFilter === 'Error' && (row.errors || []).length > 0);
                      return matchesSearch && matchesStatus;
                    })
                    .slice((uploadPage - 1) * rowsPerPage, uploadPage * rowsPerPage)
                    .map((row, i) => {
                      const hasError = (row.errors || []).length > 0;
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
                                <span className="font-bold" style={{ fontSize: '11px' }}>{(row.errors || [])[0]}</span>
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
            <Pagination 
              totalItems={uploadData.filter(row => {
                const matchesSearch = (row.name?.toLowerCase() || '').includes(uploadSearch.toLowerCase()) || (row.registerNo?.toLowerCase() || '').includes(uploadSearch.toLowerCase());
                const matchesStatus = uploadFilter === 'All' || (uploadFilter === 'Ready' && (row.errors || []).length === 0) || (uploadFilter === 'Error' && (row.errors || []).length > 0);
                return matchesSearch && matchesStatus;
              }).length} 
              currentPage={uploadPage} 
              onPageChange={setUploadPage} 
            />

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', padding: '16px 0 8px', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn" style={{ height: '48px', padding: '0 32px', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: '600' }} onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ height: '48px', padding: '0 32px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700' }}
                onClick={handleBulkSubmit}
                disabled={uploadData.filter(r => (r.errors || []).length === 0).length === 0}
              >
                <CheckCircle2 size={18} />
                <span>Import {uploadData.filter(r => (r.errors || []).length === 0).length} Valid Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Scholarship Modal */}
      {scholarshipModal.show && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="view-header mb-6">
              <h2 className="text-xl font-bold">Scholarship Scheme</h2>
              <button className="icon-btn" onClick={() => setScholarshipModal({ ...scholarshipModal, show: false })}><X size={24} /></button>
            </div>
            <div className="form-group mb-6">
              <label className="label">Scheme Name</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Enter scholarship scheme name..." 
                value={scholarshipModal.name}
                onChange={e => setScholarshipModal({ ...scholarshipModal, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button className="btn" onClick={() => setScholarshipModal({ ...scholarshipModal, show: false })}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                setTcFormData(prev => ({
                  ...prev,
                  [scholarshipModal.regNo]: { ...prev[scholarshipModal.regNo], tcScholarshipScheme: scholarshipModal.name }
                }));
                setScholarshipModal({ ...scholarshipModal, show: false });
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfficeDashboard
