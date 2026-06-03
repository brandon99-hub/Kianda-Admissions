import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

let cachedLogoBase64: string | null = null;

async function getImageBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(''); 
    img.src = url;
  });
}

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
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; maxWidth?: number; align?: 'left' | 'center' | 'right' } = {}
): number {
  const { size = 9, bold = false, color = PRIMARY, maxWidth, align = 'left' } = opts;
  doc.setFontSize(size);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(...color);
  const content = text || '—';
  if (maxWidth) {
    const lines = doc.splitTextToSize(content, maxWidth);
    doc.text(lines, x, y, { align });
    return y + lines.length * (size * 0.352778 + 1.5);
  }
  doc.text(content, x, y, { align });
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
  const siblings: any[] = app.siblings || [];
  const documents: any[] = app.documents || [];
  const formattedDob = candidate.dob
    ? new Date(candidate.dob).toLocaleDateString('en-GB')
    : 'N/A';

  // ── HEADER ────────────────────────────────────────────────────────────────
  let y = MARGIN;

  let passportPhotoBase64 = '';
  if (candidate.passportPhotoUrl) {
     passportPhotoBase64 = await getImageBase64(candidate.passportPhotoUrl);
  }

  if (passportPhotoBase64) {
    doc.addImage(passportPhotoBase64, 'JPEG', MARGIN, y, 22, 22);
  } else {
    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', MARGIN, y, 22, 22);
    }
  }

  // School name + subtitle (centered)
  const centerX = PAGE_W / 2;
  drawText(doc, 'KIANDA SCHOOL', centerX, y + 6, { size: 18, bold: true, color: PRIMARY, align: 'center' });
  drawText(doc, 'Official Admission Record', centerX, y + 12, { size: 7.5, color: MUTED, align: 'center' });
  drawText(doc, `Applying for ${candidate.grade || 'Unknown'}`, centerX, y + 18, { size: 9, color: SECONDARY, bold: true, align: 'center' });

  // Top right block: Application Info
  const rightAlign = PAGE_W - MARGIN;
  drawText(doc, 'ADMISSION TYPE', rightAlign, y + 4, { size: 6.5, bold: true, color: MUTED, align: 'right' });
  drawText(doc, (app.admissionType || 'Transfer').toUpperCase(), rightAlign, y + 8, { size: 9, bold: true, color: PRIMARY, align: 'right' });

  drawText(doc, 'APPLICATION ID', rightAlign, y + 14, { size: 6.5, bold: true, color: MUTED, align: 'right' });
  const appIdString = app.id ? app.id.toString().padStart(4, '0') : 'PREV';
  drawText(doc, `APP-${appIdString}`, rightAlign, y + 18, { size: 10, bold: true, color: PRIMARY, align: 'right' });
  
  drawText(doc, 'YEAR CYCLE', rightAlign, y + 24, { size: 6.5, bold: true, color: MUTED, align: 'right' });
  drawText(doc, (app.academicYear || new Date().getFullYear()).toString(), rightAlign, y + 28, { size: 9, bold: true, color: PRIMARY, align: 'right' });

  y += 32;
  drawRule(doc, y, MARGIN, PAGE_W - MARGIN, 1.2);
  y += 6;

  // ── CANDIDATE SUMMARY ──────────────────────────────────────────────────────
  drawText(doc, candidate.fullName || 'Unknown Candidate', MARGIN, y + 2, { size: 16, bold: true, color: PRIMARY });
  y += 10;

  // ── SECTION I: CANDIDATE PROFILE ───────────────────────────────────────────
  y = drawSectionHeader(doc, 'Section I: Personal & Academic Profile', y);

  const sA_startY = y;
  let currentY = sA_startY;

  // Grid layout (3 columns) for personal info
  const col1X = MARGIN;
  const col2X = MARGIN + (PAGE_W - MARGIN * 2) / 3;
  const col3X = MARGIN + ((PAGE_W - MARGIN * 2) / 3) * 2;

  // Row 1
  drawField(doc, 'Date of Birth', formattedDob, col1X, currentY);
  drawField(doc, 'Religion', candidate.religion, col2X, currentY);
  currentY = drawField(doc, 'Denomination', candidate.denomination, col3X, currentY) + 2;

  // Row 2
  let appliedBeforeValue = additional.hasAppliedBefore ? 'Yes' : 'No';
  if (additional.hasAppliedBefore && Array.isArray(additional.previousApplicationYears) && additional.previousApplicationYears.length > 0) {
    appliedBeforeValue = `Yes (${additional.previousApplicationYears.join(', ')})`;
  }
  
  drawField(doc, 'Birth Order', candidate.birthOrder, col1X, currentY);
  drawField(doc, 'Assessment No', candidate.assessmentNo, col2X, currentY);
  currentY = drawField(doc, 'Have you applied before ?', appliedBeforeValue, col3X, currentY) + 6;

  // Split bottom of Section I into Left (Schools) and Right (Medical History)
  y = currentY + 4;
  const s1LeftX = MARGIN;
  const s1RightX = MARGIN + COL_W + 8;
  
  let leftY = y;
  let rightY = y;

  drawText(doc, 'PREVIOUS SCHOOLS', s1LeftX, leftY + 5, { size: 8, color: MUTED, bold: true });
  leftY += 12;

  if (schools.length > 0) {
    schools.forEach((s: any) => {
      const typeStr = s.schoolType ? `${s.schoolType.toUpperCase()} • ` : '';
      drawText(
        doc,
        `${typeStr}${s.schoolName || 'Unknown School'} • ${s.yearsRange || 'Dates N/A'}`,
        s1LeftX,
        leftY,
        { size: 8, color: PRIMARY, bold: true }
      );
      leftY += 6;
    });
  } else {
    drawText(doc, 'No previous schools recorded.', s1LeftX, leftY, { size: 8, color: MUTED });
    leftY += 8;
  }

  // Right column: Medical history
  drawField(doc, 'MEDICAL HISTORY', candidate.medicalInfo || 'No conditions recorded.', s1RightX, rightY + 5, COL_W);

  y = Math.max(leftY, rightY + 16) + 4;
  drawRule(doc, y);
  y += 8;

  // ── PART II: PARENTAL & GUARDIANSHIP DETAILS ────────────────────────────
  y = checkPage(doc, y, 80);
  y = drawSectionHeader(doc, 'PART II: PARENT & GUARDIAN DETAILS', y);

  const sB_startY = y;
  let mY = sB_startY;
  let fY = sB_startY;

  const leftX = MARGIN;
  const rightX = MARGIN + COL_W + 8;

  // Draw vertical line separator for the parent table
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  doc.line(PAGE_W / 2, sB_startY, PAGE_W / 2, sB_startY + 65);

  const labelW = 26; // Width for larger labels
  
  // Father column
  drawText(doc, "FATHER'S DETAILS", leftX, mY, { size: 8, bold: true, color: SECONDARY });
  mY += 8;
  
  drawText(doc, 'NAME', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherName || 'Not Provided', leftX + labelW, mY, { size: 9, bold: true, color: PRIMARY });
  mY += 6;
  
  drawText(doc, 'PHONE', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherPhone || 'N/A', leftX + labelW, mY, { size: 9, bold: true, color: PRIMARY });
  mY += 6;
  
  drawText(doc, 'EMAIL', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherEmail || 'N/A', leftX + labelW, mY, { size: 9, bold: true, color: PRIMARY });
  mY += 6;
  
  drawText(doc, 'PROFESSION', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherProfession || 'N/A', leftX + labelW, mY, { size: 9, color: PRIMARY, bold: true });
  mY += 6;

  drawText(doc, 'WORK', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherWork || 'N/A', leftX + labelW, mY, { size: 9, color: PRIMARY, bold: true, maxWidth: COL_W - labelW - 4 });
  mY += 10;

  drawText(doc, 'ALTERNATIVE CONTACT', leftX, mY, { size: 7, bold: true, color: MUTED });
  mY += 6;
  drawText(doc, 'NAME', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherAltContactName || 'N/A', leftX + labelW, mY, { size: 9, color: PRIMARY, bold: true });
  mY += 6;
  drawText(doc, 'PHONE', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherAltContactPhone || 'N/A', leftX + labelW, mY, { size: 9, color: PRIMARY, bold: true });
  mY += 6;
  drawText(doc, 'RELATION', leftX, mY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.fatherAltContactRelation || 'N/A', leftX + labelW, mY, { size: 9, color: PRIMARY, bold: true });

  // Mother column
  drawText(doc, "MOTHER'S DETAILS", rightX, fY, { size: 8, bold: true, color: SECONDARY });
  fY += 8;
  
  drawText(doc, 'NAME', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherName || 'Not Provided', rightX + labelW, fY, { size: 9, bold: true, color: PRIMARY });
  fY += 6;
  
  drawText(doc, 'PHONE', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherPhone || 'N/A', rightX + labelW, fY, { size: 9, bold: true, color: PRIMARY });
  fY += 6;
  
  drawText(doc, 'EMAIL', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherEmail || 'N/A', rightX + labelW, fY, { size: 9, bold: true, color: PRIMARY });
  fY += 6;
  
  drawText(doc, 'PROFESSION', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherProfession || 'N/A', rightX + labelW, fY, { size: 9, color: PRIMARY, bold: true });
  fY += 6;

  drawText(doc, 'WORK', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherWork || 'N/A', rightX + labelW, fY, { size: 9, color: PRIMARY, bold: true, maxWidth: COL_W - labelW - 4 });
  fY += 10;

  drawText(doc, 'ALTERNATIVE CONTACT', rightX, fY, { size: 7, bold: true, color: MUTED });
  fY += 6;
  drawText(doc, 'NAME', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherAltContactName || 'N/A', rightX + labelW, fY, { size: 9, color: PRIMARY, bold: true });
  fY += 6;
  drawText(doc, 'PHONE', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherAltContactPhone || 'N/A', rightX + labelW, fY, { size: 9, color: PRIMARY, bold: true });
  fY += 6;
  drawText(doc, 'RELATION', rightX, fY, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.motherAltContactRelation || 'N/A', rightX + labelW, fY, { size: 9, color: PRIMARY, bold: true });

  y = Math.max(mY, fY) + 16;

  // Residential details
  drawText(doc, 'FAMILY RESIDENCY', leftX, y, { size: 7, bold: true, color: MUTED });
  drawText(doc, parent.residency || 'Not provided', leftX + 45, y, { size: 9, bold: true, color: PRIMARY });

  y += 12;
  drawRule(doc, y);
  y += 8;

  // ── Section III: Background & Health Disclosures ────────────────────────
  y = checkPage(doc, y, 50);
  y = drawSectionHeader(doc, 'Section III: Background & Health Disclosures', y);

  // 1. Siblings Information
  y = checkPage(doc, y, 40);
  drawText(doc, 'SIBLINGS INFORMATION:', MARGIN, y, { size: 8, bold: true, color: MUTED });
  y += 6;
  
  if (siblings.length > 0) {
    // Draw table header
    doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 7, 1, 1, 'F');
    const cols = [
      { label: 'Name', x: MARGIN + 4 },
      { label: 'Grade', x: MARGIN + 55 },
      { label: 'Relationship', x: MARGIN + 85 },
      { label: 'School', x: MARGIN + 115 },
      { label: 'Kianda Order', x: MARGIN + 155 }
    ];
    cols.forEach(col => {
      drawText(doc, col.label.toUpperCase(), col.x, y + 4.5, { size: 6.5, bold: true, color: [255, 255, 255] });
    });
    y += 7;

    // Draw rows
    siblings.forEach((sib: any, index: number) => {
      y = checkPage(doc, y, 10);
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 255);
        doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 7, 'F');
      }
      
      const rowCols = [
        { value: sib.name || 'N/A', x: MARGIN + 4, max: 48 },
        { value: sib.grade || 'N/A', x: MARGIN + 55, max: 28 },
        { value: sib.relationship || 'N/A', x: MARGIN + 85, max: 28 },
        { value: sib.schoolType === 'Kianda School' ? 'Kianda School' : (sib.schoolName || 'N/A'), x: MARGIN + 115, max: 38 },
        { value: sib.kiandaOrder || '-', x: MARGIN + 155, max: 20 }
      ];
      rowCols.forEach(col => {
        drawText(doc, col.value, col.x, y + 4.5, { size: 7.5, color: PRIMARY, maxWidth: col.max });
      });
      y += 7;
    });
  } else {
    doc.setFillColor(248, 250, 255);
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 8, 1, 1, 'F');
    drawText(doc, 'No siblings recorded.', MARGIN + 2, y + 5, { size: 8, color: MUTED });
    y += 8;
  }
  y += 12;

  // 2. Motivation - Quote Block Style
  y = checkPage(doc, y, 30);
  const mtvText = additional.motivation || 'Not provided.';
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  
  const mtvLines = doc.splitTextToSize(mtvText, PAGE_W - MARGIN * 2);
  const mtvHeight = mtvLines.length * (9 * 0.352778 + 1.5) + 6;
  
  drawText(doc, 'CANDIDATE MOTIVATION STATEMENT:', MARGIN, y, { size: 8, bold: true, color: MUTED });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text(mtvLines, MARGIN, y + 6);
  
  y += mtvHeight + 12;

  // 3. Source
  y = checkPage(doc, y, 20);
  const sourceMap: any = {
    'Parent': 'Parent',
    'School': "Through daughter's school",
    'Friend': 'Relative / Friend',
    'Website': 'Kianda Website',
    'SocialMedia': additional.socialPlatform ? `Social Media (${additional.socialPlatform})` : 'Social Media',
    'Other': additional.sourceOther || 'Other'
  };
  const sourceDisplay = sourceMap[additional.source || ''] || additional.source || 'N/A';
  
  drawField(doc, 'How did you hear about us?', sourceDisplay, MARGIN, y, COL_W);

  y += 12;

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
