export interface User {
  id: number;
  username: string;
  role: 'admin' | 'nursery';
  nursery_name: string | null;
  nursery_type?: 'Main' | 'Other';
}

export interface CDODivision {
  id: number;
  name: string;
}

export interface GNDivision {
  id: number;
  name: string;
  cdo_id: number;
  cdo_name?: string;
}

export interface Program {
  id: number;
  name: string;
}

export interface OtherNursery {
  id: number;
  name: string;
}

export interface JournalPrice {
  id: number;
  price: number;
}

export interface CashSalesPrice {
  id: number;
  price: number;
}

export interface CashSale {
  id: number;
  nursery_name: string;
  nursery_type: 'Main' | 'Other';
  cdo_id: number;
  gn_id: number;
  month: string;
  plant_type: string;
  price_id: number;
  seedling_type: 'Field' | 'Potted';
  quantity: number;
  year: string;
  cdo_name?: string;
  gn_name?: string;
  price?: number;
}

export interface Notification {
  id: number;
  date: string;
  notification_no: string;
  receipt_no: string;
  seedling_type: 'Field' | 'Potted';
  quantity: number;
  received_receipts: number;
  issued_quantity: number;
  program_id: number;
  cdo_id: number;
  gn_id: number;
  journal_price_id: number;
  nursery_type: 'Main' | 'Other';
  nursery_name: string;
  program_name?: string;
  cdo_name?: string;
  gn_name?: string;
  journal_price?: number;
}
