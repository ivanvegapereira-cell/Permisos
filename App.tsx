
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  AppState, 
  PermissionFormData, 
  ReasonType, 
  AreaType,
  PermissionRecord
} from './types';
import Scanner from './components/Scanner';
import PermissionForm from './components/PermissionForm';
import { generateFormalEmailBody, validateRequestSummary } from './services/geminiService';

const INITIAL_FORM: PermissionFormData = {
  educatorName: '',
  position: '',
  contractHours: 0,
  requestDate: new Date().toISOString().split('T')[0],
  executionDate: '',
  durationHours: 1,
  durationMinutes: 0,
  reason: ReasonType.MEDICO,
  withPay: true,
  area: AreaType.ACADEMICA,
  additionalNotes: ''
};

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M7 18H17M7 14H13M7 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 6.5C15 7.32843 14.3284 8 13.5 8C12.6716 8 12 7.32843 12 6.5C12 5.67157 12.6716 5 13.5 5C14.3284 5 15 5.67157 15 6.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="16" y="3" width="5" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 10L14 12M21 10L23 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="18.5" cy="15.5" r="3.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M17.5 15.5L18.25 16.25L19.75 14.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [showAppQR, setShowAppQR] = useState(false);
  const [formData, setFormData] = useState<PermissionFormData>(INITIAL_FORM);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<PermissionRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('permisos_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('permisos_history', JSON.stringify(history));
  }, [history]);

  const stats = useMemo(() => {
    const currentName = formData.educatorName.trim().toLowerCase();
    const filtered = currentName 
      ? history.filter(h => h.educatorName.trim().toLowerCase() === currentName)
      : history;

    const totalPermits = filtered.length;
    const totalMinutes = filtered.reduce((acc, curr) => acc + (Number(curr.durationHours) * 60) + Number(curr.durationMinutes), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return { totalPermits, totalHours, remainingMinutes, hasRecords: totalPermits > 0 };
  }, [history, formData.educatorName]);

  const startScanning = () => setState('SCANNING');
  
  const handleScanSuccess = useCallback((data: string) => {
    setState('FORM');
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setState('SUBMITTING');

    try {
      const summaryResult = await validateRequestSummary(formData);
      setAiSummary(summaryResult.summary);
    } catch (err) {
      console.error(err);
      setAiSummary("La solicitud está lista para ser procesada.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeAndSend = async () => {
    setIsProcessing(true);
    try {
      const emailBody = await generateFormalEmailBody(formData);
      const recipient = "coordpedagogico@salesianoconcepcion.cl";
      const subject = `SOLICITUD FORMAL DE PERMISO: ${formData.educatorName} - ${formData.executionDate}`;
      
      const newRecord: PermissionRecord = {
        ...formData,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      setHistory(prev => [newRecord, ...prev]);

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      window.open(gmailUrl, '_blank');
      setState('SUCCESS');
    } catch (err) {
      console.error(err);
      alert("Error al procesar el envío.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFormData(INITIAL_FORM);
    setAiSummary('');
    setState('IDLE');
  };

  const appQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 flex flex-col">
      <header className="sticky top-0 z-40 bg-blue-900 text-white shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center p-1">
              <img src="https://picsum.photos/id/40/100/100" alt="Logo Salesiano" className="rounded-full grayscale" />
            </div>
            <div className="truncate">
              <h1 className="text-sm sm:text-lg font-bold leading-none truncate">Salesiano Concepción</h1>
              <p className="hidden sm:block text-[10px] text-blue-200 mt-1 uppercase tracking-tight">Portal de Gestión de Permisos</p>
            </div>
          </div>
          <button 
            onClick={reset} 
            className="flex-shrink-0 text-xs bg-blue-800 hover:bg-blue-700 active:scale-95 px-3 py-2 rounded-lg transition-all font-semibold"
          >
            Inicio
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {state === 'IDLE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] text-center px-6 bg-white rounded-3xl shadow-sm border border-slate-100 py-10 sm:py-16">
              <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-blue-50 rounded-full">
                <DocumentIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3 sm:mb-4 tracking-tight">Registro de Permisos</h2>
              <p className="text-slate-600 max-w-md mb-8 sm:mb-10 text-sm sm:text-base px-2">
                Use su cámara para escanear el código QR institucional o complete el formulario de solicitud manualmente.
              </p>
              
              <div className="flex flex-col gap-4 w-full sm:w-auto px-4 sm:px-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={startScanning} 
                    className="w-full sm:w-auto px-10 py-4 bg-blue-700 text-white text-lg font-bold rounded-2xl hover:bg-blue-800 active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    Escanear QR
                  </button>
                  <button 
                    onClick={() => setState('FORM')} 
                    className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-slate-200 text-slate-700 text-lg font-bold rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Llenar Manual
                  </button>
                </div>
                
                <button 
                  onClick={() => setShowAppQR(true)}
                  className="w-full px-6 py-3 bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Compartir Acceso (QR)
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Estadísticas
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Solicitudes</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-900">{history.length}</p>
                  </div>
                  <div className="bg-orange-50 p-3 sm:p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Total Horas</p>
                    <p className="text-xl sm:text-2xl font-black text-orange-900">
                      {stats.totalHours}h
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Recientes</h3>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 uppercase font-bold tracking-tighter">Últimos 10</span>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 italic">Sin registros previos.</p>
                    </div>
                  ) : (
                    history.slice(0, 10).map(rec => (
                      <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                        <p className="text-xs font-bold text-slate-800 truncate">{rec.educatorName}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                          <span>{rec.executionDate}</span>
                          <span className={`px-2 py-0.5 rounded ${rec.withPay ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} font-bold`}>
                            {rec.durationHours}h {rec.durationMinutes}m
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal QR de la App */}
        {showAppQR && (
          <div className="fixed inset-0 z-[100] bg-blue-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in duration-300">
              <button 
                onClick={() => setShowAppQR(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Acceso Directo</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Escanea para abrir la app</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border-4 border-blue-50 shadow-inner mb-6 flex justify-center">
                <img src={appQrUrl} alt="QR de la App" className="w-full max-w-[200px] h-auto" />
              </div>

              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Comparte este código con otros educadores para que puedan realizar sus solicitudes rápidamente.
              </p>
            </div>
          </div>
        )}

        {state === 'SCANNING' && (
          <Scanner onScanSuccess={handleScanSuccess} onClose={() => setState('IDLE')} />
        )}

        {state === 'FORM' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 sm:space-y-6">
            {stats.hasRecords && (
              <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex items-center justify-between">
                <div className="flex-grow">
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Registro Personal: {formData.educatorName || 'Educador'}</p>
                  <p className="text-xs sm:text-sm">Historial: <strong>{stats.totalPermits} permisos</strong> registrados.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-black">{stats.totalHours}h {stats.remainingMinutes}m</p>
                  <p className="text-[10px] text-blue-300 font-bold">CARGA ACUMULADA</p>
                </div>
              </div>
            )}
            <PermissionForm 
              formData={formData} 
              setFormData={setFormData} 
              onSubmit={handleFormSubmit}
              onCancel={reset}
              history={history}
            />
          </div>
        )}

        {state === 'SUBMITTING' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6 text-center">
            {isProcessing ? (
               <div className="space-y-6">
                 <div className="w-16 h-16 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <div className="space-y-1">
                    <p className="text-xl font-bold text-blue-900 tracking-tight">Procesando solicitud...</p>
                    <p className="text-sm text-slate-500">Analizando datos con Inteligencia Artificial</p>
                 </div>
               </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-lg border border-blue-50 animate-in zoom-in duration-300 w-full">
                <div className="mb-6 flex justify-center">
                   <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <DocumentIcon className="h-8 w-8" />
                   </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Validación de Solicitud</h3>
                <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-700 leading-relaxed mb-6 border border-slate-100 text-left italic">
                  "{aiSummary}"
                </div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                   <div className="p-3 sm:p-4 bg-blue-50/50 rounded-2xl text-left border border-blue-100">
                     <p className="text-[10px] font-black text-blue-400 uppercase mb-1">TOTAL ACTUAL</p>
                     <p className="text-lg font-bold text-blue-900">{stats.totalPermits} <span className="text-[10px]">Pms</span></p>
                   </div>
                   <div className="p-3 sm:p-4 bg-green-50/50 rounded-2xl text-left border border-green-100">
                     <p className="text-[10px] font-black text-green-400 uppercase mb-1">NUEVO TIEMPO</p>
                     <p className="text-lg font-bold text-green-700">+{formData.durationHours}h {formData.durationMinutes}m</p>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={finalizeAndSend}
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-700 text-white rounded-2xl font-bold hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 4.5v15c0 .85-.65 1.5-1.5 1.5H21V7.387l-9 6.463-9-6.463V21H1.5C.65 21 0 20.35 0 19.5v-15c0-.425.162-.8.431-1.068C.7 3.16 1.075 3 1.5 3H2l10 7.25L22 3h.5c.425 0 .8.162 1.069.432.27.268.431.643.431 1.068z"/>
                    </svg>
                    Generar en Gmail
                  </button>
                  <button 
                    onClick={() => setState('FORM')} 
                    className="w-full py-4 border-2 border-slate-200 rounded-2xl font-bold hover:bg-slate-50 active:scale-95 transition-all text-slate-500"
                  >
                    Regresar y Editar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-10 px-6 sm:px-10 bg-white rounded-[2rem] shadow-xl border border-green-50 mt-4 sm:mt-10">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase">¡Permiso Registrado!</h2>
            <p className="text-slate-500 mb-8 leading-relaxed max-w-sm">
              Se ha preparado el formulario en Gmail. <span className="text-blue-600 font-bold underline">No olvide presionar "Enviar"</span> en la ventana abierta.
            </p>
            <div className="bg-slate-50 p-6 rounded-3xl w-full mb-8 text-sm text-left border border-slate-100">
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-4">Estado de Cuenta: {formData.educatorName}</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium italic">Historial acumulado</span>
                  <span className="font-black text-slate-800 text-lg">{stats.totalPermits} Solicitudes</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium italic">Tiempo total en registro</span>
                  <span className="font-black text-blue-900 text-lg">{stats.totalHours}h {stats.remainingMinutes}m</span>
                </div>
              </div>
            </div>
            <button 
              onClick={reset} 
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"
            >
              Finalizar y Volver al Inicio
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 bg-white border-t border-slate-100 text-slate-400 text-center px-4">
        <p className="text-xs sm:text-sm font-medium">&copy; {new Date().getFullYear()} Colegio Salesiano Concepción</p>
        <p className="mt-1 text-[10px] uppercase tracking-tighter font-bold">Autogestión de Educadores v3.0 • Mobile & PC Ready</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
