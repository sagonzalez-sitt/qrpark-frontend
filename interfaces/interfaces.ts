import { VehicleType, TicketStatus, TicketDeliveryMethod } from './enums';

export interface Ticket {
  id: string;
  qr_token: string;
  plate_number: string;
  vehicle_type: VehicleType;
  entry_timestamp: string;
  exit_timestamp: string | null;
  calculated_fee: number | null;
  status: TicketStatus;
  delivery_method: TicketDeliveryMethod;
  delivered: boolean;
  qr_downloaded_at: string | null;
  printed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketResponse extends Ticket {
  duration_ms?: number;
  duration_formatted?: string;
  fee_amount?: number;
}

export interface DashboardStats {
  activeTickets: number;
  dailyRevenue: number;
  dailyEntries: number;
  averageStayMs: number;
  averageStayFormatted: string;
  distribution: {
    cars: number;
    motorcycles: number;
    bicycles: number;
  };
  deliveryMethodDistribution: {
    digitalPhoto: number;
    digitalDownload: number;
    printed: number;
    unknown: number;
  };
}

export interface PricingConfig {
  id: string;
  vehicle_type: VehicleType;
  price_per_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
