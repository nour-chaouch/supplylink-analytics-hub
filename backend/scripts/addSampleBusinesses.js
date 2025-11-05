const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/businesses';

const sampleBusinesses = [
  {
    name: "Green Valley Organic Farms",
    category: "Agriculture",
    industry: "Organic Farming",
    description: "Leading producer of organic vegetables and fruits, serving the local community with fresh, sustainably grown produce.",
    website: "https://greenvalleyorganic.com",
    email: "contact@greenvalleyorganic.com",
    phone: "+1-555-0101",
    address: {
      street: "123 Farm Road",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      country: "USA"
    },
    tags: ["organic", "sustainable", "local", "fresh"],
    products: ["vegetables", "fruits", "organic produce", "CSA boxes"],
    services: ["farm tours", "wholesale", "farmers market", "delivery"],
    employees: 25,
    yearFounded: 2010,
    revenue: 1500000,
    rating: 4.8,
    socialMedia: {
      facebook: "greenvalleyorganic",
      twitter: "@greenvalley",
      instagram: "@greenvalleyorganic"
    },
    verified: true,
    featured: true
  },
  {
    name: "AgriTech Solutions Inc",
    category: "Technology",
    industry: "Agricultural Technology",
    description: "Innovative agricultural technology company providing IoT sensors, precision agriculture tools, and farm management software.",
    website: "https://agritechsolutions.com",
    email: "info@agritechsolutions.com",
    phone: "+1-555-0202",
    address: {
      street: "456 Tech Boulevard",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA"
    },
    tags: ["agricultural technology", "IoT", "precision agriculture", "software"],
    products: ["sensors", "farm management software", "IoT devices", "analytics platform"],
    services: ["consulting", "implementation", "support", "training"],
    employees: 150,
    yearFounded: 2015,
    revenue: 12000000,
    rating: 4.9,
    socialMedia: {
      linkedin: "agritechsolutions",
      twitter: "@AgriTechSol"
    },
    verified: true,
    featured: true
  },
  {
    name: "Rural Supply Co.",
    category: "Retail",
    industry: "Agricultural Supplies",
    description: "Your one-stop shop for agricultural supplies, equipment, seeds, and fertilizers. Serving farmers for over 30 years.",
    website: "https://ruralsupply.com",
    email: "sales@ruralsupply.com",
    phone: "+1-555-0303",
    address: {
      street: "789 Main Street",
      city: "Des Moines",
      state: "IA",
      zipCode: "50301",
      country: "USA"
    },
    tags: ["agricultural supplies", "farm equipment", "seeds", "fertilizers"],
    products: ["farming equipment", "seeds", "fertilizers", "tools", "livestock feed"],
    services: ["equipment repair", "delivery", "consulting", "rental"],
    employees: 45,
    yearFounded: 1992,
    revenue: 3500000,
    rating: 4.6,
    socialMedia: {
      facebook: "ruralsupply",
      twitter: "@RuralSupply"
    },
    verified: true,
    featured: false
  },
  {
    name: "Pure Honey Apiaries",
    category: "Agriculture",
    industry: "Beekeeping",
    description: "Family-owned beekeeping business producing premium raw honey, beeswax, and related bee products. Helping save the bees!",
    website: "https://purehoneyapiaries.com",
    email: "hello@purehoneyapiaries.com",
    phone: "+1-555-0404",
    address: {
      street: "321 Country Road",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "USA"
    },
    tags: ["honey", "beekeeping", "raw honey", "beeswax", "sustainable"],
    products: ["raw honey", "beeswax", "pollen", "propolis", "honey comb"],
    services: ["bee tours", "pollination services", "educational workshops"],
    employees: 8,
    yearFounded: 2008,
    revenue: 250000,
    rating: 4.9,
    socialMedia: {
      instagram: "@purehoney",
      facebook: "purehoneyapiaries"
    },
    verified: true,
    featured: false
  },
  {
    name: "Sustainable Seed Company",
    category: "Agriculture",
    industry: "Seed Production",
    description: "Producer of open-pollinated and heirloom seeds. Empowering farmers with sustainable, non-GMO seed varieties.",
    website: "https://sustainableseeds.com",
    email: "info@sustainableseeds.com",
    phone: "+1-555-0505",
    address: {
      street: "567 Seed Avenue",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      country: "USA"
    },
    tags: ["seeds", "heirloom", "non-GMO", "open-pollinated", "sustainable"],
    products: ["vegetable seeds", "flower seeds", "heirloom varieties", "organic seeds"],
    services: ["seed saving workshops", "consulting", "custom seed production"],
    employees: 15,
    yearFounded: 2005,
    revenue: 800000,
    rating: 4.7,
    socialMedia: {
      twitter: "@SustainableSeeds",
      instagram: "@sustainableseeds"
    },
    verified: true,
    featured: false
  },
  {
    name: "Farm Fresh Delivery",
    category: "Logistics",
    industry: "Food Delivery",
    description: "Connecting local farmers with consumers through convenient home delivery service. Fresh produce delivered to your door.",
    website: "https://farmfreshdelivery.com",
    email: "orders@farmfreshdelivery.com",
    phone: "+1-555-0606",
    address: {
      street: "890 Distribution Way",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      country: "USA"
    },
    tags: ["delivery", "local food", "fresh produce", "convenience"],
    products: ["vegetables", "fruits", "dairy", "meat", "grocery items"],
    services: ["home delivery", "subscription boxes", "gift baskets", "corporate programs"],
    employees: 60,
    yearFounded: 2018,
    revenue: 4200000,
    rating: 4.5,
    socialMedia: {
      instagram: "@farmfreshdelivery",
      facebook: "farmfreshdelivery"
    },
    verified: true,
    featured: false
  },
  {
    name: "Livestock Management Systems",
    category: "Technology",
    industry: "Livestock Technology",
    description: "Advanced livestock tracking and management solutions. RFID tags, mobile apps, and comprehensive herd management platform.",
    website: "https://livestockmgmt.com",
    email: "support@livestockmgmt.com",
    phone: "+1-555-0707",
    address: {
      street: "234 Innovation Drive",
      city: "Kansas City",
      state: "MO",
      zipCode: "64101",
      country: "USA"
    },
    tags: ["livestock", "RFID", "management software", "tracking", "veterinary"],
    products: ["RFID tags", "tracking systems", "mobile apps", "management software"],
    services: ["consulting", "training", "support", "custom solutions"],
    employees: 85,
    yearFounded: 2012,
    revenue: 9500000,
    rating: 4.6,
    socialMedia: {
      linkedin: "livestock-management-systems",
      twitter: "@LivestockMGMT"
    },
    verified: true,
    featured: false
  },
  {
    name: "Agricultural Consulting Group",
    category: "Consulting",
    industry: "Agricultural Consulting",
    description: "Expert agricultural consultants helping farmers optimize yields, reduce costs, and implement sustainable practices.",
    website: "https://agconsultinggroup.com",
    email: "consulting@agcg.com",
    phone: "+1-555-0808",
    address: {
      street: "678 Consultant Lane",
      city: "Minneapolis",
      state: "MN",
      zipCode: "55401",
      country: "USA"
    },
    tags: ["consulting", "optimization", "sustainability", "crop management"],
    products: ["consultation reports", "farm plans", "soil analysis", "custom recommendations"],
    services: ["farm consulting", "soil testing", "crop planning", "yield optimization"],
    employees: 30,
    yearFounded: 2000,
    revenue: 2800000,
    rating: 4.8,
    socialMedia: {
      linkedin: "agricultural-consulting-group",
      facebook: "agriculturalconsultinggroup"
    },
    verified: true,
    featured: false
  },
  {
    name: "Heritage Grain Mill",
    category: "Processing",
    industry: "Grain Processing",
    description: "Traditional stone-ground flour milling. Preserving heritage grains and providing local communities with fresh, nutritious flour.",
    website: "https://heritagegrainmill.com",
    email: "info@heritagegrainmill.com",
    phone: "+1-555-0909",
    address: {
      street: "456 Mill Street",
      city: "Amherst",
      state: "MA",
      zipCode: "01002",
      country: "USA"
    },
    tags: ["flour", "grain processing", "heritage grains", "stone-ground", "organic"],
    products: ["flour", "organic flour", "heritage grains", "baking supplies"],
    services: ["custom milling", "grain processing", "wholesale"],
    employees: 12,
    yearFounded: 1995,
    revenue: 650000,
    rating: 4.7,
    socialMedia: {
      instagram: "@heritagegrainmill",
      facebook: "heritagegrainmill"
    },
    verified: true,
    featured: false
  },
  {
    name: "Urban Farm Co-op",
    category: "Agriculture",
    industry: "Urban Farming",
    description: "Community-owned urban farming cooperative. Growing fresh produce in the heart of the city using vertical farming techniques.",
    website: "https://urbanfarmcoop.org",
    email: "join@urbanfarmcoop.org",
    phone: "+1-555-1010",
    address: {
      street: "789 Urban Way",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "USA"
    },
    tags: ["urban farming", "vertical farming", "community", "sustainable", "local"],
    products: ["leafy greens", "herbs", "microgreens", "salad mixes"],
    services: ["community membership", "educational programs", "volunteer opportunities"],
    employees: 6,
    yearFounded: 2016,
    revenue: 180000,
    rating: 4.6,
    socialMedia: {
      instagram: "@urbanfarmcoop",
      twitter: "@UrbanFarmCoop"
    },
    verified: true,
    featured: false
  }
];

async function addBusinesses() {
  console.log('Adding sample businesses to the directory...\n');
  
  try {
    // Add all businesses
    const response = await axios.post(`${API_BASE}/bulk`, sampleBusinesses);
    
    if (response.data.success) {
      console.log('✅ Successfully added all businesses!');
      console.log(`📊 ${response.data.message}\n`);
    } else {
      console.log('⚠️  Some businesses may not have been added');
      console.log(response.data.message);
    }
    
    // Get all businesses to verify
    console.log('Verifying businesses were added...');
    const verifyResponse = await axios.get(`${API_BASE}`);
    
    if (verifyResponse.data.success) {
      console.log(`✅ Total businesses in directory: ${verifyResponse.data.pagination.total}`);
      console.log('\nBusinesses added:');
      verifyResponse.data.data.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} - ${business.category}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error adding businesses:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

addBusinesses();









