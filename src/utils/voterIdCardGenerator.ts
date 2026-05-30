import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const TAMIL_FONT_FILE = 'NotoSansTamil-Regular.ttf';
const TAMIL_FONT_NAME = 'NotoSansTamil';
const TAMIL_FONT_URLS = [
  '/fonts/NotoSansTamil-Regular.ttf',
  'https://fonts.gstatic.com/s/notosanstamil/v27/ieVc2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-0429tBManUktuex7vGor0RqKDt_EvT.ttf',
];

let tamilFontBase64Cache: string | null = null;
const qrCache = new Map<string, string>();

// Pooled canvases — reused across renderTextToImage calls to avoid DOM churn
let _measureCanvas: HTMLCanvasElement | null = null;
let _drawCanvas: HTMLCanvasElement | null = null;

const getMeasureCanvas = (): HTMLCanvasElement => {
  if (!_measureCanvas && typeof document !== 'undefined') {
    _measureCanvas = document.createElement('canvas');
  }
  return _measureCanvas!;
};

const getDrawCanvas = (): HTMLCanvasElement => {
  if (!_drawCanvas && typeof document !== 'undefined') {
    _drawCanvas = document.createElement('canvas');
  }
  return _drawCanvas!;
};

interface VoterData {
  epicNumber: string;
  voterName: string;
  voterNameEn?: string;
  voterNameTa?: string;
  relationName: string;
  relationNameEn?: string;
  relationNameTa?: string;
  houseNumber?: string;
  age: number;
  gender: string;
  sectionName: string;
  partNumber?: string | number;
  serialNumber?: string | number;
  photoUrl?: string;
}

interface PartWiseVoterData {
  partNumber: string | number;
  voters: VoterData[];
}

const hasTamilChars = (value: string): boolean => /[\u0B80-\u0BFF]/.test(value || '');

/**
 * Renders text using the browser's native text engine (Canvas), which correctly
 * shapes complex scripts like Tamil. Returns a PNG data URL for embedding in jsPDF.
 * This is the only reliable way to render Tamil in browser-generated PDFs.
 */
const renderTextToImage = (
  text: string,
  fontSizePt: number,
  maxWidthMm: number,
  lineHeightMm: number,
  fontWeight: 'normal' | 'bold' = 'normal',
): { dataUrl: string; widthMm: number; heightMm: number; lineCount: number } | null => {
  try {
    const PX_PER_MM = 8;
    const fontSizePx = Math.round(fontSizePt * 0.3528 * PX_PER_MM);
    const maxWidthPx = Math.round(maxWidthMm * PX_PER_MM);
    const lineHeightPx = Math.round(lineHeightMm * PX_PER_MM);
    const fontStack = `${fontWeight} ${fontSizePx}px 'Noto Sans Tamil', 'Nirmala UI', 'Latha', 'Arial Unicode MS', serif`;

    const measureCanvas = getMeasureCanvas();
    const mctx = measureCanvas.getContext('2d')!;
    mctx.font = fontStack;

    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (mctx.measureText(testLine).width <= maxWidthPx) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length === 0) return null;

    const padding = 4;
    const canvasWidth = maxWidthPx;
    const canvasHeight = lineHeightPx * lines.length + padding;

    const canvas = getDrawCanvas();
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = fontStack;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => ctx.fillText(line, 0, i * lineHeightPx + 2));

    return {
      dataUrl: canvas.toDataURL('image/png'),
      widthMm: canvasWidth / PX_PER_MM,
      heightMm: canvasHeight / PX_PER_MM,
      lineCount: lines.length,
    };
  } catch (e) {
    console.warn('Failed to render text to image:', e);
    return null;
  }
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) {
        reject(new Error('Failed to convert font blob to base64'));
        return;
      }
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Failed to read font blob'));
    reader.readAsDataURL(blob);
  });

const registerTamilFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    if (!tamilFontBase64Cache) {
      for (const fontUrl of TAMIL_FONT_URLS) {
        try {
          const response = await fetch(fontUrl);
          if (!response.ok) {
            continue;
          }
          const fontBlob = await response.blob();
          tamilFontBase64Cache = await blobToBase64(fontBlob);
          break;
        } catch {
          // try next font URL
        }
      }
    }

    if (!tamilFontBase64Cache) {
      return false;
    }

    doc.addFileToVFS(TAMIL_FONT_FILE, tamilFontBase64Cache);
    doc.addFont(TAMIL_FONT_FILE, TAMIL_FONT_NAME, 'normal');

    try {
      doc.setFont(TAMIL_FONT_NAME, 'normal');
      doc.getTextWidth('தமிழ் Tamil 123');
      return true;
    } catch (fontValidationError) {
      console.warn('Tamil font registered but failed validation, falling back to Helvetica:', fontValidationError);
      doc.setFont('helvetica', 'normal');
      return false;
    }
  } catch (error) {
    console.warn('Failed to register Tamil font:', error);
    return false;
  }
};

/**
 * Helper function to load image with proper error handling
 */
const loadImageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (err) => {
      console.error('Image loading error:', err);
      reject(new Error(`Failed to load image from ${url}`));
    };
    
    const timeoutId = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.src = cacheBustedUrl;
  });
};

/**
 * Helper function to draw "No Photo" placeholder
 */
const drawNoPhotoPlaceholder = (doc: jsPDF, x: number, y: number, width: number, height: number): void => {
  doc.setDrawColor(150, 150, 150);
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, height, 'FD');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('No Photo', x + width/2, y + height/2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
};

/**
 * Generates a Voter ID Card in PDF format (Increased ATM card size: 100mm x 63mm)
 * @param voterData - Voter information
 * @returns Promise<void>
 */
