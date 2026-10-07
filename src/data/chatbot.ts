import { Product, Shop } from './catalog';
import { shopVoucher } from './promos';

export const QUICK_REPLIES = ['Available pa po?', 'Pwede po COD?', 'Kailan po ma-ship?', 'May discount po ba?', 'Legit po ba?', 'True to size po?'];

const RULES: [RegExp, (shop: Shop) => string][] = [
  [/avail|stock|meron/i, () => 'Yes po, available pa! Check out na po bago maubos.'],
  [/cod|cash/i, () => 'Opo, pwede po ang COD. Cash on Imagination din po, tanggap namin.'],
  [/ship|deliver|dating|kailan/i, (s) => (s.location === 'Overseas' ? 'Ships within 24 hours po from our overseas warehouse, 7–12 days arrival.' : `Ships within 24 hours po from ${s.location}!`)],
  [/discount|voucher|less|tawad/i, (s) => {
    const v = shopVoucher(s);
    return `Claim our shop voucher po for ₱${v.value} off min. spend ₱${v.minSpend}. Sulit!`;
  }],
  [/legit|original|auth/i, () => '100% legit po. 100% imaginary din, pero legit!'],
  [/size|fit|sukat/i, () => 'True to size po. Check the size chart on the product page para sigurado.'],
  [/salamat|thank|ty\b/i, () => 'Walang anuman po! Happy pretend shopping!'],
  [/hi|hello|good|magandang/i, (s) => `Hello po! Welcome to ${s.name}. How can we help?`],
];

export function botReply(shop: Shop, text: string, product?: Product): string {
  if (product) return `Hi po! Yes, available pa ang ${product.name}. Order na po while the price is still low!`;
  for (const [re, reply] of RULES) if (re.test(text)) return reply(shop);
  return `Thank you for messaging ${shop.name}! A (pretend) seller will reply shortly. Anything else po?`;
}
