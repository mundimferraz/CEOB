
import { Zonal, RequestStatus, User, RepairRequest } from './types';

export const ZONALS: Zonal[] = [
  Zonal.NORTH,
  Zonal.SOUTH,
  Zonal.EAST,
  Zonal.WEST
];

export const STATUS_COLORS = {
  [RequestStatus.OPEN]: 'bg-blue-100 text-blue-700 border-blue-200',
  [RequestStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700 border-amber-200',
  [RequestStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [RequestStatus.CANCELED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Eng. Ricardo Souza', role: 'Manager', zonal: Zonal.NORTH },
  { id: 'u2', name: 'Ana Oliveira', role: 'Collaborator', zonal: Zonal.NORTH },
  { id: 'u3', name: 'Carlos Santos', role: 'Intern', zonal: Zonal.NORTH },
  { id: 'u4', name: 'Juliana Lima', role: 'Manager', zonal: Zonal.SOUTH },
];

export const MOCK_REQUESTS: RepairRequest[] = [
  {
    id: 'req_001',
    protocol: '2024.123456',
    seiNumber: '00.123.456/2024',
    contract: 'CTR-05/2023',
    description: 'Recapeamento asfáltico após rompimento de tubulação de esgoto.',
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'Av. Paulista, 1000 - São Paulo, SP'
    },
    visitDate: '2024-05-15',
    status: RequestStatus.IN_PROGRESS,
    technicianId: 'u2',
    zonal: Zonal.NORTH,
    createdAt: '2024-05-10',
    photoBefore: 'https://picsum.photos/seed/pothole1/400/300'
  },
  {
    id: 'req_002',
    protocol: '2024.987654',
    seiNumber: '00.987.654/2024',
    contract: 'CTR-08/2023',
    description: 'Manutenção de calçada danificada por raízes de árvore.',
    location: {
      latitude: -23.5612,
      longitude: -46.6543,
      address: 'Rua Augusta, 1500 - São Paulo, SP'
    },
    visitDate: '2024-05-12',
    status: RequestStatus.COMPLETED,
    technicianId: 'u2',
    zonal: Zonal.NORTH,
    createdAt: '2024-05-08',
    photoBefore: 'https://picsum.photos/seed/pothole2/400/300',
    photoAfter: 'https://picsum.photos/seed/pothole3/400/300'
  }
];
