// Simulating Fabric MSP (Membership Service Provider) Roles
export enum OrgRole {
  SUPPLIER = 'SUPPLIER',
  PROCESSOR = 'PROCESSOR',
  LOGISTICS = 'LOGISTICS',
  RETAILER = 'RETAILER',
  CONSUMER = 'CONSUMER'
}

export interface FoodAsset {
  id: string; // Key
  name: string;
  category: string;
  createTime: number;
  lastUpdated: number;
  status: 'HARVESTED' | 'PROCESSED' | 'IN_TRANSIT' | 'ON_SHELF' | 'SOLD';
  owner: string; // Current owner MSP ID
  
  // Specific Data Fields
  origin?: string;
  harvestDate?: string;
  processTemp?: string;
  packageId?: string;
  logisticsId?: string;
  transportTemp?: string;
  retailerName?: string;
  shelfLife?: string;
}

export interface BlockTransaction {
  txId: string;
  timestamp: number;
  func: string; // Chaincode function name
  invoker: OrgRole;
  inputs: Record<string, any>;
  signature: string; // Mock signature
  previousHash: string; // Link to previous block
  currentHash: string;
}

export interface LedgerEntry {
  asset: FoodAsset;
  history: BlockTransaction[];
}

// Chaincode Response Wrapper
export interface ChaincodeResponse<T> {
  status: number;
  message: string;
  payload?: T;
}