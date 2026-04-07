import { useState, useEffect } from 'react'
import { LayoutDashboard, ShieldCheck, PieChart, LogOut, ChevronRight, CheckCircle, XCircle, Search, Eye, Download, X, User } from 'lucide-react'

const PrincipalDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview')
  const [approvals, setApprovals] = useState([]);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [approvalPage, setApprovalPage] = useState(1)
  const rowsPerPage = 10

  const [stats, setStats] = useState([
    { label: 'Pending Signature', value: 0, color: '#f59e0b', key: 'AWAITING AUTH' },
    { label: 'Authorized Records', value: 0, color: '#10b981', key: 'ISSUED' },
    { label: 'Pending Distribution', value: 0, color: '#6366f1', key: 'READY' }
  ])
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

      setApprovals(pending);
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
        setShowDocumentPreview(false);
        fetchApprovals();
      }
    } catch (err) {
      console.error('Authorization failed:', err);
    } finally {
      setIsProcessing(false);
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
                    {approvals.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium text-slate-600">{r.registerNo}</td>
                        <td className="font-bold text-slate-900">{r.studentName}</td>
                        <td className="text-slate-500">{r.issue_date}</td>
                        <td className="text-center">
                          <button className="icon-btn" onClick={() => { setSelectedApproval(r); setShowDocumentPreview(true); }}><Eye size={18} /></button>
                        </td>
                      </tr>
                    ))}
                    {approvals.length === 0 && (
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
                  <h2 className="text-xl font-bold">Institutional Authorization Hub</h2>
                  <p className="text-muted font-small">Review and digitally authorize pending academic certifications</p>
                </div>
                <div className="header-actions">
                  <div className="search-input" style={{ width: '320px' }}>
                    <Search size={18} />
                    <input type="text" placeholder="Search by name or register number..." />
                  </div>
                  <button className="btn" style={{ border: '1px solid #e2e8f0' }}><Download size={18} /><span>Reports</span></button>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Candidate Name</th>
                    <th>Academic Department</th>
                    <th className="text-center">Inherent Status</th>
                    <th className="text-center" style={{ width: '150px' }}>Definitive Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals
                    .slice((approvalPage - 1) * rowsPerPage, approvalPage * rowsPerPage)
                    .map((r, i) => (
                    <tr key={i}>
                      <td className="font-bold text-slate-600">{r.registerNo}</td>
                      <td className="font-bold text-slate-900">{r.studentName}</td>
                      <td className="text-slate-600 font-medium">{r.branch || 'N/A'}</td>
                      <td className="text-center">
                        <span style={{ background: '#fffbeb', color: '#b45309', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.status}</span>
                      </td>
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button className="icon-btn" style={{ color: '#2563eb' }} title="Verify Details" onClick={() => { setSelectedApproval(r); setShowDocumentPreview(true); }}><Search size={18} /></button>
                          <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }} onClick={() => { setSelectedApproval(r); setShowDocumentPreview(true); }}>Sign TC</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {approvals.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-20 text-slate-400 font-medium">System Clear: No institutional certifications are currently awaiting authorization.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination 
                totalItems={approvals.length} 
                currentPage={approvalPage} 
                onPageChange={setApprovalPage} 
              />
            </div>
          )}

          {activeTab === 'Reports' && (
            <div className="placeholder-card card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 40px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '24px' }}><PieChart size={40} /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Institutional Analytics</h2>
              <p className="text-slate-400 max-w-sm">The advanced institutional reporting and academy-wide data visualization module is currently being finalized.</p>
            </div>
          )}
        </div>
      </main>

      {showDocumentPreview && (
        <div className="modal-overlay">
          <div className="modal-container-fixed" style={{ maxWidth: '900px', width: '95%', height: '90vh' }}>
            <div className="modal-header-fixed" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', padding: '24px 32px' }}>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Document Integrity Verification</h2>
                <p className="text-slate-400 font-medium tracking-wide">Institutional Academic Dossier • Transfer Certificate #{selectedApproval?.auth_code || 'PENDING'}</p>
              </div>
              <button className="icon-btn" style={{ background: 'transparent', border: 'none' }} onClick={() => setShowDocumentPreview(false)}><X size={28} /></button>
            </div>
            <div className="modal-form-wrapper" style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', padding: '40px' }}>
              <div style={{ background: 'white', padding: '80px', minHeight: '1100px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', borderRadius: '4px', margin: '0 auto', maxWidth: '800px', border: '1px solid #e1e8ef' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                  <h1 style={{ fontSize: '24px', color: '#1e3a8a', fontWeight: '900' }}>ADHIYAMAAN COLLEGE OF ENGINEERING</h1>
                  <p style={{ fontWeight: '800', letterSpacing: '0.1em', marginTop: '4px' }}>(AUTONOMOUS)</p>
                  <p style={{ fontSize: '12px' }}>HOSUR, TAMIL NADU - 635130</p>
                </div>

                <div style={{ height: '4px', background: '#1e3a8a', marginBottom: '60px' }}></div>
                
                <h2 style={{ textAlign: 'center', fontSize: '20px', textDecoration: 'underline', fontWeight: '800', marginBottom: '80px' }}>TRANSFER CERTIFICATE</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '16px', lineHeight: '1.6' }}>
                  <p>Certified that the following institutional records have been verified against the master academy database:</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#64748b' }}>Candidate Name:</div>
                    <div style={{ fontWeight: '900' }}>{selectedApproval?.studentName || '---'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#64748b' }}>Register Number:</div>
                    <div style={{ fontWeight: '900' }}>{selectedApproval?.registerNo || '---'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#64748b' }}>Degree / Branch:</div>
                    <div style={{ fontWeight: '900' }}>{selectedApproval?.branch || '---'}</div>
                  </div>
                  
                  <p style={{ marginTop: '40px' }}>The student named above is found eligible for this certification as of {new Date().toLocaleDateString()}.</p>
                </div>

                <div style={{ marginTop: '200px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '200px', paddingTop: '8px' }}>
                    <p style={{ fontWeight: '900' }}>PRINCIPAL</p>
                    <p style={{ fontSize: '10px' }}>DIGITAL SIGNATURE PENDING</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer-static" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn" style={{ border: '1px solid #e2e8f0', height: '52px', padding: '0 32px', borderRadius: '12px', fontWeight: '700' }} onClick={() => setShowDocumentPreview(false)} disabled={isProcessing}>Decline Action</button>
              <button 
                style={{ background: '#059669', color: 'white', border: 'none', padding: '0 48px', height: '52px', borderRadius: '12px', fontWeight: '900', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)', opacity: isProcessing ? 0.7 : 1 }} 
                onClick={() => handleAuthorize(selectedApproval?.id)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Authorizing...' : 'Digitally Sign & Authorize'}
              </button>
            </div>
          </div>
        </div>
      )}

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
