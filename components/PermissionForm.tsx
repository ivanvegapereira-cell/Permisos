
import React, { useMemo } from 'react';
import { PermissionFormData, ReasonType, AreaType, PermissionRecord } from '../types';

interface PermissionFormProps {
  formData: PermissionFormData;
  setFormData: React.Dispatch<React.SetStateAction<PermissionFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  history: PermissionRecord[];
}

const EDUCATORS = [
  "ABASOLO PINEDA GRACE ANDREA",
  "ALARCÓN MEDINA DANIELA LIZETH",
  "ALARCÓN SÁNCHEZ ISRAEL LUIS",
  "ALARCÓN VALENCIA PAULA FRANCISCA",
  "ÁLVAREZ VERGARA MARISA RAQUEL",
  "ARNÉS CARDEMIL OSCAR ENRIQUE",
  "ARRIAGADA MASSE FABIOLA INÉS",
  "BARRERA OVIEDO IRIS VALENTINA",
  "BARRERA RODRÍGUEZ MARIO ENRIQUE",
  "BARRERA RODRÍGUEZ MARIO ENRIQUE",
  "BARRÍA TORREZ SOLEDAD IVONNE",
  "CABRERA VENEGAS LESLIE NICOLE",
  "CARRASCO SEPÚLVEDA CRISTIAN ANDRÉS",
  "CARRILLO CARVALLO JUAN PABLO",
  "CARTES ANDRADES CLAUDIO ESTEBAN",
  "CASTILLO SEPÚLVEDA LUIS OMAR",
  "CASTRO GONZÁLEZ SANDRA IVONNE",
  "CHANDÍA CACIANO MELISA ANDREA",
  "CHÁVEZ ENRÍQUEZ DANILO MAURICIO",
  "CID CARO HUGO ANDRÉS",
  "COLOMA RIVERO PEDRO ANTONIO",
  "CONCHA GARRIDO MIGUEL HERNÁN",
  "CONTRERAS SÁNCHEZ CECILIA ANDREA",
  "CORNEJO SILVA ARUXA SILVANA",
  "CORONADO SILVA LORENA JESÚS",
  "CUVILI CONSTANT FRANCISCO VICENTE",
  "DELGADO RODRÍGUEZ NELSON JAVIER",
  "DUQUE VERGARA ANGIE FRANCESCA",
  "ECHEVERRÍA BUSTOS CINTHIA ANDREA",
  "ESCOBAR ESPINOZA JENIFER MARCELA",
  "FERRADA ACUÑA ANTONIO ERNESTO",
  "FIERRO ALBORNOZ RICARDO ALONSO",
  "FIGUEROA ÁVILA ISABEL ALEJANDRA",
  "FUENTES ARAVENA ROMINA BEATRIZ",
  "FUENTES SÁNCHEZ PAMELA BEATRIZ",
  "GALLARDO ORTEGA MARIO JOSÉ",
  "GALLEGOS NOVA SILVIA ANDREA",
  "GAMONALES GONZÁLEZ LUIS HERNÁN",
  "GAMONALES GONZÁLEZ NATALIA ANDREA",
  "GONZÁLEZ BRICEÑO FELIPE ENRIQUE",
  "HERNÁNDEZ GALLARDO HÉCTOR ALEJANDRO",
  "HERRERA ABURTO PABLO ANGEL",
  "HIDALGO DÍAZ GONZALO ANDRÉS",
  "HIDALGO ROJAS CARLA ANDREA",
  "HUERTA ESCOBAR DANIELA ALEJANDRA",
  "IBÁÑEZ SAN MARTÍN RODRIGO ALEJANDRO",
  "ITURRA FUENTES FREDY ANDRÉS",
  "JARA CONSTANZO FERNANDO JAVIER",
  "JARA ZAGAL MATÍAS FELIPE",
  "LAGOS SÁNCHEZ CARMEN IVONNE",
  "LARA DELGADO MANUEL ORLANDO",
  "MANRÍQUEZ FLORES MATÍAS ANÍBAL",
  "MANRÍQUEZ HENRÍQUEZ JUAN EDUARDO",
  "MEDINA AGUAYO MARCELA ANDREA",
  "MENDOZA AEDO CÉSAR EDUARDO",
  "MOLINA JEREZ CLAUDIO ANDRÉS",
  "MONTALBA BALBOA ALISON SCARLET",
  "MORALES SANHUEZA VALENTINA VICTORIA",
  "MUÑOZ GATICA JULIO ARTURO",
  "MUÑOZ SILVA VALEREY ALEXANDRA",
  "NOVOA GONZÁLEZ SILVIA JACQUELINE",
  "NÚÑEZ OVIEDO ROSA IVETTE",
  "OSSES TRONCOSO ALEJANDRO ARTURO",
  "OVALLE SEPÚLVEDA FABIÁN ALEJANDRO",
  "PACHECO LAVÍN SOFÍA ALEXANDRA",
  "PÉREZ ARRIAGADA GONZALO ANTONIO",
  "PEZO PEZO NATALIA ELISA DEL CARMEN",
  "QUEVEDO QUEVEDO CLIMACO EMERSON",
  "RAMÍREZ SAN MARTÍN DANIELA ALEJANDRA",
  "RETAMAL MARDONES PABLO ARMANDO",
  "RIFFO RIFFO MANUEL HERNÁN",
  "RIVERA FERNÁNDEZ SANDRA STEFANIA",
  "RODRÍGUEZ SILVA DANIELA ELIZABETH",
  "ROJAS JIMÉNEZ PAOLA ANDREA",
  "ROMÁN RETAMAL SERGIO MAURICIO",
  "ROMERO TIZNADO JASMINE CONSTANZA",
  "RUBILAR LAGOS MARCELA ISABEL",
  "SAAVEDRA GONZÁLEZ JUAN FERNANDO",
  "SALDAÑA ORMEÑO PATRICIA HORTENSIA DEL CARMEN",
  "SAN MARTÍN MARTÍNEZ MONSERRAT ANGÉLICA",
  "SÁNCHEZ MOLINA GUSTAVO ALFONSO",
  "SANTANA URIBE LUZ EMDEN",
  "SEPÚLVEDA FLORES IDA DEL TRÁNSITO",
  "TOLOZA MANCILLA KATHERINE LISSETE",
  "TORRES PARRA KAREN VALESKA",
  "TORRES VALDERRAMA GUSTAVO ALONSO",
  "URRUTIA BARRIGA DANIELA ANDREA",
  "VALDÉS GARCÍA MARCELO ESTEBAN",
  "VALENZUELA SÁNCHEZ ANA MARÍA GRACIELA",
  "VEGA LABBÉ CARLOS ALBERTO",
  "VEGA PEREIRA IVÁN AGUSTÍN DIEGO",
  "VENEGAS SOTO LORNA SONYA",
  "VERA VALVERDE LUIS ALEJANDRINO",
  "WINSER FERNÁNDEZ ALEX AQUILES"
];

