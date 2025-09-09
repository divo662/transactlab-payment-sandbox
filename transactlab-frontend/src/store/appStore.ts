import { create } from "zustand";
import { customers as mockCustomers, paymentMethods as mockMethods, transactions as mockTx, users as mockUsers } from "@/data/mockData";
import type { Customer, PaymentMethod, Transaction, User } from "@/types";

interface AppState {
  theme: "light" | "dark";
  language: "en" | "es";
  currentUser: User | null;

  customers: Customer[];
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];

  toggleTheme: () => void;
  setLanguage: (lng: "en" | "es") => void;
  setCurrentUser: (user: User | null) => void;

  addTransaction: (tx: Transaction) => void;
  addCustomer: (c: Customer) => void;
  addPaymentMethod: (pm: PaymentMethod) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  language: "en",
  currentUser: mockUsers[0],

  customers: mockCustomers,
  paymentMethods: mockMethods,
  transactions: mockTx,

  toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  setLanguage: (lng) => set(() => ({ language: lng })),
  setCurrentUser: (user) => set(() => ({ currentUser: user })),

  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  addCustomer: (c) => set((s) => ({ customers: [c, ...s.customers] })),
  addPaymentMethod: (pm) => set((s) => ({ paymentMethods: [pm, ...s.paymentMethods] })),
}));
