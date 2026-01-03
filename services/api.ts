
import { RepairRequest, User, ZonalMetadata } from '../types';
import { supabase } from './supabase';

export const dbApi = {
  // Solicitações
  async getRequests(): Promise<RepairRequest[]> {
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    return data.map(req => ({
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

  // Usuários
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;

    return data.map(u => ({
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
        registration_number: user.registrationNumber,
        email: user.email
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

  // Zonal Metadata
  async getZonals(): Promise<ZonalMetadata[]> {
    const { data, error } = await supabase
      .from('zonals')
      .select('*');
    if (error) throw error;
    return data.map(z => ({
      id: z.id,
      name: z.name,
      managerId: z.manager_id,
      description: z.description
    }));
  },

  async saveZonal(zonal: ZonalMetadata): Promise<void> {
    // Importante: se o managerId não existir na tabela users, o Supabase retornará 409/400.
    // Garantimos que se for vazio, enviamos NULL para evitar violação de FK.
    const { error } = await supabase
      .from('zonals')
      .upsert([{
        id: zonal.id,
        name: zonal.name,
        manager_id: zonal.managerId || null,
        description: zonal.description || null
      }], { onConflict: 'id' });
    
    if (error) throw error;
  }
};
