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
  drawText(doc, label.toUpperCase(), x, y, { size: 7.5, color: MUTED, bold: true });
  return drawText(doc, value || 'N/A', x, y + 5, { size: 9.5, bold: true, color: PRIMARY, maxWidth });
}

/** Draw a horizontal rule. */
function drawRule(doc: jsPDF, y: number, x1 = MARGIN, x2 = PAGE_W - MARGIN, weight = 0.3) {
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(weight);
  doc.line(x1, y, x2, y);
}

/** Draw a filled section-header bar. Returns y after bar. */
function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  drawText(doc, title, MARGIN, y + 5, { size: 9, bold: true, color: PRIMARY });
  drawRule(doc, y + 7.5, MARGIN, PAGE_W - MARGIN, 0.8); // Professional full-width underline
  return y + 15;
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

  // ── SECTION I: CANDIDATE PROFILE ───────────────────────────────────────────
  y = drawSectionHeader(doc, 'Section I: Personal & Academic Profile', y);

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
      drawText(doc, s.schoolName, rightX, rightY + 4, { size: 9, bold: true, color: PRIMARY });
      drawText(
        doc,
        `${s.schoolType || ''} • ${s.yearsRange || 'Dates N/A'}`.toUpperCase(),
        rightX,
        rightY + 8,
        { size: 7, color: MUTED, bold: true }
      );
      rightY += 12;
    });
  } else {
    drawText(doc, 'No previous schools recorded.', rightX, rightY, { size: 8, color: MUTED });
    rightY += 8;
  }

  y = Math.max(leftY, rightY) + 6;
  drawRule(doc, y);
  y += 8;

  // ── PART II: PARENTAL & GUARDIANSHIP DETAILS ────────────────────────────
  y = checkPage(doc, y, 55);
  y = drawSectionHeader(doc, 'PART II: PARENT & GUARDIAN DETAILS', y);

  const sB_startY = y;
  let mY = sB_startY;
  let fY = sB_startY;

  // Mother record
  drawText(doc, "MOTHER'S RECORD", leftX, mY + 4, { size: 8, bold: true, color: SECONDARY });
  mY += 9;
  mY = drawText(doc, parent.motherName || 'Not Provided', leftX, mY, { size: 10, bold: true, color: PRIMARY });
  mY += 1;
  
  // Labelled data
  const labelW = 18; // Increased to accommodate larger labels
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTED);
  doc.text('MOB:', leftX, mY + 1);
  mY = drawText(doc, parent.motherPhone, leftX + labelW, mY + 1, { size: 9, color: PRIMARY });
  
  doc.text('MAIL:', leftX, mY);
  mY = drawText(doc, parent.motherEmail, leftX + labelW, mY, { size: 9, color: PRIMARY });
  
  doc.text('CRAFT:', leftX, mY + 1);
  drawText(doc, parent.motherProfession, leftX + labelW, mY + 1, { size: 9, color: PRIMARY, bold: true });

  // Father record
  drawText(doc, "FATHER'S RECORD", rightX, fY + 4, { size: 8, bold: true, color: MUTED });
  fY += 9;
  fY = drawText(doc, parent.fatherName || 'Not Provided', rightX, fY, { size: 10, bold: true, color: PRIMARY });
  fY += 1;
  
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTED);
  doc.text('MOB:', rightX, fY + 1);
  fY = drawText(doc, parent.fatherPhone, rightX + labelW, fY + 1, { size: 9, color: PRIMARY });
  
  doc.text('MAIL:', rightX, fY);
  fY = drawText(doc, parent.fatherEmail, rightX + labelW, fY, { size: 9, color: PRIMARY });
  
  doc.text('CRAFT:', rightX, fY + 1);
  drawText(doc, parent.fatherProfession, rightX + labelW, fY + 1, { size: 9, color: PRIMARY, bold: true });

  y = sB_startY + 42;
  drawRule(doc, y);
  y += 8;

  // ── Section III: Background & Health Disclosures ────────────────────────
  y = checkPage(doc, y, 50);
  y = drawSectionHeader(doc, 'Section III: Background & Health Disclosures', y);

  // 1. Motivation First - FULL WIDTH NARRATIVE
  const mtvText = additional.motivation || 'Not provided.';
  const mtvLines = doc.splitTextToSize(mtvText, PAGE_W - MARGIN * 2 - 14);
  const mtvHeight = mtvLines.length * (8.5 * 0.352778 + 2) + 12;
  
  y = checkPage(doc, y, mtvHeight + 5);

  doc.setFillColor(248, 250, 255);
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, mtvHeight, 2, 2, 'F');
  doc.setDrawColor(...SECONDARY);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 4, y + 4, MARGIN + 4, y + mtvHeight - 4); // Accent line
  
  drawText(doc, 'CANDIDATE MOTIVATION STATEMENT', MARGIN + 8, y + 5, { size: 6.5, bold: true, color: SECONDARY });
  y = drawText(doc, mtvText, MARGIN + 8, y + 10, { size: 8.5, color: PRIMARY, maxWidth: PAGE_W - MARGIN * 2 - 16 });
  y += 10;

  // 2. Health and Source below in split view
  y = checkPage(doc, y, 20);
  drawField(doc, 'MEDICAL HISTORY', candidate.medicalInfo || 'No conditions recorded.', leftX, y, COL_W);

  // Map source value to full label
  const sourceMap: any = {
    'Parent': 'Parent',
    'School': "Through daughter's school",
    'Friend': 'Relative / Friend',
    'Website': 'Kianda Website',
    'SocialMedia': 'Social Media',
    'Other': additional.sourceOther || 'Other'
  };
  const sourceDisplay = sourceMap[additional.source || ''] || additional.source || 'N/A';
  
  drawField(doc, 'How did you hear about us?', sourceDisplay, rightX, y, COL_W);
  y += 18;

  
  y += 6;
  drawRule(doc, y);
  y += 8;



  // ── FOOTER & PAGINATION ──────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = 285;
    drawRule(doc, footerY - 4, MARGIN, PAGE_W - MARGIN, 0.3);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text('Institutional Record • Kianda School Admissions Board', MARGIN, footerY);
    
    const pageText = `Institutional Record | Page ${i} of ${totalPages}`;
    doc.text(pageText, PAGE_W - MARGIN, footerY, { align: 'right' });
  }

  return doc;
}
