
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  AppState, 
  PermissionFormData, 
  ReasonType, 
  AreaType,
  PermissionRecord
} from './types';
import PermissionForm from './components/PermissionForm';
import AdminConsole from './components/AdminConsole';
import { validateRequestSummary } from './services/geminiService';

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

const MASTER_PASSWORD = 'admin123'; // Contraseña por defecto

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
  const [adminPass, setAdminPass] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [formData, setFormData] = useState<PermissionFormData>(INITIAL_FORM);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<PermissionRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('permisos_central_store');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('permisos_central_store', JSON.stringify(history));
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
        timestamp: Date.now(),
        status: 'PENDING'
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === MASTER_PASSWORD) {
      setState('ADMIN_DASHBOARD');
      setAdminPass('');
    } else {
      alert("Contraseña de administrador incorrecta.");
    }
  };

  const updateRecordStatus = (id: string, newStatus: PermissionRecord['status']) => {
    if (newStatus === 'ARCHIVED') {
      setHistory(prev => prev.filter(r => r.id !== id));
    } else {
      setHistory(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const reset = () => {
    setFormData(INITIAL_FORM);
    setAiSummary('');
    setState('IDLE');
    setShowShareModal(false);
    setAdminPass('');
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
                </button>
                <button 
                  onClick={() => setShowShareModal(true)} 
                  className="flex-1 sm:flex-none px-8 py-5 bg-white border-2 border-slate-200 text-slate-500 text-lg font-bold rounded-2xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  Compartir App
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">Mi Historial Local</h3>
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
            </div>
          </div>
        )}

        {state === 'FORM' && (
          <PermissionForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleFormSubmit}
            onCancel={reset}
            history={history}
          />
        )}

        {state === 'ADMIN_LOGIN' && (
          <div className="max-w-md mx-auto mt-12 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
               </div>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Acceso de Administrador</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Solo personal autorizado</p>
             </div>
             <form onSubmit={handleAdminLogin} className="space-y-6">
                <input 
                  autoFocus
                  type="password"
                  placeholder="Ingrese contraseña maestra"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-900 text-center font-bold"
                />
                <div className="flex flex-col gap-3">
                  <button type="submit" className="w-full py-4 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 hover:bg-blue-800 transition-all">
                    Entrar a Consola
                  </button>
                  <button type="button" onClick={reset} className="w-full py-3 text-slate-400 font-bold text-xs uppercase hover:text-slate-600">
                    Cancelar
                  </button>
                </div>
             </form>
          </div>
        )}

        {state === 'ADMIN_DASHBOARD' && (
          <AdminConsole 
            records={history} 
            onClose={reset} 
            onUpdateStatus={updateRecordStatus}
          />
        )}

        {state === 'SUBMITTING' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6 text-center">
            {isProcessing ? (
               <div className="space-y-8">
                 <div className="relative">
                   <div className="w-20 h-20 border-4 border-blue-700/20 rounded-full mx-auto"></div>
                   <div className="w-20 h-20 border-4 border-blue-700 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 -ml-10"></div>
                 </div>
                 <p className="text-2xl font-black text-blue-900 uppercase">Enviando a Central...</p>
               </div>
            ) : (
              <div className="bg-white rounded-[3rem] shadow-2xl p-8 sm:p-12 max-w-lg border border-blue-50 animate-in zoom-in duration-300 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <h3 className="text-2xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Confirmar Envío Centralizado</h3>
                <div className="bg-blue-50/50 p-5 rounded-3xl text-sm text-blue-800 leading-relaxed mb-8 border border-blue-100 text-left">
                  <p className="font-bold mb-1 uppercase text-[10px] text-blue-400 tracking-widest">Resumen de IA:</p>
                  <span className="italic">"{aiSummary}"</span>
                </div>
                <button 
                  onClick={finalizeAndSendDirectly}
                  className="w-full py-5 bg-blue-700 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-blue-800 shadow-xl shadow-blue-200"
                >
                  Confirmar y Registrar
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-12 px-8 bg-white rounded-[3rem] shadow-2xl border border-green-50 mt-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase">¡Registrado en Central!</h2>
            <p className="text-slate-500 mb-10 font-medium">Su solicitud ha sido enviada y guardada en la consola de coordinación.</p>
            <button onClick={reset} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs">
              Volver al Inicio
            </button>
          </div>
        )}

        {/* Modal de Compartir */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in duration-300">
              <button onClick={() => setShowShareModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="mb-6"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Compartir Acceso</h3><p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Escanea este código QR</p></div>
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm mb-8 flex justify-center items-center"><img src={qrUrl} alt="QR" className="w-full h-auto rounded-xl" /></div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 bg-white border-t border-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400 text-center">
          <p className="text-xs sm:text-sm font-medium">&copy; {new Date().getFullYear()} Colegio Salesiano Concepción</p>
          <p className="mt-1 text-[10px] uppercase tracking-tighter font-bold text-slate-300">Consola Central de Gestión v5.0</p>
        </div>
        {/* Botón Secreto de Admin */}
        <button 
          onClick={() => setState('ADMIN_LOGIN')}
          className="p-3 text-slate-200 hover:text-blue-200 transition-colors rounded-full hover:bg-slate-50"
          title="Administración"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default App;
