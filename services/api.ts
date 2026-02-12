
import { RepairRequest, User, ZonalMetadata, AuditLog, VisitRoute } from '../types';
import { supabase } from './supabase';

export const dbApi = {
  // Autenticação
  async login(username: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike."${username}",registration_number.ilike."${username}"`)
        .eq('password', password)
        .maybeSingle();
      
      if (error || !data) return null;

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
    } catch (e) { return null; }
  },

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await supabase.from('users').update({ password: newPassword }).eq('id', userId);
  },

  // Usuários
  async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('users').select('*').order('name');
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
    await supabase.from('users').upsert([{
      id: user.id,
      name: user.name,
      role: user.role,
      zonal: user.zonal,
      registration_number: user.registrationNumber,
      email: user.email,
      password: user.password || '123456',
      position: user.position,
      function: user.function
    }]);
  },

  async deleteUser(id: string): Promise<void> {
    await supabase.from('users').delete().eq('id', id);
  },

  // Roteiros
  async getRoutes(): Promise<VisitRoute[]> {
    const { data } = await supabase.from('visit_routes').select('*').order('created_at', { ascending: false });
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      technicianId: r.technician_id,
      requestIds: r.request_ids || [],
      startLocation: r.start_location,
      createdAt: r.created_at,
      status: r.status
    }));
  },

  async saveRoute(route: VisitRoute): Promise<void> {
    await supabase.from('visit_routes').upsert([{
      id: route.id,
      name: route.name,
      technician_id: route.technicianId,
      request_ids: route.requestIds,
      start_location: route.startLocation,
      created_at: route.createdAt,
      status: route.status
    }]);
  },

  async deleteRoute(id: string): Promise<void> {
    await supabase.from('visit_routes').delete().eq('id', id);
  },

  // Vistorias (Otimizadas)
  async getRequests(): Promise<RepairRequest[]> {
    // Buscamos tudo, mas como é chamado menos vezes e atualizado localmente, o impacto diminui
    const { data, error } = await supabase.from('repair_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(req => ({
      id: req.id,
      protocol: req.protocol,
      seiNumber: req.sei_number,
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
    const { error } = await supabase.from('repair_requests').insert([{
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
    if (error) throw error;
  },

  async updateRequest(request: RepairRequest): Promise<void> {
    const { error } = await supabase.from('repair_requests').update({
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
    if (error) throw error;
  },

  async deleteRequest(id: string): Promise<void> {
    await supabase.from('repair_requests').delete().eq('id', id);
  },

  async getZonals(): Promise<ZonalMetadata[]> {
    const { data } = await supabase.from('zonals').select('*').order('name');
    return (data || []).map(z => ({
      id: z.id,
      name: z.name,
      managerId: z.manager_id,
      assistantId: z.assistant_id,
      description: z.description
    }));
  },

  async saveZonal(z: ZonalMetadata): Promise<void> {
    await supabase.from('zonals').upsert([{
      id: z.id,
      name: z.name,
      manager_id: z.managerId,
      assistant_id: z.assistantId,
      description: z.description
    }]);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    return data || [];
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    await supabase.from('audit_logs').insert([log]);
  }
};
