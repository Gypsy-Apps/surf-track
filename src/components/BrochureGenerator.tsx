import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  X,
  CheckCircle,
  Shield
} from 'lucide-react';

interface BrochureGeneratorProps {
  onClose?: () => void;
}

const BrochureGenerator: React.FC<BrochureGeneratorProps> = ({ onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBrochure = async () => {
    setIsGenerating(true);
    
    try {
      // Instead of generating a PDF, we'll now just download the PNG file directly
      const link = document.createElement('a');
     link.href = '/surf-track-brochure.pdf';
link.download = 'Surf_Track_Brochure.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error downloading brochure:', error);
      alert('Error downloading brochure. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Download Surf Track Brochure</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="h-32 w-32 mx-auto mb-4 rounded-full overflow-hidden">
              <img src="/Untitled (52).png" alt="Surf Track Logo" className="h-full w-full object-cover" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Professional Product Brochure</h4>
            <p className="text-cyan-200 text-sm">
              Download our comprehensive brochure featuring complete platform details, 
              technical specifications, and implementation information.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <h5 className="font-semibold text-white mb-3">Brochure Contents:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-cyan-200">Complete Feature Set</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-cyan-200">Business Benefits</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-cyan-200">About the Developer</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-cyan-200">Berkner Platform Solutions</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/20 rounded-xl p-4 mb-6 border border-blue-500/30">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-blue-200">Professional Quality</span>
            </div>
            <p className="text-blue-200 text-sm">
              This brochure is designed for sharing with stakeholders, investors, or team members. 
              It showcases how Surf Track breaks free from bloated, expensive systems with software made with soul—for 
              businesses that live by the tide, not the clock.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={generateBrochure}
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 disabled:from-cyan-800 disabled:to-blue-900 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-3 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
          <span>Download Brochure (PDF)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-cyan-300 text-xs mt-4">
          The brochure will be automatically downloaded as "Surf_Track_Brochure.pdf"
          </p>
        </div>
      </div>
    </div>
  );
};

export default BrochureGenerator;
