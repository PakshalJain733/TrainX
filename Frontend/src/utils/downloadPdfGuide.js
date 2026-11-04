/**
 * Client-side standard PDF-1.4 file generator and instant download trigger.
 * Generates an authentic, valid PDF binary blob and triggers direct browser download.
 */
export function downloadPdfGuide(guide) {
  const title = (guide?.title || 'Platform Guide').replace(/[()\\]/g, '');
  const desc = (guide?.desc || 'Documentation and operational guidelines').replace(/[()\\]/g, '');
  const cleanFilename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;

  // Standard valid PDF-1.4 text stream
  const textStream = [
    'BT',
    '/F1 18 Tf',
    '50 730 Td',
    `(${title}) Tj`,
    '0 -30 Td',
    '/F1 11 Tf',
    '(TrainX Enterprise Training Portal - Official User Documentation) Tj',
    '0 -24 Td',
    `(${desc}) Tj`,
    '0 -32 Td',
    '/F1 13 Tf',
    '(Key Platform Capabilities:) Tj',
    '0 -22 Td',
    '/F1 10 Tf',
    '(1. Sessions & Classes: Real-time lecture management and attendance records.) Tj',
    '0 -18 Td',
    '(2. Assessments & Feedback: Coding submissions, lab metrics, and evaluations.) Tj',
    '0 -18 Td',
    '(3. Attendance Governance: 75 percent mandatory compliance and leave approvals.) Tj',
    '0 -18 Td',
    '(4. Resolution Desk: Ticket escalation to College Admin and Super Admin.) Tj',
    '0 -36 Td',
    '/F1 10 Tf',
    '(Support Contact: ganeshvshinde2006@gmail.com  |  Campus Hotline: +91 87793 51143) Tj',
    '0 -20 Td',
    '(Copyright 2026 TrainX. All rights reserved.) Tj',
    'ET'
  ].join('\n');

  const streamLen = new TextEncoder().encode(textStream).length;

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  const addObj = (obj) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += obj + '\n';
  };

  addObj('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  addObj('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  addObj('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj');
  addObj(`4 0 obj << /Length ${streamLen} >> stream\n${textStream}\nendstream endobj`);
  addObj('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj');

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 0; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export default downloadPdfGuide;

