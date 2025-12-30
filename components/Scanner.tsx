
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 15, 
        qrbox: (viewWidth, viewHeight) => {
            const minDim = Math.min(viewWidth, viewHeight);
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
        },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
        onScanSuccess(decodedText);
      },
      (error) => {
        // Continuous scanning
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-blue-900/90 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Cámara QR</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Apunte al código oficial</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-90 rounded-2xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="bg-slate-900 p-2 sm:p-4">
          <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
        </div>
        
        <div className="p-8 text-center bg-white">
          <div className="flex justify-center mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
          </div>
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-xs mx-auto">
            Asegúrese de tener buena iluminación y centre el código en el recuadro superior.
          </p>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="mt-8 text-white/70 font-black uppercase text-xs tracking-[0.3em] hover:text-white transition-colors"
      >
        Cerrar Cámara
      </button>

      {/* Override internal scanner button styles to match the app */}
      <style>{`
        #reader__dashboard_section_csr button {
          background-color: #1d4ed8 !important;
          color: white !important;
          border-radius: 1rem !important;
          padding: 10px 20px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          border: none !important;
          letter-spacing: 0.1em !important;
          margin: 10px 0 !important;
        }
        #reader img {
          display: none !important;
        }
        #reader select {
          padding: 8px !important;
          border-radius: 0.75rem !important;
          font-size: 12px !important;
          margin-bottom: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
