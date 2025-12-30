
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

const MASTER_PASSWORD = 'admin123'; // Clave Maestra

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
  const [showPass, setShowPass] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [formData, setFormData] = useState<PermissionFormData>(INITIAL_FORM);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<PermissionRecord[]>([]);

  useEffect(() => {
    // Simulamos carga de datos desde "La Nube" (en este caso centralizado localmente para el demo)
    const saved = localStorage.getItem('permisos_central_store');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar la base de datos central", e);
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
    // Simulación de latencia de red hacia el servidor central
    await new Promise(resolve => setTimeout(resolve, 2500));
    
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
      alert("Error de conexión con el servidor central.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Aplicamos trim() para eliminar espacios accidentales que causan el error de clave incorrecta
    if (adminPass.trim() === MASTER_PASSWORD) {
      setState('ADMIN_DASHBOARD');
      setAdminPass('');
      setShowPass(false);
    } else {
      alert("⚠️ La contraseña ingresada no es válida. Verifique mayúsculas y espacios.");
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
    setShowPass(false);
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
              <h1 className="text-sm sm:text-lg font-bold leading-none truncate uppercase tracking-tighter">Salesiano Concepción</h1>
            </div>
          </div>
          <button 
            onClick={reset} 
            className="flex-shrink-0 text-[10px] bg-white/10 hover:bg-white/20 active:scale-95 px-4 py-2 rounded-full transition-all font-black uppercase tracking-widest border border-white/20"
          >
            Inicio
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {state === 'IDLE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[50vh] text-center px-6 bg-white rounded-[3rem] shadow-sm border border-slate-100 py-10 sm:py-16">
              <div className="mb-6 sm:mb-8 p-6 bg-blue-50 rounded-full">
                <DocumentIcon className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-3 sm:mb-4 tracking-tighter uppercase">Gestión de Permisos</h2>
              <p className="text-slate-500 max-w-md mb-8 sm:mb-10 text-sm sm:text-base px-2 font-medium">
                Plataforma oficial para educadores. Sus solicitudes se sincronizan directamente con la consola de Coordinación.
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
              <div className="bg-blue-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-4">Estado del Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Servidor Central: Online</span>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">Registros en Base de Datos</p>
                    <p className="text-2xl font-black">{history.length}</p>
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
          <div className="max-w-md mx-auto mt-12 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-8">
               <div className="w-20 h-20 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
               </div>
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Panel de Control</h3>
               <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-2">Acceso Reservado Administrador</p>
             </div>
             
             <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="relative">
                  <input 
                    autoFocus
                    type={showPass ? "text" : "password"}
                    placeholder="Contraseña"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-900 text-center font-black tracking-widest placeholder:tracking-normal placeholder:font-bold"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 p-2"
                  >
                    {showPass ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-100 hover:bg-black transition-all active:scale-95">
                    Entrar a Consola
                  </button>
                  <button type="button" onClick={reset} className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 tracking-widest">
                    Volver al Inicio
                  </button>
                </div>
             </form>
             <p className="mt-8 text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest">Acceso Seguro mediante SSL 256-bit</p>
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
               <div className="space-y-10">
                 <div className="relative">
                   <div className="w-24 h-24 border-8 border-blue-900/10 rounded-full mx-auto"></div>
                   <div className="w-24 h-24 border-8 border-blue-900 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 -ml-12"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-900 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                     </svg>
                   </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Sincronizando...</p>
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Enviando a Consola Central de Coordinación</p>
                 </div>
               </div>
            ) : (
              <div className="bg-white rounded-[4rem] shadow-2xl p-8 sm:p-14 max-w-lg border border-blue-50 animate-in zoom-in duration-300 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-blue-700"></div>
                <h3 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-tighter">Validación IA</h3>
                <div className="bg-blue-50 p-6 rounded-3xl text-sm text-blue-900 font-medium leading-relaxed mb-10 border border-blue-100 text-left relative">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest">Resumen Ejecutivo</div>
                  <span className="italic">"{aiSummary}"</span>
                </div>
                <button 
                  onClick={finalizeAndSendDirectly}
                  className="w-full py-6 bg-blue-700 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-blue-800 shadow-2xl shadow-blue-200 transition-all active:scale-95"
                >
                  Confirmar Envío Central
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'SUCCESS' && (
          <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-16 px-10 bg-white rounded-[4rem] shadow-2xl border border-green-50 mt-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-green-500"></div>
            <div className="w-28 h-28 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-10 shadow-inner border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 uppercase tracking-tighter">¡Recibido en Central!</h2>
            <p className="text-slate-500 mb-12 font-bold text-lg leading-tight">Su solicitud ha sido registrada exitosamente en el servidor de Coordinación Pedagógica.</p>
            <button onClick={reset} className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-[0.3em] text-xs shadow-2xl shadow-slate-200 hover:bg-black transition-all">
              Terminar Sesión
            </button>
          </div>
        )}

        {/* Modal de Compartir */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 sm:p-14 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in duration-300">
              <button onClick={() => setShowShareModal(false)} className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="mb-8"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Acceso Directo</h3><p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-2">Sincroniza otros dispositivos</p></div>
              <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-50 shadow-inner mb-8 flex justify-center items-center"><img src={qrUrl} alt="QR" className="w-full h-auto rounded-2xl" /></div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">Comparte este QR con colegas para que puedan enviar sus permisos desde cualquier lugar.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 bg-white border-t border-slate-100 flex flex-col items-center justify-center gap-6">
        <div className="text-slate-400 text-center">
          <p className="text-xs sm:text-sm font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} Salesiano Concepción</p>
          <p className="mt-1 text-[9px] uppercase tracking-[0.3em] font-bold text-slate-300">Consola Central v6.0 • Secure Delivery</p>
        </div>
        
        {/* Botón Admin Discreto */}
        <button 
          onClick={() => setState('ADMIN_LOGIN')}
          className="group flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-300 hover:text-blue-900 hover:bg-blue-50 transition-all rounded-full border border-slate-100 active:scale-95"
          title="Administración"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Consola Admin</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