export const generateVoterIdCard = async (voterData: VoterData): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [120, 75]
    });

    const pageWidth = 120;
    const pageHeight = 75;
    const outerMargin = 5;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(outerMargin, outerMargin, pageWidth - (outerMargin * 2), pageHeight - (outerMargin * 2), 2, 2);

    const photoWidth = 30;
    const photoHeight = 35;
    const photoX = outerMargin + 5;
    const photoY = outerMargin + 8;

    if (voterData.photoUrl) {
      try {
        const imageBase64 = await loadImageToBase64(voterData.photoUrl);
        doc.addImage(imageBase64, 'JPEG', photoX, photoY, photoWidth, photoHeight);
      } catch (error) {
        console.warn('Photo loading failed:', error);
        drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
      }
    } else {
      drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
    }

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.rect(photoX, photoY, photoWidth, photoHeight);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(voterData.epicNumber, photoX + (photoWidth / 2), photoY + photoHeight + 4, { align: 'center' });

    const formatPartNumber = (value?: string | number) => {
      if (value === undefined || value === null || value === '') return '--';
      const normalized = String(value).trim();
      if (!normalized) return '--';
      if (/^\d+$/.test(normalized)) {
        return normalized.padStart(2, '0');
      }
      return normalized;
    };

    const formatSerialNumber = (value?: string | number) => {
      if (value === undefined || value === null || value === '') return '--';
      const normalized = String(value).trim();
      if (!normalized) return '--';
      if (/^\d+$/.test(normalized) && normalized.length < 2) {
        return normalized.padStart(2, '0');
      }
      return normalized;
    };

    const drawInlineMetaField = (
      label: string,
      value: string,
      fieldX: number,
      baselineY: number,
      fieldWidth: number
    ) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(0, 0, 0);
      doc.text(`${label} :`, fieldX, baselineY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(value, fieldX + fieldWidth, baselineY);
    };

    const partDisplayValue = formatPartNumber(voterData.partNumber);
    const serialDisplayValue = formatSerialNumber(voterData.serialNumber);
    const qrSize = 18;
    const qrX = pageWidth - outerMargin - qrSize - 4;
    const qrY = pageHeight - outerMargin - qrSize - 6;
    const metaBaselineY = qrY + qrSize;
    const metaFieldWidth = 13;
    const metaFieldGap = 13;
    const leftFieldX = photoX;
    const rightFieldX = leftFieldX + metaFieldWidth + 21 + metaFieldGap;
    drawInlineMetaField('Part no', partDisplayValue, leftFieldX, metaBaselineY, metaFieldWidth);
    drawInlineMetaField('Serial no', serialDisplayValue, rightFieldX, metaBaselineY, metaFieldWidth);

    const detailsX = photoX + photoWidth + 8;
    const detailsStartY = photoY - 1;  // start near top of card for more vertical room
    const labelFontSize = 7;
    const valueFontSize = 7.5;
    const lineHeight = 5.0;  // tighter lines so section text clears the QR
    const labelWidth = 17; 
    const valueX = detailsX + labelWidth;
    const maxTextWidth = qrX - valueX - 4;

    let currentY = detailsStartY;

    // addField: labels via jsPDF, Tamil values via Canvas image (correct shaping)
    const addField = (label: string, value: string, bold = false) => {
      doc.setFontSize(labelFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(label, detailsX, currentY);

      const hasTamil = hasTamilChars(value);

      if (hasTamil) {
        const rendered = renderTextToImage(value, valueFontSize, maxTextWidth, lineHeight, bold ? 'bold' : 'normal');
        if (rendered) {
          const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
          doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
          currentY += lineHeight * rendered.lineCount;
          return;
        }
      }

      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(valueFontSize);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(value || 'N/A', maxTextWidth);
      doc.text(lines, valueX, currentY);
      currentY += lineHeight * lines.length;
    };

    const addProminentAddressField = (label: string, value: string) => {
      currentY -= 0.8;

      doc.setFontSize(labelFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(label, detailsX, currentY);

      const addressValue = value || 'N/A';
      const addressFontSize = 8.4;
      const addressLineHeight = 4.7;

      if (hasTamilChars(addressValue)) {
        const rendered = renderTextToImage(addressValue, addressFontSize, maxTextWidth, addressLineHeight, 'bold');
        if (rendered) {
          const imgTop = currentY - addressFontSize * 0.3528 * 0.8;
          doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
          currentY += addressLineHeight * rendered.lineCount;
          return;
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(addressFontSize);
      const lines = doc.splitTextToSize(addressValue, maxTextWidth);
      doc.text(lines, valueX, currentY);
      currentY += addressLineHeight * Math.max(lines.length, 1);
    };

    // Helper: render English on line 1 and Tamil on line 2
    const addBilingualField = (label: string, enValue: string, taValue: string) => {
      doc.setFontSize(labelFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(label, detailsX, currentY);

      if (enValue) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(valueFontSize);
        const enLines = doc.splitTextToSize(enValue, maxTextWidth);
        doc.text(enLines, valueX, currentY);
        currentY += lineHeight * enLines.length;
      }

      if (taValue) {
        const rendered = renderTextToImage(taValue, valueFontSize, maxTextWidth, lineHeight, 'bold');
        if (rendered) {
          const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
          doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
          currentY += lineHeight * rendered.lineCount;
        }
      }

      if (!enValue && !taValue) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(valueFontSize);
        doc.text('N/A', valueX, currentY);
        currentY += lineHeight;
      }
    };

    // Name (English line 1, Tamil line 2)
    addBilingualField(
      'Name:',
      voterData.voterNameEn || '',
      voterData.voterNameTa || ''
    );

    // Relation (English line 1, Tamil line 2)
    addBilingualField(
      'Relation:',
      voterData.relationNameEn || '',
      voterData.relationNameTa || ''
    );

    // Age & Gender on same line
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal'); // Label normal
    doc.setTextColor(0, 0, 0);
    doc.text('Age:', detailsX, currentY);
    
    doc.setFontSize(valueFontSize);
    doc.setFont('helvetica', 'bold'); // Value bold
    doc.setTextColor(0, 0, 0);
    const ageText = voterData.age ? voterData.age.toString() : 'N/A';
    doc.text(ageText, detailsX + 9, currentY);
    
    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'normal'); // Label normal
    doc.setTextColor(0, 0, 0);
    doc.text('Gender:', detailsX + 20, currentY);
    
    // Gender: use Canvas if Tamil
    const genderValue = voterData.gender || 'N/A';
    if (hasTamilChars(genderValue)) {
      const rendered = renderTextToImage(genderValue, valueFontSize, 20, lineHeight);
      if (rendered) {
        const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
        doc.addImage(rendered.dataUrl, 'PNG', detailsX + 36, imgTop, rendered.widthMm, rendered.heightMm);
      } else {
        doc.setFontSize(valueFontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(genderValue, detailsX + 36, currentY);
      }
    } else {
      doc.setFontSize(valueFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(genderValue, detailsX + 36, currentY);
    }
    currentY += lineHeight;

    // House Number (above Section)
    if (voterData.houseNumber) {
      addField('House No:', voterData.houseNumber);
    }

    // Section (BOLD value)
    addProminentAddressField('Address:', voterData.sectionName || 'N/A');

    // QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(voterData.epicNumber, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M'
    });

    doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.save(`voter-id-${voterData.epicNumber}.pdf`);
  } catch (error) {
    console.error('Error generating voter ID card:', error);
    throw error;
  }
};

