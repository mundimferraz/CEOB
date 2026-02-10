
export enum RequestStatus {
  OPEN = 'Aberta',
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Concluída',
  CANCELED = 'Cancelada'
}

export enum ZonalType {
  NORTH = 'Zonal Norte',
  SOUTH = 'Zonal Sul',
  EAST = 'Zonal Leste',
  WEST = 'Zonal Oeste'
}

export enum AppRole {
  ADMIN = 'Admin',
  EDITOR = 'Editor',
  OPERATOR = 'Operator',
  VIEWER = 'Viewer',
  RESTRICTED = 'Restricted'
}

export type UserRole = AppRole;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  zonal: ZonalType | string;
  email?: string;
  registrationNumber?: string;
  password?: string;
  position?: string; 
  function?: string; 
  lastActiveAt?: string; // Timestamp da última atividade
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export interface RepairRequest {
  id: string;
  protocol: string;
  seiNumber: string;
  contract: string;
  description: string;
  location: LocationData;
  visitDate: string;
  status: RequestStatus;
  technicianId: string;
  zonal: ZonalType | string;
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

export interface VisitRoute {
  id: string;
  name: string;
  technicianId: string;
  requestIds: string[];
  startLocation?: LocationData;
  createdAt: string;
  status: 'Pendente' | 'Em Execução' | 'Finalizado';
}

export interface ZonalMetadata {
  id: string;
  name: string;
  managerId?: string;
  assistantId?: string;
  description?: string;
}

export enum AuditAction {
  CREATE = 'CRIAÇÃO',
  UPDATE = 'ALTERAÇÃO',
  DELETE = 'EXCLUSÃO'
}

export enum AuditEntity {
  REQUEST = 'VISTORIA',
  USER = 'USUÁRIO',
  ZONAL = 'UNIDADE',
  ROUTE = 'ROTEIRO'
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: AuditAction;
  entity_type: AuditEntity;
  entity_id: string;
  details: any;
  created_at: string;
}
