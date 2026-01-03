
import { ZonalType, RequestStatus, User, RepairRequest, ZonalMetadata } from './types';

export const ZONALS_LIST: ZonalType[] = [
  ZonalType.NORTH,
  ZonalType.SOUTH,
  ZonalType.EAST,
  ZonalType.WEST
];

export const INITIAL_ZONAL_METADATA: ZonalMetadata[] = ZONALS_LIST.map(z => ({
  id: z,
  name: z,
  managerId: z === ZonalType.NORTH ? 'u1' : z === ZonalType.SOUTH ? 'u4' : undefined
}));

export const STATUS_COLORS = {
  [RequestStatus.OPEN]: 'bg-blue-100 text-blue-700 border-blue-200',
  [RequestStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700 border-amber-200',
  [RequestStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [RequestStatus.CANCELED]: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Eng. Ricardo Souza', role: 'Manager', zonal: ZonalType.NORTH, registrationNumber: '12345-6' },
  { id: 'u2', name: 'Ana Oliveira', role: 'Collaborator', zonal: ZonalType.NORTH, registrationNumber: '88772-1' },
  { id: 'u3', name: 'Carlos Santos', role: 'Intern', zonal: ZonalType.NORTH, registrationNumber: 'EST-990' },
  { id: 'u4', name: 'Juliana Lima', role: 'Manager', zonal: ZonalType.SOUTH, registrationNumber: '55443-2' },
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
    zonal: ZonalType.NORTH,
    createdAt: '2024-05-10',
    photoBefore: 'https://picsum.photos/seed/pothole1/400/300'
  }
];
