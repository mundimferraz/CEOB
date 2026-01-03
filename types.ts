
export enum RequestStatus {
  OPEN = 'Aberta',
  IN_PROGRESS = 'Em andamento',
  COMPLETED = 'Concluída',
  CANCELED = 'Cancelada'
}

export enum Zonal {
  NORTH = 'Zonal Norte',
  SOUTH = 'Zonal Sul',
  EAST = 'Zonal Leste',
  WEST = 'Zonal Oeste'
}

export interface User {
  id: string;
  name: string;
  role: 'Manager' | 'Collaborator' | 'Intern';
  zonal: Zonal;
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
  zonal: Zonal;
  photoBefore?: string;
  photoAfter?: string;
  createdAt: string;
}

export interface ZonalInfo {
  id: Zonal;
  manager: string;
  totalTeam: number;
}
