export type ProductBadge = 'Хіт продажу' | 'Акція' | 'Новинка' | '';

export interface Product {
  id: string;
  name: string;
  category: string;
  mainCategory?: string;
  subCategory?: string;
  badge: ProductBadge;
  sku: string;
  stock: number;
  price: number;
  unit: string;
  desc: string;
  image: string;
  brand?: string;
  specs?: Record<string, string>;
}

export type CategoryTree = {
  [mainCat: string]: {
    _leaves?: string[];
    [subCat: string]: any;
  };
};

export interface CartItem extends Product {
  qty: number;
}

export type OrderStatus = 'Створено' | 'Оплачено' | 'Збирається' | 'Відправлено' | 'Доставлено';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  unit: string;
  sku?: string;
  image?: string;
}

export interface Order {
  id: string;
  fio: string;
  phone: string;
  delivery: string;
  city: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: OrderStatus;
  ttn?: string;
  paymentMethod?: 'cash_on_delivery' | 'card_online' | 'bank_invoice';
  isPaid?: boolean;
  paidAt?: string;
  paymentTransactionId?: string;
  paymentProvider?: string;
  notes?: string;
}

export interface ClientData {
  name: string;
  balance: number;
  discount: number;
  city?: string;
  notes?: string;
}

export interface WeeklyDealConfig {
  enabled: boolean;
  title: string;
  badgeText: string;
  subtitle: string;
  productId: string;
  discountPercent: number;
  customPrice?: number;
  endDateText?: string;
  endTimestamp?: number;
}

export interface SiteFeatures {
  ordersEnabled: boolean;
  loyaltyEnabled: boolean;
  showExactStock: boolean;
  floatingCallBtn: boolean;
  minOrderSum: number;
  freeShippingThreshold: number;
  weeklyDealEnabled?: boolean;
  lowStockThreshold?: number;
  lowStockTelegramNotify?: boolean;
  showLowStockBadgeToBuyers?: boolean;
}

export interface SiteSettings {
  phone: string;
  viber: string;
  telegram: string;
  callbackText: string;
  botToken: string;
  chatId: string;
  city: string;
  address: string;
  workHours: string;
  adminPassword?: string;
  novaPoshtaApiKey?: string;
  ukrposhtaToken?: string;
  // Online Payment Gateways (WayForPay, Monobank, LiqPay)
  paymentGateway?: 'wayforpay' | 'monobank' | 'liqpay' | 'manual';
  paymentMerchantId?: string;
  paymentSecretKey?: string;
  monobankToken?: string;
  companyName?: string;
  companyEdrpou?: string;
  companyIban?: string;
  companyBank?: string;
  features: SiteFeatures;
}

export interface ProductReview {
  id: string;
  productId?: string;
  author: string;
  city?: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  recommended: boolean;
  helpfulCount: number;
}

export interface HeaderDesign {
  bgColor: string;
  logoBadge: string;
  logoText: string;
  promoActive: boolean;
  promoText: string;
  heroBadge: string;
  heroTitle: string;
  heroDesc: string;
  heroAddress: string;
  heroCity: string;
}

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  enabled: boolean;
  autoSync: boolean;
}
