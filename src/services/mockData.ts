// Mock database with localStorage persistence
const STORAGE_KEYS = {
  SHOPS: 'barberqueue_shops',
  QUEUES: 'barberqueue_queues',
  SERVICES: 'barberqueue_services',
  SHOP_SERVICES: 'barberqueue_shop_services',
  QUEUE_SERVICES: 'barberqueue_queue_services',
  USERS: 'barberqueue_users',
  SHOP_OWNERS: 'barberqueue_shop_owners',
};

// Helper functions
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Generate UUID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initialize default data
const initializeData = () => {
  // Default services
  const defaultServices = [
    { id: 's1', name: 'Classic Haircut', duration: 30, price: 25, description: 'Traditional haircut with scissors', is_custom: false, shop_id: null },
    { id: 's2', name: 'Beard Trim', duration: 15, price: 15, description: 'Professional beard trimming and shaping', is_custom: false, shop_id: null },
    { id: 's3', name: 'Hot Towel Shave', duration: 45, price: 35, description: 'Luxurious hot towel shave experience', is_custom: false, shop_id: null },
    { id: 's4', name: 'Hair Color', duration: 60, price: 50, description: 'Professional hair coloring', is_custom: false, shop_id: null },
    { id: 's5', name: 'Deluxe Package', duration: 90, price: 70, description: 'Haircut, beard trim, and hot towel shave', is_custom: false, shop_id: null },
  ];

  // Default shop
  const defaultShop = {
    id: 'shop1',
    name: 'Classic Cuts Barbershop',
    address: '123 Main Street, Downtown',
    rating: 4.5,
    qr_code: 'SHOP_DEMO_QR123',
    image: '/placeholder.svg',
    phone: '(555) 123-4567',
    description: 'Your neighborhood barbershop for classic cuts and modern styles',
    latitude: 40.7128,
    longitude: -74.0060,
    distance: 0.5,
    current_queue: 0,
    estimated_wait: 0,
    opening_hours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 5:00 PM',
      sunday: 'Closed'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Default users
  const defaultUsers = [
    { id: 'user1', email: 'shop@demo.com', role: 'shop_owner', name: 'Shop Owner' },
    { id: 'user2', email: 'customer@demo.com', role: 'customer', name: 'John Customer' },
  ];

  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    saveToStorage(STORAGE_KEYS.SERVICES, defaultServices);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHOPS)) {
    saveToStorage(STORAGE_KEYS.SHOPS, [defaultShop]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHOP_OWNERS)) {
    saveToStorage(STORAGE_KEYS.SHOP_OWNERS, [{ id: 'so1', user_id: 'user1', shop_id: 'shop1' }]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SHOP_SERVICES)) {
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, [
      { id: 'ss1', shop_id: 'shop1', service_id: 's1', custom_price: null, custom_duration: null },
      { id: 'ss2', shop_id: 'shop1', service_id: 's2', custom_price: null, custom_duration: null },
      { id: 'ss3', shop_id: 'shop1', service_id: 's3', custom_price: null, custom_duration: null },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUEUES)) {
    saveToStorage(STORAGE_KEYS.QUEUES, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUEUE_SERVICES)) {
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
  }
};

// Initialize on import
initializeData();