const PermissionForm: React.FC<PermissionFormProps> = ({ formData, setFormData, onSubmit, onCancel, history }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const setPayStatus = (status: boolean) => {
    setFormData(prev => ({ ...prev, withPay: status }));
  };

  const checkDeadline = (reqStr: string, exeStr: string): boolean => {
    if (!reqStr || !exeStr) return true;
    
    const d1 = new Date(reqStr + 'T00:00:00');
    const d2 = new Date(exeStr + 'T00:00:00');
    
    if (d2 <= d1) return false;

    let businessDays = 0;
    let current = new Date(d1);
    
    while (current < d2) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay(); 
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    return businessDays >= 2;
  };

  const isWithinDeadline = checkDeadline(formData.requestDate, formData.executionDate);

  const concurrentRequests = useMemo(() => {
    if (!formData.executionDate) return 0;
    return history.filter(h => h.executionDate === formData.executionDate).length;
  }, [history, formData.executionDate]);

  const isCrowdedDay = concurrentRequests >= 2;

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-6 sm:space-y-8 max-w-3xl mx-auto border border-blue-50">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
            Nueva Solicitud
          </h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Complete los campos obligatorios</p>
        </div>
      </div>

      {isCrowdedDay && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-red-800 uppercase tracking-tighter">¡Alerta de Cupos!</p>
            <p className="text-xs text-red-700 font-medium">
              Ya existen <span className="font-black underline">{concurrentRequests} educadores</span> con permiso para el día {formData.executionDate}. 
              Se recomienda consultar disponibilidad antes de enviar.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Educador Info */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Identificación</h3>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Nombre Completo del Educador</label>
            <select 
              required
              name="educatorName"
              value={formData.educatorName}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">Seleccione Educador...</option>
              {EDUCATORS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Cargo Institucional</label>
            <input 
              required
              type="text" 
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
              placeholder="Ej. Docente, Administrativo..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Hora de contrato (Semanal)</label>
            <input 
              required
              type="number" 
              name="contractHours"
              value={formData.contractHours}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
              placeholder="Ej. 44"
            />
          </div>
        </div>

        {/* Dates & Time */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Programación</h3>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Fecha de Solicitud</label>
            <input 
              required
              type="date" 
              name="requestDate"
              value={formData.requestDate}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-400 cursor-not-allowed"
              readOnly
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Fecha de Ejecución del Permiso</label>
            <input 
              required
              type="date" 
              name="executionDate"
              value={formData.executionDate}
              onChange={handleChange}
              className={`w-full px-5 py-3 border rounded-2xl outline-none transition-all text-sm font-medium focus:ring-4 ${
                !isWithinDeadline && formData.executionDate 
                  ? 'border-orange-300 bg-orange-50 focus:ring-orange-500/10 focus:border-orange-500' 
                  : 'bg-slate-50 border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white'
              }`}
            />
            
            {formData.executionDate && !isWithinDeadline && (
              <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-[11px] text-orange-800 leading-tight">
                  <span className="font-black uppercase block mb-1">Fuera de plazo</span>
                  Las solicitudes deben realizarse con <span className="font-black">48 horas de anticipación</span> (días hábiles). Esta solicitud podría ser rechazada.
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <p className="text-[10px] font-black text-blue-600 mb-3 uppercase tracking-tighter">Duración Cronológica</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Horas</label>
                <input 
                  required
                  type="number" 
                  name="durationHours"
                  value={formData.durationHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Minutos</label>
                <input 
                  required
                  type="number" 
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  min="0"
                  max="59"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Reasons & Areas */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Categorización</h3>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Motivo Principal</label>
            <select 
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              {Object.values(ReasonType).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Área de Dependencia</label>
            <select 
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              {Object.values(AreaType).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Remuneración</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setPayStatus(true)}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase transition-all border ${
                  formData.withPay 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]' 
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                Con goce
              </button>
              <button
                type="button"
                onClick={() => setPayStatus(false)}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase transition-all border ${
                  !formData.withPay 
                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200 scale-[1.02]' 
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                Sin goce
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Información Extra</h3>
          <div className="space-y-1.5 h-full flex flex-col">
            <label className="block text-xs font-bold text-slate-500 uppercase ml-1">Notas Adicionales</label>
            <textarea 
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={6}
              placeholder="Detalle el motivo si seleccionó 'Otro' o proporcione especificaciones relevantes..."
              className="w-full flex-grow px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 sm:pt-10 border-t border-slate-100">
        <button 
          type="button"
          onClick={onCancel}
          className="order-2 sm:order-1 flex-1 py-4 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="order-1 sm:order-2 flex-[1.5] py-4 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-800 active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Procesar Solicitud
        </button>
      </div>
    </form>
  );
};

export default PermissionForm;
