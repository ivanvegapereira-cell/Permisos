
import React, { useState, useMemo } from 'react';
import { PermissionRecord, AreaType } from '../types';

interface AdminConsoleProps {
  records: PermissionRecord[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: PermissionRecord['status']) => void;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ records, onClose, onUpdateStatus }) => {
  const [filterArea, setFilterArea] = useState<string>('ALL');

  const filteredRecords = useMemo(() => {
    if (filterArea === 'ALL') return records;
    return records.filter(r => r.area === filterArea);
  }, [records, filterArea]);

  const statsByArea = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(AreaType).forEach(area => {
      counts[area] = records.filter(r => r.area === area).length;
    });
    return counts;
  }, [records]);

  return (
    <div className="animate-in fade-in zoom-in duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Consola Central</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Panel de Control de Coordinación</p>
        </div>
        <button 
          onClick={onClose}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase transition-all"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statsByArea).map(([area, count]) => (
          <div key={area} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{area}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-black text-blue-900">{count}</p>
              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.min((count / (records.length || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Listado de Solicitudes</h3>
          <select 
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">Todas las Áreas</option>
            {Object.values(AreaType).map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Educador</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Área / Motivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Permiso</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duración</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    No hay solicitudes registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{rec.educatorName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{rec.position}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black uppercase inline-block mb-1">{rec.area}</span>
                      <p className="text-xs text-slate-600">{rec.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{rec.executionDate}</p>
                      <p className="text-[10px] text-slate-400 italic">Solicitado: {rec.requestDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800">{rec.durationHours}h {rec.durationMinutes}m</p>
                      <p className={`text-[9px] font-black uppercase ${rec.withPay ? 'text-green-600' : 'text-orange-600'}`}>
                        {rec.withPay ? 'Con Goce' : 'Sin Goce'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onUpdateStatus(rec.id, 'ARCHIVED')}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                        title="Archivar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
