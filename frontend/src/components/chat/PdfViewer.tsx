import { useEffect, useState } from "react";
import { X, Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfViewerProps {
  pdfUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewer = ({ pdfUrl, isOpen, onClose }: PdfViewerProps) => {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Detect if we're in production environment
  const isProduction = window.location.hostname === 'avai.life' || 
                      window.location.hostname.includes('avai.life') ||
                      window.location.protocol === 'https:' ||
                      window.location.hostname !== 'localhost';

  // Test if PDF is accessible
  const testPdfAccess = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('PDF accessibility test failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      console.log(`PDF Viewer opened - Production mode: ${isProduction}, URL: ${pdfUrl}`);
      setIsLoading(true);
      setShowFallback(false);
      setIframeError(false);
      document.addEventListener('keydown', handleEscape);
      
      // Test PDF accessibility in production
      if (isProduction) {
        console.log('Production environment detected, testing PDF accessibility...');
        testPdfAccess(pdfUrl).then(isAccessible => {
          console.log(`PDF accessible: ${isAccessible}`);
          setIsLoading(false);
          if (!isAccessible) {
            console.log('PDF not accessible in production, using fallback');
            setShowFallback(true);
          } else {
            // Even if accessible, show fallback in production due to iframe restrictions
            console.log('Using fallback UI for production security compliance');
            setTimeout(() => setShowFallback(true), 500);
          }
        });
      } else {
        console.log('Development environment, attempting iframe load...');
        // In development, give PDF time to load before showing fallback
        const timeout = setTimeout(() => {
          setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose, pdfUrl, isProduction]);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfUrl.split('/').pop() || 'document.pdf';
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
        "flex items-center justify-center p-4"
      )}
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl h-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              {pdfUrl.split('/').pop()?.replace('.pdf', '') || 'PDF Document'}
            </h2>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="text-green-400 border-green-400 hover:bg-green-400/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 relative overflow-hidden bg-gray-800">
          {showFallback || isProduction ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-gray-700 rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-white mb-4">
                  📄 Security Audit Report Ready
                </h3>
                <p className="text-gray-300 mb-6">
                  {isProduction 
                    ? "For security reasons, PDF preview is not available in production. Use the buttons below to view the complete audit report:"
                    : "Your browser doesn't support embedded PDF viewing. Use the buttons below to view the report:"
                  }
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={handleOpenInNewTab}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open PDF in New Tab
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full border-green-400 text-green-400 hover:bg-green-400/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>
                {isProduction && (
                  <p className="text-xs text-gray-400 mt-4">
                    💡 Production environments require opening PDFs in a new tab for security compliance
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
                style={{ minHeight: "600px" }}
                onLoad={() => {
                  console.log("PDF iframe loaded successfully");
                  setIsLoading(false);
                }}
                onError={() => {
                  console.error("PDF iframe failed to load, showing fallback");
                  setShowFallback(true);
                  setIframeError(true);
                  setIsLoading(false);
                }}
              />
              
              {/* Manual fallback trigger if PDF doesn't load visually */}
              {!showFallback && !isLoading && (
                <div className="absolute bottom-4 right-4">
                  <Button
                    onClick={() => setShowFallback(true)}
                    variant="outline"
                    size="sm"
                    className="text-xs text-gray-400 border-gray-600 hover:bg-gray-700"
                  >
                    PDF not displaying? Click here
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              📄 Security Audit Report - Generated by AVAI Analysis Engine
              {isProduction && " • Production Mode"}
            </span>
            <span>
              Press ESC to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
