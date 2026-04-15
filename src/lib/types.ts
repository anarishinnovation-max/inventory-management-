export enum Role {
  OWNER = 'OWNER',
  EMPLOYEE = 'EMPLOYEE'
}

export enum TransactionType {
  INWARD = 'INWARD',
  OUTWARD = 'OUTWARD',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum POStatus {
  PENDING = 'PENDING',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  category?: { id: string; name: string };
  unit: string;
  minStockLevel: number;
  isCritical: boolean;
  createdAt: Date;
  updatedAt: Date;
  stocks?: any[];
  inventory?: any;
}

export interface Rack {
  id: string;
  rackNumber: string;
}

export interface Stock {
  id: string;
  itemId: string;
  rackId: string;
  quantity: number;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}
