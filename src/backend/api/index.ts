
// This file simulates our Express.js API endpoints
// In a real setup, this would be Express routes in your backend repo

import { 
  farmerData, 
  retailerData, 
  transporterData, 
  managerData, 
  regulatorData,
  historicalData 
} from '../data/mockData';

// Simulate API delay like a real network request
const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// API endpoints for different user roles
export const api = {
  // Farmer data endpoints
  farmer: {
    getDashboardData: async () => {
      await simulateApiDelay();
      return { 
        data: farmerData[0],
        success: true 
      };
    },
    getHistoricalData: async () => {
      await simulateApiDelay();
      return { 
        data: historicalData.farmer,
        success: true 
      };
    }
  },
  
  // Retailer data endpoints
  retailer: {
    getDashboardData: async () => {
      await simulateApiDelay();
      return { 
        data: retailerData[0],
        success: true 
      };
    },
    getHistoricalData: async () => {
      await simulateApiDelay();
      return { 
        data: historicalData.retailer,
        success: true 
      };
    }
  },
  
  // Transporter data endpoints
  transporter: {
    getDashboardData: async () => {
      await simulateApiDelay();
      return { 
        data: transporterData[0],
        success: true 
      };
    },
    getHistoricalData: async () => {
      await simulateApiDelay();
      return { 
        data: historicalData.transporter,
        success: true 
      };
    }
  },
  
  // Manager data endpoints
  manager: {
    getDashboardData: async () => {
      await simulateApiDelay();
      return { 
        data: managerData[0],
        success: true 
      };
    },
    getHistoricalData: async () => {
      await simulateApiDelay();
      return { 
        data: historicalData.manager,
        success: true 
      };
    }
  },
  
  // Regulator data endpoints
  regulator: {
    getDashboardData: async () => {
      await simulateApiDelay();
      return { 
        data: regulatorData[0],
        success: true 
      };
    },
    getComplianceData: async () => {
      await simulateApiDelay();
      return {
        data: {
          complianceRate: 94,
          sectors: [
            { name: 'Agriculture', rate: 92, violations: 3 },
            { name: 'Manufacturing', rate: 96, violations: 1 },
            { name: 'Retail', rate: 95, violations: 2 },
            { name: 'Transport', rate: 93, violations: 2 }
          ]
        },
        success: true
      };
    },
    getHistoricalData: async () => {
      await simulateApiDelay();
      return { 
        data: historicalData.regulator,
        success: true 
      };
    }
  }
};
