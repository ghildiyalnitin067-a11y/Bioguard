
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.warn('[Email] GMAIL_USER or GMAIL_APP_PASS not set — email notifications disabled.');
    return null;
  }
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS
    }
  });
  return _transporter;
}

function alertEmailHTML(alert) {
  const sev = alert.severity || 'info';
  const sevColor = sev === 'critical' ? '#ff1744' : sev === 'warning' ? '#ff9100' : '#29b6f6';
  const headline = alert.headline || `${alert.type} Alert`;
  const hindi = alert.headlineHindi || '';
  const msg = alert.villageMessage || alert.description || '';
  const solns = alert.solutions || [];
  const prev = alert.prevention || [];

  const solutiontRows = solns.map((s, i) => `
    <tr>
      <td style="padding:6px 0; color:#a5d6a7; font-size:14px; vertical-align:top;">
        <span style="display:inline-block;width:22px;height:22px;background:#4CAF5022;
          border:1px solid #4CAF5055;border-radius:50%;text-align:center;
          line-height:22px;font-weight:900;color:#4CAF50;margin-right:8px;">${i + 1}</span>
        ${s}
      </td>
    </tr>`).join('');

  const preventionRows = prev.map((p, i) => `
    <tr>
      <td style="padding:6px 0; color:#ce93d8; font-size:14px;">
        💡 ${p}
      </td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#161b22;border-radius:16px;overflow:hidden;
    border:1px solid rgba(255,255,255,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.5);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d1117,#1a1f2e);padding:28px 32px;
      border-bottom:3px solid ${sevColor};">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="background:#4CAF5020;border:1px solid #4CAF5050;border-radius:8px;
          padding:4px 14px;font-size:12px;font-weight:800;color:#4CAF50;letter-spacing:1px;">
          🌿 BIOGUARD NE INDIA
        </span>
        <span style="background:${sevColor}22;border:1px solid ${sevColor}55;border-radius:8px;
          padding:4px 14px;font-size:12px;font-weight:800;color:${sevColor};letter-spacing:1px;text-transform:uppercase;">
          ${sev}
        </span>
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:${sevColor};line-height:1.3;">
        ${headline}
      </h1>
      ${hindi ? `<p style="margin:6px 0 0;font-size:16px;color:${sevColor}bb;">${hindi}</p>` : ''}
    </div>

    <!-- Location + Time -->
    <div style="padding:18px 32px 0;display:flex;gap:20px;flex-wrap:wrap;">
      <span style="font-size:13px;color:#888;">📍 <strong style="color:#ccc;">${alert.location || 'Unknown location'}</strong></span>
      <span style="font-size:13px;color:#888;">🕐 ${new Date(alert.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
      <span style="font-size:13px;color:#888;">🏷️ ${alert.type || 'Unknown'}</span>
    </div>

    <!-- Village Message -->
    <div style="padding:20px 32px;">
      <div style="background:rgba(255,255,255,0.03);border-left:3px solid ${sevColor};
        border-radius:0 10px 10px 0;padding:16px 18px;">
        <p style="margin:0;font-size:15px;color:#c8c8c8;line-height:1.7;">${msg}</p>
      </div>
    </div>

    <!-- Solutions -->
    ${solns.length ? `
    <div style="padding:0 32px 20px;">
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#4CAF50;">
        ✅ क्या करें / What To Do
      </h3>
      <table style="width:100%;border-collapse:collapse;">${solutiontRows}</table>
    </div>` : ''}

    <!-- Prevention -->
    ${prev.length ? `
    <div style="padding:0 32px 20px;background:rgba(171,71,188,0.04);border-top:1px solid rgba(255,255,255,0.05);">
      <h3 style="margin:16px 0 12px;font-size:15px;font-weight:800;color:#ce93d8;padding-top:4px;">
        🛡️ बचाव / Prevention Tips
      </h3>
      <table style="width:100%;border-collapse:collapse;">${preventionRows}</table>
    </div>` : ''}

    <!-- Emergency Helplines -->
    <div style="padding:16px 32px;background:rgba(255,23,68,0.06);border-top:1px solid rgba(255,23,68,0.2);">
      <p style="margin:0;font-size:13px;color:#888;font-weight:600;letter-spacing:0.5px;margin-bottom:6px;">
        📞 EMERGENCY HELPLINES
      </p>
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <span style="font-size:14px;color:#ff8a80;font-weight:700;">🌲 Forest Dept: 1800-11-0027</span>
        <span style="font-size:14px;color:#ff8a80;font-weight:700;">🚑 Ambulance: 108</span>
        <span style="font-size:14px;color:#ff8a80;font-weight:700;">🔥 Fire: 101</span>
        <span style="font-size:14px;color:#ff8a80;font-weight:700;">🆘 Emergency: 112</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.05);
      background:#0d1117;text-align:center;">
      <p style="margin:0;font-size:12px;color:#444;">
        This is an automated alert from <strong style="color:#4CAF50;">BioGuard NE India</strong>.
        Visit <a href="http://localhost:5173" style="color:#4CAF50;">the dashboard</a> for full details.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function reportEmailHTML(report) {
  const urgColor = report.urgency?.includes('High') ? '#ff1744' :
  report.urgency?.includes('Medium') ? '#ff9100' : '#29b6f6';
  const typeEmoji = {
    wildlife: '🐘', deforestation: '🌳', fire: '🔥', poaching: '🎯', other: '📋'
  }[report.type] || '📋';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#161b22;border-radius:16px;overflow:hidden;
    border:1px solid rgba(255,255,255,0.08);">

    <div style="background:linear-gradient(135deg,#1a0e2e,#0d1117);padding:24px 28px;
      border-bottom:3px solid ${urgColor};">
      <span style="background:#4CAF5020;border:1px solid #4CAF5050;border-radius:8px;
        padding:3px 12px;font-size:12px;font-weight:800;color:#4CAF50;margin-bottom:10px;display:inline-block;">
        🌿 BIOGUARD — NEW COMMUNITY REPORT
      </span>
      <h1 style="margin:10px 0 0;font-size:20px;font-weight:900;color:#e0e0e0;">
        ${typeEmoji} ${report.type?.charAt(0).toUpperCase() + report.type?.slice(1) || 'Report'} — ${report.location}
      </h1>
    </div>

    <div style="padding:20px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#aaa;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">Reference</td>
          <td style="color:#81c784;font-weight:700;">#${report.refId}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Region</td>
          <td>${report.region}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Location</td>
          <td>${report.location}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Urgency</td>
          <td style="color:${urgColor};font-weight:700;">${report.urgency}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Reporter</td>
          <td>${report.anonymous ? '👤 Anonymous' : report.contactName || 'Unknown'}</td></tr>
        ${!report.anonymous && report.contactPhone ?
  `<tr><td style="padding:6px 0;color:#666;">Phone</td><td>${report.contactPhone}</td></tr>` : ''}
      </table>

      <div style="margin-top:16px;background:rgba(255,255,255,0.03);border-radius:10px;
        border-left:3px solid ${urgColor};padding:14px 16px;">
        <p style="margin:0;font-size:14px;color:#c8c8c8;line-height:1.7;">${report.description}</p>
      </div>

      <div style="margin-top:16px;padding:14px;background:rgba(250,204,21,0.06);
        border-radius:10px;border:1px solid rgba(250,204,21,0.2);">
        <p style="margin:0;font-size:13px;color:#facc15;font-weight:700;">
          ⚡ ACTION REQUIRED: Please review this report in the BioGuard dashboard
          and update its status (Reviewed / Resolved / Fake).
        </p>
      </div>
    </div>

    <div style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);background:#0d1117;text-align:center;">
      <p style="margin:0;font-size:12px;color:#444;">
        BioGuard NE India — Community Report System
      </p>
    </div>
  </div>
</body>
</html>`;
}


async function sendAlertNotification(toEmails, alert) {
  const t = getTransporter();
  if (!t || !toEmails?.length) return;

  const sev = (alert.severity || 'info').toUpperCase();
  const subject = `[BioGuard 🚨 ${sev}] ${alert.headline || alert.type + ' Alert'} — ${alert.location}`;

  try {
    await t.sendMail({
      from: `"BioGuard NE India 🌿" <${process.env.GMAIL_USER}>`,
      to: toEmails.join(', '),
      subject,
      html: alertEmailHTML(alert)
    });
    console.log(`[Email] Alert notification sent to ${toEmails.length} recipient(s).`);
  } catch (err) {
    console.error('[Email] Failed to send alert notification:', err.message);
  }
}

async function sendReportNotification(toEmails, report) {
  const t = getTransporter();
  if (!t || !toEmails?.length) return;

  const typeLabel = { wildlife: 'Wildlife Conflict', deforestation: 'Illegal Logging',
    fire: 'Forest Fire', poaching: 'Poaching', other: 'Other' }[report.type] || report.type;
  const subject = `[BioGuard 📋 NEW REPORT] ${typeLabel} — ${report.location} (#${report.refId})`;

  try {
    await t.sendMail({
      from: `"BioGuard NE India 🌿" <${process.env.GMAIL_USER}>`,
      to: toEmails.join(', '),
      subject,
      html: reportEmailHTML(report)
    });
    console.log(`[Email] Report notification sent to ${toEmails.length} recipient(s).`);
  } catch (err) {
    console.error('[Email] Failed to send report notification:', err.message);
  }
}

module.exports = { sendAlertNotification, sendReportNotification };