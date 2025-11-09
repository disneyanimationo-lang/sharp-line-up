// Mock data
const mockShops = [
  {
    id: '1',
    name: 'Classic Cuts Barbershop',
    address: '123 Main St, Downtown',
    rating: 4.8,
    distance: 0.5,
    currentQueue: 5,
    estimatedWait: 45,
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
    qrCode: 'SHOP001',
    services: ['1', '2', '3', '4']
  },
  {
    id: '2',
    name: 'Modern Gentleman Barbers',
    address: '456 Oak Ave, Midtown',
    rating: 4.9,
    distance: 1.2,
    currentQueue: 3,
    estimatedWait: 30,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
    qrCode: 'SHOP002',
    services: ['1', '2', '3', '5']
  },
  {
    id: '3',
    name: 'The Blade & Brush',
    address: '789 Elm St, Uptown',
    rating: 4.7,
    distance: 2.1,
    currentQueue: 7,
    estimatedWait: 60,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
    qrCode: 'SHOP003',
    services: ['1', '2', '3', '4', '5']
  },
  {
    id: '4',
    name: 'Vintage Barber Co.',
    address: '321 Pine Rd, East Side',
    rating: 4.6,
    distance: 3.0,
    currentQueue: 2,
    estimatedWait: 20,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
    qrCode: 'SHOP004',
    services: ['1', '2', '3']
  }
];

const mockServices = [
  {
    id: '1',
    name: 'Classic Haircut',
    duration: 30,
    price: 25,
    description: 'Traditional haircut with scissors and clippers'
  },
  {
    id: '2',
    name: 'Beard Trim & Shape',
    duration: 20,
    price: 15,
    description: 'Professional beard trimming and shaping'
  },
  {
    id: '3',
    name: 'Hot Towel Shave',
    duration: 25,
    price: 30,
    description: 'Luxurious hot towel straight razor shave'
  },
  {
    id: '4',
    name: 'Haircut & Beard Combo',
    duration: 45,
    price: 35,
    description: 'Complete grooming package'
  },
  {
    id: '5',
    name: 'Kids Haircut',
    duration: 20,
    price: 18,
    description: 'Haircut for children under 12'
  }
];

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Get all shops
  getShops: async (searchQuery = '') => {
    await delay();
    const filtered = searchQuery
      ? mockShops.filter(shop => 
          shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : mockShops;
    return { data: filtered, error: null };
  },

  // Get shop by ID
  getShop: async (shopId) => {
    await delay();
    const shop = mockShops.find(s => s.id === shopId);
    return shop 
      ? { data: shop, error: null }
      : { data: null, error: 'Shop not found' };
  },

  // Get shop by QR code
  getShopByQR: async (qrCode) => {
    await delay();
    const shop = mockShops.find(s => s.qrCode === qrCode);
    return shop
      ? { data: shop, error: null }
      : { data: null, error: 'Invalid QR code' };
  },

  // Get services for a shop
  getShopServices: async (shopId) => {
    await delay();
    const shop = mockShops.find(s => s.id === shopId);
    if (!shop) return { data: [], error: 'Shop not found' };
    
    const services = mockServices.filter(service => 
      shop.services.includes(service.id)
    );
    return { data: services, error: null };
  },

  // Join queue
  joinQueue: async (shopId, serviceId, customerName) => {
    await delay(800);
    const shop = mockShops.find(s => s.id === shopId);
    const service = mockServices.find(s => s.id === serviceId);
    
    if (!shop || !service) {
      return { data: null, error: 'Invalid shop or service' };
    }

    // Generate mock queue entry
    const queueEntry = {
      id: `Q${Date.now()}`,
      shopId,
      shopName: shop.name,
      serviceId,
      serviceName: service.name,
      customerName,
      position: shop.currentQueue + 1,
      estimatedWait: (shop.currentQueue + 1) * service.duration,
      joinedAt: new Date().toISOString(),
      status: 'waiting'
    };

    return { data: queueEntry, error: null };
  },

  // Get queue status
  getQueueStatus: async (queueId) => {
    await delay();
    // In a real API, this would fetch the actual queue position
    // For mock, we'll return a simulated update
    return {
      data: {
        id: queueId,
        position: Math.max(1, Math.floor(Math.random() * 5)),
        estimatedWait: Math.floor(Math.random() * 40) + 10,
        status: 'waiting'
      },
      error: null
    };
  },

  // Cancel queue entry
  cancelQueue: async (queueId) => {
    await delay();
    return { data: { success: true }, error: null };
  },

  // Get all services
  getAllServices: async () => {
    await delay();
    return { data: mockServices, error: null };
  }
};
