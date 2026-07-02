
const ICON = '/favicon.ico';

export async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function hasPermission() {
  return 'Notification' in window && Notification.permission === 'granted';
}

function show(title, options = {}) {
  if (!hasPermission()) return;
  try {
    const n = new Notification(title, {
      icon: ICON,
      badge: ICON,
      silent: false,
      ...options
    });
    setTimeout(() => n.close(), 8000);
    n.onclick = () => {window.focus();n.close();};
    return n;
  } catch (e) {
    console.warn('[BrowserNotif] Failed:', e.message);
  }
}

export function notifyAlert(alert) {
  const sev = alert.severity || 'info';
  const sevEmoji = sev === 'critical' ? '🔴' : sev === 'warning' ? '🟠' : '🔵';

  const title = `${sevEmoji} ${alert.headline || alert.type + ' Alert'} — BioGuard`;
  const solutions = (alert.solutions || []).slice(0, 2).map((s, i) => `${i + 1}. ${s}`).join('\n');
  const body = [
  `📍 ${alert.location}`,
  alert.villageMessage ? `\n${alert.villageMessage.slice(0, 120)}…` : '',
  solutions ? `\n\n✅ What to do:\n${solutions}` : ''].
  filter(Boolean).join('');

  return show(title, { body, tag: `bioguard-alert-${alert._id}` });
}

export function notifyReport(refId) {
  return show('📋 Report Submitted — BioGuard', {
    body: `Your report #${refId} has been submitted successfully.\nOur team will review it within 30 minutes.`,
    tag: `bioguard-report-${refId}`
  });
}

export function notifyNewReport(report) {
  const typeEmoji = { wildlife: '🐘', deforestation: '🌳', fire: '🔥', poaching: '🎯', other: '📋' }[report.type] || '📋';
  return show(`${typeEmoji} New Report — ${report.location}`, {
    body: `#${report.refId} · ${report.urgency?.split('—')[0]?.trim() || 'Unknown urgency'}\n${report.description?.slice(0, 100)}`,
    tag: `bioguard-new-report-${report.refId}`
  });
}

export function notifySystem(title, body) {
  return show(title, { body, tag: 'bioguard-system' });
}