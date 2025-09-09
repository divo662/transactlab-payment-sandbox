import axios from 'axios';

type RatesMap = Record<string, number>;

// In-memory cached FX rates with 24h TTL. Base: NGN = 1
let cachedAt = 0;
let rates: RatesMap = {
  NGN: 1,
  USD: 1333,     // 1 USD = 1,333 NGN
  EUR: 1449,     // 1 EUR = 1,449 NGN  
  GBP: 1695,     // 1 GBP = 1,695 NGN
  KES: 8.6,      // 1 KES = 8.6 NGN
  GHS: 100,      // 1 GHS = 100 NGN
};

const ONE_DAY = 24 * 60 * 60 * 1000;

export async function refreshRatesIfNeeded(): Promise<RatesMap> {
  const now = Date.now();
  if (now - cachedAt < ONE_DAY) return rates;
  try {
    // Placeholder: pull from a free source if configured; else retain defaults
    // Example: const { data } = await axios.get(process.env.FXRATES_URL!)
    // Map to our base (NGN) if needed. For now, keep defaults.
    cachedAt = now;
    return rates;
  } catch (_) {
    cachedAt = now;
    return rates;
  }
}

export function convertAmount(amount: number, from: string, to: string): number {
  if (!amount) return 0;
  if (from === to) return amount;
  
  // Convert to NGN first
  let inNgn: number;
  if (from === 'NGN') {
    inNgn = amount;
  } else {
    const fromRate = rates[from] ?? 1;
    inNgn = amount * fromRate; // multiply by rate to get NGN
  }
  
  // Convert from NGN to target currency
  if (to === 'NGN') {
    return inNgn;
  } else {
    const toRate = rates[to] ?? 1;
    return inNgn / toRate; // divide by rate to get target currency
  }
}

export function setRates(custom: RatesMap) {
  rates = { ...rates, ...custom };
  cachedAt = Date.now();
}

export function getRates(): RatesMap {
  return { ...rates };
}