/**
 * Generates multiple voter ID cards in a single PDF
 * @param votersData - Array of voter information
 * @returns Promise<void>
 */
export const generateBulkVoterIdCards = async (votersData: VoterData[]): Promise<void> => {
  try {
    if (votersData.length === 0) {
      throw new Error('No voters selected for ID card generation');
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [120, 75]
    });

    for (let i = 0; i < votersData.length; i++) {
      if (i > 0) {
        doc.addPage([120, 75], 'landscape');
      }

      const voterData = votersData[i];
      const pageWidth = 120;
      const pageHeight = 75;
      const outerMargin = 5;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.roundedRect(outerMargin, outerMargin, pageWidth - (outerMargin * 2), pageHeight - (outerMargin * 2), 2, 2);

      const photoWidth = 30;
      const photoHeight = 35;
      const photoX = outerMargin + 5;
      const photoY = outerMargin + 8;

      if (voterData.photoUrl) {
        try {
          const imageBase64 = await loadImageToBase64(voterData.photoUrl);
          doc.addImage(imageBase64, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        } catch (error) {
          drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
        }
      } else {
        drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
      }

      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.rect(photoX, photoY, photoWidth, photoHeight);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(voterData.epicNumber, photoX + (photoWidth / 2), photoY + photoHeight + 4, { align: 'center' });

      const detailsX = photoX + photoWidth + 8;
      const detailsStartY = photoY + 2;
      const labelFontSize = 7;
      const valueFontSize = 7.5;
      const lineHeight = 5.5;
      const labelWidth = 17;
      const valueX = detailsX + labelWidth;
      const maxTextWidth = pageWidth - valueX - outerMargin - 12;

      let currentY = detailsStartY;

      const addField = (label: string, value: string, bold = false) => {
        doc.setFontSize(labelFontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(label, detailsX, currentY);

        const hasTamil = hasTamilChars(value);

        if (hasTamil) {
          const rendered = renderTextToImage(value, valueFontSize, maxTextWidth, lineHeight, bold ? 'bold' : 'normal');
          if (rendered) {
            const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
            doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
            currentY += lineHeight * rendered.lineCount;
            return;
          }
        }

        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(valueFontSize);
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(value, maxTextWidth);
        doc.text(lines, valueX, currentY);
        currentY += lineHeight * lines.length;
      };

      // Helper: render English on line 1 and Tamil on line 2 (bulk)
      const addBilingualFieldBulk = (label: string, enValue: string, taValue: string) => {
        doc.setFontSize(labelFontSize);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(label, detailsX, currentY);

        if (enValue) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(valueFontSize);
          const enLines = doc.splitTextToSize(enValue, maxTextWidth);
          doc.text(enLines, valueX, currentY);
          currentY += lineHeight * enLines.length;
        }

        if (taValue) {
          const rendered = renderTextToImage(taValue, valueFontSize, maxTextWidth, lineHeight, 'bold');
          if (rendered) {
            const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
            doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
            currentY += lineHeight * rendered.lineCount;
          }
        }

        if (!enValue && !taValue) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(valueFontSize);
          doc.text('N/A', valueX, currentY);
          currentY += lineHeight;
        }
      };

      // Name (English line 1, Tamil line 2)
      addBilingualFieldBulk(
        'Name:',
        voterData.voterNameEn || '',
        voterData.voterNameTa || ''
      );

      // Relation (English line 1, Tamil line 2)
      addBilingualFieldBulk(
        'Relation:',
        voterData.relationNameEn || '',
        voterData.relationNameTa || ''
      );

      // Age & Gender
      doc.setFontSize(labelFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Age:', detailsX, currentY);
      
      doc.setFontSize(valueFontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(voterData.age.toString(), detailsX + 9, currentY);
      
      doc.setFontSize(labelFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Gender:', detailsX + 20, currentY);
      
      const genderBulkVal = voterData.gender || 'N/A';
      if (hasTamilChars(genderBulkVal)) {
        const rendered = renderTextToImage(genderBulkVal, valueFontSize, 20, lineHeight);
        if (rendered) {
          const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
          doc.addImage(rendered.dataUrl, 'PNG', detailsX + 36, imgTop, rendered.widthMm, rendered.heightMm);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.text(genderBulkVal, detailsX + 36, currentY);
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text(genderBulkVal, detailsX + 36, currentY);
      }
      currentY += lineHeight;

      // House Number (above Section)
      if (voterData.houseNumber) {
        addField('House No:', voterData.houseNumber);
      }

      addField('Address:', voterData.sectionName);

      // QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(voterData.epicNumber, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      const qrSize = 18;
      const qrX = pageWidth - outerMargin - qrSize - 3;
      const qrY = pageHeight - outerMargin - qrSize - 3;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    doc.save(`voter-id-cards-bulk-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Error generating bulk voter ID cards:', error);
    throw error;
  }
};

/**
 * Generates part-wise voter ID cards in A4 print layout with 2 cards per row
 * @param partWiseData - Voters grouped by part number
 * @returns Promise<void>
 */
export const generatePartWiseVoterIdCards = async (
  partWiseData: PartWiseVoterData[],
  photoMode: 'yes' | 'no' | 'both' = 'both',
  template: '8perpage' | '10perpage' = '8perpage'
): Promise<void> => {
  try {
    if (!partWiseData || partWiseData.length === 0) {
      throw new Error("No voters found for selected part(s)");
    }

    const filteredPartData = partWiseData
      .map((part) => ({
        ...part,
        voters: Array.isArray(part.voters) ? part.voters : [],
      }))
      .filter((part) => part.voters.length > 0);

    if (filteredPartData.length === 0) {
      throw new Error("No voters found for selected part(s)");
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Template-specific layout constants
    // Template 1 (8perpage): 91mm × 54mm cards — 2 cols × 4 rows, with part header
    // Template 2 (10perpage): 88mm × 58mm cards — 2 cols × 5 rows, no part header
    const is10PerPage = template === '10perpage';
    const marginX    = is10PerPage ? 16   : 12;
    const marginY    = is10PerPage ? 1    : 8;
    const headerHeight = is10PerPage ? 0  : 10;
    const cardGapX   = is10PerPage ? 2    : 4;
    const cardGapY   = is10PerPage ? 0.6  : 3;
    const cardHeight  = is10PerPage ? 58  : 54;
    // cardWidth: 10perpage → (210-32-2)/2=88mm, 8perpage → (210-24-4)/2=91mm
    const cardWidth = (pageWidth - marginX * 2 - cardGapX) / 2;

    const drawPartHeader = (partNumber: string | number, isContinued = false) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const suffix = isContinued ? " (Contd.)" : "";
      doc.text(`Part ${partNumber}${suffix}`, marginX, marginY + 5);

      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(marginX, marginY + 7, pageWidth - marginX, marginY + 7);
    };

    const drawCard = async (voterData: VoterData, cardX: number, cardY: number, showPhoto: boolean) => {
      const outerMargin = 2;
      const innerX = cardX + outerMargin;
      const innerY = cardY + outerMargin;
      const innerWidth = cardWidth - outerMargin * 2;
      const innerHeight = cardHeight - outerMargin * 2;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.roundedRect(innerX, innerY, innerWidth, innerHeight, 1.5, 1.5);

      const photoWidth = 20;
      const photoHeight = 24;
      const photoX = innerX + 3;
      const photoY = innerY + 4;

      if (showPhoto) {
        if (voterData.photoUrl) {
          try {
            const imageBase64 = await loadImageToBase64(voterData.photoUrl);
            doc.addImage(imageBase64, "JPEG", photoX, photoY, photoWidth, photoHeight);
          } catch (error) {
            drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
          }
        } else {
          drawNoPhotoPlaceholder(doc, photoX, photoY, photoWidth, photoHeight);
        }
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.2);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(voterData.epicNumber || "N/A", photoX + photoWidth / 2, photoY + photoHeight + 3, {
        align: "center",
      });

      const formatPartNumber = (value?: string | number) => {
        if (value === undefined || value === null || value === "") return "--";
        const normalized = String(value).trim();
        if (!normalized) return "--";
        if (/^\d+$/.test(normalized)) {
          return normalized.padStart(2, "0");
        }
        return normalized;
      };

      const formatSerialNumber = (value?: string | number) => {
        if (value === undefined || value === null || value === "") return "--";
        const normalized = String(value).trim();
        if (!normalized) return "--";
        if (/^\d+$/.test(normalized) && normalized.length < 2) {
          return normalized.padStart(2, "0");
        }
        return normalized;
      };

      const drawInlineMetaField = (
        label: string,
        value: string,
        fieldX: number,
        baselineY: number,
        fieldWidth: number
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.4);
        doc.setTextColor(0, 0, 0);
        doc.text(`${label} :`, fieldX, baselineY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.4);
        doc.text(value, fieldX + fieldWidth, baselineY);
      };

      const partDisplayValue = formatPartNumber(voterData.partNumber);
      const serialDisplayValue = formatSerialNumber(voterData.serialNumber);
      const qrSize = 14;
      const qrX = innerX + innerWidth - qrSize - 3;
      const qrY = innerY + innerHeight - qrSize - 6;
      const metaBaselineY = qrY + qrSize;
      const inlineFieldWidth = 11;
      const inlineGap = 9;
      const metaLeftX = photoX;
      const metaRightX = metaLeftX + inlineFieldWidth + 18 + inlineGap;
      drawInlineMetaField("Part no", partDisplayValue, metaLeftX, metaBaselineY, inlineFieldWidth);
      drawInlineMetaField("Serial no", serialDisplayValue, metaRightX, metaBaselineY, inlineFieldWidth);

      const detailsX = photoX + photoWidth + 4;
      const detailsStartY = innerY + 6;
      const labelFontSize = 6;
      const valueFontSize = 6.5;
      const lineHeight = 4.2;
      const labelWidth = 13;
      const valueX = detailsX + labelWidth;
      const maxTextWidth = qrX - valueX - 3;

      let currentY = detailsStartY;

      const addField = (label: string, value: string, bold = false) => {
        const fieldValue = value || "N/A";

        doc.setFontSize(labelFontSize);
        doc.setFont("helvetica", "normal");
        doc.text(label, detailsX, currentY);

        const hasTamil = hasTamilChars(fieldValue);

        if (hasTamil) {
          const rendered = renderTextToImage(fieldValue, valueFontSize, maxTextWidth, lineHeight, bold ? 'bold' : 'normal');
          if (rendered) {
            const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
            doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
            currentY += lineHeight * rendered.lineCount;
            return;
          }
        }

        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(valueFontSize);
        const lines = doc.splitTextToSize(fieldValue, maxTextWidth);
        doc.text(lines, valueX, currentY);
        currentY += lineHeight * Math.max(lines.length, 1);
      };

      const addProminentAddressField = (label: string, value: string) => {
        currentY -= 0.6;

        doc.setFontSize(labelFontSize);
        doc.setFont("helvetica", "normal");
        doc.text(label, detailsX, currentY);

        const addressValue = value || "N/A";
        const addressFontSize = 7.2;
        const addressLineHeight = 3.9;

        if (hasTamilChars(addressValue)) {
          const rendered = renderTextToImage(addressValue, addressFontSize, maxTextWidth, addressLineHeight, 'bold');
          if (rendered) {
            const imgTop = currentY - addressFontSize * 0.3528 * 0.8;
            doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
            currentY += addressLineHeight * rendered.lineCount;
            return;
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(addressFontSize);
        const lines = doc.splitTextToSize(addressValue, maxTextWidth);
        doc.text(lines, valueX, currentY);
        currentY += addressLineHeight * Math.max(lines.length, 1);
      };

      // Helper: render English on line 1 and Tamil on line 2 (part-wise)
      const addBilingualFieldPW = (label: string, enValue: string, taValue: string) => {
        doc.setFontSize(labelFontSize);
        doc.setFont("helvetica", "normal");
        doc.text(label, detailsX, currentY);

        if (enValue) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(valueFontSize);
          const enLines = doc.splitTextToSize(enValue, maxTextWidth);
          doc.text(enLines, valueX, currentY);
          currentY += lineHeight * enLines.length;
        }

        if (taValue) {
          const rendered = renderTextToImage(taValue, valueFontSize, maxTextWidth, lineHeight, 'bold');
          if (rendered) {
            const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
            doc.addImage(rendered.dataUrl, 'PNG', valueX, imgTop, rendered.widthMm, rendered.heightMm);
            currentY += lineHeight * rendered.lineCount;
          }
        }

        if (!enValue && !taValue) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(valueFontSize);
          doc.text("N/A", valueX, currentY);
          currentY += lineHeight;
        }
      };

      // Name (English line 1, Tamil line 2)
      addBilingualFieldPW(
        "Name:",
        voterData.voterNameEn || "",
        voterData.voterNameTa || ""
      );

      // Relation (English line 1, Tamil line 2)
      addBilingualFieldPW(
        "Relation:",
        voterData.relationNameEn || "",
        voterData.relationNameTa || ""
      );

      doc.setFontSize(labelFontSize);
      doc.setFont("helvetica", "normal");
      doc.text("Age:", detailsX, currentY);
      doc.setFontSize(valueFontSize);
      doc.setFont("helvetica", "bold");
      doc.text(voterData.age ? String(voterData.age) : "N/A", detailsX + 8, currentY);

      doc.setFontSize(labelFontSize);
      doc.setFont("helvetica", "normal");
      doc.text("Gender:", detailsX + 18, currentY);
      doc.setFontSize(valueFontSize);
      const genderVal = voterData.gender || "N/A";
      if (hasTamilChars(genderVal)) {
        const rendered = renderTextToImage(genderVal, valueFontSize, 18, lineHeight);
        if (rendered) {
          const imgTop = currentY - valueFontSize * 0.3528 * 0.8;
          doc.addImage(rendered.dataUrl, 'PNG', detailsX + 31, imgTop, rendered.widthMm, rendered.heightMm);
        } else {
          doc.setFont("helvetica", "bold");
          doc.text(genderVal, detailsX + 31, currentY);
        }
      } else {
        doc.setFont("helvetica", "bold");
        doc.text(genderVal, detailsX + 31, currentY);
      }
      currentY += lineHeight;

      // House Number (above Section)
      if (voterData.houseNumber) {
        addField("House No:", voterData.houseNumber, false);
      }

      addProminentAddressField("Address:", voterData.sectionName || "N/A");

      const qrKey = voterData.epicNumber || "N/A";
      let qrCodeDataUrl = qrCache.get(qrKey);
      if (!qrCodeDataUrl) {
        qrCodeDataUrl = await QRCode.toDataURL(qrKey, { width: 200, margin: 1, errorCorrectionLevel: "M" });
        qrCache.set(qrKey, qrCodeDataUrl);
      }
      doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    };

    let isFirstPage = true;
    qrCache.clear();

    for (const part of filteredPartData) {
      if (!isFirstPage) {
        doc.addPage("a4", "portrait");
      }
      isFirstPage = false;

      if (!is10PerPage) {
        drawPartHeader(part.partNumber);
      }
      let cursorY = marginY + headerHeight;
      let col = 0;
      let partContinued = false;
      let voterIndex = 0;

      for (const voter of part.voters) {
        // Yield to the browser every 10 cards so the UI stays responsive
        if (voterIndex % 10 === 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, 0));
        }
        voterIndex++;

        const cardX = marginX + col * (cardWidth + cardGapX);

        if (cursorY + cardHeight > pageHeight - marginY) {
          doc.addPage("a4", "portrait");
          partContinued = true;
          if (!is10PerPage) {
            drawPartHeader(part.partNumber, partContinued);
          }
          cursorY = marginY + headerHeight;
          col = 0;
        }

        await drawCard(voter, cardX, cursorY, photoMode !== 'no');

        if (col === 0) {
          col = 1;
        } else {
          col = 0;
          cursorY += cardHeight + cardGapY;
        }
      }

      if (col === 1) {
        cursorY += cardHeight + cardGapY;
      }
    }

    doc.save(`voter-id-cards-part-wise-${Date.now()}.pdf`);
  } catch (error) {
    console.error("Error generating part-wise voter ID cards:", error);
    throw error;
  }
};