export const mockDb = {
  // Shops
  getShops: () => getFromStorage(STORAGE_KEYS.SHOPS, []),
  getShop: (id: string) => getFromStorage(STORAGE_KEYS.SHOPS, []).find((s: any) => s.id === id),
  getShopByQR: (qrCode: string) => getFromStorage(STORAGE_KEYS.SHOPS, []).find((s: any) => s.qr_code === qrCode),
  updateShop: (id: string, updates: any) => {
    const shops = getFromStorage(STORAGE_KEYS.SHOPS, []);
    const index = shops.findIndex((s: any) => s.id === id);
    if (index !== -1) {
      shops[index] = { ...shops[index], ...updates, updated_at: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.SHOPS, shops);
    }
    return shops[index];
  },
  createShop: (shop: any) => {
    const shops = getFromStorage(STORAGE_KEYS.SHOPS, []);
    const newShop = { ...shop, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    shops.push(newShop);
    saveToStorage(STORAGE_KEYS.SHOPS, shops);
    return newShop;
  },

  // Services
  getServices: () => getFromStorage(STORAGE_KEYS.SERVICES, []),
  getService: (id: string) => getFromStorage(STORAGE_KEYS.SERVICES, []).find((s: any) => s.id === id),
  createService: (service: any) => {
    const services = getFromStorage(STORAGE_KEYS.SERVICES, []);
    const newService = { ...service, id: generateId() };
    services.push(newService);
    saveToStorage(STORAGE_KEYS.SERVICES, services);
    return newService;
  },
  deleteService: (id: string) => {
    const services = getFromStorage(STORAGE_KEYS.SERVICES, []);
    const filtered = services.filter((s: any) => s.id !== id);
    saveToStorage(STORAGE_KEYS.SERVICES, filtered);
  },

  // Shop Services
  getShopServices: () => getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []),
  getShopServicesForShop: (shopId: string) => 
    getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []).filter((ss: any) => ss.shop_id === shopId),
  addShopService: (shopService: any) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const newShopService = { ...shopService, id: generateId() };
    shopServices.push(newShopService);
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, shopServices);
    return newShopService;
  },
  updateShopService: (id: string, updates: any) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const index = shopServices.findIndex((ss: any) => ss.id === id);
    if (index !== -1) {
      shopServices[index] = { ...shopServices[index], ...updates };
      saveToStorage(STORAGE_KEYS.SHOP_SERVICES, shopServices);
    }
    return shopServices[index];
  },
  deleteShopService: (shopId: string, serviceId: string) => {
    const shopServices = getFromStorage(STORAGE_KEYS.SHOP_SERVICES, []);
    const filtered = shopServices.filter((ss: any) => !(ss.shop_id === shopId && ss.service_id === serviceId));
    saveToStorage(STORAGE_KEYS.SHOP_SERVICES, filtered);
  },

  // Queues
  getQueues: () => getFromStorage(STORAGE_KEYS.QUEUES, []),
  getQueue: (id: string) => getFromStorage(STORAGE_KEYS.QUEUES, []).find((q: any) => q.id === id),
  getQueuesByShop: (shopId: string) => 
    getFromStorage(STORAGE_KEYS.QUEUES, []).filter((q: any) => q.shop_id === shopId),
  getActiveQueue: (customerName: string) =>
    getFromStorage(STORAGE_KEYS.QUEUES, []).find((q: any) => 
      q.customer_name === customerName && ['waiting', 'in_progress'].includes(q.status)
    ),
  createQueue: (queue: any) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const newQueue = { 
      ...queue, 
      id: generateId(), 
      joined_at: new Date().toISOString(),
      status: 'waiting'
    };
    queues.push(newQueue);
    saveToStorage(STORAGE_KEYS.QUEUES, queues);
    return newQueue;
  },
  updateQueue: (id: string, updates: any) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const index = queues.findIndex((q: any) => q.id === id);
    if (index !== -1) {
      queues[index] = { ...queues[index], ...updates };
      saveToStorage(STORAGE_KEYS.QUEUES, queues);
    }
    return queues[index];
  },
  deleteQueue: (id: string) => {
    const queues = getFromStorage(STORAGE_KEYS.QUEUES, []);
    const filtered = queues.filter((q: any) => q.id !== id);
    saveToStorage(STORAGE_KEYS.QUEUES, filtered);
  },

  // Queue Services
  getQueueServices: () => getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []),
  getQueueServicesForQueue: (queueId: string) =>
    getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []).filter((qs: any) => qs.queue_id === queueId),
  addQueueServices: (queueServices: any[]) => {
    const current = getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
    const newServices = queueServices.map(qs => ({ ...qs, id: generateId() }));
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, [...current, ...newServices]);
    return newServices;
  },
  deleteQueueServicesForQueue: (queueId: string) => {
    const queueServices = getFromStorage(STORAGE_KEYS.QUEUE_SERVICES, []);
    const filtered = queueServices.filter((qs: any) => qs.queue_id !== queueId);
    saveToStorage(STORAGE_KEYS.QUEUE_SERVICES, filtered);
  },

  // Users
  getUsers: () => getFromStorage(STORAGE_KEYS.USERS, []),
  getUser: (id: string) => getFromStorage(STORAGE_KEYS.USERS, []).find((u: any) => u.id === id),
  getUserByEmail: (email: string) => getFromStorage(STORAGE_KEYS.USERS, []).find((u: any) => u.email === email),
  createUser: (user: any) => {
    const users = getFromStorage(STORAGE_KEYS.USERS, []);
    const newUser = { ...user, id: generateId() };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  // Shop Owners
  getShopOwners: () => getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []),
  getShopOwnerByUser: (userId: string) => 
    getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []).find((so: any) => so.user_id === userId),
  createShopOwner: (shopOwner: any) => {
    const shopOwners = getFromStorage(STORAGE_KEYS.SHOP_OWNERS, []);
    const newShopOwner = { ...shopOwner, id: generateId() };
    shopOwners.push(newShopOwner);
    saveToStorage(STORAGE_KEYS.SHOP_OWNERS, shopOwners);
    return newShopOwner;
  },
};
