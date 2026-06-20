import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, Printer, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { API_BASE_URL } from '../config'

const CourseCompletionCertificate = () => {
  const { id } = useParams()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/certificates/${id}`);
        const data = await response.json();
        setCert(data);
      } catch (err) {
        console.error('Failed to fetch certificate:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy}`;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('cc-document');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`CC-${cert.auth_code || cert.id}.pdf`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-400">LOADING DIGITAL RECORDS...</div>;
  if (!cert) return <div className="flex h-screen items-center justify-center font-bold text-red-400">CERTIFICATE NOT FOUND</div>;

  return (
    <div className="main-wrapper" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Tool Bar - Hidden during print */}
      <div className="print-hide" style={{ width: '100%', maxWidth: '297mm', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="#059669" size={24} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>Verified Academic Record</h3>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Auth Code: {cert.auth_code}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="btn" style={{ background: '#2563eb', color: 'white', border: 'none', height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Printer size={16} /> Print Certificate
          </button>
          <button onClick={handleDownloadPDF} className="btn" style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Actual Course Completion Certificate Document */}
      <div id="cc-document" style={{ 
        background: 'white', 
        padding: '35px 60px', 
        height: '210mm', 
        width: '297mm', 
        border: '1px solid #000', 
        color: '#000', 
        position: 'relative', 
        fontFamily: 'Times New Roman, serif',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        
        {/* Double Border Frame */}
        <div style={{
          position: 'absolute',
          top: '16px',
          bottom: '16px',
          left: '16px',
          right: '16px',
          border: '1px solid #000',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
          border: '1px solid #000',
          pointerEvents: 'none'
        }} />

        {/* Institution Header */}
        <div style={{ position: 'relative', marginBottom: '25px', paddingBottom: '12px', borderBottom: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', marginRight: '20px' }}>
            <img src="/logo.png" alt="ACE Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', color: '#000', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '0.5px', lineHeight: '1.2' }}>ADHIYAMAAN COLLEGE OF ENGINEERING</h1>
            <p style={{ fontWeight: '800', letterSpacing: '1px', fontSize: '14px', color: '#000', margin: '0 0 4px 0' }}>(AN AUTONOMOUS INSTITUTE)</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0' }}>Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai</p>
            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0' }}>Accredited by NBA & NAAC</p>
            <p style={{ fontSize: '13px', fontWeight: '800', margin: '4px 0 0 0' }}>Dr. M.G.R. Nagar, HOSUR - 635 130</p>
            <p style={{ fontSize: '10px', margin: '0' }}>Phone: (04344) 260570, 261001-3, 261020 Fax: (04344) 260573</p>
            <p style={{ fontSize: '10px', margin: '0' }}>E-mail: principal@adhiyamaan.ac.in  Web: www.adhiyamaan.ac.in</p>
          </div>
        </div>

        {/* Certificate Title */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '1px', textDecoration: 'underline', margin: '0' }}>COURSE COMPLETION CERTIFICATE</h2>
        </div>

        {/* Certificate Body Paragraph */}
        <div style={{ fontSize: '18px', lineHeight: '2.2', textAlign: 'justify', textIndent: '40px', marginTop: '25px' }}>
          This is to certify that Mr./Ms. <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{cert.studentName?.toUpperCase()}</span> is a bonafide student of this college and has studied <span style={{ fontWeight: 'bold' }}>{cert.course} {cert.branch}</span> Degree Course during the period <span style={{ fontWeight: 'bold' }}>{cert.batchStart} - {cert.batchEnd}</span>. Result of Final Semester is awaited, which will be published during the month of <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{cert.ccResultMonthYear || '---'}</span>. His/Her Character and Conduct during the above period was found to be <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{cert.ccConduct?.toUpperCase() || '---'}</span>.
        </div>

        {/* Signature & Seal Footer */}
        <div style={{ marginTop: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 'bold', fontSize: '16px' }}>
          <div>
            <p style={{ margin: '0 0 8px 0' }}>Date: {formatDate(cert.issue_date)}</p>
            <p style={{ margin: '0' }}>Seal</p>
          </div>
          <div style={{ textAlign: 'center', marginRight: '20px' }}>
            <p style={{ margin: '0 0 12px 0', letterSpacing: '0.5px' }}>PRINCIPAL</p>
            {cert.status === 'ISSUED' ? (
              <div style={{ fontSize: '10px', padding: '6px 12px', border: '1px solid #059669', color: '#059669', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>DIGITALLY SIGNED</div>
            ) : (
              <div style={{ fontSize: '10px', padding: '6px 12px', border: '1px solid #e11d48', color: '#e11d48', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>SIGNATURE PENDING</div>
            )}
          </div>
        </div>

        {/* System generated note */}
        <div style={{ marginTop: '40px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', fontStyle: 'italic', margin: '0' }}>Note: This is a system generated Course Completion Certificate. No physical seal or signature is required for its validity as per institutional digital record policy.</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 landscape; margin: 0; }
        @media print {
          .print-hide { display: none !important; }
          .main-wrapper { padding: 0 !important; background: white !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }
          #cc-document { border: none !important; box-shadow: none !important; width: 297mm !important; height: 210mm !important; margin: 0 !important; }
        }
      `}} />
    </div>
  )
}

export default CourseCompletionCertificate;
