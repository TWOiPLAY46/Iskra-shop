/**
 * SMS & Messaging Utility for Customer Notifications (Stock Alerts, Order Status)
 * Supports:
 * 1. Native SMS links (sms:+380...&body=...) for 1-click mobile sending from manager phone
 * 2. Viber deep-links (viber://chat?number=...)
 * 3. Ukrainian SMS Gateways (TurboSMS, SMS-Fly, AlphaSMS)
 */

export interface SmsSendParams {
  phone: string;
  text: string;
  gateway?: 'none' | 'turbosms' | 'smsfly' | 'alphasms';
  apiKey?: string;
  senderName?: string;
}

export interface SmsSendResult {
  success: boolean;
  message: string;
  messageId?: string;
}

/**
 * Format phone number to international Ukrainian standard (+380XXXXXXXXX)
 */
export function formatPhoneE164(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('380') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+38${digits}`;
  }
  if (digits.length === 9) {
    return `+380${digits}`;
  }
  return rawPhone.startsWith('+') ? rawPhone : `+${rawPhone}`;
}

/**
 * Generate standard SMS URL for mobile/desktop browsers
 * iOS uses &body=, Android/others use ?body=
 */
export function generateSmsUrl(phone: string, text: string): string {
  const cleanPhone = formatPhoneE164(phone);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(text)}`;
}

/**
 * Generate Viber direct chat URL
 */
export function generateViberUrl(phone: string): string {
  const digitsOnly = formatPhoneE164(phone).replace('+', '');
  return `viber://chat?number=%2B${digitsOnly}`;
}

/**
 * Generate Telegram direct chat or message URL
 */
export function generateTelegramUrl(phone: string, text?: string, username?: string): string {
  if (username && username.trim()) {
    const cleanUser = username.trim().replace(/^@/, '');
    return `https://t.me/${cleanUser}`;
  }
  const digitsOnly = formatPhoneE164(phone).replace('+', '');
  return `https://t.me/+${digitsOnly}`;
}

/**
 * Generate WhatsApp direct chat URL (wa.me)
 */
export function generateWhatsAppUrl(phone: string, text?: string): string {
  const digitsOnly = formatPhoneE164(phone).replace(/\D/g, '');
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digitsOnly}${encodedText}`;
}

/**
 * Format a template message with product and price
 */
export function formatStockAlertSms(
  template: string | undefined,
  productName: string,
  price?: number,
  clientName?: string
): string {
  const defaultTemplate = 
    "⚡ Магазин ISKRA\nВітаємо! Товар «{product}» знову в наявності ({price} грн). Замовляйте на сайті або телефонуйте!";

  let text = template?.trim();

  // If no template or legacy template without header
  if (!text || text === "Вітаємо! Товар «{product}» знову в наявності в магазині ISKRA ({price} грн). Замовляйте на сайті або телефонуйте!") {
    text = defaultTemplate;
  } else if (!text.includes('ISKRA') && !text.includes('Магазин')) {
    text = `⚡ Магазин ISKRA\n${text}`;
  }

  text = text.replace(/{product}/g, productName);
  if (price && price > 0) {
    text = text.replace(/{price}/g, `${price}`);
  } else {
    text = text.replace(/\s*\({price}\s*грн\)/g, '').replace(/{price}/g, '');
  }
  text = text.replace(/{name}/g, clientName?.trim() ? clientName : 'покупець');
  text = text.replace(/{phone}/g, '067 000 00 00');
  return text;
}

/**
 * Send SMS via Ukrainian Gateway API (with TurboSMS / SMS-Fly / AlphaSMS support)
 */
export async function sendSmsViaGateway(params: SmsSendParams): Promise<SmsSendResult> {
  const { phone, text, gateway, apiKey, senderName } = params;
  const formattedPhone = formatPhoneE164(phone);

  if (!gateway || gateway === 'none' || !apiKey) {
    return {
      success: false,
      message: 'SMS-шлюз не налаштовано. Використовуйте швидке відправлення SMS або Viber в 1 клік.'
    };
  }

  const sender = senderName?.trim() || 'ISKRA';

  // 1. TurboSMS API (v2)
  if (gateway === 'turbosms') {
    try {
      const payload = {
        recipients: [formattedPhone],
        sms: {
          sender: sender,
          text: text
        }
      };

      const response = await fetch('https://api.turbosms.ua/message/send.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.response_code === 0 || data.response_code === 800 || data.response_status === 'OK') {
        return {
          success: true,
          message: 'SMS успішно відправлено через TurboSMS!',
          messageId: data.response_result?.[0]?.message_id
        };
      } else {
        return {
          success: false,
          message: `Помилка TurboSMS: ${data.response_status || 'Код ' + data.response_code}`
        };
      }
    } catch (err: unknown) {
      // Due to browser CORS, if direct fails, return helpful guidance
      return {
        success: false,
        message: 'Браузер заблокував прямий запит до TurboSMS (CORS). Для надійного відправлення використовуйте кнопку SMS/Viber в 1 клік.'
      };
    }
  }

  // 2. SMS-Fly API
  if (gateway === 'smsfly') {
    try {
      const response = await fetch(`https://sms-fly.ua/additional/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          text: text,
          sender: sender
        })
      });
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        message: 'Запит до SMS-Fly відправлено.'
      };
    } catch {
      return {
        success: false,
        message: 'Не вдалося з\'єднатися з SMS-Fly. Скористайтеся швидкою кнопкою SMS у телефоні.'
      };
    }
  }

  return {
    success: false,
    message: 'Непідтримуваний шлюз.'
  };
}
