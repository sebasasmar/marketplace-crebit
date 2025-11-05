export type UserRole = 'admin' | 'empresa';

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export type Plan = 'freemium' | 'basico' | 'profesional' | 'empresarial';

export interface Empresa {
  id: string;
  user_id: string;
  email: string;
  nombre_empresa: string;
  nit: string;
  plan: Plan;
  saldo: number;
  activo: boolean;
  leads_comprados: number;
  leads_gratis_limite: number;
  leads_gratis_usados: number;
}

export type LeadVertical = 'Colpensiones' | 'Fopep' | 'Magisterio' | 'Fuerzas Militares';
export type LeadRiesgo = 'bajo' | 'medio' | 'alto';
export type LeadIntencion = 'alta' | 'media' | 'baja';
export type LeadEstado = 'captado' | 'ofertado' | 'reservado' | 'vendido' | 'rechazado' | 'en_revision';

export interface Lead {
  id: string;
  nombre: string;
  cedula: string;
  edad: number;
  email: string;
  telefono: string;
  pagaduria: string;
  monto_solicitado: number;
  vertical: LeadVertical;
  score: number;
  riesgo: LeadRiesgo;
  intencion: LeadIntencion;
  precio: number;
  estado: LeadEstado;
  vendido: boolean;
  convertido: boolean;
  fecha_creacion: string;
  fecha_venta?: string;
  empresa_compradora_id?: string;
}

export interface AnonymousLead extends Omit<Lead, 'nombre' | 'cedula' | 'email' | 'telefono'> {}

export interface Compra {
    id: string;
    empresa_id: string;
    lead_id: string;
    precio: number;
    plan: Plan;
    convertido: boolean;
    fecha_compra: string;
    lead?: Lead;
    empresa?: { nombre_empresa: string };
}

export interface LeadSubscription {
    id: string;
    empresa_id: string;
    name: string;
    criteria: {
        vertical?: LeadVertical | '';
        riesgo?: LeadRiesgo | '';
        min_score?: number | string;
        max_price?: number | string;
        min_monto?: number | string;
    };
    max_daily_purchases: number;
    daily_purchases: number;
    active: boolean;
}

export interface LeadReport {
    id: string;
    empresa_id: string;
    lead_id: string;
    reason: 'datos_incorrectos' | 'no_contesta' | 'ya_tiene_credito' | 'no_interesado' | 'otro';
    comments?: string;
    status: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';
    created_at: string;
    empresa_nombre?: string;
    lead?: Lead;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
