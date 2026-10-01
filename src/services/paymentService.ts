/**
 * Online Payment Gateway Automation Service (Monobank, WayForPay, LiqPay, Apple Pay & Google Pay)
 */

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  provider: 'monobank' | 'wayforpay' | 'liqpay' | 'apple_pay' | 'google_pay' | 'card_3ds';
  providerName: string;
  status: 'success' | 'pending' | 'failed';
  paidAt: string;
  cardMask?: string;
  rrn?: string; // Retrieval Reference Number
}

export interface MonobankInvoiceResponse {
  invoiceId: string;
  pageUrl: string;
}

/**
 * Create an official Monobank Merchant Invoice (mono e-commerce)
 */
export async function createMonobankInvoice(
  token: string,
  orderId: string,
  amountUah: number,
  customerName: string,
  customerPhone: string,
  items: { name: string; qty: number; price: number }[],
  redirectUrl: string
): Promise<{ success: boolean; pageUrl?: string; invoiceId?: string; error?: string }> {
  if (!token || token.trim().length < 10) {
    return { success: false, error: 'Токен еквайрингу Monobank не налаштовано' };
  }

  const amountKopecks = Math.round(amountUah * 100);

  const payload = {
    amount: amountKopecks,
    ccy: 980, // UAH
    merchantPaymInfo: {
      reference: `ISKRA-${orderId}`,
      destination: `Оплата замовлення №${orderId} в магазині ISKRA (${customerName})`,
      basketOrder: items.map(item => ({
        name: item.name.slice(0, 100),
        qty: item.qty,
        sum: Math.round(item.price * 100),
        unit: 'шт.'
      }))
    },
    redirectUrl,
    validity: 3600
  };

  try {
    const res = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': token.trim()
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data: MonobankInvoiceResponse = await res.json();
      if (data.pageUrl) {
        return {
          success: true,
          pageUrl: data.pageUrl,
          invoiceId: data.invoiceId
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return { 
        success: false, 
        error: errData.errText || `Помилка створення інвойсу Monobank (код ${res.status})` 
      };
    }
  } catch (err) {
    console.warn('Monobank API call warning:', err);
  }

  return { success: false, error: 'Не вдалося з’єднатися з сервером Monobank' };
}

/**
 * Generate a unique banking transaction receipt code
 */
export function generateTransactionId(prefix: string = 'TXN'): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${datePart}-${rand}`;
}

/**
 * Format timestamp for Ukrainian banking records
 */
export function formatBankingTimestamp(): string {
  const d = new Date();
  return d.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
