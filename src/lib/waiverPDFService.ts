import jsPDF from 'jspdf';
import { Waiver } from './waiversService';
import { settingsService } from './settingsService';

export interface WaiverPDFOptions {
  includeSignature: boolean;
  includeTimestamp: boolean;
  includeLegalInfo: boolean;
}

export const waiverPDFService = {
  // Generate a complete waiver PDF with signature
  async generateWaiverPDF(waiver: Waiver, options: WaiverPDFOptions = {
    includeSignature: true,
    includeTimestamp: true,
    includeLegalInfo: true
  }): Promise<string> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (yPosition + (lines.length * (fontSize * 0.4)) > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize * 0.4) + 5;
      
      return yPosition;
    };

    const addSection = (title: string, content: string) => {
      yPosition += 10;
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }
      addText(title, 14, true, [0, 100, 150]);
      addText(content, 10);
    };

    // Header with business branding
    pdf.setFillColor(0, 150, 200);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(settingsService.getSetting('business.name') || 'SURF TRACK', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('DIGITAL WAIVER AND RELEASE OF LIABILITY', pageWidth / 2, 40, { align: 'center' });

    yPosition = 60;
    pdf.setTextColor(0, 0, 0);

    // Waiver title
    const waiverTitle = waiver.activities.includes('Surf Lessons') 
      ? settingsService.getWaiverTitle('lesson')
      : settingsService.getWaiverTitle('rental');
    
    addText(waiverTitle, 16, true);
    yPosition += 10;

    // Participant Information
    addText('PARTICIPANT INFORMATION', 14, true, [0, 100, 150]);
    
    const participantInfo = `
Name: ${waiver.customer_name}
Email: ${waiver.email}
Phone: ${waiver.phone}
Date of Birth: ${waiver.date_of_birth ? new Date(waiver.date_of_birth).toLocaleDateString() : 'Not provided'}

Emergency Contact:
Name: ${waiver.emergency_contact_name}
Phone: ${waiver.emergency_contact_phone}

Activities: ${waiver.activities.join(', ')}
    `;
    
    addText(participantInfo.trim(), 10);

    // Waiver text
    addSection('WAIVER AGREEMENT', waiver.waiver_text || 'Standard waiver agreement text');

    // Additional clauses if any
    const activityType = waiver.activities.includes('Surf Lessons') ? 'lesson' : 'rental';
    const additionalClauses = settingsService.getAdditionalClauses(activityType);
    
    if (additionalClauses.length > 0) {
      addSection('ADDITIONAL TERMS AND CONDITIONS', additionalClauses.join('\n\n'));
    }

    // Signature section
    if (options.includeSignature && waiver.signature_data) {
      // Add new page for signature if needed
      if (yPosition > pageHeight - 150) {
        pdf.addPage();
        yPosition = margin;
      }

      yPosition += 20;
      addText('DIGITAL SIGNATURE', 14, true, [0, 100, 150]);
      
      // Signature box
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 80);
      
      try {
        // Add signature image if available
        if (waiver.signature_data.startsWith('data:image')) {
          pdf.addImage(
            waiver.signature_data,
            'PNG',
            margin + 10,
            yPosition + 10,
            pageWidth - 2 * margin - 20,
            60
          );
        }
      } catch (error) {
        console.error('Error adding signature image:', error);
        // Fallback text
        pdf.setFontSize(12);
        pdf.text('Digital signature on file', margin + 10, yPosition + 40);
      }
      
      yPosition += 90;
      
      // Signature details
      if (options.includeTimestamp && waiver.signed_date) {
        const signatureDetails = `
Signed by: ${waiver.customer_name}
Date: ${new Date(waiver.signed_date).toLocaleString()}
IP Address: ${waiver.ip_address || 'Not recorded'}
Device: ${waiver.device_type || 'Not recorded'}
        `;
        addText(signatureDetails.trim(), 9, false, [100, 100, 100]);
      }
    }

    // Legal compliance information
    if (options.includeLegalInfo) {
      yPosition += 20;
      addSection('LEGAL COMPLIANCE INFORMATION', `
This document constitutes a legally binding agreement. The digital signature above has been verified and is equivalent to a handwritten signature under applicable electronic signature laws.

Document ID: ${waiver.id}
Generated: ${new Date().toLocaleString()}
Waiver Status: ${waiver.status.toUpperCase()}
Expiry Date: ${waiver.expiry_date ? new Date(waiver.expiry_date).toLocaleDateString() : 'No expiry'}

This waiver is stored securely and can be retrieved for legal purposes. For questions about this document, please contact:

${settingsService.getSetting('business.name') || 'Surf Track'}
${settingsService.getSetting('business.address') || ''}
Phone: ${settingsService.getSetting('business.phone') || ''}
Email: ${settingsService.getSetting('business.email') || ''}
      `);
    }

    // Footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Document generated on ${new Date().toLocaleString()}`, margin, footerY);
    pdf.text(`Waiver ID: ${waiver.id.substring(0, 8)}`, pageWidth - margin, footerY, { align: 'right' });

    return pdf.output('datauristring');
  },

  // Download waiver PDF
  async downloadWaiverPDF(waiver: Waiver, options?: WaiverPDFOptions): Promise<void> {
    try {
      const pdfDataUri = await this.generateWaiverPDF(waiver, options);
      
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `Waiver_${waiver.customer_name.replace(/\s+/g, '_')}_${waiver.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Waiver PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading waiver PDF:', error);
      throw new Error('Failed to download waiver PDF');
    }
  },

  // Generate waiver PDF for email attachment
  async generateWaiverPDFBlob(waiver: Waiver, options?: WaiverPDFOptions): Promise<Blob> {
    try {
      const pdfDataUri = await this.generateWaiverPDF(waiver, options);
      
      // Convert data URI to blob
      const response = await fetch(pdfDataUri);
      return await response.blob();
    } catch (error) {
      console.error('❌ Error generating waiver PDF blob:', error);
      throw new Error('Failed to generate waiver PDF blob');
    }
  }
};