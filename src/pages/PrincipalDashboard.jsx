import { useState, useEffect } from 'react'
import { Landmark, ShieldCheck, Search, LogOut, ChevronRight, CheckCircle, XCircle, Download, X, Eye, FileText, Activity } from 'lucide-react'

const PrincipalDashboard = () => {
  const [activeTab, setActiveTab] = useState('Approvals')
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const [currentPageApprovals, setCurrentPageApprovals] = useState(1)
  const [currentPageLogs, setCurrentPageLogs] = useState(1)
  const [viewedRecord, setViewedRecord] = useState(null) // Added state for the record being viewed
  const rowsPerPage = 10

  // Function to handle downloading the Transfer Certificate
  const handleDownloadTC = () => {
    // In a real application, you might use 'viewedRecord' to fetch specific data
    // or generate a specific PDF. For this mockup, we just print the current view.
    setTimeout(() => {
      window.print();
    }, 800); // Small delay to ensure modal content is fully rendered before printing
  }

  // Function to handle viewing the Transfer Certificate
  const handleViewTC = (record) => {
    setViewedRecord(record);
    setShowDocumentPreview(true);
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand"><Landmark className="brand-icon" /><span>Principal Office</span></div>
        <nav className="sidebar-nav">
          {[
            { name: 'Approvals', icon: <ShieldCheck size={18} /> },
            { name: 'Reports', icon: <i className="fa-solid fa-chart-pie" style={{ fontSize: '18px' }} /> },
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
              <div className="profile-img-small principal">PR</div>
              <div className="profile-info-compact">
                <span className="p-name">Principal Dr. S. K.</span>
              </div>
            </div>
          </div>
        </header>

        <section className="view-content">
          {activeTab === 'Approvals' ? (
            <div className="content-table-view">
              <div className="table-header-complex">
                <div className="table-header-top-row">
                  <div className="table-header">
                    <h3>Authorization Queue</h3>
                  </div>
                  <div className="table-header-controls">
                    <div className="compact-search-box" style={{ minWidth: '320px' }}>
                      <Search size={14} color="#94a3b8" />
                      <input type="text" placeholder="Search pending requests by register number..." />
                    </div>
                  </div>
                </div>
              </div>
              <div className="dummy-table">
                <div className="row header-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 220px' }}>
                  <span>Register No</span>
                  <span>Full Name</span>
                  <span>Request Date</span>
                  <span>Branch</span>
                  <span>Status</span>
                  <span style={{textAlign: 'center'}}>Executive Actions</span>
                </div>
                {[
                  { reg: '21EC045', name: 'Arun Kumar', date: 'Today, 09:30', branch: 'ECE', status: 'AWAITING AUTH' },
                  { reg: '21ME092', name: 'Siddharth Menon', date: 'Today, 09:12', branch: 'MECH', status: 'AWAITING AUTH' }
                ].slice((currentPageApprovals - 1) * rowsPerPage, currentPageApprovals * rowsPerPage).map((row, idx) => (
                  <div key={idx} className="row student-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 220px' }}>
                    <span>{row.reg}</span>
                    <span className="font-bold text-gray-900">{row.name}</span>
                    <span>{row.date}</span>
                    <span>{row.branch}</span>
                    <div>
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{row.status}</span>
                    </div>
                    <div className="table-actions-cell" style={{ justifyContent: 'center', gap: '8px' }}>
                      <button className="action-icon-btn view" title="View Document Preview" onClick={() => setShowDocumentPreview(true)}>
                        <i className="fa-solid fa-file-invoice" style={{ fontSize: '12px' }}></i>
                      </button>
                      <button className="approve-action-btn" title="Authorize and Sign">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="reject-action-btn" title="Reject Generation">
                        <XCircle size={14} /> Reject
                      </button>
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
          ) : activeTab === 'Reports' ? (
            <div className="reports-view">
              <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
                <div className="stat-card">
                  <div className="stat-info"><h3>Pending Authorizations</h3><p>14</p></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info"><h3>Total Approved</h3><p>1,204</p></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info"><h3>Total Rejected</h3><p>28</p></div>
                </div>
              </div>

              <div className="content-table-view">
                <div className="table-header-complex">
                  <div className="table-header-top-row">
                    <div className="table-header">
                      <h3>Processed Execution Logs</h3>
                    </div>
                    <div className="table-header-controls">
                      <div className="compact-search-box" style={{ minWidth: '320px' }}>
                        <Search size={14} color="#94a3b8" />
                        <input type="text" placeholder="Search execution logs by register number..." />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="dummy-table">
                  <div className="row header-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 130px' }}>
                    <span>Register No</span>
                    <span>Full Name</span>
                    <span>Decision Date</span>
                    <span>Branch</span>
                    <span>Outcome</span>
                    <span style={{textAlign: 'center'}}>Official Record</span>
                  </div>
                {[
                  { reg: '21CS001', name: 'Rahul Sharma', date: '14/05/2026', branch: 'CSE', outcome: 'APPROVED' },
                  { reg: '21IT024', name: 'Sneha Patel', date: '12/05/2026', branch: 'IT', outcome: 'APPROVED' },
                  { reg: '21EE051', name: 'Kiran S', date: '10/05/2026', branch: 'EEE', outcome: 'REJECTED' }
                ].slice((currentPageLogs - 1) * rowsPerPage, currentPageLogs * rowsPerPage).map((row, idx) => (
                  <div key={idx} className="row student-row" style={{ gridTemplateColumns: '130px 1.5fr 1fr 140px 140px 130px' }}>
                    <span>{row.reg}</span>
                    <span className="font-bold text-gray-900">{row.name}</span>
                    <span>{row.date}</span>
                    <span>{row.branch}</span>
                    <div>
                      <span style={{ background: row.outcome === 'APPROVED' ? '#ecfdf5' : '#fef2f2', color: row.outcome === 'APPROVED' ? '#059669' : '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{row.outcome}</span>
                    </div>
                    <div className="table-actions-cell" style={{ justifyContent: 'center' }}>
                      <button className="action-icon-btn view" title="View Official Certificate" onClick={() => setShowDocumentPreview(true)}>
                        <i className="fa-solid fa-file-invoice" style={{ fontSize: '12px' }}></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="table-pagination-footer">
                <div className="pagination-info">Showing 1 to 3 of 3 entries</div>
                <div className="pagination-controls">
                  <button className="pag-btn" disabled><i className="fa-solid fa-chevron-left"></i></button>
                  <button className="pag-btn active">1</button>
                  <button className="pag-btn" disabled><i className="fa-solid fa-chevron-right"></i></button>
                </div>
              </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>

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
                      <div>Admission No: {viewedRecord?.admissionNo || 'ADM21894'}</div>
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
                        { num: '8.', lbl: 'Whether the Course has been completed (or) not', val: 'YES' },
                        { num: '9.', lbl: 'Medium of Instruction', val: viewedRecord?.mediumOfInstruction || 'English' },
                        { num: '10.', lbl: 'Whether Qualified for promotion to a higher class (or) not', val: 'YES' },
                        { num: '11.', lbl: 'Whether the student has paid all the fees due to the college', val: 'YES' },
                        { num: '12.', lbl: 'Date on which the Student actually left the College', val: '14/05/2026' },
                        { num: '13.', lbl: 'Date on which application for Transfer Certificate was made', val: '10/05/2026' },
                        { num: '14.', lbl: 'Character and Conduct', val: 'GOOD' },
                        { num: '15.', lbl: 'Scholarship', val: 'NO' }
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
                 </div>
              </div>
            </div>
            <div className="modal-footer-static" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 32px' }}>
               <button className="reject-action-btn large" onClick={() => setShowDocumentPreview(false)}>Reject Document</button>
               <button className="approve-action-btn large" onClick={() => setShowDocumentPreview(false)}>Sign & Approve</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dashboard-container { display: flex; min-height: 100vh; background: #fff; font-family: ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
        .sidebar { width: 260px; background: white; color: #1e1b4b; display: flex; flex-direction: column; padding: 24px 16px; border-right: 1px solid #e2e8f0; }
        .sidebar-brand { display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 800; margin-bottom: 32px; color: #4338ca; }
        .brand-icon { color: #4338ca; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: transparent; border: none; border-radius: 10px; color: #6366f1; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; transition: 0.2s; }
        .nav-item:hover { background: #f5f3ff; color: #4338ca; }
        .nav-item.active { background: #eef2ff; color: #4338ca; border: 1px solid #e0e7ff; }
        .logout-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fef2f2; color: #ef4444; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; justify-content: flex-start; }
        
        .main-content { flex: 1; display: flex; flex-direction: column; background: #fdfdfd; overflow-y: auto; height: 100vh; }
        .dashboard-header-compact { display: flex; align-items: center; justify-content: space-between; padding: 12px 40px; background: white; border-bottom: 1px solid #e2e8f0; height: 60px; box-sizing: border-box; }
        .header-breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; }
        .crumb.active { color: #1e1b4b; font-weight: 700; }
        .header-actions { display: flex; align-items: center; gap: 20px; }
        .user-profile-small { display: flex; align-items: center; gap: 10px; }
        .profile-img-small.principal { background: #4338ca; }
        .profile-img-small { width: 32px; height: 32px; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
        .profile-info-compact { display: flex; flex-direction: column; }
        .p-name { font-size: 13px; font-weight: 700; color: #1e1b4b; line-height: 1; }
        .p-role { font-size: 11px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        .view-content { padding: 32px 40px; width: 100%; max-width: 100%; box-sizing: border-box; }
        .content-table-view { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); width: 100%; overflow: hidden; }
        .table-header-complex { display: flex; flex-direction: column; background: #fff; border-bottom: 1px solid #e2e8f0; }
        .table-header-top-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; min-height: 72px; gap: 20px; }
        .table-header h3 { font-size: 18px; font-weight: 800; color: #1e1b4b; margin: 0; white-space: nowrap; }
        .compact-search-box { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px 16px; border-radius: 10px; border: 1px solid #e2e8f0; flex: 1; }
        .compact-search-box input { border: none; background: transparent; outline: none; font-size: 14px; width: 100%; color: #1e1b4b; }
        
        .dummy-table { width: 100%; display: flex; flex-direction: column; }
        .row { display: grid; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; align-items: center; width: 100%; color: #475569; }
        .row.header-row { background: #f8fafc; font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; height: 50px; }
        .row.student-row:hover { background: #f8fafc; }
        .font-bold { font-weight: 700; color: #1e1b4b; font-size: 14.5px; }
        
        .table-actions-cell { display: flex; align-items: center; }
        .action-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .action-icon-btn.view { background: #eff6ff; color: #3b82f6; border-color: #dbeafe; }
        .approve-action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 14px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .approve-action-btn:hover { background: #d1fae5; }
        .reject-action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 14px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .reject-action-btn:hover { background: #fee2e2; }
        .approve-action-btn.large, .reject-action-btn.large { font-size: 14px; padding: 12px 24px; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .stat-card { background: white; padding: 20px 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); border-color: #cbd5e1; }
        .stat-info h3 { font-size: 12px; color: #64748b; font-weight: 700; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-info p { font-size: 26px; font-weight: 800; color: #1e1b4b; margin: 0; line-height: 1; }

        /* Pagination Refinement */
        .table-pagination-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; background: #fff; border-top: 1px solid #f1f5f9; min-height: 58px; box-sizing: border-box; }
        .pagination-info { font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .pagination-controls { display: flex; align-items: center; gap: 6px; }
        .pag-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); font-size: 12px; font-weight: 800; }
        .pag-btn:hover:not(:disabled) { border-color: #4338ca; color: #4338ca; background: #f5f3ff; transform: translateY(-1px); }
        .pag-btn.active { background: #4338ca; color: #fff; border-color: #4338ca; box-shadow: 0 4px 10px rgba(67, 56, 202, 0.25); }
        .pag-btn:disabled { opacity: 0.3; cursor: not-allowed; background: #f8fafc; }
        .pag-btn i { font-size: 10px; }

        @media print {
            body { background: white !important; }
            .dashboard-container, .modal-header-fixed, .modal-footer-static, .close-action-flex, .sidebar { display: none !important; }
            .modal-overlay { position: absolute !important; inset: 0 !important; background: white !important; padding: 0 !important; backdrop-filter: none !important; display: block !important; overflow: visible !important; }
            .modal-container-fixed { position: absolute !important; inset: 0 !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; border: none !important; box-shadow: none !important; display: block !important; border-radius: 0 !important; overflow: visible !important; }
            .modal-form-wrapper { padding: 0 !important; background: white !important; display: block !important; overflow: visible !important; }
            .certificate-paper-mockup { margin: 0 auto !important; border: none !important; box-shadow: none !important; width: 210mm !important; min-height: 297mm !important; padding: 15mm !important; padding-top: 20mm !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        /* Modal Overlays */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-container-fixed { background: white; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        .modal-header-fixed { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: white; }
        .modal-header-fixed h2 { margin: 0; font-size: 18px; font-weight: 800; color: #1e1b4b; }
        .close-action-flex { border: none; background: #f1f5f9; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: #64748b; cursor: pointer; transition: 0.2s; }
        .close-action-flex:hover { background: #e2e8f0; color: #1e1b4b; }
        .modal-footer-static { padding: 20px 24px; border-top: 1px solid #e2e8f0; background: white; }
        
        .certificate-paper-mockup { background: white; width: 100%; max-width: 600px; padding: 48px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; min-height: 700px; margin: 0 auto; box-sizing: border-box; }
        .cert-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0f172a; padding-bottom: 24px; }
        .cert-header h1 { font-family: Georgia, serif; font-size: 20px; font-weight: 800; margin: 0; color: #0f172a; }
        .cert-header p { font-family: Georgia, serif; font-size: 11px; margin: 6px 0 0; color: #475569; letter-spacing: 0.05em; text-transform: uppercase; }
        .cert-header h2 { font-family: Georgia, serif; font-size: 16px; font-weight: 800; margin: 32px 0 0; color: #0f172a; letter-spacing: 0.1em; text-decoration: underline; }
        .cert-body { display: flex; flex-direction: column; gap: 24px; font-family: Georgia, serif; font-size: 15px; color: #1e293b; }
        .cert-row { display: grid; grid-template-columns: minmax(220px, max-content) 1fr; gap: 16px; align-items: end; }
        .cert-row .lbl { font-weight: 700; }
        .cert-row .val { border-bottom: 1px dashed #94a3b8; font-weight: 600; padding-bottom: 2px; }
      `}} />
    </div>
  )
}

export default PrincipalDashboard
