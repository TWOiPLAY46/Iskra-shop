/**
 * Robust Telegram Bot notification helper with CORS proxy fallback
 */
export async function sendTelegramAlert(botToken: string, chatId: string, text: string): Promise<boolean> {
  if (!botToken || !chatId) return false;
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();
  const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
  const payload = {
    chat_id: cleanChatId,
    text
  };

  // 1. Try via CORS proxy (browsers block direct fetch to api.telegram.org due to CORS headers)
  try {
    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.ok) return true;
    }
  } catch (err) {
    // Proxy attempt failed, trying direct fallback
  }

  // 2. Direct fetch fallback
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.ok) return true;
    }
  } catch (err) {
    console.warn('Telegram direct send error:', err);
  }

  return false;
}
