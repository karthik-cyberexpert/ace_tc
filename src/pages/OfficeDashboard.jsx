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
  const [certType, setCertType] = useState('TC')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionRef = useRef(null)
  const [overrideModal, setOverrideModal] = useState({ show: false, type: '', regNo: '', val1: '', val2: '', val3: '' })

  const hasExistingCert = (regNo, type) => {
    return records.some(r => (r.registerNo === regNo || r.reg === regNo) && (r.cert_type || 'TC') === type && (r.status === 'AWAITING AUTH' || r.status === 'ISSUED' || r.status === 'READY'));
  };

  useEffect(() => { setStudentPage(1); }, [studentSearch])
  useEffect(() => { setRecordPage(1); }, [recordSearch])
  useEffect(() => { setStudentPage(1); }, [filterCriteria])
  useEffect(() => { setUploadPage(1); }, [uploadSearch, uploadFilter])
  useEffect(() => { setTcPage(1); }, [tcSearch])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        cert_type: certType,
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
      const isLandscape = record.cert_type === 'CC';
      const pdf = new jsPDF({ orientation: isLandscape ? 'l' : 'p', unit: 'mm', format: 'a4' });
      if (isLandscape) {
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      }
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
      
      const isLandscape = record.cert_type === 'CC';
      const pdf = new jsPDF({ orientation: isLandscape ? 'l' : 'p', unit: 'mm', format: 'a4' });
      if (isLandscape) {
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      const pdfBlob = pdf.output('blob');
      zip.file(`${record.auth_code || record.id}.pdf`, pdfBlob);
    }
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ACE_Certificate_Records_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    
    setPdfData(null);
    setDownloadProgress({ active: false, current: 0, total: 0 });
  }

  const handleEditStudent = (student) => {
    setNewStudent(student);
    setIsEditing(true);
    setShowAddModal(true);
  }

  const filteredStudents = students.filter(s => {
    const reg = s.registerNo || '';
    const name = s.name || '';
    const query = tcSingleSearch.toLowerCase();
    const matchesSearch = reg.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    return matchesSearch && !hasExistingCert(s.registerNo, certType);
  }).slice(0, 5);

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
          <button onClick={() => setActiveTab('Generate Record')} className={`nav-link ${activeTab === 'Generate Record' ? 'active' : ''}`}>
            <Plus size={18} />
            <span>Generate Record</span>
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
                    <select className="premium-select" value={filterCriteria.course} onChange={e => setFilterCriteria({...filterCriteria, course: e.target.value})}>
                      <option value="">All Courses</option>
                      {[...new Set(students.map(s => s.course))].filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Branch</label>
                    <select className="premium-select" value={filterCriteria.branch} onChange={e => setFilterCriteria({...filterCriteria, branch: e.target.value})}>
                      <option value="">All Branches</option>
                      {[...new Set(students.map(s => s.branch))].filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block tracking-wider">Batch Period</label>
                    <select className="premium-select" value={filterCriteria.batch} onChange={e => setFilterCriteria({...filterCriteria, batch: e.target.value})}>
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

          {activeTab === 'Generate Record' && (
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #cbd5e1', borderRadius: '24px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05), 0 0 0 1px rgba(226, 232, 240, 0.8)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '620px' }}>
                <div style={{ background: '#f8fafc', padding: '40px 32px', borderRight: '1px solid #cbd5e1' }}>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Issuance Workspace</h4>
                  <div className="vertical-stepper">
                    {[
                      { id: 0, title: 'Scope & Type', desc: 'Select configuration' },
                      { id: 1, title: genMode === 'Single' ? 'Profile Search' : 'Batch Selection', desc: genMode === 'Single' ? 'Find student record' : 'Filter student group' },
                      { id: 2, title: 'Academic Audit', desc: 'Verify identity & status' },
                      { id: 3, title: 'Details Registry', desc: 'Configure properties' },
                      { id: 4, title: 'Finalized', desc: 'Request submitted' }
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

                <div style={{ padding: '48px', minWidth: '0', overflow: 'hidden', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                  {tcStep === 0 && (
                    <div className="mode-selection" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '24px 0', flexGrow: 1 }}>
                      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Generate Certificate Record</h2>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">Select the type of certificate and target student scope to initialize the generation process.</p>
                      </div>

                      <div className="form-group mb-10" style={{ width: '100%', maxWidth: '400px' }}>
                        <label className="text-xs text-slate-400 uppercase font-bold mb-3 block tracking-widest text-center">Certificate Type</label>
                        <div className="segmented-control">
                          <button 
                            type="button" 
                            className={`segmented-btn ${certType === 'TC' ? 'active' : ''}`}
                            onClick={() => setCertType('TC')}
                          >
                            Transfer Certificate (TC)
                          </button>
                          <button 
                            type="button" 
                            className={`segmented-btn ${certType === 'CC' ? 'active' : ''}`}
                            onClick={() => setCertType('CC')}
                          >
                            Course Completion (CC)
                          </button>
                        </div>
                      </div>

                      <div className="mode-cards" style={{ display: 'flex', gap: '32px', marginBottom: '48px' }}>
                        <div 
                          className={`mode-card-premium ${genMode === 'Single' ? 'active' : ''}`}
                          onClick={() => setGenMode('Single')}
                        >
                          <div className="active-indicator">
                            {genMode === 'Single' && <Check size={12} />}
                          </div>
                          <div className="icon-box"><Users size={28} /></div>
                          <div className="card-info">
                            <h4 className="font-bold text-lg mb-1 text-slate-800">Single Student</h4>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">Generate a certificate for an individual student by searching their register number.</p>
                          </div>
                        </div>

                        <div 
                          className={`mode-card-premium ${genMode === 'Bulk' ? 'active' : ''}`}
                          onClick={() => setGenMode('Bulk')}
                        >
                          <div className="active-indicator">
                            {genMode === 'Bulk' && <Check size={12} />}
                          </div>
                          <div className="icon-box"><ClipboardList size={28} /></div>
                          <div className="card-info">
                            <h4 className="font-bold text-lg mb-1 text-slate-800">Batch Processing</h4>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">Select a course, branch, and batch year to generate certificates in bulk.</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        className="premium-btn-primary" 
                        style={{ padding: '0 48px', height: '52px', fontSize: '0.9375rem' }}
                        onClick={() => setTcStep(1)}
                      >
                        Configure {genMode === 'Single' ? 'Search Parameters' : 'Batch Parameters'}
                      </button>
                    </div>
                  )}

                  {tcStep === 1 && genMode === 'Single' && (
                    <div className="search-phase" style={{ width: '100%', maxWidth: '460px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Identity Search</h2>
                        <p className="text-slate-500 text-sm">Locate the target student record in the institutional database.</p>
                      </div>
                      
                      <div className="card" style={{ width: '100%', padding: '32px 40px', border: '1px solid #cbd5e1', borderRadius: '20px', boxShadow: 'none' }}>
                        <div className="form-group mb-8">
                          <label className="text-xs text-slate-400 uppercase font-bold mb-3 block tracking-widest">Student Register Number / Name</label>
                          <div className="premium-input-container" ref={suggestionRef}>
                            <Search size={18} className="text-slate-400" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                              type="text" 
                              className="premium-search-input" 
                              placeholder="Search e.g. 21CS101 or John" 
                              value={tcSingleSearch}
                              onChange={e => {
                                setTcSingleSearch(e.target.value);
                                setShowSuggestions(true);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                            />
                            {showSuggestions && tcSingleSearch.trim() && (
                              <div className="search-suggestions-dropdown">
                                {filteredStudents.length > 0 ? (
                                  filteredStudents.map(student => (
                                    <div 
                                      key={student.id} 
                                      className="suggestion-item"
                                      onClick={() => {
                                        setTcSingleSearch(student.registerNo);
                                        setShowSuggestions(false);
                                      }}
                                    >
                                      <span className="suggestion-reg">{student.registerNo}</span>
                                      <span className="suggestion-divider">•</span>
                                      <span className="suggestion-name">{student.name}</span>
                                      <span className="suggestion-course">({student.course})</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="suggestion-no-results">No eligible students found</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                          <button className="premium-btn-ghost" style={{ flex: 1, height: '48px' }} onClick={() => { setTcStep(0); setTcSingleSearch(''); setShowSuggestions(false); }}>Back</button>
                          <button className="premium-btn-primary" style={{ flex: 2, height: '48px' }} onClick={() => {
                            const student = students.find(s => s.registerNo.toLowerCase() === tcSingleSearch.toLowerCase());
                            if (!student) return alert('Student record not found in institutional database.');
                            if (hasExistingCert(student.registerNo, certType)) return alert(`A ${certType === 'TC' ? 'Transfer' : 'Course Completion'} Certificate request already exists or has been issued for this student. Regeneration is prohibited.`);
                            setSelectedStudent(student);
                            setShowSuggestions(false);
                            setTcStep(2);
                          }}>Identify Record</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tcStep === 1 && genMode === 'Bulk' && (
                    <div className="bulk-filter-phase" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', maxWidth: '500px', margin: '0 auto', flexGrow: 1 }}>
                      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Group Batch Processing</h2>
                        <p className="text-slate-500 text-sm">Configure parameters for bulk certification of an entire academic group.</p>
                      </div>

                      <div className="card" style={{ width: '100%', padding: '32px', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: 'none' }}>
                        <div className="form-group mb-5">
                          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block tracking-widest">Education Course</label>
                          <select 
                            className="premium-select" 
                            value={bulkFilter.course} 
                            onChange={e => setBulkFilter({ course: e.target.value, branch: '', batch: '' })}
                          >
                            <option value="">Select Course</option>
                            {[...new Set(students.map(s => s.course))].filter(Boolean).sort().map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group mb-5">
                          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block tracking-widest">Department / Branch</label>
                          <select 
                            className="premium-select" 
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

                        <div className="form-group mb-8">
                          <label className="text-xs text-slate-400 uppercase font-bold mb-2 block tracking-widest">Academy Batch</label>
                          <select 
                            className="premium-select" 
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

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                          <button className="premium-btn-ghost" style={{ flex: 1, height: '48px' }} onClick={() => setTcStep(0)}>Back</button>
                          <button 
                            className="premium-btn-primary" 
                            style={{ flex: 2, height: '48px' }} 
                            onClick={() => {
                              const filtered = students.filter(s => 
                                s.course === bulkFilter.course && 
                                s.branch === bulkFilter.branch && 
                                `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                                !hasExistingCert(s.registerNo, certType)
                              );
                              setBulkSelectedIds(new Set(filtered.map(s => s.registerNo)));
                              setTcStep(2);
                            }}
                            disabled={!bulkFilter.batch}
                          >
                            Select Batch Group
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {tcStep === 2 && genMode === 'Single' && (
                    <div className="verification-phase" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Student Profile</h2>
                        <p className="text-slate-500 text-sm">Please verify the academic credentials of the identified profile before generating a certificate.</p>
                      </div>

                      <div className="dossier-card">
                        <div className="dossier-badge">Verified Dossier</div>
                        <div className="dossier-header">
                          <div className="dossier-avatar">
                            {selectedStudent?.name ? selectedStudent.name.charAt(0) : 'S'}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, color: '#0f172a', fontWeight: '800', fontSize: '1.25rem' }}>{selectedStudent?.name}</h3>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Register No: <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedStudent?.registerNo}</span></p>
                          </div>
                        </div>

                        <div className="dossier-grid">
                          <div className="dossier-field">
                            <span className="dossier-label">Father's Name</span>
                            <span className="dossier-value">{selectedStudent?.fatherName || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Date of Birth</span>
                            <span className="dossier-value">{selectedStudent?.dob || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Admission No</span>
                            <span className="dossier-value">{selectedStudent?.admissionNo || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">UMIS Number</span>
                            <span className="dossier-value">{selectedStudent?.umisNo || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Course & Branch</span>
                            <span className="dossier-value">{selectedStudent?.course} - {selectedStudent?.branch}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Batch Period</span>
                            <span className="dossier-value">{selectedStudent?.batchStart} - {selectedStudent?.batchEnd}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Nationality</span>
                            <span className="dossier-value">{selectedStudent?.nationality || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Religion & Caste</span>
                            <span className="dossier-value">{selectedStudent?.religion || '---'} ({selectedStudent?.caste || '---'})</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Admission Date</span>
                            <span className="dossier-value">{selectedStudent?.dateOfAdmission || '---'}</span>
                          </div>
                          <div className="dossier-field">
                            <span className="dossier-label">Medium of Instruction</span>
                            <span className="dossier-value" style={{ color: '#2563eb', fontWeight: '700' }}>{selectedStudent?.mediumOfInstruction || 'English'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="action-buttons-footer" style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button className="premium-btn-ghost" style={{ width: '140px', height: '48px' }} onClick={() => setTcStep(1)}>Back</button>
                        <button className="premium-btn-primary" style={{ width: '220px', height: '48px' }} onClick={() => {
                          const initialData = {};
                          if (selectedStudent) {
                            if (certType === 'CC') {
                              initialData[selectedStudent.registerNo] = {
                                ccResultMonthYear: 'June/July - ' + (selectedStudent.batchEnd || new Date().getFullYear()),
                                ccConduct: 'Good'
                              };
                            } else {
                              initialData[selectedStudent.registerNo] = { 
                                tcPromotion: 'yes', tcCompleted: 'yes', tcFeesPaid: 'yes', 
                                tcScholarship: 'no', tcScholarshipScheme: '', tcConduct: 'Good',
                                tcLeftDate: new Date().toISOString().split('T')[0],
                                tcApplyDate: new Date().toISOString().split('T')[0]
                              };
                            }
                          }
                          setTcFormData(initialData);
                          setTcStep(3); 
                        }}>Configure Certificate</button>
                      </div>
                    </div>
                  )}

                  {tcStep === 2 && genMode === 'Bulk' && (
                    <div className="bulk-verify-phase" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="mb-6 flex justify-between items-center" style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">Verify Batch Students</h2>
                          <p className="text-slate-400 text-xs mt-1">Check student records selected for bulk creation.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div className="search-input" style={{ width: '280px', background: 'white' }}>
                            <Search size={16} />
                            <input 
                              type="text" 
                              placeholder="Find student..." 
                              value={tcSearch}
                              onChange={e => setTcSearch(e.target.value)}
                            />
                          </div>
                          {(() => {
                            const count = students.filter(s => 
                              s.course === bulkFilter.course &&
                              s.branch === bulkFilter.branch &&
                              `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                              !hasExistingCert(s.registerNo, certType) &&
                              ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))
                            ).length;
                            return (
                              <div className="stat-pill" style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #dbeafe', fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>
                                <span>{count} Records Found</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="scroll-container-fixed horizontal-scroll-fix" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', flexGrow: 1, maxHeight: '350px' }}>
                        <table className="data-table fixed-width-table w-2200">
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              <th style={{ width: '50px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={students.filter(s => 
                                    s.course === bulkFilter.course && 
                                    s.branch === bulkFilter.branch && 
                                    `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                                    !hasExistingCert(s.registerNo, certType)
                                  ).every(s => bulkSelectedIds.has(s.registerNo))}
                                  onChange={e => {
                                     const filtered = students.filter(s => 
                                       s.course === bulkFilter.course && 
                                       s.branch === bulkFilter.branch && 
                                       `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                                       !hasExistingCert(s.registerNo, certType)
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
                                s.course === bulkFilter.course && 
                                s.branch === bulkFilter.branch && 
                                `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                                ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())) &&
                                !hasExistingCert(s.registerNo, certType)
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
                            {students.filter(s => s.course === bulkFilter.course && s.branch === bulkFilter.branch && `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch && ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))).length === 0 && (
                              <tr><td colSpan="15" className="text-center py-20 text-slate-400 font-medium">No students meet your search criteria.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <Pagination 
                        totalItems={students.filter(s => 
                          s.course === bulkFilter.course && 
                          s.branch === bulkFilter.branch && 
                          `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                          ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase()))
                        ).length}
                        currentPage={tcPage}
                        onPageChange={setTcPage}
                      />
                    
                      <div className="action-buttons-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="premium-btn-ghost" style={{ height: '48px', padding: '0 24px' }} onClick={() => setTcStep(1)}>Back</button>
                        <button 
                          className="premium-btn-primary" 
                          style={{ height: '48px', padding: '0 32px' }} 
                          disabled={bulkSelectedIds.size === 0}
                          onClick={() => {
                            const initialData = {};
                            const filtered = students.filter(s => 
                              s.course === bulkFilter.course && 
                              s.branch === bulkFilter.branch && 
                              `${s.batchStart}-${s.batchEnd}` === bulkFilter.batch &&
                              bulkSelectedIds.has(s.registerNo)
                            );
                            filtered.forEach(s => {
                              if (certType === 'CC') {
                                initialData[s.registerNo] = {
                                  tcSelected: true,
                                  ccResultMonthYear: 'June/July - ' + (s.batchEnd || new Date().getFullYear()),
                                  ccConduct: 'Good'
                                };
                              } else {
                                initialData[s.registerNo] = { 
                                  tcSelected: true,
                                  tcPromotion: 'yes', tcCompleted: 'yes', tcFeesPaid: 'yes', 
                                  tcScholarship: 'no', tcScholarshipScheme: '', tcConduct: 'Good',
                                  tcLeftDate: new Date().toISOString().split('T')[0],
                                  tcApplyDate: new Date().toISOString().split('T')[0]
                                };
                              }
                            });
                            setTcFormData(initialData);
                            setTcStep(3);
                          }}
                        >Generate {certType === 'TC' ? 'TCs' : 'CCs'} ({bulkSelectedIds.size})</button>
                      </div>
                    </div>
                  )}

                  {tcStep === 3 && genMode === 'Single' && (
                    <div className="details-phase" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="mb-8" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                        <h2 className="text-2xl font-bold text-slate-900">Configure Certificate Record</h2>
                        <p className="text-slate-400 text-xs mt-1">Specify certification properties for {selectedStudent?.name}.</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }}>
                        {/* Student Dossier Summary */}
                        <div className="dossier-card" style={{ padding: '24px', margin: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <div className="dossier-avatar" style={{ width: '44px', height: '44px', borderRadius: '10px', fontSize: '1rem' }}>
                              {selectedStudent?.name ? selectedStudent.name.charAt(0) : 'S'}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontWeight: '700', fontSize: '0.9375rem', color: '#0f172a' }}>{selectedStudent?.name}</h4>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{selectedStudent?.registerNo}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="dossier-field">
                              <span className="dossier-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span>Course & Branch</span>
                                <button 
                                  type="button"
                                  onClick={() => setOverrideModal({
                                    show: true,
                                    type: 'course',
                                    regNo: selectedStudent.registerNo,
                                    val1: tcFormData[selectedStudent.registerNo]?.override_course || selectedStudent.course || '',
                                    val2: tcFormData[selectedStudent.registerNo]?.override_branch || selectedStudent.branch || '',
                                    val3: ''
                                  })}
                                  style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#64748b' }}
                                  title="Edit Course & Branch"
                                >
                                  <Edit size={12} />
                                </button>
                              </span>
                              <span className="dossier-value" style={{ fontSize: '0.8125rem' }}>
                                {tcFormData[selectedStudent?.registerNo]?.override_course || selectedStudent?.course} - {tcFormData[selectedStudent?.registerNo]?.override_branch || selectedStudent?.branch}
                              </span>
                            </div>
                            <div className="dossier-field">
                              <span className="dossier-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span>Admission & Batch</span>
                                <button 
                                  type="button"
                                  onClick={() => setOverrideModal({
                                    show: true,
                                    type: 'batch',
                                    regNo: selectedStudent.registerNo,
                                    val1: tcFormData[selectedStudent.registerNo]?.override_admissionNo || selectedStudent.admissionNo || '',
                                    val2: tcFormData[selectedStudent.registerNo]?.override_batchStart || selectedStudent.batchStart || '',
                                    val3: tcFormData[selectedStudent.registerNo]?.override_batchEnd || selectedStudent.batchEnd || ''
                                  })}
                                  style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#64748b' }}
                                  title="Edit Admission & Batch"
                                >
                                  <Edit size={12} />
                                </button>
                              </span>
                              <span className="dossier-value" style={{ fontSize: '0.8125rem' }}>
                                {tcFormData[selectedStudent?.registerNo]?.override_admissionNo || selectedStudent?.admissionNo} ({tcFormData[selectedStudent?.registerNo]?.override_batchStart || selectedStudent?.batchStart} - {tcFormData[selectedStudent?.registerNo]?.override_batchEnd || selectedStudent?.batchEnd})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Config Form */}
                        <div className="card" style={{ padding: '32px', border: '1px solid #cbd5e1', borderRadius: '16px', boxShadow: 'none' }}>
                          {certType === 'CC' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Result Publication Month & Year</label>
                                <input 
                                  type="text" 
                                  className="premium-search-input" 
                                  style={{ height: '44px', paddingLeft: '16px' }}
                                  value={tcFormData[selectedStudent?.registerNo]?.ccResultMonthYear || ''}
                                  onChange={e => {
                                    setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: {
                                        ...prev[selectedStudent.registerNo],
                                        ccResultMonthYear: e.target.value
                                      }
                                    }))
                                  }}
                                  placeholder="e.g. June/July - 2026"
                                />
                              </div>
                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Character & Conduct</label>
                                <select 
                                  className="premium-select" 
                                  value={tcFormData[selectedStudent?.registerNo]?.ccConduct || 'Good'}
                                  onChange={e => {
                                    setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: {
                                        ...prev[selectedStudent.registerNo],
                                        ccConduct: e.target.value
                                      }
                                    }))
                                  }}
                                >
                                  <option value="Excellent">Excellent</option>
                                  <option value="Good">Good</option>
                                  <option value="Satisfactory">Satisfactory</option>
                                  <option value="Bad">Bad</option>
                                </select>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Qualified for Promotion?</label>
                                <div className="toggle-group">
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcPromotion === 'yes' ? 'active-yes' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcPromotion: 'yes' }
                                    }))}
                                  >
                                    Yes
                                  </button>
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcPromotion === 'no' ? 'active-no' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcPromotion: 'no' }
                                    }))}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Course Completed?</label>
                                <div className="toggle-group">
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcCompleted === 'yes' ? 'active-yes' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcCompleted: 'yes' }
                                    }))}
                                  >
                                    Yes
                                  </button>
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcCompleted === 'no' ? 'active-no' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcCompleted: 'no' }
                                    }))}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">All Fees Paid?</label>
                                <div className="toggle-group">
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcFeesPaid === 'yes' ? 'active-yes' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcFeesPaid: 'yes' }
                                    }))}
                                  >
                                    Yes
                                  </button>
                                  <button 
                                    type="button" 
                                    className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcFeesPaid === 'no' ? 'active-no' : ''}`}
                                    onClick={() => setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcFeesPaid: 'no' }
                                    }))}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Scholarship Holder?</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div className="toggle-group">
                                    <button 
                                      type="button" 
                                      className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcScholarship === 'yes' ? 'active-yes' : ''}`}
                                      onClick={() => {
                                        setTcFormData(prev => ({
                                          ...prev,
                                          [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcScholarship: 'yes' }
                                        }));
                                        setScholarshipModal({ show: true, regNo: selectedStudent.registerNo, name: tcFormData[selectedStudent.registerNo]?.tcScholarshipScheme || '' });
                                      }}
                                    >
                                      Yes
                                    </button>
                                    <button 
                                      type="button" 
                                      className={`toggle-pill ${tcFormData[selectedStudent?.registerNo]?.tcScholarship === 'no' ? 'active-no' : ''}`}
                                      onClick={() => setTcFormData(prev => ({
                                        ...prev,
                                        [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcScholarship: 'no', tcScholarshipScheme: '' }
                                      }))}
                                    >
                                      No
                                    </button>
                                  </div>
                                  {tcFormData[selectedStudent?.registerNo]?.tcScholarship === 'yes' && (
                                    <button 
                                      className="edit-scheme-btn"
                                      type="button"
                                      onClick={() => setScholarshipModal({ show: true, regNo: selectedStudent.registerNo, name: tcFormData[selectedStudent.registerNo]?.tcScholarshipScheme || '' })}
                                      style={{ alignSelf: 'flex-start' }}
                                    >
                                      <Edit size={10} />
                                      <span>{tcFormData[selectedStudent.registerNo]?.tcScholarshipScheme || 'Set Scheme Name'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Student Conduct</label>
                                <select 
                                  className="premium-select" 
                                  value={tcFormData[selectedStudent?.registerNo]?.tcConduct || 'Good'}
                                  onChange={e => {
                                    setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcConduct: e.target.value }
                                    }))
                                  }}
                                >
                                  <option value="Excellent">Excellent</option>
                                  <option value="Good">Good</option>
                                  <option value="Satisfactory">Satisfactory</option>
                                  <option value="Bad">Bad</option>
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">College Leaving Date</label>
                                <input 
                                  type="date" 
                                  className="premium-search-input" 
                                  style={{ height: '44px', paddingLeft: '16px' }}
                                  value={tcFormData[selectedStudent?.registerNo]?.tcLeftDate || ''}
                                  onChange={e => {
                                    setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcLeftDate: e.target.value }
                                    }))
                                  }}
                                />
                              </div>

                              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Certificate Application Date</label>
                                <input 
                                  type="date" 
                                  className="premium-search-input" 
                                  style={{ height: '44px', paddingLeft: '16px' }}
                                  value={tcFormData[selectedStudent?.registerNo]?.tcApplyDate || ''}
                                  onChange={e => {
                                    setTcFormData(prev => ({
                                      ...prev,
                                      [selectedStudent.registerNo]: { ...prev[selectedStudent.registerNo], tcApplyDate: e.target.value }
                                    }))
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="action-buttons-footer" style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                        <button className="premium-btn-ghost" style={{ height: '48px', padding: '0 32px' }} onClick={() => setTcStep(2)} disabled={isProcessing}>Back</button>
                        <button 
                          className="premium-btn-primary" 
                          style={{ height: '48px', padding: '0 40px', opacity: isProcessing ? 0.7 : 1 }} 
                          onClick={handleFinalize}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Submitting Requests...' : 'Finalize Generation'}
                        </button>
                      </div>
                    </div>
                  )}

                  {tcStep === 3 && genMode === 'Bulk' && (
                    <div className="details-phase" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div className="mb-6 flex justify-between items-center" style={{ background: '#f8fafc', padding: '20px 24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">Batch Certificate Details</h2>
                          <p className="text-slate-400 text-xs mt-1">Configure fields for the selected students in this batch.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div className="search-input" style={{ width: '280px', background: 'white' }}>
                            <Search size={16} />
                            <input 
                              type="text" 
                              placeholder="Search processing list..." 
                              value={tcSearch}
                              onChange={e => setTcSearch(e.target.value)}
                            />
                          </div>
                          {(() => {
                            const count = students.filter(s => tcFormData[s.registerNo])
                              .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                              .length;
                            return (
                              <div className="stat-pill" style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #dbeafe', fontSize: '0.75rem', fontWeight: '700', color: '#2563eb' }}>
                                <span>{count} Students</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="scroll-container-fixed horizontal-scroll-fix" style={{ border: '1px solid #cbd5e1', borderRadius: '12px', background: 'white', flexGrow: 1, maxHeight: '350px' }}>
                        <table className="data-table fixed-width-table" style={{ minWidth: certType === 'CC' ? '1000px' : '1800px', width: certType === 'CC' ? '1000px' : '1800px' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 20 }}>
                            {certType === 'CC' ? (
                              <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ width: '50px' }}><Check size={14} /></th>
                                <th style={{ width: '120px' }}>Reg No</th>
                                <th style={{ width: '220px' }}>Student Name</th>
                                <th style={{ width: '300px' }}>Result Publication Month/Year</th>
                                <th style={{ width: '200px' }}>Character and Conduct</th>
                              </tr>
                            ) : (
                              <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ width: '50px' }}><Check size={14} /></th>
                                <th style={{ width: '120px' }}>Reg No</th>
                                <th style={{ width: '200px' }}>Student Name</th>
                                <th style={{ width: '180px' }}>Promotion?</th>
                                <th style={{ width: '180px' }}>Completed?</th>
                                <th style={{ width: '180px' }}>Fees Paid?</th>
                                <th style={{ width: '200px' }}>Scholarship?</th>
                                <th style={{ width: '200px' }}>Conduct</th>
                                <th style={{ width: '180px' }}>Left Date</th>
                                <th style={{ width: '180px' }}>Apply Date</th>
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {students.filter(s => tcFormData[s.registerNo])
                              .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                              .slice((tcPage - 1) * rowsPerPage, tcPage * rowsPerPage)
                              .map((s, i) => {
                                const data = tcFormData[s.registerNo] || {};
                                const update = (key, val) => setTcFormData(prev => ({
                                  ...prev,
                                  [s.registerNo]: { ...prev[s.registerNo], [key]: val }
                                }));

                                if (certType === 'CC') {
                                  return (
                                    <tr key={i} style={{ opacity: !data.tcSelected ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                                      <td>
                                        <input 
                                          type="checkbox" 
                                          checked={data.tcSelected || false} 
                                          onChange={e => update('tcSelected', e.target.checked)}
                                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                      </td>
                                      <td className="font-bold text-slate-700">{s.registerNo}</td>
                                      <td className="font-bold text-slate-900">{s.name}</td>
                                      <td>
                                        <input 
                                          type="text" 
                                          className="input h-9 text-xs" 
                                          style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                          value={data.ccResultMonthYear || ''} 
                                          onChange={e => update('ccResultMonthYear', e.target.value)} 
                                          placeholder="e.g. June/July - 2026"
                                        />
                                      </td>
                                      <td>
                                        <select className="table-select" value={data.ccConduct || 'Good'} onChange={e => update('ccConduct', e.target.value)}>
                                          <option value="Excellent">Excellent</option>
                                          <option value="Good">Good</option>
                                          <option value="Satisfactory">Satisfactory</option>
                                          <option value="Bad">Bad</option>
                                        </select>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={i} style={{ opacity: !data.tcSelected ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                                    <td>
                                      <input 
                                        type="checkbox" 
                                        checked={data.tcSelected || false} 
                                        onChange={e => update('tcSelected', e.target.checked)}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                    </td>
                                    <td className="font-bold text-slate-700">{s.registerNo}</td>
                                    <td className="font-bold text-slate-900">{s.name}</td>
                                    <td>
                                      <div className="table-radio-group">
                                        <label className="table-radio-label">
                                          <input type="radio" name={`promotion-${s.registerNo}`} checked={data.tcPromotion === 'yes'} onChange={() => update('tcPromotion', 'yes')} /> Yes
                                        </label>
                                        <label className="table-radio-label">
                                          <input type="radio" name={`promotion-${s.registerNo}`} checked={data.tcPromotion === 'no'} onChange={() => update('tcPromotion', 'no')} /> No
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="table-radio-group">
                                        <label className="table-radio-label">
                                          <input type="radio" name={`completed-${s.registerNo}`} checked={data.tcCompleted === 'yes'} onChange={() => update('tcCompleted', 'yes')} /> Yes
                                        </label>
                                        <label className="table-radio-label">
                                          <input type="radio" name={`completed-${s.registerNo}`} checked={data.tcCompleted === 'no'} onChange={() => update('tcCompleted', 'no')} /> No
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="table-radio-group">
                                        <label className="table-radio-label">
                                          <input type="radio" name={`fees-${s.registerNo}`} checked={data.tcFeesPaid === 'yes'} onChange={() => update('tcFeesPaid', 'yes')} /> Yes
                                        </label>
                                        <label className="table-radio-label">
                                          <input type="radio" name={`fees-${s.registerNo}`} checked={data.tcFeesPaid === 'no'} onChange={() => update('tcFeesPaid', 'no')} /> No
                                        </label>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div className="table-radio-group">
                                          <label className="table-radio-label">
                                            <input type="radio" name={`scholarship-${s.registerNo}`} checked={data.tcScholarship === 'yes'} onChange={() => { update('tcScholarship', 'yes'); setScholarshipModal({ show: true, regNo: s.registerNo, name: data.tcScholarshipScheme || '' }) }} /> Yes
                                          </label>
                                          <label className="table-radio-label">
                                            <input type="radio" name={`scholarship-${s.registerNo}`} checked={data.tcScholarship === 'no'} onChange={() => update('tcScholarship', 'no')} /> No
                                          </label>
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
                                      <select className="table-select" value={data.tcConduct} onChange={e => update('tcConduct', e.target.value)}>
                                        <option value="Excellent">Excellent</option>
                                        <option value="Good">Good</option>
                                        <option value="Satisfactory">Satisfactory</option>
                                        <option value="Bad">Bad</option>
                                      </select>
                                    </td>
                                    <td><input type="date" className="input h-9 text-xs" style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={data.tcLeftDate} onChange={e => update('tcLeftDate', e.target.value)} /></td>
                                    <td><input type="date" className="input h-9 text-xs" style={{ height: '36px', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={data.tcApplyDate} onChange={e => update('tcApplyDate', e.target.value)} /></td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>

                      <Pagination 
                        totalItems={students.filter(s => tcFormData[s.registerNo])
                          .filter(s => ((s.name || '').toLowerCase().includes(tcSearch.toLowerCase()) || (s.registerNo || '').toLowerCase().includes(tcSearch.toLowerCase())))
                          .length
                        }
                        currentPage={tcPage}
                        onPageChange={setTcPage}
                      />

                      <div className="action-buttons-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="premium-btn-ghost" style={{ height: '48px', padding: '0 24px' }} onClick={() => setTcStep(2)} disabled={isProcessing}>Back</button>
                        <button 
                          className="premium-btn-primary" 
                          style={{ height: '48px', padding: '0 32px' }} 
                          onClick={handleFinalize}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Submitting Requests...' : 'Finalize Generation'}
                        </button>
                      </div>
                    </div>
                  )}

                  {tcStep === 4 && (
                    <div className="auth-phase text-center py-10 success-anim-container" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div className="success-icon-container mb-8 success-checkmark-glow" style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                        <Check size={40} className="text-green-600" />
                      </div>
                      <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{genMode === 'Bulk' ? 'Bulk Requests Finalized' : 'Request Finalized'}</h2>
                      <p className="text-slate-500 mb-10 max-w-lg mx-auto" style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
                        {(() => {
                          if (genMode === 'Single') {
                            return `The certificate request for ${selectedStudent?.name || 'the student'} (Reg No: ${selectedStudent?.registerNo || 'N/A'}) has been successfully submitted to the principal for approval.`;
                          } else {
                            const count = bulkSelectedIds.size;
                            return `The certificate requests for ${count} ${count === 1 ? 'student' : 'students'} from ${bulkFilter.branch || 'selected branches'} (${bulkFilter.batch || 'selected batch'}) have been successfully submitted to the principal for approval.`;
                          }
                        })()}
                      </p>
                      <button className="premium-btn-primary px-12 h-14" style={{ height: '56px', fontSize: '0.9375rem' }} onClick={() => { setActiveTab('Overview'); setTcStep(0); }}>Return to Dashboard</button>
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
                    <select className="premium-select" value={filterCriteria.course} onChange={e => { setFilterCriteria(prev => ({ ...prev, course: e.target.value })); setRecordPage(1); }}>
                      <option value="">All Courses</option>
                      {Array.from(new Set(records.map(a => a.course).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                    <select className="premium-select" value={filterCriteria.branch} onChange={e => { setFilterCriteria(prev => ({ ...prev, branch: e.target.value })); setRecordPage(1); }}>
                      <option value="">All Branches</option>
                      {Array.from(new Set(records.filter(a => !filterCriteria.course || a.course === filterCriteria.course).map(a => a.branch).filter(Boolean))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Batch</label>
                    <select className="premium-select" value={filterCriteria.batch} onChange={e => { setFilterCriteria(prev => ({ ...prev, batch: e.target.value })); setRecordPage(1); }}>
                       <option value="">All Batches</option>
                       {Array.from(new Set(records.map(a => `${a.batchStart}-${a.batchEnd}`).filter(b => b !== 'undefined-undefined'))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <select className="premium-select" value={filterCriteria.status} onChange={e => { setFilterCriteria(prev => ({ ...prev, status: e.target.value })); setRecordPage(1); }}>
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
                    <th>Type</th>
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
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: '800', background: r.cert_type === 'CC' ? '#faf5ff' : '#eff6ff', color: r.cert_type === 'CC' ? '#7c3aed' : '#2563eb', padding: '4px 8px', borderRadius: '6px', border: r.cert_type === 'CC' ? '1px solid #d8b4fe' : '1px solid #bfdbfe' }}>
                          {r.cert_type || 'TC'}
                        </span>
                      </td>
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
                          <button className="icon-btn" style={{ color: '#2563eb' }} onClick={() => window.open(r.cert_type === 'CC' ? `/cc-view/${r.id}` : `/tc-view/${r.id}`, '_blank')} title="View Certificate"><Eye size={18} /></button>
                          {r.status === 'ISSUED' && (
                            <button className="icon-btn" style={{ color: '#10b981' }} onClick={() => handleDownloadPDF(r)} title={`Download ${r.cert_type || 'TC'}`}><Download size={18} /></button>
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
              {pdfData.cert_type === 'CC' ? (
                <div id="invisible-tc" style={{ 
                  background: 'white', padding: '35px 60px', height: '210mm', width: '297mm', 
                  border: '1px solid #000', color: '#000', position: 'relative', fontFamily: 'Times New Roman, serif',
                  boxSizing: 'border-box', overflow: 'hidden'
                }}>
                  {/* Double Border Frame */}
                  <div style={{ position: 'absolute', top: '16px', bottom: '16px', left: '16px', right: '16px', border: '1px solid #000', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: '20px', bottom: '20px', left: '20px', right: '20px', border: '1px solid #000', pointerEvents: 'none' }} />

                  {/* Institution Header */}
                  <div style={{ position: 'relative', marginBottom: '25px', paddingBottom: '12px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                      <img src="/logo.png" alt="ACE Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h1 style={{ fontSize: '24px', color: '#000', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '0.5px', lineHeight: '1.2' }}>ADHIYAMAAN COLLEGE OF ENGINEERING</h1>
                      <p style={{ fontWeight: '800', letterSpacing: '1px', fontSize: '14px', color: '#000', margin: '0 0 4px 0' }}>(AN AUTONOMOUS INSTITUTE)</p>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0' }}>Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai</p>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0' }}>Accredited by NBA & NAAC</p>
                      <p style={{ fontSize: '13px', fontWeight: '800', margin: '4px 0 0 0' }}>Dr. M.G.R. Nagar, HOSUR - 635 130</p>
                    </div>
                  </div>

                  {/* Certificate Title */}
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', textDecoration: 'underline', margin: '0' }}>COURSE COMPLETION CERTIFICATE</h2>
                  </div>

                  {/* Certificate Body Paragraph */}
                  <div style={{ fontSize: '18px', lineHeight: '2.2', textAlign: 'justify', textIndent: '40px', marginTop: '25px' }}>
                    This is to certify that Mr./Ms. <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{pdfData.studentName?.toUpperCase()}</span> is a bonafide student of this college and has studied <span style={{ fontWeight: 'bold' }}>{pdfData.course} {pdfData.branch}</span> Degree Course during the period <span style={{ fontWeight: 'bold' }}>{pdfData.batchStart} - {pdfData.batchEnd}</span>. Result of Final Semester is awaited, which will be published during the month of <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{pdfData.ccResultMonthYear || '---'}</span>. His/Her Character and Conduct during the above period was found to be <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{pdfData.ccConduct?.toUpperCase() || '---'}</span>.
                  </div>

                  {/* Signature & Seal Footer */}
                  <div style={{ marginTop: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '16px' }}>
                    <div>
                      <p style={{ margin: '0 0 8px 0' }}>Date: {new Date(pdfData.issue_date).toLocaleDateString()}</p>
                      <p style={{ margin: '0' }}>Seal</p>
                    </div>
                    <div style={{ textAlign: 'center', marginRight: '20px' }}>
                      <p style={{ margin: '0 0 12px 0', letterSpacing: '0.5px' }}>PRINCIPAL</p>
                      <div style={{ fontSize: '10px', padding: '6px 12px', border: '1px solid #059669', color: '#059669', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>DIGITALLY SIGNED</div>
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
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
        .vertical-stepper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        
        .vertical-stepper::before {
          content: '';
          position: absolute;
          top: 16px;
          bottom: 16px;
          left: 16px;
          width: 2px;
          background: #e2e8f0;
          z-index: 0;
        }

        .v-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          position: relative;
          z-index: 1;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .v-step.active, .v-step.completed {
          opacity: 1;
        }

        .v-step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8125rem;
          color: #64748b;
          flex-shrink: 0;
          z-index: 2;
          transition: all 0.3s ease;
        }

        .v-step.active .v-step-circle {
          border-color: #2563eb;
          color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
          transform: scale(1.05);
        }

        .v-step.completed .v-step-circle {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        .v-step-title {
          font-weight: 700;
          color: #0f172a;
          font-size: 0.875rem;
          transition: color 0.3s ease;
        }

        .v-step.active .v-step-title {
          color: #2563eb;
        }

        .v-step-desc {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
        }

        /* Premium Buttons */
        .premium-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .premium-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
          background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
        }
        .premium-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .premium-btn-primary:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .premium-btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-btn-ghost:hover:not(:disabled) {
          background: #f8fafc;
          color: #1e293b;
          border-color: #94a3b8;
        }
        .premium-btn-ghost:active:not(:disabled) {
          background: #f1f5f9;
        }
        .premium-btn-ghost:disabled {
          background: #f1f5f9;
          color: #cbd5e1;
          border-color: #e2e8f0;
          cursor: not-allowed;
        }

        /* Premium Inputs & Selects */
        .premium-input-container {
          position: relative;
          width: 100%;
        }
        .premium-search-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 44px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1e293b;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-search-input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .premium-search-input::placeholder {
          color: #94a3b8;
        }

        .premium-select {
          width: 100%;
          padding: 12px 40px 12px 16px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #1e293b;
          outline: none;
          appearance: none;
          line-height: 1.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .premium-select:focus {
          border-color: #2563eb;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .premium-select:disabled {
          background-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .table-select {
          width: 100%;
          height: 36px;
          padding: 0 28px 0 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .table-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* Active Indicator & Dossier Badge */
        .active-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          background: #ffffff;
          transition: all 0.3s ease;
        }
        .mode-card-premium.active .active-indicator {
          border-color: #2563eb;
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.3);
        }

        .dossier-badge {
          position: absolute;
          top: 24px;
          right: 32px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Search Autocomplete Suggestions Dropdown */
        .search-suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 16px -8px rgba(0, 0, 0, 0.08);
          max-height: 240px;
          overflow-y: auto;
          z-index: 100;
          padding: 6px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .suggestion-item:hover {
          background: #eff6ff;
        }

        .suggestion-reg {
          font-weight: 700;
          color: #2563eb;
        }

        .suggestion-divider {
          margin: 0 8px;
          color: #cbd5e1;
        }

        .suggestion-name {
          font-weight: 600;
          color: #0f172a;
          flex-grow: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-course {
          font-size: 0.75rem;
          color: #64748b;
          margin-left: 8px;
        }

        .suggestion-no-results {
          padding: 12px 14px;
          color: #64748b;
          font-size: 0.875rem;
          text-align: center;
        }
        
        .search-suggestions-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .search-suggestions-dropdown::-webkit-scrollbar-track {
          background: transparent;
        }
        .search-suggestions-dropdown::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }

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

        /* Dynamic / Premium Styles for Generate Record */
        .segmented-control {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          width: 100%;
        }
        .segmented-btn {
          flex: 1;
          height: 40px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          color: #64748b;
        }
        .segmented-btn.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
        }

        .dossier-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.02);
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        .dossier-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
        }
        .dossier-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 20px;
        }
        .dossier-avatar {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          border: 1px solid #bfdbfe;
        }
        .dossier-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .dossier-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dossier-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .dossier-value {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .toggle-group {
          display: flex;
          gap: 8px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          width: fit-content;
          border: 1px solid #cbd5e1;
        }
        .toggle-pill {
          padding: 8px 20px;
          border-radius: 7px;
          border: none;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .toggle-pill.active-yes {
          background: #ffffff;
          color: #16a34a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }
        .toggle-pill.active-no {
          background: #ffffff;
          color: #dc2626;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
        }

        .success-anim-container {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-checkmark-glow {
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          animation: pulseGreen 2s infinite;
        }
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* Custom radio style inside table cells */
        .table-radio-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .table-radio-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          user-select: none;
          margin-bottom: 0 !important;
        }
        .table-radio-label input[type="radio"] {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          outline: none;
          transition: all 0.2s;
          position: relative;
          background: #ffffff;
          cursor: pointer;
        }
        .table-radio-label input[type="radio"]:checked {
          border-color: #2563eb;
          background: #2563eb;
        }
        .table-radio-label input[type="radio"]:checked::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ffffff;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
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
                  className="table-select" 
                  style={{ width: '140px' }}
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
                if (!scholarshipModal.name || !scholarshipModal.name.trim()) {
                  alert('Scholarship scheme name is required.');
                  return;
                }
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

      {/* Overrides Modal */}
      {overrideModal.show && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="view-header mb-6">
              <h2 className="text-xl font-bold">
                {overrideModal.type === 'course' ? 'Rename Course & Branch' : 'Rename Admission & Batch'}
              </h2>
              <button className="icon-btn" onClick={() => setOverrideModal({ ...overrideModal, show: false })}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="mb-6">
              {overrideModal.type === 'course' ? (
                <>
                  <div className="form-group">
                    <label className="label">Course Name</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. B.Tech" 
                      value={overrideModal.val1}
                      onChange={e => setOverrideModal({ ...overrideModal, val1: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Department / Branch</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. Computer Science" 
                      value={overrideModal.val2}
                      onChange={e => setOverrideModal({ ...overrideModal, val2: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="label">Admission Number</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="e.g. ADM001" 
                      value={overrideModal.val1}
                      onChange={e => setOverrideModal({ ...overrideModal, val1: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="label">Batch Start Year</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. 2021" 
                        value={overrideModal.val2}
                        onChange={e => setOverrideModal({ ...overrideModal, val2: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Batch End Year</label>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="e.g. 2025" 
                        value={overrideModal.val3}
                        onChange={e => setOverrideModal({ ...overrideModal, val3: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 justify-end">
              <button className="btn" onClick={() => setOverrideModal({ ...overrideModal, show: false })}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (overrideModal.type === 'course') {
                    if (!overrideModal.val1.trim() || !overrideModal.val2.trim()) {
                      alert('Both Course and Branch names are required.');
                      return;
                    }
                    if (!window.confirm('Are you sure you want to override the Course & Branch details for this certificate only? This will not alter the permanent database record of the student.')) {
                      return;
                    }
                    setTcFormData(prev => ({
                      ...prev,
                      [overrideModal.regNo]: { 
                        ...prev[overrideModal.regNo], 
                        override_course: overrideModal.val1.trim(),
                        override_branch: overrideModal.val2.trim()
                      }
                    }));
                  } else {
                    if (!overrideModal.val1.trim() || !overrideModal.val2.trim() || !overrideModal.val3.trim()) {
                      alert('Admission Number, Batch Start, and Batch End years are all required.');
                      return;
                    }
                    if (!window.confirm('Are you sure you want to override the Admission & Batch details for this certificate only? This will not alter the permanent database record of the student.')) {
                      return;
                    }
                    setTcFormData(prev => ({
                      ...prev,
                      [overrideModal.regNo]: { 
                        ...prev[overrideModal.regNo], 
                        override_admissionNo: overrideModal.val1.trim(),
                        override_batchStart: overrideModal.val2.trim(),
                        override_batchEnd: overrideModal.val3.trim()
                      }
                    }));
                  }
                  setOverrideModal({ ...overrideModal, show: false });
                }}
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfficeDashboard
