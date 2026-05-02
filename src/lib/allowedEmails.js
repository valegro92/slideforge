/**
 * SlideForge — Whitelist degli utenti autorizzati
 *
 * I pagamenti sono gestiti esternamente tramite Officina.
 * Solo le email presenti in questa lista possono accedere all'app.
 *
 * Tutte le email vengono assegnate al tier `pro` di default.
 * Per cambiare il tier di un utente, modificare la mappa qui sotto.
 */

/**
 * Mappa email → tier ('pro' | 'enterprise').
 * Le chiavi DEVONO essere in lowercase.
 */
export const ALLOWED_EMAILS = {
  'francesca.gaudino@bakermckenzie.com': 'pro',
  'fscm.saiani@gmail.com': 'pro',
  'g.ambrosino@demetraform.it': 'pro',
  'armando.delucia@crmpartners.it': 'pro',
  'gianlucascarpellini@gmail.com': 'pro',
  'stefferri@icloud.com': 'pro',
  'l-albertini@bluewin.ch': 'pro',
  'lorenzo.gant@gmail.com': 'pro',
  'valegro92@gmail.com': 'enterprise',
};

/**
 * Verifica se un'email è autorizzata e restituisce il tier.
 *
 * @param {string} email
 * @returns {{ authorized: boolean, tier: string, email?: string }}
 */
export function checkAllowedEmail(email) {
  const normalized = String(email || '').toLowerCase().trim();
  const tier = ALLOWED_EMAILS[normalized];

  if (tier) {
    return { authorized: true, tier, email: normalized };
  }

  return { authorized: false, tier: 'free' };
}
