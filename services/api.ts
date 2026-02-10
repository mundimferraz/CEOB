
import { RepairRequest, User, ZonalMetadata, AuditLog, VisitRoute } from '../types';
import { supabase } from './supabase';

export const dbApi = {
  // Autenticação
  async login(username: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.${username},registration_number.ilike.${username}`)
      .eq('password', password)
      .maybeSingle();
    
    if (error) return null;
    if (!data) return null;

    await this.updateUserActivity(data.id);

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zonal: data.zonal,
      registrationNumber: data.registration_number,
      email: data.email,
      position: data.position,
      function: data.function,
      lastActiveAt: new Date().toISOString()
    };
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await supabase.from('users').update({ password: newPassword }).eq('id', userId);
  },

  async updateUserActivity(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  },

  // Usuários
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      zonal: u.zonal,
      registrationNumber: u.registration_number,
      email: u.email,
      position: u.position,
      function: u.function,
      lastActiveAt: u.last_active_at
    }));
  },

  async saveUser(user: User): Promise<void> {
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      zonal: user.zonal,
      registration_number: user.registrationNumber || null,
      email: user.email || null,
      password: user.password || '123456',
      position: user.position || null,
      function: user.function || null
    };

    const { error } = await supabase
      .from('users')
      .upsert([payload], { onConflict: 'id' });
    
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    await supabase.from('users').delete().eq('id', id);
  },

  // Roteiros de Visitas (Novo)
  async getRoutes(): Promise<VisitRoute[]> {
    const { data, error } = await supabase.from('visit_routes').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn("Erro ao buscar rotas no Supabase, tentando LocalStorage:", error.message);
      const local = localStorage.getItem('sgr_vias_routes');
      return local ? JSON.parse(local) : [];
    }
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      technicianId: r.technician_id,
      requestIds: r.request_ids,
      startLocation: r.start_location,
      createdAt: r.created_at,
      status: r.status
    }));
  },

  async saveRoute(route: VisitRoute): Promise<void> {
    // 1. Tentar salvar no Supabase
    const { error } = await supabase.from('visit_routes').upsert([{
      id: route.id,
      name: route.name,
      technician_id: route.technicianId,
      request_ids: route.requestIds,
      start_location: route.startLocation,
      created_at: route.createdAt,
      status: route.status
    }]);

    if (error) {
      console.error("Falha Crítica na Persistência Supabase (visit_routes):", error);
      // Se falhar no banco, ainda assim salvamos no LocalStorage para não perder o trabalho do usuário
    }

    // 2. Backup robusto em localStorage
    try {
      const local = localStorage.getItem('sgr_vias_routes');
      const routes = local ? JSON.parse(local) : [];
      const index = routes.findIndex((r: any) => r.id === route.id);
      if (index >= 0) routes[index] = route; else routes.push(route);
      localStorage.setItem('sgr_vias_routes', JSON.stringify(routes));
    } catch (e) {
      console.error("Erro ao salvar backup local:", e);
    }
    
    if (error) throw new Error("Erro de comunicação com o servidor, dados salvos localmente.");
  },

  async deleteRoute(id: string): Promise<void> {
    await supabase.from('visit_routes').delete().eq('id', id);
    const local = localStorage.getItem('sgr_vias_routes');
    if (local) {
      const routes = JSON.parse(local);
      localStorage.setItem('sgr_vias_routes', JSON.stringify(routes.filter((r: any) => r.id !== id)));
    }
  },

  // Zonais
  async getZonals(): Promise<ZonalMetadata[]> {
    const { data, error } = await supabase.from('zonals').select('*').order('name');
    if (error) throw error;
    return (data || []).map(z => ({
      id: z.id,
      name: z.name,
      managerId: z.manager_id,
      assistantId: z.assistant_id,
      description: z.description
    }));
  },

  async saveZonal(zonal: ZonalMetadata): Promise<void> {
    const { error } = await supabase
      .from('zonals')
      .upsert([{
        id: zonal.id,
        name: zonal.name,
        manager_id: zonal.managerId || null,
        assistant_id: zonal.assistantId || null,
        description: zonal.description || null
      }], { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteZonal(id: string): Promise<void> {
    await supabase.from('zonals').delete().eq('id', id);
  },

  // Auditoria
  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    await supabase.from('audit_logs').insert([log]);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Solicitações
  async getRequests(): Promise<RepairRequest[]> {
    const { data, error } = await supabase.from('repair_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(req => ({
      id: req.id,
      protocol: req.protocol,
      sei_number: req.sei_number,
      contract: req.contract,
      description: req.description,
      location: { latitude: req.latitude, longitude: req.longitude, address: req.address },
      visitDate: req.visit_date,
      status: req.status,
      technicianId: req.technician_id,
      zonal: req.zonal,
      photoBefore: req.photo_before,
      photoAfter: req.photo_after,
      createdAt: req.created_at
    }));
  },

  async createRequest(request: RepairRequest): Promise<void> {
    await supabase.from('repair_requests').insert([{
      id: request.id,
      protocol: request.protocol,
      sei_number: request.seiNumber,
      contract: request.contract,
      description: request.description,
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      address: request.location.address,
      visit_date: request.visitDate,
      status: request.status,
      technician_id: request.technicianId,
      zonal: request.zonal,
      photo_before: request.photoBefore,
      photo_after: request.photoAfter,
      created_at: request.createdAt
    }]);
  },

  async updateRequest(request: RepairRequest): Promise<void> {
    await supabase.from('repair_requests').update({
      protocol: request.protocol,
      sei_number: request.seiNumber,
      contract: request.contract,
      description: request.description,
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      address: request.location.address,
      visit_date: request.visitDate,
      status: request.status,
      technician_id: request.technicianId,
      zonal: request.zonal,
      photo_before: request.photoBefore,
      photo_after: request.photoAfter
    }).eq('id', request.id);
  },

  async deleteRequest(id: string): Promise<void> {
    await supabase.from('repair_requests').delete().eq('id', id);
  }
};
