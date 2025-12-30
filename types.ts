
export enum ReasonType {
  MEDICO = 'Médico',
  ESTUDIO = 'Estudio',
  FAMILIAR = 'Familiar',
  TRAMITES = 'Trámites Personales',
  OTRO = 'Otro'
}

export enum AreaType {
  ADMINISTRACION = 'Administración',
  ACADEMICA = 'Académica',
  AMBIENTE = 'Ambiente',
  APOYO = 'Apoyo',
  EVANGELIZACION = 'Evangelización',
  T_PROFESIONAL = 'T. Profesional'
}

export interface PermissionFormData {
  educatorName: string;
  position: string;
  contractHours: number;
  requestDate: string;
  executionDate: string;
  durationHours: number;
  durationMinutes: number;
  reason: ReasonType;
  withPay: boolean;
  area: AreaType;
  additionalNotes?: string;
}

export interface PermissionRecord extends PermissionFormData {
  id: string;
  timestamp: number;
}

export type AppState = 'IDLE' | 'SCANNING' | 'FORM' | 'SUBMITTING' | 'SUCCESS';
