import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

let cachedLogoBase64: string | null = null;

async function getLogoBase64(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      cachedLogoBase64 = canvas.toDataURL('image/png');
      resolve(cachedLogoBase64);
    };
    img.onerror = () => resolve(''); // Gracefully skip if logo fails
    img.src = '/kianda-school-logo-removebg-preview.png';
  });
}

// Primary school colour (deep navy/indigo from the design system)
const PRIMARY = [24, 33, 109] as [number, number, number];
const SECONDARY = [212, 160, 23] as [number, number, number]; // gold
const MUTED = [120, 120, 140] as [number, number, number];
const LIGHT_GREY = [245, 245, 248] as [number, number, number];

const PAGE_W = 210; // A4 mm
const MARGIN = 16;
const COL_W = (PAGE_W - MARGIN * 2 - 8) / 2; // two equal columns with 8mm gap

/** Draw text and return the y position after the text block. */
function drawText(
  doc: jsPDF,
  text: string | undefined | null,
  x: number,
  y: number,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; maxWidth?: number } = {}
): number {
  const { size = 9, bold = false, color = PRIMARY, maxWidth } = opts;
  doc.setFontSize(size);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(...color);
  const content = text || '—';
  if (maxWidth) {
    const lines = doc.splitTextToSize(content, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * (size * 0.352778 + 1.5);
  }
  doc.text(content, x, y);
  return y + size * 0.352778 + 1.5;
}

/** Draw a labelled field — label on top, value below. Returns new Y. */
function drawField(
  doc: jsPDF,
  label: string,
  value: string | undefined | null,
  x: number,
  y: number,
  maxWidth?: number
): number {
  drawText(doc, label.toUpperCase(), x, y, { size: 6.5, color: MUTED, bold: true });
  return drawText(doc, value || 'N/A', x, y + 4.5, { size: 9, bold: true, color: PRIMARY, maxWidth });
}

/** Draw a horizontal rule. */
function drawRule(doc: jsPDF, y: number, x1 = MARGIN, x2 = PAGE_W - MARGIN, weight = 0.3) {
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(weight);
  doc.line(x1, y, x2, y);
}

/** Draw a filled section-header bar. Returns y after bar. */
function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 8, 1.5, 1.5, 'F');
  // Gold accent dot
  doc.setFillColor(...SECONDARY);
  doc.circle(MARGIN + 5, y + 4, 1.5, 'F');
  drawText(doc, title, MARGIN + 10, y + 5.2, { size: 7.5, bold: true, color: PRIMARY });
  return y + 12;
}

