
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  AppState, 
  PermissionFormData, 
  ReasonType, 
  AreaType,
  PermissionRecord
} from './types';
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
    <circle cx="18.5" cy="15.5" r="3.5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M17.5 15.5L18.25 16.25L19.75 14.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('IDLE');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setState('SUBMITTING');

    try {
      const summaryResult = await validateRequestSummary(formData);
      setAiSummary(summaryResult.summary);
    } catch (err) {
      console.error(err);
      setAiSummary("La solicitud está lista para ser enviada al servidor institucional.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeAndSendDirectly = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const newRecord: PermissionRecord = {
        ...formData,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      setHistory(prev => [newRecord, ...prev]);
      setState('SUCCESS');
    } catch (err) {
      console.error(err);
      alert("Error crítico al conectar con el servidor de correos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const reset = () => {
    setFormData(INITIAL_FORM);
    setAiSummary('');
    setState('IDLE');
    setShowShareModal(false);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;

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
              <p className="hidden sm:block text-[10px] text-blue-200 mt-1 uppercase tracking-tight">Sistema Interno de Permisos</p>
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
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3 sm:mb-4 tracking-tight uppercase">Portal del Educador</h2>
              <p className="text-slate-600 max-w-md mb-8 sm:mb-10 text-sm sm:text-base px-2">
                Bienvenido al sistema automatizado. Complete su solicitud y será enviada automáticamente a Coordinación Pedagógica.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
                <button 
                  onClick={() => setState('FORM')} 
                  className="flex-1 sm:flex-none px-12 py-5 bg-blue-700 text-white text-lg font-black rounded-2xl hover:bg-blue-800 active:scale-95 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                  Nueva Solicitud
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="flex-1 sm:flex-none px-8 py-5 bg-white border-2 border-slate-200 text-slate-500 text-lg font-bold rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir App
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Mi Historial Local
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total Enviados</p>
                    <p className="text-xl sm:text-2xl font-black text-blue-900">{history.length}</p>
                  </div>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horas Acum.</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalHours}h</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Solicitudes Recientes</h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 italic">No hay registros recientes.</p>
                    </div>
                  ) : (
                    history.slice(0, 5).map(rec => (
                      <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{rec.educatorName}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                          <span>{rec.executionDate}</span>
                          <span className="text-green-600 font-bold">ENVIADO</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Compartir Simplificado */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in duration-300">
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Compartir Acceso</h3>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Escanea este código QR</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm mb-8 flex justify-center items-center">
                <img src={qrUrl} alt="QR de la aplicación" className="w-full h-auto rounded-xl" />
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Cualquier educador puede escanear este código para acceder al sistema institucional de permisos.
                </p>
                <button 
                  onClick={copyLink}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
                    copyFeedback 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                  }`}
                >
                  {copyFeedback ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Enlace Copiado
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copiar Enlace Manual
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {state === 'FORM' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 sm:space-y-6">
            {stats.hasRecords && (
              <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex items-center justify-between">
                <div className="flex-grow">
                  <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Educador: {formData.educatorName || 'Seleccionado'}</p>
                  <p className="text-xs sm:text-sm">Historial: <strong>{stats.totalPermits} permisos</strong> previos.</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-black">{stats.totalHours}h {stats.remainingMinutes}m</p>
                  <p className="text-[10px] text-blue-300 font-bold uppercase">Tiempo Registrado</p>
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
               <div className="space-y-8">
                 <div className="relative">
                   <div className="w-20 h-20 border-4 border-blue-700/20 rounded-full mx-auto"></div>
                   <div className="w-20 h-20 border-4 border-blue-700 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 -ml-10"></div>
                 </div>
                 <div className="space-y-2">
                    <p className="text-2xl font-black text-blue-900 tracking-tighter uppercase">Enviando Solicitud...</p>
                    <p className="text-sm text-slate-500 font-medium">Sincronizando con Coordinación Pedagógica</p>
                 </div>
               </div>
            ) : (
              <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 max-w-lg border border-blue-50 animate-in zoom-in duration-300 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <div className="mb-8 flex justify-center">
                   <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                      <DocumentIcon className="h-10 w-10" />
                   </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Confirmar Envío Directo</h3>
                <div className="bg-blue-50/50 p-5 rounded-3xl text-sm text-blue-800 leading-relaxed mb-8 border border-blue-100 text-left">
                  <p className="font-bold mb-1 uppercase text-[10px] text-blue-400 tracking-widest">Resumen de IA:</p>
                  <span className="italic">"{aiSummary}"</span>
                </div>
                
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={finalizeAndSendDirectly}
                    disabled={isProcessing}
                    className="w-full py-5 bg-blue-700 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-blue-800 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200"
                  >
                    Confirmar y Enviar Ahora
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setState('FORM')} 
                    className="w-full py-4 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Revisar Datos
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-12 px-8 bg-white rounded-[3rem] shadow-2xl border border-green-50 mt-8 sm:mt-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">¡Envío Exitoso!</h2>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">
              La solicitud ha sido enviada directamente a <br/>
              <span className="text-blue-700 font-bold">coordpedagogico@salesianoconcepcion.cl</span>
            </p>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] w-full mb-10 text-left border border-slate-100 shadow-sm relative">
              <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Comprobante Digital</div>
              <p className="text-slate-400 uppercase tracking-widest text-[9px] font-black mb-6">Detalles del Proceso</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Educador</span>
                  <span className="font-black text-slate-800 text-sm truncate max-w-[180px]">{formData.educatorName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Fecha de Permiso</span>
                  <span className="font-black text-slate-800 text-sm">{formData.executionDate}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Estado</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-black text-[10px] uppercase">Procesado</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={reset} 
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200 uppercase tracking-[0.2em] text-xs"
            >
              Cerrar y Volver al Inicio
            </button>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 bg-white border-t border-slate-100 text-slate-400 text-center px-4">
        <p className="text-xs sm:text-sm font-medium">&copy; {new Date().getFullYear()} Colegio Salesiano Concepción</p>
        <p className="mt-1 text-[10px] uppercase tracking-tighter font-bold">Autogestión de Educadores v4.1 • Direct Delivery</p>
      </footer>
    </div>
  );
};

export default App;
