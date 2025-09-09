import { User, Transaction, PaymentMethod, Customer } from "@/types";

export const users: User[] = [
  { 
    id: "u1", 
    firstName: "Alex", 
    lastName: "Morgan", 
    email: "alex@transactlab.io", 
    role: "admin",
    isVerified: true,
    isActive: true,
    businessName: "TransactLab",
    businessType: "enterprise",
    isBusinessVerified: true,
    defaultCurrency: "USD",
    supportedCurrencies: ["USD", "EUR", "GBP"],
    paymentMethods: ["card", "bank"],
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      language: "en",
      timezone: "UTC",
      currency: "USD",
      dashboardTheme: "light",
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: "u2", 
    firstName: "Taylor", 
    lastName: "Reed", 
    email: "taylor@merchant.com", 
    role: "merchant",
    isVerified: true,
    isActive: true,
    businessName: "Taylor's Store",
    businessType: "startup",
    isBusinessVerified: false,
    defaultCurrency: "USD",
    supportedCurrencies: ["USD"],
    paymentMethods: ["card"],
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: false,
      },
      language: "en",
      timezone: "America/New_York",
      currency: "USD",
      dashboardTheme: "auto",
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
];

export const customers: Customer[] = [
  { id: "c1", name: "John Carter", email: "john.carter@example.com", createdAt: new Date().toISOString() },
  { id: "c2", name: "Emma Wilson", email: "emma.wilson@example.com", createdAt: new Date().toISOString() },
  { id: "c3", name: "Liam Chen", email: "liam.chen@example.com", createdAt: new Date().toISOString() },
];

export const paymentMethods: PaymentMethod[] = [
  { id: "pm1", type: "card", label: "Visa •••• 4242", last4: "4242", provider: "Visa", isDefault: true },
  { id: "pm2", type: "bank", label: "Chase Business", provider: "ACH" },
  { id: "pm3", type: "wallet", label: "Apple Pay", provider: "Apple" },
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const currencies = ["USD", "EUR", "GBP"];
const statuses = ["pending", "completed", "failed", "refunded"] as const;

export const transactions: Transaction[] = Array.from({ length: 32 }).map((_, i) => ({
  id: `t${i + 1}`,
  date: new Date(Date.now() - i * 86400000).toISOString(),
  amount: rand(12, 1200) * 1.0,
  currency: currencies[rand(0, currencies.length - 1)],
  customerId: customers[rand(0, customers.length - 1)].id,
  methodId: paymentMethods[rand(0, paymentMethods.length - 1)].id,
  status: statuses[rand(0, statuses.length - 1)],
  reference: `INV-${1000 + i}`,
}));

export const revenueSeries = Array.from({ length: 12 }).map((_, i) => ({ name: `M${i + 1}` , value: rand(10, 120) }));
export const volumeSeries = Array.from({ length: 12 }).map((_, i) => ({ name: `M${i + 1}` , value: rand(200, 1200) }));
export const methodDistribution = [
  { name: "Cards", value: 62 },
  { name: "Bank", value: 23 },
  { name: "Wallets", value: 15 },
];
