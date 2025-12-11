import React, { useState, useEffect } from 'react';
import { Scan, X } from 'lucide-react';

interface Props {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QrScannerMock: React.FC<Props> = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          // Simulate a successful scan of the seeded item
          setTimeout(() => {
             onScan('ASSET-8821-WAGYU');
          }, 500);
          return 100;
        }
        return prev + 2; // fast scan
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
      >
        <X size={24} />
      </button>

      <div className="relative w-72 h-72 border-2 border-white/30 rounded-3xl overflow-hidden mb-8">
        {/* Camera Simulation */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 z-10" />
        
        {/* Scanning Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-[scan_2s_ease-in-out_infinite] z-20" />
        
        {/* Corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl z-20" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl z-20" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl z-20" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl z-20" />

        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/50 text-sm font-mono animate-pulse">正在扫描二维码...</span>
        </div>
      </div>

      <div className="w-72 bg-gray-800 rounded-full h-1.5 mb-4">
        <div 
          className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-gray-400 text-center text-sm">
        请将摄像头对准产品二维码 <br/> 以验证 Fabric 网络上的真实性。
      </p>

      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default QrScannerMock;