import { type EventStatus } from './event';

export type TicketStatus =
  | 'ACTIVE'
  | 'ONGATE_PENDING'
  | 'USED'
  | 'CANCELLED';

export interface MyTickets {
  ticket_id: string;
  qr_hash: string;
  status: TicketStatus;
  price_purchased: string;
  created_at: string;
  ticket_type: {
    name: string;
    description: string;
  };
  event: {
    event_id: string;
    name: string;
    location: string;
    start_at: string;
    end_at: string;
    status: EventStatus;
  };
}

export const MOCK_TICKETS: MyTickets[] = [
  {
    ticket_id: 'tkt-001',
    qr_hash: 'a3f8c2d1e9b74a6f8012de3c5b7a9f01',
    status: 'ACTIVE',
    price_purchased: '2500.00',
    created_at: new Date('2026-02-20T10:30:00').toISOString(),
    ticket_type: {
      name: 'VIP Gold',
      description: 'Front-row access with backstage pass',
    },
    event: {
      event_id: '1',
      name: 'Neon Dreams Music Festival',
      location: 'Downtown Arena, NY',
      start_at: new Date('2026-08-15T18:00:00').toISOString(),
      end_at: new Date('2026-08-15T23:59:59').toISOString(),
      status: 'ON_SALE',
    },
  },
  {
    ticket_id: 'tkt-002',
    qr_hash: 'b7e4d92c1f0a38e56d21cf84a6b30e72',
    status: 'ACTIVE',
    price_purchased: '5000.00',
    created_at: new Date('2026-02-18T14:15:00').toISOString(),
    ticket_type: {
      name: 'Premium',
      description: 'Reserved seating with complimentary refreshments',
    },
    event: {
      event_id: '2',
      name: 'Tech Innovation Summit',
      location: 'Moscone Center, SF',
      start_at: new Date('2026-09-02T09:00:00').toISOString(),
      end_at: new Date('2026-09-03T17:00:00').toISOString(),
      status: 'ON_SALE',
    },
  },
  {
    ticket_id: 'tkt-003',
    qr_hash: 'c1d5a83e7f2b490c6e8d3a1f05b7c9d2',
    status: 'ONGATE_PENDING',
    price_purchased: '3500.00',
    created_at: new Date('2026-02-25T09:00:00').toISOString(),
    ticket_type: {
      name: 'General Admission',
      description: 'Standard entry with open seating',
    },
    event: {
      event_id: '3',
      name: 'Championship Finals 2026',
      location: 'Grand Stadium, UK',
      start_at: new Date('2026-10-20T19:30:00').toISOString(),
      end_at: new Date('2026-10-20T22:30:00').toISOString(),
      status: 'ON_SALE',
    },
  },
  {
    ticket_id: 'tkt-004',
    qr_hash: 'd9f2e17b3c8a60d45a1b2c3d4e5f6a7b',
    status: 'USED',
    price_purchased: '1500.00',
    created_at: new Date('2026-01-05T16:45:00').toISOString(),
    ticket_type: {
      name: 'Early Bird',
      description: 'Discounted early purchase ticket',
    },
    event: {
      event_id: '7',
      name: 'Colombo Music Night 2026',
      location: 'Nelum Pokuna, Colombo',
      start_at: new Date('2026-01-20T19:00:00').toISOString(),
      end_at: new Date('2026-01-20T23:00:00').toISOString(),
      status: 'COMPLETED',
    },
  },
  {
    ticket_id: 'tkt-005',
    qr_hash: 'e4a8b31d6c9f20e75b8a1c2d3e4f5678',
    status: 'CANCELLED',
    price_purchased: '800.00',
    created_at: new Date('2026-02-10T11:20:00').toISOString(),
    ticket_type: {
      name: 'Standard',
      description: 'General entry ticket',
    },
    event: {
      event_id: '8',
      name: 'Startup Meetup Kandy',
      location: 'Queens Hotel, Kandy',
      start_at: new Date('2026-03-05T10:00:00').toISOString(),
      end_at: new Date('2026-03-05T17:00:00').toISOString(),
      status: 'CANCELLED',
    },
  },
  {
    ticket_id: 'tkt-006',
    qr_hash: 'f5b9c42e7d0a31f86c9e2d1a3b4c5d6e',
    status: 'ACTIVE',
    price_purchased: '1200.00',
    created_at: new Date('2026-02-27T08:00:00').toISOString(),
    ticket_type: {
      name: 'Regular',
      description: 'Standard musical theatre seating',
    },
    event: {
      event_id: '4',
      name: 'Broadways Magic: The Musical',
      location: 'Majestic Theatre, NY',
      start_at: new Date('2026-11-05T20:00:00').toISOString(),
      end_at: new Date('2026-11-05T23:00:00').toISOString(),
      status: 'ON_SALE',
    },
  },
];

export async function getMyTicketsMock(): Promise<MyTickets[]> {
  return MOCK_TICKETS;
}