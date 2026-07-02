








import React, { useState, useCallback, useEffect } from 'react';
import { registerToastFn } from './NotificationManager';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";


const SEV_COLOR = {
  critical: '#ff1744',
  high: '#ff6d00',
  warning: '#ff9100',
  medium: '#ffc107',
  low: '#4caf50',
  info: '#29b6f6'
};


const URGENCY_COLOR = {
  critical: '#ff1744',
  high: '#ff6d00',
  medium: '#ffc107',
  low: '#66bb6a'
};

function getReportColor(urgency = '') {
  return URGENCY_COLOR[urgency?.toLowerCase()] || '#43a047';
}




function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    _jsxDEV("div", {
      onClick: onClose,
      style: {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'lbFadeIn 0.2s ease',
        cursor: 'zoom-out'
      }, children: [

      _jsxDEV("img", {
        src: src,
        alt: alt || 'Report evidence',
        onClick: (e) => e.stopPropagation(),
        style: {
          maxWidth: '90vw', maxHeight: '90vh',
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
          cursor: 'default',
          animation: 'lbZoomIn 0.25s cubic-bezier(0.16,1,0.3,1)'
        } }, void 0, false
      ),
      _jsxDEV("button", {
        onClick: onClose,
        style: {
          position: 'fixed', top: 20, right: 24,
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: 40, height: 40,
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        },
        "aria-label": "Close image", children:
        "✕" }, void 0, false),
      _jsxDEV("style", { children: `
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbZoomIn { from{transform:scale(0.88)} to{transform:scale(1)} }
      ` }, void 0, false)] }, void 0, true
    ));

}




function Toast({ t, onClose }) {
  const [lightbox, setLightbox] = useState(null);

  const isReport = t.kind === 'report';
  const isReportUpdate = t.kind === 'report_update';
  const isReportKind = isReport || isReportUpdate;

  const accentColor = isReportKind ?
  getReportColor(t.urgency) :
  SEV_COLOR[t.severity] || '#4CAF50';

  const badge = isReport ?
  '📋 NEW REPORT' :
  isReportUpdate ?
  '🔄 REPORT UPDATE' :
  `${t.severity === 'critical' ? '🔴' : t.severity === 'warning' ? '🟠' : '🔵'} ${(t.severity || 'info').toUpperCase()} ALERT`;

  return (
    _jsxDEV(_Fragment, { children: [
      lightbox &&
      _jsxDEV(Lightbox, {
        src: lightbox,
        alt: t.text,
        onClose: () => setLightbox(null) }, void 0, false
      ),


      _jsxDEV("div", { style: {
          background: '#0d1117f2',
          border: `1px solid ${accentColor}44`,
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: 14,
          padding: isReport && t.previewImage ? '12px 14px 12px 16px' : '12px 14px 12px 16px',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 6px 28px ${accentColor}20, 0 2px 10px rgba(0,0,0,0.75)`,
          animation: 'rptSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          minWidth: 290,
          maxWidth: 370,
          position: 'relative',
          overflow: 'hidden'
        }, children: [


        _jsxDEV("button", {
          onClick: () => onClose(t.id),
          style: {
            position: 'absolute', top: 8, right: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#666', fontSize: 14, lineHeight: 1, padding: 2,
            zIndex: 2
          },
          "aria-label": "Dismiss", children:
          "✕" }, void 0, false),


        _jsxDEV("div", { style: {
            fontSize: '0.7rem', fontWeight: 800,
            color: accentColor, letterSpacing: '0.6px',
            textTransform: 'uppercase'
          }, children: [
          badge,
          isReport && t.imageCount > 0 &&
          _jsxDEV("span", { style: {
              marginLeft: 6, background: `${accentColor}22`,
              borderRadius: 100, padding: '1px 7px',
              fontSize: '0.65rem', fontWeight: 700
            }, children: ["📷 ",
            t.imageCount, " image", t.imageCount > 1 ? 's' : ''] }, void 0, true
          )] }, void 0, true

        ),


        _jsxDEV("div", { style: { display: 'flex', gap: 10, alignItems: 'flex-start', paddingRight: 16 }, children: [
          _jsxDEV("div", { style: { flex: 1, minWidth: 0 }, children: [

            _jsxDEV("div", { style: { fontSize: '0.84rem', color: '#e8eaed', lineHeight: 1.45 }, children:
              t.text }, void 0, false
            ),


            t.subtext &&
            _jsxDEV("div", { style: { fontSize: '0.73rem', color: '#9aa0a6', lineHeight: 1.35, marginTop: 3 }, children:
              t.subtext }, void 0, false
            ),



            t.refId &&
            _jsxDEV("div", { style: {
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 5, padding: '2px 8px',
                background: `${accentColor}22`, borderRadius: 100,
                color: accentColor, fontSize: '0.68rem', fontWeight: 700
              }, children: ["🔖 ",
              t.refId] }, void 0, true
            ),



            t.solutions?.slice(0, 2).map((s, i) =>
            _jsxDEV("div", { style: { fontSize: '0.73rem', color: '#a5d6a7', marginTop: 3 }, children: ["✅ ",
              s] }, i, true
            )
            )] }, void 0, true
          ),


          isReport && t.previewImage &&
          _jsxDEV("button", {
            onClick: () => setLightbox(t.previewImage),
            title: "Click to view full image",
            style: {
              flexShrink: 0,
              width: 70, height: 70,
              borderRadius: 10,
              overflow: 'hidden',
              border: `2px solid ${accentColor}55`,
              cursor: 'zoom-in',
              padding: 0,
              background: 'none',
              position: 'relative'
            }, children: [

            _jsxDEV("img", {
              src: t.previewImage,
              alt: "Evidence",
              style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }, void 0, false
            ),

            _jsxDEV("div", { style: {
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, opacity: 0,
                transition: 'all 0.2s'
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
                e.currentTarget.style.opacity = '1';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0)';
                e.currentTarget.style.opacity = '0';
              }, children:
              "🔍" }, void 0, false)] }, void 0, true
          )] }, void 0, true

        ),


        _jsxDEV("div", { style: {
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: `${accentColor}22`, overflow: 'hidden'
          }, children:
          _jsxDEV("div", { style: {
              height: '100%', background: accentColor,
              animation: 'rptProgress 6.5s linear forwards'
            } }, void 0, false) }, void 0, false
        )] }, void 0, true
      )] }, void 0, true
    ));

}




export default function AlertToastBar() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-4), { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 6500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((p) => p.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    registerToastFn(addToast);
    window.__bioguardToast = addToast;
    return () => {window.__bioguardToast = null;};
  }, [addToast]);

  if (!toasts.length) return null;

  return (
    _jsxDEV(_Fragment, { children: [
      _jsxDEV("style", { children: `
        @keyframes rptSlideIn {
          from { opacity: 0; transform: translateX(52px) scale(0.94); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes rptProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      ` }, void 0, false),

      _jsxDEV("div", { style: {
          position: 'fixed', top: 72, right: 16, zIndex: 9998,
          display: 'flex', flexDirection: 'column', gap: 10,
          pointerEvents: 'none'
        }, children:
        toasts.map((t) =>
        _jsxDEV("div", { style: { pointerEvents: 'auto' }, children:
          _jsxDEV(Toast, { t: t, onClose: removeToast }, void 0, false) }, t.id, false
        )
        ) }, void 0, false
      )] }, void 0, true
    ));

}