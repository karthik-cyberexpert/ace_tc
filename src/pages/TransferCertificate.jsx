import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, Printer, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const TransferCertificate = () => {
  const { id } = useParams()
  const [cert, setCert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/certificates/${id}`);
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('tc-document');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save(`${cert.auth_code || cert.id}.pdf`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-400">LOADING DIGITAL RECORDS...</div>;
  if (!cert) return <div className="flex h-screen items-center justify-center font-bold text-red-400">CERTIFICATE NOT FOUND</div>;

  return (
    <div className="main-wrapper" style={{ background: '#f1f5f9', minHeight: '100vh', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Tool Bar - Hidden during print */}
      <div className="print-hide" style={{ width: '794px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck color="#059669" size={24} />
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>Verified Academic Record</h3>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Auth Code: {cert.auth_code}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="btn" style={{ background: '#2563eb', color: 'white', border: 'none', height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Printer size={16} /> Print TC
          </button>
          <button onClick={handleDownloadPDF} className="btn" style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', height: '40px', padding: '0 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      {/* Actual Certificate Document */}
      <div id="tc-document" style={{ 
        background: 'white', 
        padding: '10px 40px', 
        height: '297mm', 
        width: '210mm', 
        border: '1px solid #000', 
        color: '#000', 
        position: 'relative', 
        fontFamily: 'Times New Roman, serif',
        boxSizing: 'border-box',
        overflow: 'hidden'
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
           <div>S.No : {cert.auth_code || '---'}</div>
           <div style={{ textAlign: 'right' }}>
              Admission No. : <span style={{ borderBottom: '1px solid #000', padding: '0 10px' }}>{cert.admissionNo || '---'}</span><br/>
              UMIS ID. : <span style={{ borderBottom: '1px solid #000', padding: '0 10px' }}>{cert.umisNo || '---'}</span>
           </div>
        </div>
        
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', textDecoration: 'underline' }}>TRANSFER CERTIFICATE</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '14px' }}>
          <tbody>
            {[
              { l: '1.', q: 'Name of the Student', v: cert.studentName },
              { l: '2.', q: 'Name of the Father / Guardian', v: cert.fatherName },
              { l: '3.', q: 'Nationality, Religion and Caste', v: `${cert.nationality || 'INDIAN'}, ${cert.religion || '---'} & ${cert.caste || '---'}` },
              { l: '4.', q: 'Date of Birth in words as entered in the Admission Register', v: dateToWords(cert.dob) },
              { l: '5.', q: 'Date of Admission', v: cert.dateOfAdmission },
              { l: '6.', q: 'Course to which the student was Admitted', v: cert.course },
              { l: '7.', q: 'Branch of Study', v: cert.branch },
              { l: '8.', q: 'Whether the Course has been completed (or) not', v: (cert.tcCompleted || '---').toUpperCase() },
              { l: '9.', q: 'Medium of Instruction', v: (cert.mediumOfInstruction || 'ENGLISH').toUpperCase() },
              { l: '10.', q: 'Whether Qualified for promotion to a higher class (or) not', v: (cert.tcPromotion || '---').toUpperCase() },
              { l: '11.', q: 'Whether the student has paid all the fees due to the college', v: (cert.tcFeesPaid || '---').toUpperCase() },
              { l: '12.', q: 'Date on which the Student actually left the College', v: cert.tcLeftDate },
              { l: '13.', q: 'Date on which application for Transfer Certificate was made', v: cert.tcApplyDate },
              { l: '14.', q: 'Character and Conduct', v: (cert.tcConduct || 'GOOD').toUpperCase() },
              { l: '15.', q: 'Scholarship', v: cert.tcScholarship === 'yes' ? `YES (${cert.tcScholarshipScheme || '---'})` : 'NO' }
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
            {cert.status === 'ISSUED' ? (
              <div style={{ fontSize: '9px', padding: '4px 8px', border: '1px solid #059669', color: '#059669', borderRadius: '4px' }}>DIGITALLY SIGNED</div>
            ) : (
              <div style={{ fontSize: '9px', padding: '4px 8px', border: '1px solid #e11d48', color: '#e11d48', borderRadius: '4px' }}>SIGNATURE PENDING</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '50px', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', textAlign: 'center' }}>
           <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', fontStyle: 'italic' }}>Note: This is a system generated Transfer Certificate. No physical seal or signature is required for its validity as per institutional digital record policy.</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 0; }
        @media print {
          .print-hide { display: none !important; }
          .main-wrapper { padding: 0 !important; background: white !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; overflow: hidden; }
          #tc-document { border: none !important; box-shadow: none !important; width: 210mm !important; height: 297mm !important; margin: 0 !important; }
        }
      `}} />
    </div>
  )
}

export default TransferCertificate;
