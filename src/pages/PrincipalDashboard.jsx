import { useState, useEffect } from 'react'
import { LayoutDashboard, ShieldCheck, PieChart, LogOut, ChevronRight, CheckCircle, XCircle, Search, Eye, Download, X, User, Filter } from 'lucide-react'

const PrincipalDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [allCertificates, setAllCertificates] = useState([]);
  const [approvalPage, setApprovalPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const rowsPerPage = 10;

  const [stats, setStats] = useState([
    { label: 'Pending Signature', value: 0, color: '#f59e0b' },
    { label: 'Authorized Records', value: 0, color: '#10b981' },
    { label: 'Pending Distribution', value: 0, color: '#6366f1' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkSelection, setBulkSelection] = useState(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showReportsFilterPanel, setShowReportsFilterPanel] = useState(false);
  
  const [approvalSearch, setApprovalSearch] = useState('');
  const [approvalFilters, setApprovalFilters] = useState({ course: '', branch: '', batch: '' });
  
  const [reportsSearch, setReportsSearch] = useState('');
  const [reportsFilters, setReportsFilters] = useState({ course: '', branch: '', batch: '' });

  const getFilteredList = (list, search, filters) => {
    return list.filter(a => {
      const term = (a.studentName || '').toLowerCase() + (a.registerNo || '').toLowerCase();
      const searchMatch = term.includes(search.toLowerCase());
      const courseMatch = !filters.course || a.course === filters.course;
      const branchMatch = !filters.branch || a.branch === filters.branch;
      const batchMatch = !filters.batch || `${a.batchStart}-${a.batchEnd}` === filters.batch;
      return searchMatch && courseMatch && branchMatch && batchMatch;
    });
  };

  const pendingEntries = allCertificates.filter(c => c.status === 'AWAITING AUTH');
  const issuedEntries = allCertificates.filter(c => c.status === 'ISSUED');

  const filteredApprovals = getFilteredList(pendingEntries, approvalSearch, approvalFilters);
  const filteredReports = getFilteredList(issuedEntries, reportsSearch, reportsFilters);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/certificates');
      const data = await response.json();
      
      const pending = data.filter(c => c.status === 'AWAITING AUTH');
      const authorized = data.filter(c => c.status === 'ISSUED').length;
      const ready = data.filter(c => c.status === 'READY').length;

      setAllCertificates(data);
      setBulkSelection(new Set(pending.map(p => p.id)));
      setStats([
        { label: 'Pending Signature', value: pending.length, color: '#f59e0b' },
        { label: 'Authorized Records', value: authorized, color: '#10b981' },
        { label: 'Pending Distribution', value: ready, color: '#6366f1' }
      ]);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    }
  }

  const handleAuthorize = async (id) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/certificates/${id}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        fetchApprovals();
      }
    } catch (err) {
      console.error('Authorization failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleBulkApprove = async () => {
    if (bulkSelection.size === 0) return alert('Select students to approve first.');
    setIsProcessing(true);
    try {
      await Promise.all(Array.from(bulkSelection).map(id => 
        fetch(`http://localhost:5000/api/certificates/${id}/authorize`, { method: 'POST' })
      ));
      fetchApprovals();
      setBulkSelection(new Set());
    } catch (err) {
      console.error('Bulk Approval failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this TC request?')) return;
    try {
      await fetch(`http://localhost:5000/api/certificates/${id}/reject`, { method: 'POST' });
      fetchApprovals();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  }

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
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        if (n < 20) return singles[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + singles[n % 10] : "");
      };

      const yearToWords = (yr) => {
        const rem = yr % 100;
        const thousand = Math.floor(yr / 1000);
        const hundred = Math.floor((yr % 1000) / 100);
        let s = numToWords(thousand) + " Thousand";
        if (hundred > 0) s += " " + numToWords(hundred) + " Hundred";
        if (rem > 0) s += " and " + numToWords(rem);
        return s;
      };

      return `${numToWords(d)} ${m} ${yearToWords(y)}`.toUpperCase();
    } catch { return dateStr; }
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} className="text-primary" style={{ color: '#2563eb' }} />
          <span style={{ fontSize: '1.25rem' }}>ACE Principal</span>
        </div>
        
        <nav className="nav">
          {[
            { name: 'Overview', icon: <LayoutDashboard size={18} /> },
            { name: 'Approvals', icon: <ShieldCheck size={18} /> },
            { name: 'Reports', icon: <PieChart size={18} /> },
          ].map((item) => (
            <button 
              key={item.name} 
              onClick={() => setActiveTab(item.name)} 
              className={`nav-link ${activeTab === item.name ? 'active' : ''}`}
            >
              {item.icon}<span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => window.location.href = '/'}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <div className="breadcrumb">
            <span className="text-muted">Signature Portal</span>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-medium">{activeTab}</span>
          </div>
          <div className="header-user">
            <div className="avatar" style={{ background: '#4f46e5' }}><User size={16} /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="font-bold text-slate-900" style={{ fontSize: '0.875rem', lineHeight: 1 }}>Principal Dr. S. K.</span>
              <span className="text-slate-400 font-medium" style={{ fontSize: '0.75rem' }}>Authorized Signatory</span>
            </div>
          </div>
        </header>

        <div className="scroll-area">
          {activeTab === 'Overview' && (
            <div className="overview-container">
              <div className="overview-grid">
                {stats.map((s, i) => (
                  <div key={i} className="stat-card card">
                    <div className="stat-info">
                      <span className="text-muted font-small uppercase tracking-widest font-bold">{s.label}</span>
                      <h2 className="stat-value" style={{ color: s.color }}>{s.value}</h2>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="data-view card" style={{ gridColumn: 'span 3', marginTop: '24px' }}>
                <div className="view-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="text-lg font-bold">Priority Authorization Queue</h3>
                  <button className="btn btn-primary" onClick={() => setActiveTab('Approvals')}>View Full Queue</button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reg No</th>
                      <th>Student Name</th>
                      <th>Request Date</th>
                      <th className="text-center" style={{ width: '120px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingEntries.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium text-slate-600">{r.registerNo}</td>
                        <td className="font-bold text-slate-900">{r.studentName}</td>
                        <td className="text-slate-500">{r.issue_date}</td>
                        <td className="text-center">
                          <button className="icon-btn" onClick={() => window.open(`/tc-view/${r.id}`, '_blank')}><Eye size={18} /></button>
                        </td>
                      </tr>
                    ))}
                    {pendingEntries.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-400 italic">No certificates awaiting your definitive signature today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

           {activeTab === 'Approvals' && (
            <div className="data-view card">
              <div className="view-header mb-6">
                <div>
                  <h2 className="text-xl font-bold">TC Approval Portal</h2>
                  <p className="text-muted font-small">Review and verify student certificate requests</p>
                </div>
                <div className="header-actions">
                  <div className="search-input" style={{ width: '220px' }}>
                    <Search size={18} />
                    <input type="text" placeholder="Search students..." value={approvalSearch} onChange={e => { setApprovalSearch(e.target.value); setApprovalPage(1); }} />
                  </div>
                  <button className={`btn ${showFilterPanel ? 'btn-primary' : ''}`} style={{ border: '1px solid #e2e8f0', background: showFilterPanel ? '#2563eb' : 'white', color: showFilterPanel ? 'white' : '#64748b' }} onClick={() => setShowFilterPanel(!showFilterPanel)}><Filter size={18} /></button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleBulkApprove} 
                    disabled={isProcessing || bulkSelection.size === 0}
                    style={{ background: '#10b981', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                  >
                    <CheckCircle size={18} />
                    <span>Approve Selected ({bulkSelection.size})</span>
                  </button>
                </div>
              </div>

              {showFilterPanel && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Course</label>
                    <select className="input h-10" value={approvalFilters.course} onChange={e => { setApprovalFilters(prev => ({ ...prev, course: e.target.value })); setApprovalPage(1); }}>
                      <option value="">All Courses</option>
                      {Array.from(new Set(allCertificates.map(a => a.course).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                    <select className="input h-10" value={approvalFilters.branch} onChange={e => { setApprovalFilters(prev => ({ ...prev, branch: e.target.value })); setApprovalPage(1); }}>
                      <option value="">All Branches</option>
                      {Array.from(new Set(allCertificates.filter(a => !approvalFilters.course || a.course === approvalFilters.course).map(a => a.branch).filter(Boolean))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Batch</label>
                    <select className="input h-10" value={approvalFilters.batch} onChange={e => { setApprovalFilters(prev => ({ ...prev, batch: e.target.value })); setApprovalPage(1); }}>
                      <option value="">All Batches</option>
                      {Array.from(new Set(allCertificates.map(a => `${a.batchStart}-${a.batchEnd}`).filter(b => b !== 'undefined-undefined'))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <button className="btn" style={{ marginTop: '18px', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => { setApprovalFilters({ course: '', branch: '', batch: '' }); setApprovalSearch(''); }}>Reset</button>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={filteredApprovals.length > 0 && filteredApprovals.every(a => bulkSelection.has(a.id))} 
                        onChange={(e) => {
                          if (e.target.checked) setBulkSelection(new Set(filteredApprovals.map(a => a.id)));
                          else setBulkSelection(new Set());
                        }}
                      />
                    </th>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Branch</th>
                    <th>Batch</th>
                    <th className="text-center" style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals
                    .slice((approvalPage - 1) * rowsPerPage, approvalPage * rowsPerPage)
                    .map((r, i) => (
                    <tr key={i} style={{ opacity: !bulkSelection.has(r.id) ? 0.6 : 1 }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={bulkSelection.has(r.id)} 
                          onChange={() => {
                            const next = new Set(bulkSelection);
                            if (next.has(r.id)) next.delete(r.id);
                            else next.add(r.id);
                            setBulkSelection(next);
                          }}
                        />
                      </td>
                      <td className="font-bold text-slate-600">{r.registerNo}</td>
                      <td className="font-bold text-slate-900">{r.studentName}</td>
                      <td className="text-slate-600 font-medium">{r.course || '---'}</td>
                      <td className="text-slate-600 font-medium">{r.branch || '---'}</td>
                      <td className="text-slate-500">{`${r.batchStart}-${r.batchEnd}`}</td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="icon-btn" style={{ color: '#64748b' }} onClick={() => window.open(`/tc-view/${r.id}`, '_blank')} title="View Certificate"><Eye size={18} /></button>
                          <button className="icon-btn" style={{ color: '#10b981' }} onClick={() => handleAuthorize(r.id)} title="Approve TC"><CheckCircle size={20} /></button>
                          <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleReject(r.id)} title="Reject TC"><XCircle size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApprovals.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-20 text-slate-400 font-medium italic">{(approvalSearch || approvalFilters.course || approvalFilters.branch || approvalFilters.batch) ? 'No certificate requests match your current filters.' : 'System Clear: No institutional certifications are currently awaiting authorization.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={filteredApprovals.length} 
                currentPage={approvalPage} 
                onPageChange={setApprovalPage} 
              />
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="data-view card">
              <div className="view-header mb-6">
                <div>
                  <h2 className="text-xl font-bold">Institutional Records</h2>
                  <p className="text-muted font-small">Archive of authorized Transfer Certificates</p>
                </div>
                <div className="header-actions">
                  <div className="search-input" style={{ width: '220px' }}>
                    <Search size={18} />
                    <input type="text" placeholder="Search records..." value={reportsSearch} onChange={e => { setReportsSearch(e.target.value); setReportsPage(1); }} />
                  </div>
                  <button className={`btn ${showReportsFilterPanel ? 'btn-primary' : ''}`} style={{ border: '1px solid #e2e8f0', background: showReportsFilterPanel ? '#2563eb' : 'white', color: showReportsFilterPanel ? 'white' : '#64748b' }} onClick={() => setShowReportsFilterPanel(!showReportsFilterPanel)}><Filter size={18} /></button>
                </div>
              </div>

              {showReportsFilterPanel && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Course</label>
                    <select className="input h-10" value={reportsFilters.course} onChange={e => { setReportsFilters(prev => ({ ...prev, course: e.target.value })); setReportsPage(1); }}>
                      <option value="">All Courses</option>
                      {Array.from(new Set(allCertificates.map(a => a.course).filter(Boolean))).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Branch</label>
                    <select className="input h-10" value={reportsFilters.branch} onChange={e => { setReportsFilters(prev => ({ ...prev, branch: e.target.value })); setReportsPage(1); }}>
                      <option value="">All Branches</option>
                      {Array.from(new Set(allCertificates.filter(a => !reportsFilters.course || a.course === reportsFilters.course).map(a => a.branch).filter(Boolean))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Batch</label>
                    <select className="input h-10" value={reportsFilters.batch} onChange={e => { setReportsFilters(prev => ({ ...prev, batch: e.target.value })); setReportsPage(1); }}>
                      <option value="">All Batches</option>
                      {Array.from(new Set(allCertificates.map(a => `${a.batchStart}-${a.batchEnd}`).filter(b => b !== 'undefined-undefined'))).map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <button className="btn" style={{ marginTop: '18px', background: 'white', border: '1px solid #cbd5e1' }} onClick={() => { setReportsFilters({ course: '', branch: '', batch: '' }); setReportsSearch(''); }}>Reset</button>
                </div>
              )}

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Branch</th>
                    <th>Batch</th>
                    <th>Auth Code</th>
                    <th className="text-center" style={{ width: '100px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports
                    .slice((reportsPage - 1) * rowsPerPage, reportsPage * rowsPerPage)
                    .map((r, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-600">{r.registerNo}</td>
                      <td className="font-bold text-slate-900">{r.studentName}</td>
                      <td className="text-slate-600 font-medium">{r.course || '---'}</td>
                      <td className="text-slate-600 font-medium">{r.branch || '---'}</td>
                      <td className="text-slate-500">{`${r.batchStart}-${r.batchEnd}`}</td>
                      <td className="font-mono text-xs font-bold text-blue-600">{r.auth_code}</td>
                      <td className="text-center">
                        <button className="icon-btn" style={{ color: '#64748b' }} onClick={() => window.open(`/tc-view/${r.id}`, '_blank')} title="View Certificate"><Eye size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-20 text-slate-400 font-medium italic">{(reportsSearch || reportsFilters.course || reportsFilters.branch || reportsFilters.batch) ? 'No institutional records match your current filters.' : 'Institutional Registry: No authorized certificates are currently on record.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={filteredReports.length} 
                currentPage={reportsPage} 
                onPageChange={setReportsPage} 
              />
            </div>
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-layout { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .sidebar { width: 260px; background: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 32px 0; }
        .brand { padding: 0 24px; display: flex; align-items: center; gap: 16px; margin-bottom: 48px; font-weight: 800; font-size: 1.25rem; color: #0f172a; }
        .nav { flex: 1; display: flex; flex-direction: column; gap: 6px; padding: 0 16px; }
        .nav-link { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; color: #64748b; font-weight: 600; font-size: 0.875rem; background: transparent; border: none; cursor: pointer; text-align: left; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-link:hover { background: #f1f5f9; color: #0f172a; }
        .nav-link.active { background: #eff6ff; color: #2563eb; }
        .content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .content-header { height: 72px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
        .avatar { width: 40px; height: 40px; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
        .header-user { display: flex; align-items: center; gap: 14px; }
        .scroll-area { flex: 1; padding: 40px; overflow-y: auto; background: #f8fafc; }
        .stat-card { padding: 32px; flex: 1; min-width: 280px; }
        .stat-value { font-size: 2rem; font-weight: 800; margin-top: 8px; }
        .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .overview-grid { display: flex; gap: 24px; flex-wrap: wrap; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 16px; border-bottom: 2px solid #f1f5f9; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
        .data-table td { padding: 20px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .icon-btn { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 10px; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .icon-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-container-fixed { background: white; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .view-header { display: flex; justify-content: space-between; align-items: center; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 0 20px; height: 44px; border-radius: 10px; font-weight: 700; font-size: 0.8125rem; cursor: pointer; transition: all 0.2s; }
        .btn-primary { background: #2563eb; color: white; border: none; }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .search-input { display: flex; align-items: center; background: #f1f5f9; border-radius: 12px; padding: 0 16px; height: 44px; gap: 12px; }
        .search-input input { background: transparent; border: none; outline: none; width: 100%; font-size: 0.875rem; color: #334155; font-weight: 500; }
        .header-actions { display: flex; gap: 12px; align-items: center; }
      `}} />
    </div>
  )
}

export default PrincipalDashboard
