
import { RepairRequest, User, ZonalMetadata, AuditLog } from '../types';
import { supabase } from './supabase';

export const dbApi = {
  // Autenticação
  async login(username: string, password: string): Promise<User | null> {
    // PostgREST exige que valores no .or() não tenham aspas extras se não houver espaços
    // Usamos uma sintaxe mais limpa para evitar erro 400
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.eq.${username},registration_number.eq.${username}`)
      .eq('password', password)
      .maybeSingle(); // maybeSingle é mais seguro que single() para evitar erros se não encontrar nada
    
    if (error) {
      console.error('Erro na consulta de login:', error);
      return null;
    }
    
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      role: data.role,
      zonal: data.zonal,
      registrationNumber: data.registration_number,
      email: data.email
    };
  },

  // Auditoria
  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: log.user_id,
        user_name: log.user_name,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: log.details
      }]);
    
    if (error) console.error('Erro ao gravar auditoria:', error);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      user_id: l.user_id,
      user_name: l.user_name,
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      details: l.details,
      created_at: l.created_at
    }));
  },

  // Solicitações
  async getRequests(): Promise<RepairRequest[]> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    return (data || []).map(req => ({
      id: req.id,
      protocol: req.protocol,
      seiNumber: req.sei_number,
      contract: req.contract,
      description: req.description,
      location: {
        latitude: req.latitude,
        longitude: req.longitude,
        address: req.address
      },
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
    const { error } = await supabase
      .from('repair_requests')
      .insert([{
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
    const { error } = await supabase
      .from('repair_requests')
      .update({
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
      })
      .eq('id', request.id);
    
    if (error) throw error;
  },

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('repair_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Usuários
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      zonal: u.zonal,
      registrationNumber: u.registration_number,
      email: u.email
    }));
  },

  async saveUser(user: User): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        name: user.name,
        role: user.role,
        zonal: user.zonal,
        registration_number: user.registrationNumber || null,
        email: user.email || null,
        password: user.password || '123456'
      }], { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Zonais
  async getZonals(): Promise<ZonalMetadata[]> {
    const { data, error } = await supabase
      .from('zonals')
      .select('*');
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
  }
};
