
// This file defines the data schemas for our MongoDB models
// In a real setup, this would be in your Express.js backend repo

export interface FarmerData {
  id: string;
  cropHealth: number;
  soilMoisture: number;
  harvestForecast: number;
  weatherRisk: string;
  lastUpdated: Date;
}

export interface RetailerData {
  id: string;
  inventory: number;
  sales: number;
  outOfStockItems: number;
  demandForecast: string;
  lastUpdated: Date;
}

export interface TransporterData {
  id: string;
  activeShipments: number;
  onTimeDelivery: number;
  fleetUtilization: number;
  routeEfficiency: string;
  lastUpdated: Date;
}

export interface ManagerData {
  id: string;
  supplyChainScore: number;
  costEfficiency: number;
  riskIndex: string;
  totalPartners: number;
  lastUpdated: Date;
}

export interface RegulatorData {
  id: string;
  complianceRate: number;
  pendingApprovals: number;
  safetyViolations: number;
  policyUpdates: number;
  lastUpdated: Date;
}
