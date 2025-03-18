
// This file contains mock data until we connect to a real MongoDB database
// In a real setup, this would be your actual database

import { 
  FarmerData, 
  RetailerData, 
  TransporterData, 
  ManagerData, 
  RegulatorData 
} from '../models/schema';

// Mock data for farmer dashboard
export const farmerData: FarmerData[] = [
  {
    id: 'f1',
    cropHealth: 87,
    soilMoisture: 42,
    harvestForecast: 1240,
    weatherRisk: 'Low',
    lastUpdated: new Date()
  },
  {
    id: 'f2',
    cropHealth: 92,
    soilMoisture: 48,
    harvestForecast: 1560,
    weatherRisk: 'Moderate',
    lastUpdated: new Date()
  }
];

// Mock data for retailer dashboard
export const retailerData: RetailerData[] = [
  {
    id: 'r1',
    inventory: 3420,
    sales: 12840,
    outOfStockItems: 12,
    demandForecast: 'Increasing',
    lastUpdated: new Date()
  },
  {
    id: 'r2',
    inventory: 2850,
    sales: 10560,
    outOfStockItems: 8,
    demandForecast: 'Stable',
    lastUpdated: new Date()
  }
];

// Mock data for transporter dashboard
export const transporterData: TransporterData[] = [
  {
    id: 't1',
    activeShipments: 24,
    onTimeDelivery: 93,
    fleetUtilization: 86,
    routeEfficiency: 'Optimal',
    lastUpdated: new Date()
  },
  {
    id: 't2',
    activeShipments: 18,
    onTimeDelivery: 91,
    fleetUtilization: 82,
    routeEfficiency: 'Suboptimal',
    lastUpdated: new Date()
  }
];

// Mock data for manager dashboard
export const managerData: ManagerData[] = [
  {
    id: 'm1',
    supplyChainScore: 87,
    costEfficiency: 76,
    riskIndex: 'Low',
    totalPartners: 48,
    lastUpdated: new Date()
  },
  {
    id: 'm2',
    supplyChainScore: 82,
    costEfficiency: 72,
    riskIndex: 'Moderate',
    totalPartners: 52,
    lastUpdated: new Date()
  }
];

// Mock data for regulator dashboard
export const regulatorData: RegulatorData[] = [
  {
    id: 'reg1',
    complianceRate: 94,
    pendingApprovals: 7,
    safetyViolations: 2,
    policyUpdates: 3,
    lastUpdated: new Date()
  },
  {
    id: 'reg2',
    complianceRate: 96,
    pendingApprovals: 5,
    safetyViolations: 1,
    policyUpdates: 2,
    lastUpdated: new Date()
  }
];

// Historical data for trend charts
export const historicalData = {
  farmer: [
    { month: 'Jan', cropHealth: 80, soilMoisture: 45 },
    { month: 'Feb', cropHealth: 82, soilMoisture: 48 },
    { month: 'Mar', cropHealth: 84, soilMoisture: 46 },
    { month: 'Apr', cropHealth: 86, soilMoisture: 44 },
    { month: 'May', cropHealth: 87, soilMoisture: 42 }
  ],
  retailer: [
    { month: 'Jan', inventory: 3000, sales: 10000 },
    { month: 'Feb', inventory: 3200, sales: 10800 },
    { month: 'Mar', inventory: 3300, sales: 11500 },
    { month: 'Apr', inventory: 3380, sales: 12200 },
    { month: 'May', inventory: 3420, sales: 12840 }
  ],
  transporter: [
    { month: 'Jan', shipments: 18, onTimeDelivery: 88 },
    { month: 'Feb', shipments: 20, onTimeDelivery: 89 },
    { month: 'Mar', shipments: 22, onTimeDelivery: 91 },
    { month: 'Apr', shipments: 23, onTimeDelivery: 92 },
    { month: 'May', shipments: 24, onTimeDelivery: 93 }
  ],
  manager: [
    { month: 'Jan', score: 80, efficiency: 70 },
    { month: 'Feb', score: 82, efficiency: 72 },
    { month: 'Mar', score: 84, efficiency: 73 },
    { month: 'Apr', score: 85, efficiency: 75 },
    { month: 'May', score: 87, efficiency: 76 }
  ],
  regulator: [
    { month: 'Jan', compliance: 90, violations: 6 },
    { month: 'Feb', compliance: 91, violations: 5 },
    { month: 'Mar', compliance: 92, violations: 4 },
    { month: 'Apr', compliance: 93, violations: 3 },
    { month: 'May', compliance: 94, violations: 2 }
  ]
};
