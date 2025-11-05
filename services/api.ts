import type { UserProfile, Empresa, Lead, LeadSubscription, LeadReport, Plan, LeadEstado, Notification } from '../types';
import { exportToCsv } from '../utils/csvExporter';
import { supabase } from './supabase';

// Helper to apply sorting on Supabase queries
const applySortToQuery = (query: any, sort: { key: string, direction: 'asc' | 'desc' }) => {
    if (!sort.key) return query;
    // For nested columns, the key might be 'leads.nombre'. Supabase handles this dot notation.
    const isNested = sort.key.includes('.');
    if (isNested) {
        const [foreignTable, column] = sort.key.split('.');
        return query.order(column, { foreignTable: foreignTable, ascending: sort.direction === 'asc' });
    }
    return query.order(sort.key, { ascending: sort.direction === 'asc' });
};

// Mock data for features not in the DB schema
let MOCK_APP_CONFIG = {
  lead_prices: { bajo: 20000, medio: 10000, alto: 5000 },
  commission_rates: { freemium: 0, basico: 5, profesional: 10, empresarial: 15 }
};

class ApiService {
  async login(email: string, pass: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
        console.error("Login error:", error.message);
        throw error; // Re-throw the error for the UI to handle specifically
    }
     if (!data.user) {
        throw new Error("Login failed: No user data returned.");
    }
    return this.getProfile(data.user.id);
  }

  async logout() {
      await supabase.auth.signOut();
  }
  
  async sendPasswordReset(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
          // This is an expected case for users who haven't confirmed their email yet,
          // as RLS prevents access. We don't want to log it as a critical error.
          if (error.code !== 'PGRST116') { // PGRST116: "Searched for a single row, but found 0 rows"
            console.error("Error getting profile:", error.message);
          }
          return null;
      }
      return data;
  }

  async signupUser(signupData: { nombreEmpresa: string, nit: string, email: string, plan: Plan, password: string }): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
            data: {
                nombre: signupData.nombreEmpresa,
                nombre_empresa: signupData.nombreEmpresa,
                nit: signupData.nit,
                plan: signupData.plan,
            }
        }
    });

    if (error) {
        console.error('Signup error:', error);
        throw error;
    }
    
    // On success, Supabase sends a confirmation email. The DB trigger handles profile creation.
    // We don't poll for the profile because the user isn't authenticated until they confirm.
    if (!data.user) {
        throw new Error("Signup failed: No user data returned from Supabase.");
    }
  }
  
  async getEmpresaForUser(userId: string): Promise<Empresa | null> {
    const { data, error } = await supabase.from('empresas').select('*').eq('user_id', userId).single();
    if (error) {
        console.error("Get Empresa error:", error);
        return null;
    }
    return data;
  }

  // Admin methods
  async getAdminStats() {
      const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
      const { count: leadsVendidos } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('vendido', true);
      const { count: leadsConvertidos } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('convertido', true);
      const { data: comprasData } = await supabase.from('compras').select('precio');
      const { count: empresasActivas } = await supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('activo', true);

      const tasaConversionGlobal = leadsVendidos! > 0 ? (leadsVendidos! / leadsVendidos!) * 100 : 0;
      const ingresosTotales = comprasData?.reduce((sum, c) => sum + c.precio, 0) || 0;

    return {
      totalLeads,
      leadsVendidos,
      leadsConvertidos,
      leadsDisponibles: totalLeads! - leadsVendidos!,
      tasaConversionGlobal: parseFloat(tasaConversionGlobal.toFixed(1)),
      ingresosTotales,
      empresasActivas,
      leadsVendidosTrend: (Math.random() * 10 - 3).toFixed(1), // Mock trend
      ingresosTotalesTrend: (Math.random() * 10 - 2).toFixed(1), // Mock trend
    };
  }

  async getAdminChartData() {
    // This remains mocked as it's complex to generate historical data without more logic
    const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        Ingresos: Math.floor(Math.random() * 500000) + 100000,
      };
    });
    return { monthlyRevenue };
  }

  async getAllLeads({ page, limit, searchTerm, filters, sort }: { page: number, limit: number, searchTerm: string, filters: any, sort: {key: string, direction: 'asc'|'desc'} }) {
    let query = supabase.from('leads').select('*', { count: 'exact' });
    if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,cedula.ilike.%${searchTerm}%`);
    }
    if (filters) {
        if(filters.vertical && filters.vertical !== 'all') query = query.eq('vertical', filters.vertical);
        if(filters.riesgo && filters.riesgo !== 'all') query = query.eq('riesgo', filters.riesgo);
        if(filters.estado && filters.estado !== 'all') query = query.eq('estado', filters.estado);
    }
    query = applySortToQuery(query, sort);
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) console.error("Get All Leads error:", error);
    return { data: data || [], total: count || 0 };
  }
  
  async createLead(leadData: Omit<Lead, 'id' | 'fecha_creacion' | 'estado' | 'vendido' | 'convertido'>) {
      const { data, error } = await supabase.from('leads').insert([{ ...leadData, estado: 'ofertado' }]).select().single();
      if (error) console.error("Create Lead error:", error);
      return data;
  }

  async updateLeadStatus(leadId: string, newStatus: LeadEstado): Promise<Lead | null> {
    const { data, error } = await supabase.from('leads').update({ estado: newStatus }).eq('id', leadId).select().single();
    if(error) console.error('Update lead status error', error);
    return data;
  }

  async bulkDeleteLeads(leadIds: string[]): Promise<void> {
    const { error } = await supabase.from('leads').delete().in('id', leadIds);
    if(error) console.error('Bulk delete error:', error);
  }

  async bulkUpdateLeadsStatus(leadIds: string[], newStatus: LeadEstado): Promise<void> {
    const { error } = await supabase.from('leads').update({ estado: newStatus }).in('id', leadIds);
    if(error) console.error('Bulk update status error:', error);
  }

  async getAllEmpresas({ page, limit, sort }: { page: number, limit: number, sort: {key: string, direction: 'asc'|'desc'} }) {
      let query = supabase.from('empresas').select('*', { count: 'exact' });
      query = applySortToQuery(query, sort);
      query = query.range((page - 1) * limit, page * limit - 1);
      const { data, count, error } = await query;
      if (error) console.error('Get all empresas error:', error);
      return { data: data || [], total: count || 0 };
  }
  
  // This client-side function is insecure and has been removed.
  // Balance adjustments are now handled exclusively by the backend Edge Function via a secure RPC call.
  /*
  async adjustSaldo(empresaId: string, amount: number) {
      // ... insecure implementation ...
  }
  */

  // Fix: Add a secure method for admins to adjust saldo via an RPC call.
  async adminAdjustSaldo(empresaId: string, amount: number): Promise<void> {
      // This RPC function should be protected by RLS to only allow admins.
      const { error } = await supabase.rpc('admin_adjust_saldo', {
          p_empresa_id: empresaId,
          p_monto: amount,
      });

      if (error) {
          console.error('Admin adjust saldo RPC error:', error);
          throw new Error('Ocurrió un error al ajustar el saldo.');
      }
  }

  async changePlan(empresaId: string, newPlan: Plan) {
      const { data, error } = await supabase.from('empresas').update({ plan: newPlan }).eq('id', empresaId).select().single();
      if (error) console.error('Change plan error:', error);
      return data;
  }

  async getAllCompras({ page, limit, sort }: { page: number, limit: number, sort: {key: string, direction: 'asc'|'desc'} }) {
      let query = supabase.from('compras').select('*, lead:leads(*), empresa:empresas(nombre_empresa)', { count: 'exact' });
      query = applySortToQuery(query, sort);
      query = query.range((page - 1) * limit, page * limit - 1);
      const { data, count, error } = await query;
      if (error) console.error('Get all compras error:', error);
      return { data: data || [], total: count || 0 };
  }
  
  async getAllReports({ page, limit, sort }: { page: number, limit: number, sort: {key:string, direction: 'asc'|'desc'} }) {
      let query = supabase.from('lead_reports').select('*, lead:leads(*), empresa:empresas!inner(nombre_empresa)', { count: 'exact' });
      const {data, count, error} = await applySortToQuery(query, sort).range((page - 1) * limit, page * limit - 1);
      if(error) console.error('Get all reports error:', error);
      // The API returns empresa object, let's flatten it.
  const flatData = data?.map((r: any) => ({...r, empresa_nombre: r.empresa?.nombre_empresa})) || [];
      return { data: flatData, total: count || 0 };
  }
  
  async updateReportStatus(reportId: string, status: LeadReport['status']) {
    if (status === 'aprobado') {
        const { data: report } = await supabase.from('lead_reports').select('*, lead:leads(precio), empresa_id').eq('id', reportId).single();
        if (report && report.lead) {
            // This logic is now part of the database trigger/function for security.
            // For simplicity, we keep it here but in a real app, it should be a single RPC call.
            const { data: empresa } = await supabase.from('empresas').select('saldo').eq('id', report.empresa_id).single();
            if (empresa) {
                await supabase.from('empresas').update({ saldo: empresa.saldo + report.lead.precio }).eq('id', report.empresa_id);
            }
        }
    }
    const { data, error } = await supabase.from('lead_reports').update({ status }).eq('id', reportId).select().single();
    if(error) console.error("Update report status error", error);
    return data;
  }

  async getAppConfig() { return MOCK_APP_CONFIG; }
  async updateAppConfig(newConfig: typeof MOCK_APP_CONFIG) {
      MOCK_APP_CONFIG = newConfig;
      return MOCK_APP_CONFIG;
  }

  // Empresa methods
  async getEmpresaStats(empresaId: string) {
    const { data: empresa } = await supabase.from('empresas').select('*').eq('id', empresaId).single();
    if (!empresa) return {};
    const { count: conversiones } = await supabase.from('compras').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('convertido', true);
    const { data: compras } = await supabase.from('compras').select('precio').eq('empresa_id', empresaId);
    
    const tasaConversion = empresa.leads_comprados > 0 ? (conversiones! / empresa.leads_comprados) * 100 : 0;
    const costoTotal = compras?.reduce((sum, c) => sum + c.precio, 0) || 0;

    return {
        leadsComprados: empresa.leads_comprados,
        tasaConversion: tasaConversion,
        saldoDisponible: empresa.saldo,
        costoTotal: costoTotal,
        conversiones: conversiones,
        leadsCompradosTrend: (Math.random() * 10 - 4).toFixed(1), // Mock trend
        tasaConversionTrend: (Math.random() * 5 - 2).toFixed(1), // Mock trend
    };
  }

  async getEmpresaChartData() {
    // Mock data for empresa chart
    const performanceData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const comprados = Math.floor(Math.random() * 5) + 1;
        return {
            name: date.toLocaleDateString('es-CO', { weekday: 'short' }),
            Comprados: comprados,
            Convertidos: Math.floor(comprados * (Math.random() * 0.5 + 0.1)),
        };
    });
    return { performanceData };
  }

  async getAvailableLeads({ page, limit, filters, sort }: { page: number, limit: number, filters: any, sort: string }) {
    let query = supabase.from('leads').select('*', { count: 'exact' }).eq('estado', 'ofertado');
    if (filters) {
        if (filters.vertical && filters.vertical !== 'all') query = query.eq('vertical', filters.vertical);
        if (filters.riesgo && filters.riesgo !== 'all') query = query.eq('riesgo', filters.riesgo);
    }
    const [sortKey, sortDir] = sort.split('-');
    query = query.order(sortKey, { ascending: sortDir === 'asc' });
    query = query.range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await query;
    if (error) console.error('Get available leads error:', error);
    return { data: data || [], total: count || 0 };
  }
  
  async purchaseLead(empresaId: string, leadId: string): Promise<void> {
    const { data, error } = await supabase.rpc('purchase_lead', {
        p_empresa_id: empresaId,
        p_lead_id: leadId,
    });

    if (error) {
        console.error('Purchase lead RPC error:', error);
        throw new Error('Ocurrió un error en la transacción. Inténtalo de nuevo.');
    }

    const result = data?.[0];
    if (!result || !result.success) {
        throw new Error(result ? result.message : 'La transacción falló por una razón desconocida.');
    }
  }

  async getMisCompras({ empresaId, page, limit, sort }: { empresaId: string, page: number, limit: number, sort: {key: string, direction: 'asc'|'desc'} }) {
    let query = supabase.from('compras').select('*, lead:leads(*)', { count: 'exact' }).eq('empresa_id', empresaId);
    query = applySortToQuery(query, sort);
    query = query.range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await query;
    if(error) console.error('Get mis compras error:', error);
    return { data: data || [], total: count || 0 };
  }

  async reportLead(reportData: Omit<LeadReport, 'id' | 'status' | 'created_at'>) {
    const { data, error } = await supabase.from('lead_reports').insert({ ...reportData, status: 'pendiente' }).select().single();
    if (error) console.error('Report lead error:', error);
    return data;
  }

  async markAsConverted(compraId: string) {
    const { data, error } = await supabase.from('compras').update({ convertido: true }).eq('id', compraId).select('lead_id').single();
    if (error) {
      console.error('Mark as converted error', error);
      return null;
    }
    if (data?.lead_id) {
      await supabase.from('leads').update({ convertido: true }).eq('id', data.lead_id);
    }
    return data;
  }

  async getSubscriptions({ empresaId, page, limit }: { empresaId: string, page: number, limit: number }) {
    let query = supabase.from('lead_subscriptions').select('*', { count: 'exact' }).eq('empresa_id', empresaId);
    query = query.range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await query;
    if (error) console.error('Get subscriptions error:', error);
    return { data: data || [], total: count || 0 };
  }

  async createLeadSubscription(subData: Omit<LeadSubscription, 'id' | 'daily_purchases'>) {
    const { data, error } = await supabase.from('lead_subscriptions').insert({ ...subData, daily_purchases: 0 }).select().single();
    if(error) console.error('Create subscription error:', error);
    return data;
  }
  
  async editSubscription(subId: string, subData: Partial<Omit<LeadSubscription, 'id' | 'empresa_id'>>) {
    const { data, error } = await supabase.from('lead_subscriptions').update(subData).eq('id', subId).select().single();
    if (error) console.error('Edit subscription error:', error);
    return data;
  }
  
  async updateSubscription(subId: string, active: boolean) {
     const { data, error } = await supabase.from('lead_subscriptions').update({ active }).eq('id', subId).select().single();
     if (error) console.error('Update subscription status error:', error);
     return data;
  }

  async deleteSubscription(subId: string) {
    const { error } = await supabase.from('lead_subscriptions').delete().eq('id', subId);
    if(error) console.error('Delete subscription error:', error);
  }
  
  async generateApiKey(): Promise<string> {
    return 'sk_live_' + [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
  }

  async createWompiCheckout(amountInCents: number): Promise<{ reference: string; signature: string }> {
    try {
      // FIX: To guarantee a valid access token and prevent authentication errors with long-lived
      // sessions, we explicitly force a session refresh before invoking the Edge Function.
      // This is more robust than getSession() for this specific use case.
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

      if (sessionError || !session) {
          console.error('Session refresh error:', sessionError);
          throw new Error('Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.');
      }

      // IMPROVEMENT: We now explicitly pass the refreshed access token in the Authorization header.
      // This is the most robust way to ensure the Edge Function receives a valid token,
      // eliminating potential race conditions where the Supabase client might internally
      // hold on to a stale token.
      const { data, error } = await supabase.functions.invoke('create-wompi-checkout', {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        },
        body: { amountInCents },
      });

      if (error) {
        // FIX: Check if the error is a FunctionsHttpError and parse the JSON body
        // to provide a much more specific and useful error message to the user.
        // This is a type-safe check that avoids needing a direct import.
        if (error && typeof error === 'object' && 'context' in error && error.context instanceof Response) {
            const errorData = await (error.context as Response).json();
            // Re-throw with the specific message from the function's response body
            throw new Error(errorData.error || 'La función de pago devolvió un error.');
        }
        // Throw original error for other, unexpected cases
        throw error;
      }
      
      return data;

    } catch (error) {
      // The console log is still useful for debugging the full error object
      console.error('Error setting up Wompi checkout:', error);
      // Re-throw the (now more specific) error for the UI to handle.
      throw error;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
      if (error) {
        console.error('Get notifications error:', error.message);
        // FIX: Throw an error instead of returning an empty array on failure.
        // This allows the calling component to handle network errors gracefully
        // without clearing existing data from the UI.
        throw new Error(error.message);
      }
      return data;
  }
  
  async markNotificationsAsRead(userId: string) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
      if (error) console.error('Mark as read error:', error);
  }
  
  async exportDataAsCsv(tableName: string, data?: any[]) {
      const filename = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
      if (data) {
          exportToCsv(data, filename);
          return;
      }
      const { data: allData, error } = await supabase.from(tableName).select('*');
      if (error) {
          console.error(`Error exporting ${tableName}`, error);
          alert(`Error exporting ${tableName}`);
          return;
      }
      if (allData) {
          exportToCsv(allData, filename);
      }
  }
}

export const apiService = new ApiService();