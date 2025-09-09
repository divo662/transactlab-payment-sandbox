export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  USSD: 'ussd',
  MOBILE_MONEY: 'mobile_money',
  WALLET: 'wallet',
  CRYPTO: 'crypto'
} as const;

export const CARD_TYPES = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DISCOVER: 'discover'
} as const;

export const BANK_CODES = {
  GTB: '058',
  ZENITH: '057',
  UBA: '033',
  FIRST_BANK: '011',
  ACCESS_BANK: '044',
  FIDELITY: '070',
  STERLING: '232',
  POLARIS: '076',
  WEMA: '035',
  ECOBANK: '050',
  FCMB: '214',
  UNION_BANK: '032'
} as const;

export const MOBILE_MONEY_PROVIDERS = {
  PAGA: 'paga',
  OPAY: 'opay',
  PALMPAY: 'palmPay',
  AIRTEL_MONEY: 'airtel_money',
  MTN_MOMO: 'mtn_momo'
} as const;

export const CRYPTO_CURRENCIES = {
  BITCOIN: 'BTC',
  ETHEREUM: 'ETH',
  USDT: 'USDT',
  BNB: 'BNB'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type CardType = typeof CARD_TYPES[keyof typeof CARD_TYPES];
export type BankCode = typeof BANK_CODES[keyof typeof BANK_CODES];
export type MobileMoneyProvider = typeof MOBILE_MONEY_PROVIDERS[keyof typeof MOBILE_MONEY_PROVIDERS];
export type CryptoCurrency = typeof CRYPTO_CURRENCIES[keyof typeof CRYPTO_CURRENCIES]; 