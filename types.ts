
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

export type UserRole = 'Manager' | 'Collaborator' | 'Intern';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  zonal: ZonalType;
  email?: string;
  registrationNumber?: string; // Matrícula
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
  zonal: ZonalType;
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

export interface ZonalMetadata {
  id: ZonalType;
  name: string;
  managerId?: string; // ID do Engenheiro Responsável
  description?: string;
}