/** Check if we need a new page and add one if so. Returns updated y. */
function checkPage(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 275) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export async function buildApplicationPDF(app: any): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4');

  const candidate = app.candidate || {};
  const parent = app.parentDetails || {};
  const additional = app.additionalInfo || {};
  const schools: any[] = app.schoolsAttended || [];
  const documents: any[] = app.documents || [];
  const formattedDob = candidate.dob
    ? new Date(candidate.dob).toLocaleDateString('en-GB')
    : 'N/A';

  // ── HEADER ────────────────────────────────────────────────────────────────
  const logoBase64 = await getLogoBase64();
  let y = MARGIN;

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', MARGIN, y, 22, 22);
  }

  // Vertical divider
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 26, y + 2, MARGIN + 26, y + 20);

  // School name + subtitle
  drawText(doc, 'KIANDA SCHOOL', MARGIN + 30, y + 8, { size: 18, bold: true, color: PRIMARY });
  drawText(doc, 'Official Admission Record', MARGIN + 30, y + 14, { size: 7.5, color: MUTED });

  // Contact block (right-aligned)
  const contactLines = [
    'P.O. BOX 48328, Kabarsiran Ave, Nairobi',
    'Tel: 0733 846 959   |   info@kiandaschool.ac.ke',
  ];
  contactLines.forEach((line, i) => {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(line, PAGE_W - MARGIN, y + 7 + i * 5, { align: 'right' });
  });

  y += 26;
  drawRule(doc, y, MARGIN, PAGE_W - MARGIN, 1.2);
  y += 6;

  // ── CANDIDATE SUMMARY ──────────────────────────────────────────────────────
  drawText(doc, candidate.fullName || 'Unknown Candidate', MARGIN, y, { size: 16, bold: true, color: PRIMARY });
  y += 7;
  drawText(doc, `Applying for ${candidate.grade || 'Unknown Grade'}`, MARGIN, y, { size: 8, color: SECONDARY, bold: true });

  // Application ID (right)
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED);
  doc.text('APPLICATION ID', PAGE_W - MARGIN, y - 6, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(`APP-${app.id.toString().padStart(4, '0')}`, PAGE_W - MARGIN, y, { align: 'right' });

  y += 8;
  drawRule(doc, y);
  y += 8;

  // ── SECTION A: CANDIDATE PROFILE ──────────────────────────────────────────
  y = drawSectionHeader(doc, 'Section A: Candidate Profile & Scholastic Background', y);

  // Left column: personal details
  const sA_startY = y;
  let leftY = sA_startY;
  let rightY = sA_startY;

  const leftX = MARGIN;
  const rightX = MARGIN + COL_W + 8;

  leftY = drawField(doc, 'Date of Birth', formattedDob, leftX, leftY) + 2;
  leftY = drawField(doc, 'Religion', candidate.religion, leftX, leftY) + 2;
  leftY = drawField(doc, 'Denomination', candidate.denomination, leftX, leftY) + 2;
  leftY = drawField(doc, 'Birth Order', candidate.birthOrder, leftX, leftY) + 2;

  // Right column: academic timeline
  drawText(doc, 'ACADEMIC TIMELINE', rightX, rightY, { size: 6.5, color: MUTED, bold: true });
  rightY += 5;

  if (schools.length > 0) {
    schools.forEach((s: any) => {
      doc.setFillColor(250, 250, 252);
      doc.roundedRect(rightX, rightY, COL_W, 10, 1.5, 1.5, 'F');
      drawText(doc, s.schoolName, rightX + 3, rightY + 4, { size: 8.5, bold: true, color: PRIMARY });
      drawText(
        doc,
        `${s.schoolType || ''} • ${s.yearsRange || 'Dates N/A'}`.toUpperCase(),
        rightX + 3,
        rightY + 8,
        { size: 6, color: MUTED }
      );
      rightY += 13;
    });
  } else {
    drawText(doc, 'No previous schools recorded.', rightX, rightY, { size: 8, color: MUTED });
    rightY += 8;
  }

  y = Math.max(leftY, rightY) + 6;
  drawRule(doc, y);
  y += 8;

  // ── SECTION B: PARENT / GUARDIAN ─────────────────────────────────────────
  y = checkPage(doc, y, 55);
  y = drawSectionHeader(doc, 'Section B: Parent / Guardian Information', y);

  const sB_startY = y;
  let mY = sB_startY;
  let fY = sB_startY;

  // Mother card
  doc.setFillColor(254, 252, 245);
  doc.roundedRect(leftX, mY - 2, COL_W, 38, 2, 2, 'F');
  drawText(doc, "MOTHER'S RECORD", leftX + 3, mY + 4, { size: 6.5, bold: true, color: SECONDARY });
  mY += 9;
  mY = drawText(doc, parent.motherName || 'Not Provided', leftX + 3, mY, { size: 10, bold: true, color: PRIMARY });
  mY = drawText(doc, parent.motherPhone, leftX + 3, mY + 1, { size: 7.5, color: MUTED, maxWidth: COL_W - 6 });
  mY = drawText(doc, parent.motherEmail, leftX + 3, mY, { size: 7.5, color: MUTED, maxWidth: COL_W - 6 });
  drawText(doc, parent.motherProfession, leftX + 3, mY + 1, { size: 7.5, color: MUTED, bold: true });

  // Father card
  doc.setFillColor(246, 247, 252);
  doc.roundedRect(rightX, fY - 2, COL_W, 38, 2, 2, 'F');
  drawText(doc, "FATHER'S RECORD", rightX + 3, fY + 4, { size: 6.5, bold: true, color: MUTED });
  fY += 9;
  fY = drawText(doc, parent.fatherName || 'Not Provided', rightX + 3, fY, { size: 10, bold: true, color: PRIMARY });
  fY = drawText(doc, parent.fatherPhone, rightX + 3, fY + 1, { size: 7.5, color: MUTED, maxWidth: COL_W - 6 });
  fY = drawText(doc, parent.fatherEmail, rightX + 3, fY, { size: 7.5, color: MUTED, maxWidth: COL_W - 6 });
  drawText(doc, parent.fatherProfession, rightX + 3, fY + 1, { size: 7.5, color: MUTED, bold: true });

  y = sB_startY + 42;
  drawRule(doc, y);
  y += 8;

  // ── SECTION C: SUPPLEMENTARY CONTEXT ─────────────────────────────────────
  y = checkPage(doc, y, 40);
  y = drawSectionHeader(doc, 'Section C: Supplementary Context & Medical History', y);

  let cLeftY = y;
  let cRightY = y;

  // Medical
  drawText(doc, 'MEDICAL HISTORY', leftX, cLeftY, { size: 6.5, bold: true, color: MUTED });
  cLeftY += 5;
  cLeftY = drawText(doc, candidate.medicalInfo || 'No medical conditions recorded.', leftX, cLeftY, {
    size: 8.5,
    color: PRIMARY,
    maxWidth: COL_W,
  });

  // Motivation + source
  drawText(doc, 'MOTIVATION TO JOIN KIANDA', rightX, cRightY, { size: 6.5, bold: true, color: MUTED });
  cRightY += 5;
  cRightY = drawText(doc, additional.motivation || 'Not provided.', rightX, cRightY, {
    size: 8.5,
    color: PRIMARY,
    maxWidth: COL_W,
  });
  cRightY += 3;
  drawText(doc, 'APPLICATION SOURCE', rightX, cRightY, { size: 6.5, bold: true, color: MUTED });
  drawText(doc, additional.source || 'N/A', rightX, cRightY + 4.5, { size: 9, bold: true, color: SECONDARY });

  y = Math.max(cLeftY, cRightY + 10) + 6;
  drawRule(doc, y, MARGIN, PAGE_W - MARGIN, 1);
  y += 8;

  // ── SUPPORTING DOCUMENTS ─────────────────────────────────────────────────
  y = checkPage(doc, y, 20);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED);
  doc.text('SUPPORTING DOCUMENTS & ATTACHMENTS', PAGE_W / 2, y, { align: 'center' });
  y += 7;

  if (documents.length > 0) {
    documents.forEach((d: any, i: number) => {
      y = checkPage(doc, y, 12);
      const rowX = i % 2 === 0 ? leftX : rightX;
      const rowY = i % 2 === 0 ? y : y;
      // Draw a subtle card
      doc.setFillColor(250, 250, 252);
      doc.roundedRect(rowX, rowY - 1, COL_W, 10, 1.5, 1.5, 'F');
      drawText(doc, d.documentType || 'Uploaded File', rowX + 4, rowY + 4.5, { size: 8, bold: true, color: PRIMARY });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...SECONDARY);
      doc.text('✓ RECORDED', rowX + COL_W - 3, rowY + 4.5, { align: 'right' });
      if (i % 2 === 1 || i === documents.length - 1) {
        y += 13;
      }
    });
  } else {
    drawText(doc, 'No documents were uploaded with this application.', MARGIN, y, {
      size: 8,
      color: MUTED,
    });
    y += 10;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = 285;
  drawRule(doc, footerY - 4, MARGIN, PAGE_W - MARGIN, 0.3);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Institutional Record • Kianda School Admissions Board', MARGIN, footerY);
  doc.text(new Date().toLocaleDateString('en-GB'), PAGE_W - MARGIN, footerY, { align: 'right' });

  return doc;
}
