import React from 'react';
import { X, Download, FileText, Calendar, User, Shield } from 'lucide-react';

interface SignatureViewerProps {
  signatureData: string;
  customerName: string;
  signedDate?: string;
  onClose: () => void;
  onDownload?: () => void;
}

const SignatureViewer: React.FC<SignatureViewerProps> = ({
  signatureData,
  customerName,
  signedDate,
  onClose,
  onDownload
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="text-xl font-semibold text-white">Digital Signature</h3>
              <p className="text-cyan-200 text-sm">{customerName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Signature Display */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="border-2 border-gray-300 rounded-lg p-4 min-h-48 flex items-center justify-center">
              {signatureData ? (
                <img
                  src={signatureData}
                  alt="Digital Signature"
                  className="max-w-full max-h-40 object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No signature available</p>
                </div>
              )}
            </div>
          </div>

          {/* Signature Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-400" />
                <span className="text-cyan-200 text-sm">Signatory</span>
              </div>
              <p className="text-white font-medium">{customerName}</p>
            </div>

            {signedDate && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span className="text-cyan-200 text-sm">Date Signed</span>
                </div>
                <p className="text-white font-medium">
                  {new Date(signedDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Legal Notice */}
          <div className="mt-6 bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-200 mb-1">Legal Digital Signature</h4>
                <p className="text-blue-200 text-sm">
                  This digital signature is legally binding and equivalent to a handwritten signature 
                  under applicable electronic signature laws. The signature has been captured with 
                  timestamp and device information for verification purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureViewer;