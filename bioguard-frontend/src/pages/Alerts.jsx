import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, ShieldAlert, Info, Search,
  Clock, MapPin, ChevronRight, X, CheckCircle, Siren,
  Copy, Check, MessageSquare, Shield, Lightbulb,
  Users, RefreshCw, Bell, FileText, Plus, Zap } from
'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Alerts.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";


function fireToast(t) {
  try {window.__bioguardToast?.(t);} catch (_) {}
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});


const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const API = `${BASE}/api`;
const getToken = () => localStorage.getItem('bioguard-jwt') || '';


function makeAdvisoryIcon(severity) {
  const colors = { critical: '#ff1744', warning: '#ff9100', info: '#29b6f6' };
  const c = colors[severity] || '#4CAF50';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${c}22;border:2.5px solid ${c};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 4px ${c}30,0 0 12px ${c}55;
      animation:pulse-marker 1.8s ease-in-out infinite;
      font-size:14px;">
      🔔
    </div>
    <style>@keyframes pulse-marker{
      0%,100%{box-shadow:0 0 0 3px ${c}30,0 0 10px ${c}44;}
      50%{box-shadow:0 0 0 8px ${c}18,0 0 20px ${c}33;}
    }</style>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

function makeDefaultIcon(severity) {
  const colors = { critical: '#ff1744', warning: '#ff9100', info: '#29b6f6' };
  const c = colors[severity] || '#4CAF50';
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 2px 6px ${c}88;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
  });
}

const TYPES = ['All Types', 'Wildlife', 'Deforestation', 'Wildfire', 'Poaching', 'Conflict', 'Other'];
const REGIONS = ['All Regions', 'Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Nagaland', 'Mizoram', 'Sikkim', 'Tripura'];
const SEV_ICON = { critical: Siren, warning: AlertTriangle, info: Info };

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}


function ReportLightbox({ src, onClose }) {
  useEffect(() => {
    const h = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    _jsxDEV("div", { onClick: onClose, style: {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.93)', cursor: 'zoom-out',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'lbFadeIn 0.2s ease'
      }, children: [
      _jsxDEV("img", { src: src, alt: "Report evidence", onClick: (e) => e.stopPropagation(),
        style: { maxWidth: '90vw', maxHeight: '88vh', borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
          animation: 'lbZoom 0.25s cubic-bezier(0.16,1,0.3,1)',
          cursor: 'default'
        } }, void 0, false
      ),
      _jsxDEV("button", { onClick: onClose, style: {
          position: 'fixed', top: 18, right: 22,
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 40, height: 40, color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }, children: "✕" }, void 0, false),
      _jsxDEV("style", { children: `
        @keyframes lbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lbZoom   { from{transform:scale(0.85)} to{transform:scale(1)} }
      ` }, void 0, false)] }, void 0, true
    ));

}


const URGENCY_COLOR = {
  'High — immediate risk to life or wildlife': '#ff4444',
  'Medium — situation developing': '#ffa500',
  'Low — no immediate danger': '#4caf50'
};
const TYPE_EMOJI = { wildlife: '🐘', deforestation: '🌳', fire: '🔥', poaching: '🎯', other: '📋' };

function ReportCard({ report, onImageClick }) {
  const urgColor = URGENCY_COLOR[report.urgency] || (
  report.urgency?.toLowerCase().includes('high') ? '#ff4444' :
  report.urgency?.toLowerCase().includes('med') ? '#ffa500' : '#4caf50');
  return (
    _jsxDEV("div", { style: {
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${urgColor}33`,
        borderLeft: `4px solid ${urgColor}`,
        borderRadius: 14, padding: '14px 16px',
        animation: report._live ? 'liveIn 0.4s cubic-bezier(0.16,1,0.3,1)' : 'none',
        position: 'relative', overflow: 'hidden'
      }, children: [

      report._live &&
      _jsxDEV("span", { style: {
          position: 'absolute', top: 10, right: 12,
          background: '#ff174422', border: '1px solid #ff174466',
          color: '#ff5252', fontSize: '0.62rem', fontWeight: 800,
          padding: '1px 7px', borderRadius: 100, letterSpacing: '0.5px',
          textTransform: 'uppercase'
        }, children: "🔴 LIVE" }, void 0, false),

      _jsxDEV("div", { style: { display: 'flex', gap: 10, alignItems: 'flex-start' }, children: [
        _jsxDEV("div", { style: { flex: 1 }, children: [
          _jsxDEV("div", { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }, children: [
            _jsxDEV("span", { style: { fontSize: '0.72rem', fontWeight: 800, color: urgColor,
                textTransform: 'uppercase', letterSpacing: '0.5px' }, children: [
              TYPE_EMOJI[report.type] || '📋', " ", report.type] }, void 0, true
            ),
            _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#888' }, children: "•" }, void 0, false),
            _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#888' }, children: report.region }, void 0, false),
            _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#888' }, children: "•" }, void 0, false),
            _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#666' }, children: [
              _jsxDEV(Clock, { size: 10, style: { verticalAlign: 'middle', marginRight: 3 } }, void 0, false),
              timeAgo(report.createdAt || report.timestamp)] }, void 0, true
            )] }, void 0, true
          ),
          _jsxDEV("div", { style: { fontSize: '0.83rem', color: '#e0e0e0', marginBottom: 4 }, children: [
            _jsxDEV(MapPin, { size: 12, style: { verticalAlign: 'middle', marginRight: 4, color: '#888' } }, void 0, false),
            report.location] }, void 0, true
          ),
          _jsxDEV("p", { style: { fontSize: '0.78rem', color: '#9aa0a6', margin: '4px 0 8px', lineHeight: 1.5 }, children:
            report.description }, void 0, false
          ),
          _jsxDEV("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap' }, children: [
            _jsxDEV("span", { style: {
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                background: `${urgColor}22`, color: urgColor,
                borderRadius: 100
              }, children: report.urgency?.split('—')[0]?.trim() || report.urgency }, void 0, false),
            report.refId &&
            _jsxDEV("span", { style: { fontSize: '0.68rem', color: '#666',
                background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 100 }, children: ["🔖 ",
              report.refId] }, void 0, true
            ),

            report.status &&
            _jsxDEV("span", { style: {
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                background: report.status === 'pending' ? 'rgba(255,152,0,0.15)' :
                report.status === 'reviewed' ? 'rgba(33,150,243,0.15)' :
                report.status === 'resolved' ? 'rgba(76,175,80,0.15)' : 'rgba(255,68,68,0.1)',
                color: report.status === 'pending' ? '#ffb74d' :
                report.status === 'reviewed' ? '#64b5f6' :
                report.status === 'resolved' ? '#81c784' : '#ff5252'
              }, children: ["● ", report.status] }, void 0, true)] }, void 0, true

          )] }, void 0, true
        ),

        report.imageData?.length > 0 &&
        _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }, children:
          report.imageData.slice(0, 3).map((img, i) =>
          _jsxDEV("button", { onClick: () => onImageClick(img),
            title: "View full image",
            style: {
              width: 64, height: 64, borderRadius: 8, overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.12)',
              cursor: 'zoom-in', padding: 0, background: 'none',
              position: 'relative', display: 'block'
            }, children: [

            _jsxDEV("img", { src: img, alt: `Evidence ${i + 1}`,
              style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }, void 0, false
            ),
            i === 2 && report.imageData.length > 3 &&
            _jsxDEV("div", { style: {
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }, children: ["+", report.imageData.length - 3] }, void 0, true)] }, i, true

          )
          ) }, void 0, false
        )] }, void 0, true

      )] }, void 0, true
    ));

}


function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };
  return [copied, copy];
}


function VillageAdvisory({ alert }) {
  const [copied, copy] = useCopy();
  const [expanded, setExpanded] = useState(true);


  const getStaticAdvisory = () => {
    const HEADLINES = {
      Wildlife: { critical: ['🚨 WILDLIFE DANGER — STAY INDOORS', '🚨 वन्यजीव खतरा — घर के अंदर रहें'],
        warning: ['⚠️ WILDLIFE ALERT — CAUTION ADVISED', '⚠️ वन्यजीव सतर्कता — सावधान रहें'],
        info: ['ℹ️ WILDLIFE SIGHTING — INFORMATION', 'ℹ️ वन्यजीव दर्शन — सूचना'] },
      Deforestation: { critical: ['🌳 URGENT — ILLEGAL TREE CUTTING DETECTED', '🌳 अत्यावश्यक — अवैध पेड़ काटना पकड़ा गया'],
        warning: ['⚠️ DEFORESTATION WARNING', '⚠️ वन कटाव चेतावनी'],
        info: ['ℹ️ LAND COVER CHANGE DETECTED', 'ℹ️ भूमि आच्छादन परिवर्तन'] },
      Wildfire: { critical: ['🔥 FIRE EMERGENCY — EVACUATE IF UNSAFE', '🔥 आग आपातकाल — असुरक्षित हो तो घर छोड़ें'],
        warning: ['⚠️ WILDFIRE RISK — BE ALERT', '⚠️ जंगल की आग — सतर्क रहें'],
        info: ['ℹ️ FOREST FIRE DETECTED NEARBY', 'ℹ️ निकट में जंगल की आग'] },
      Poaching: { critical: ['🚫 CRITICAL — POACHING DETECTED', '🚫 गंभीर — शिकार पकड़ा गया'],
        warning: ['⚠️ POACHING ACTIVITY — REPORT NOW', '⚠️ शिकार गतिविधि — जानकारी दें'],
        info: ['ℹ️ PATROL ACTIVE', 'ℹ️ गश्त सक्रिय'] },
      Conflict: { critical: ['🚨 HUMAN-WILDLIFE CONFLICT — URGENT', '🚨 मानव-वन्यजीव संघर्ष — तुरंत'],
        warning: ['⚠️ ANIMAL MOVEMENT NEAR VILLAGE', '⚠️ पशु आवाजाही — गाँव के पास'],
        info: ['ℹ️ ANIMAL MOVEMENT MONITORED', 'ℹ️ पशु आवाजाही निगरानी में'] }
    };
    const hl = HEADLINES[alert.type]?.[alert.severity] || ['⚠️ ALERT', '⚠️ सतर्कता'];
    return { headline: hl[0], headlineHindi: hl[1] };
  };

  const headline = alert.headline || getStaticAdvisory().headline;
  const headlineHindi = alert.headlineHindi || getStaticAdvisory().headlineHindi;
  const message = alert.villageMessage || alert.description || 'Authorities have been alerted. Follow instructions from your Asha Worker and forest department.';
  const solutions = alert.solutions?.length ? alert.solutions : [
  'Stay indoors and remain calm',
  'Contact your Asha Worker immediately',
  'Call Forest Department Helpline: 1800-11-0027',
  'Do NOT take any independent action'];

  const prevention = alert.prevention?.length ? alert.prevention : [
  'Report unusual animal activity promptly',
  'Stay updated via BioGuard alerts',
  'Participate in community safety programs'];

  const whatsapp = alert.whatsappText || `${headline}\n${headlineHindi}\n\n📍 ${alert.location}\n\n${message}\n\n📞 Helpline: 1800-11-0027`;

  const SEV_COLORS = { critical: '#ff1744', warning: '#ff9100', info: '#29b6f6' };
  const color = SEV_COLORS[alert.severity] || '#4CAF50';

  return (
    _jsxDEV("div", { className: "village-advisory", children: [

      _jsxDEV("div", { className: "va-header", style: { borderColor: color + '55', background: color + '11' }, children: [
        _jsxDEV("div", { className: "va-header-left", children: [
          _jsxDEV(Users, { size: 16, color: color }, void 0, false),
          _jsxDEV("span", { style: { color, fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }, children: "Village Advisory Message" }, void 0, false

          )] }, void 0, true
        ),
        _jsxDEV("button", { className: "va-toggle", onClick: () => setExpanded((e) => !e), children:
          expanded ? '▲ Collapse' : '▼ Expand' }, void 0, false
        )] }, void 0, true
      ),

      expanded &&
      _jsxDEV(_Fragment, { children: [

        _jsxDEV("div", { className: "va-headline", style: { background: color + '18', borderLeft: `4px solid ${color}` }, children: [
          _jsxDEV("div", { className: "va-headline-en", children: headline }, void 0, false),
          _jsxDEV("div", { className: "va-headline-hi", children: headlineHindi }, void 0, false)] }, void 0, true
        ),


        _jsxDEV("div", { className: "va-message", children: [
          _jsxDEV(MessageSquare, { size: 14 }, void 0, false),
          _jsxDEV("p", { children: message }, void 0, false)] }, void 0, true
        ),


        _jsxDEV("div", { className: "va-section", children: [
          _jsxDEV("div", { className: "va-section-title", children: [
            _jsxDEV(CheckCircle, { size: 14, color: "#4CAF50" }, void 0, false),
            _jsxDEV("span", { children: "What To Do — क्या करें" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("ol", { className: "va-list solutions-list", children:
            solutions.map((s, i) =>
            _jsxDEV("li", { className: "va-list-item solution-item", children: [
              _jsxDEV("span", { className: "va-num", children: i + 1 }, void 0, false),
              _jsxDEV("span", { children: s }, void 0, false)] }, i, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ),


        _jsxDEV("div", { className: "va-section", children: [
          _jsxDEV("div", { className: "va-section-title", children: [
            _jsxDEV(Shield, { size: 14, color: "#ab47bc" }, void 0, false),
            _jsxDEV("span", { children: "Prevention Tips — बचाव के उपाय" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("ul", { className: "va-list prevention-list", children:
            prevention.map((p, i) =>
            _jsxDEV("li", { className: "va-list-item prevention-item", children: [
              _jsxDEV(Lightbulb, { size: 12, color: "#ab47bc", style: { flexShrink: 0 } }, void 0, false),
              _jsxDEV("span", { children: p }, void 0, false)] }, i, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ),


        _jsxDEV("div", { className: "va-helplines", children: [
          _jsxDEV("span", { children: ["📞 Forest Helpline: ", _jsxDEV("strong", { children: "1800-11-0027" }, void 0, false)] }, void 0, true),
          _jsxDEV("span", { children: ["🚑 Ambulance: ", _jsxDEV("strong", { children: "108" }, void 0, false)] }, void 0, true),
          _jsxDEV("span", { children: ["🔥 Fire: ", _jsxDEV("strong", { children: "101" }, void 0, false)] }, void 0, true)] }, void 0, true
        ),


        _jsxDEV("button", {
          className: `va-copy-btn ${copied ? 'copied' : ''}`,
          onClick: () => copy(whatsapp), children:

          copied ? _jsxDEV(_Fragment, { children: [_jsxDEV(Check, { size: 14 }, void 0, false), " Copied!"] }, void 0, true) : _jsxDEV(_Fragment, { children: [_jsxDEV(Copy, { size: 14 }, void 0, false), " Copy WhatsApp / SMS Message"] }, void 0, true) }, void 0, false
        )] }, void 0, true
      )] }, void 0, true

    ));

}






const ALERT_TYPES = ['Wildlife', 'Deforestation', 'Wildfire', 'Poaching', 'Conflict', 'Other'];
const DEFAULT_FORM = {
  type: 'Wildlife', severity: 'warning', location: '', state: '',
  description: '', action: '',
  lat: '', lng: ''
};

function CreateAlertModal({ onClose, onCreated, userRole }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${API_URL}/api/locations/suggestions`).
    then((res) => res.json()).
    then((data) => setSuggestions(data.locations || [])).
    catch(() => {});
  }, []);

  const filteredSuggestions = suggestions.filter((s) =>
  s.name.toLowerCase().includes((form.location || '').toLowerCase()) ||
  s.state.toLowerCase().includes((form.location || '').toLowerCase())
  ).slice(0, 10);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.location.trim() || !form.description.trim()) {
      setErr('Location and description are required.');return;
    }
    setSaving(true);setErr('');
    try {
      const body = {
        type: form.type,
        severity: form.severity,
        location: form.location.trim(),
        state: form.state.trim() || 'Assam',
        description: form.description.trim(),
        action: form.action.trim(),
        lat: form.lat ? parseFloat(form.lat) : 26.2,
        lng: form.lng ? parseFloat(form.lng) : 93.0
      };
      const res = await fetch(`${API}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create alert');
      onCreated(json.alert);
      onClose();
    } catch (e) {setErr(e.message);}
    setSaving(false);
  };

  const SEV_OPTS = ['critical', 'warning', 'info'];
  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', fontSize: '0.84rem', outline: 'none',
    boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' };

  return (
    _jsxDEV("div", { style: {
        position: 'fixed', inset: 0, zIndex: 9990,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }, children:
      _jsxDEV("div", { style: {
          background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh',
          overflowY: 'auto', padding: '24px 28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          animation: 'lbZoom 0.25s cubic-bezier(0.16,1,0.3,1)'
        }, children: [

        _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, children: [
          _jsxDEV("div", { children: [
            _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }, children: [
              _jsxDEV(Zap, { size: 18, color: "#ff9100" }, void 0, false),
              _jsxDEV("span", { style: { fontWeight: 800, fontSize: '1.05rem', color: '#fff' }, children: "Create Live Alert" }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("p", { style: { fontSize: '0.75rem', color: '#666', margin: 0 }, children: "Alert will be saved to database and broadcast to all users instantly" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("button", { onClick: onClose, style: { background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxDEV(X, { size: 16 }, void 0, false) }, void 0, false)] }, void 0, true
        ),

        _jsxDEV("form", { onSubmit: submit, children: [

          _jsxDEV("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }, children: [
            _jsxDEV("div", { children: [
              _jsxDEV("label", { style: labelStyle, children: "Alert Type" }, void 0, false),
              _jsxDEV("select", { value: form.type, onChange: (e) => set('type', e.target.value), style: inputStyle, children:
                ALERT_TYPES.map((t) => _jsxDEV("option", { children: t }, t, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { children: [
              _jsxDEV("label", { style: labelStyle, children: "Severity" }, void 0, false),
              _jsxDEV("select", { value: form.severity, onChange: (e) => set('severity', e.target.value), style: { ...inputStyle, color: form.severity === 'critical' ? '#ff1744' : form.severity === 'warning' ? '#ff9100' : '#29b6f6' }, children:
                SEV_OPTS.map((s) => _jsxDEV("option", { value: s, children: s.charAt(0).toUpperCase() + s.slice(1) }, s, false)) }, void 0, false
              )] }, void 0, true
            )] }, void 0, true
          ),


          _jsxDEV("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }, children: [
            _jsxDEV("div", { style: { position: 'relative' }, children: [
              _jsxDEV("label", { style: labelStyle, children: ["Location ", _jsxDEV("span", { style: { color: '#ff5252' }, children: "*" }, void 0, false)] }, void 0, true),
              _jsxDEV("input", { value: form.location,
                onChange: (e) => {
                  set('location', e.target.value);
                  setShowSuggestions(true);
                },
                onFocus: () => setShowSuggestions(true),
                onBlur: () => setTimeout(() => setShowSuggestions(false), 200),
                placeholder: "Search village, park, or landmark…", style: inputStyle }, void 0, false
              ),
              showSuggestions && filteredSuggestions.length > 0 && form.location &&
              _jsxDEV("div", { className: "autocomplete-dropdown", style: {
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, marginTop: 4, zIndex: 100, maxHeight: 200, overflowY: 'auto',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                }, children:
                filteredSuggestions.map((loc, i) =>
                _jsxDEV("div", { onClick: () => {
                    set('location', loc.name);
                    if (loc.state) set('state', loc.state);
                    if (loc.lat && loc.lng) {set('lat', loc.lat);set('lng', loc.lng);}
                    setShowSuggestions(false);
                  }, style: {
                    padding: '10px 14px', cursor: 'pointer', fontSize: '0.82rem',
                    borderBottom: i < filteredSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex', flexDirection: 'column', gap: 2
                  },
                  onMouseEnter: (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)',
                  onMouseLeave: (e) => e.currentTarget.style.background = 'transparent', children: [

                  _jsxDEV("span", { style: { color: '#fff', fontWeight: 600 }, children: loc.name }, void 0, false),
                  _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#888' }, children: [loc.state, " • ", loc.type] }, void 0, true)] }, i, true
                )
                ) }, void 0, false
              )] }, void 0, true

            ),
            _jsxDEV("div", { children: [
              _jsxDEV("label", { style: labelStyle, children: "State" }, void 0, false),
              _jsxDEV("input", { value: form.state, onChange: (e) => set('state', e.target.value), placeholder: "e.g. Assam", style: inputStyle }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),


          _jsxDEV("div", { style: { marginBottom: 14 }, children: [
            _jsxDEV("label", { style: labelStyle, children: ["Description ", _jsxDEV("span", { style: { color: '#ff5252' }, children: "*" }, void 0, false)] }, void 0, true),
            _jsxDEV("textarea", { value: form.description, onChange: (e) => set('description', e.target.value),
              placeholder: "Describe what is happening…", rows: 3,
              style: { ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 } }, void 0, false)] }, void 0, true
          ),


          _jsxDEV("div", { style: { marginBottom: 14 }, children: [
            _jsxDEV("label", { style: labelStyle, children: "Current Action" }, void 0, false),
            _jsxDEV("input", { value: form.action, onChange: (e) => set('action', e.target.value), placeholder: "e.g. Rangers dispatched", style: inputStyle }, void 0, false)] }, void 0, true
          ),


          _jsxDEV("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }, children: [
            _jsxDEV("div", { children: [
              _jsxDEV("label", { style: labelStyle, children: "Latitude (optional)" }, void 0, false),
              _jsxDEV("input", { type: "number", value: form.lat, onChange: (e) => set('lat', e.target.value), placeholder: "26.57", style: inputStyle, step: "any" }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("div", { children: [
              _jsxDEV("label", { style: labelStyle, children: "Longitude (optional)" }, void 0, false),
              _jsxDEV("input", { type: "number", value: form.lng, onChange: (e) => set('lng', e.target.value), placeholder: "93.17", style: inputStyle, step: "any" }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),

          err && _jsxDEV("div", { style: { background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)', borderRadius: 8, padding: '8px 12px', color: '#ff5252', fontSize: '0.8rem', marginBottom: 14 }, children: err }, void 0, false),

          _jsxDEV("div", { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' }, children: [
            _jsxDEV("button", { type: "button", onClick: onClose, style: { padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#888', fontSize: '0.84rem', cursor: 'pointer' }, children: "Cancel" }, void 0, false),
            _jsxDEV("button", { type: "submit", disabled: saving, style: {
                padding: '9px 22px', borderRadius: 9, border: 'none',
                background: form.severity === 'critical' ? '#ff1744' : form.severity === 'warning' ? '#ff9100' : '#29b6f6',
                color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: saving ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1
              }, children: [
              _jsxDEV(Zap, { size: 14 }, void 0, false), saving ? 'Broadcasting…' : 'Broadcast Alert'] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true
        )] }, void 0, true
      ) }, void 0, false
    ));

}

const Alerts = () => {
  const { user } = useAuth();
  const canModerate = user?.role === 'admin' || user?.role === 'asha_worker';
  const [tab, setTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [rptLoad, setRptLoad] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const wsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [type, setType] = useState('All Types');
  const [region, setRegion] = useState('All Regions');
  const [selected, setSelected] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [apiError, setApiError] = useState('');


  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API}/alerts?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.alerts?.length) {
          setAlerts((prev) => {

            const wsOnly = prev.filter((a) => a._live && !json.alerts.find((x) => x._id === a._id));
            const merged = [...wsOnly, ...json.alerts];

            const unique = [];
            const seen = new Set();
            for (const a of merged) {
              const key = a.externalRef || a._id;
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(a);
              }
            }
            return unique;
          });
          setSelected((s) => s ? json.alerts.find((a) => a._id === s._id) || s : null);
        }
      } else {
        setApiError('Could not reach backend — showing cached data.');
      }
    } catch {
      setApiError('Backend unreachable. Check your internet connection.');
    }
    setLoading(false);
  }, []);



  const fetchReports = useCallback(async () => {
    setRptLoad(true);
    try {
      const res = await fetch(`${API}/reports?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
      }
    } catch {}
    setRptLoad(false);
  }, [user, canModerate]);


  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const WS_URL = API_URL.replace(/^http/, 'ws');
    const connect = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);
        wsRef.current.onclose = () => setTimeout(connect, 5000);
        wsRef.current.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);


            if (msg.event === 'new_alert') {
              const a = { ...msg.data, _id: msg.data._id || msg.data.id, _live: true };
              setAlerts((prev) => {
                if (prev.find((x) => x._id === a._id || a.externalRef && x.externalRef === a.externalRef)) return prev;
                return [a, ...prev.slice(0, 99)];
              });
              setLiveCount((c) => c + 1);
              fireToast({
                severity: a.severity,
                text: `${a.type} Alert — ${a.location}`,
                subtext: a.description?.slice(0, 90),
                solutions: a.solutions
              });
            }


            if (msg.event === 'realtime_alert_batch' && msg.data?.alerts) {
              const batch = msg.data.alerts.map((a) => ({
                ...a, _id: a._id || a.id || `rt-${Date.now()}-${Math.random()}`,
                _live: true, source: 'system'
              }));
              setAlerts((prev) => {
                const newOnes = batch.filter((a) => !prev.find((x) => x._id === a._id || a.externalRef && x.externalRef === a.externalRef));
                return newOnes.length > 0 ? [...newOnes, ...prev].slice(0, 100) : prev;
              });
              setLiveCount((c) => c + batch.length);
            }


            if (msg.event === 'realtime_critical_alert') {
              const a = msg.data;
              fireToast({
                severity: 'critical',
                text: `🛰️ SATELLITE ALERT — ${a.location}`,
                subtext: a.description?.slice(0, 90),
                solutions: a.solutions || ['Avoid area immediately.']
              });
            }


            if (msg.event === 'new_report') {
              const r = { ...msg.data, _id: msg.data.id, _live: true, createdAt: msg.data.timestamp };
              setReports((prev) => [r, ...prev.slice(0, 49)]);
              if (tab === 'reports') {
                fireToast({
                  kind: 'report',
                  text: `New ${msg.data.type} report — ${msg.data.location}`,
                  subtext: msg.data.description?.slice(0, 80),
                  urgency: msg.data.urgency?.toLowerCase().includes('high') ? 'high' : 'medium',
                  refId: msg.data.refId,
                  previewImage: msg.data.previewImage,
                  imageCount: msg.data.imageCount
                });
              }
            }
            if (msg.event === 'report_updated') {
              setReports((prev) => prev.map((r) =>
              r._id === msg.data.id ? { ...r, status: msg.data.status, riskLevel: msg.data.riskLevel } : r
              ));
            }
          } catch (_) {}
        };
        wsRef.current.onerror = () => {};
      } catch (_) {}
    };
    connect();
    return () => {if (wsRef.current) wsRef.current.close();};
  }, [tab]);

  useEffect(() => {
    fetchAlerts();

    const t1 = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(t1);
  }, [fetchAlerts]);

  useEffect(() => {
    if (tab === 'reports') fetchReports();
  }, [tab, fetchReports]);



  const filtered = alerts.filter((a) => {
    const matchSev = severity === 'all' || a.severity === severity;
    const matchType = type === 'All Types' || a.type === type;
    const matchRegion = region === 'All Regions' || a.state === region || a.region === region;
    const matchSearch = !search || a.location?.toLowerCase().includes(search.toLowerCase()) || a.type?.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchType && matchRegion && matchSearch;
  });

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length
  };


  const handleAlertCreated = useCallback((alert) => {
    setAlerts((prev) => {
      if (prev.find((x) => x._id === alert._id)) return prev;
      return [{ ...alert, _live: true }, ...prev.slice(0, 49)];
    });
    setLiveCount((c) => c + 1);
    setActionMsg('🚀 Alert broadcast live to all users!');
    setTimeout(() => setActionMsg(''), 4000);
  }, []);

  const resolveAlert = async (id) => {
    try {
      const res = await fetch(`${API}/alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setActionMsg('✅ Alert resolved successfully.');
      await fetchAlerts();
    } catch (e) {setActionMsg('❌ ' + e.message);}
    setTimeout(() => setActionMsg(''), 3000);
  };

  const deleteAlert = async (id) => {
    if (!window.confirm('Permanently delete this alert?')) return;
    try {
      const res = await fetch(`${API}/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setActionMsg('🗑️ Alert deleted.');
      setSelected(null);
      await fetchAlerts();
    } catch (e) {setActionMsg('❌ ' + e.message);}
    setTimeout(() => setActionMsg(''), 3000);
  };

  return (
    _jsxDEV("div", { className: "page-root alerts-page", children: [
      lightbox && _jsxDEV(ReportLightbox, { src: lightbox, onClose: () => setLightbox(null) }, void 0, false),
      showCreate && _jsxDEV(CreateAlertModal, { onClose: () => setShowCreate(false), onCreated: handleAlertCreated, userRole: user?.role }, void 0, false),

      _jsxDEV("div", { className: "page-header-bar", children: [
        _jsxDEV("div", { children: [
          _jsxDEV("h1", { className: "page-title", children: [
            _jsxDEV(Bell, { size: 20, style: { marginRight: 8, verticalAlign: 'middle' } }, void 0, false), "Alert Management"] }, void 0, true

          ),
          _jsxDEV("p", { className: "page-sub", children: [
            alerts.length, " total alerts · ", alerts.filter((a) => a.status === 'active').length, " active · Auto-generates village advisory with solutions & prevention"] }, void 0, true

          )] }, void 0, true
        ),
        _jsxDEV("div", { style: { display: 'flex', gap: 10, alignItems: 'center' }, children: [
          liveCount > 0 &&
          _jsxDEV("span", { style: {
              fontSize: '0.72rem', fontWeight: 800, color: '#ff5252',
              background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.3)',
              borderRadius: 100, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
              animation: 'pulseLive 2s ease-in-out infinite'
            }, children: [
            _jsxDEV("span", { style: { width: 7, height: 7, borderRadius: '50%', background: '#ff5252', display: 'inline-block' } }, void 0, false),
            liveCount, " Live"] }, void 0, true
          ),

          _jsxDEV("button", { className: "icon-btn", onClick: tab === 'alerts' ? fetchAlerts : fetchReports,
            disabled: loading || rptLoad, children: [
            _jsxDEV(RefreshCw, { size: 14, className: loading || rptLoad ? 'spinning' : '' }, void 0, false), " Refresh"] }, void 0, true
          ),
          tab === 'alerts' &&
          _jsxDEV("button", { className: `icon-btn ${showMap ? 'active' : ''}`, onClick: () => setShowMap(!showMap), children: [
            showMap ? _jsxDEV(X, { size: 16 }, void 0, false) : _jsxDEV(MapPin, { size: 16 }, void 0, false), " ", showMap ? 'Hide Map' : 'Show Map'] }, void 0, true
          ),

          canModerate && tab === 'alerts' &&
          _jsxDEV("button", { className: "icon-btn create-alert-btn", onClick: () => setShowCreate(true), children: [
            _jsxDEV(Plus, { size: 14 }, void 0, false), " Create Alert"] }, void 0, true
          )] }, void 0, true

        )] }, void 0, true
      ),


      apiError &&
      _jsxDEV("div", { style: {
          margin: '0 0 12px', padding: '10px 16px', borderRadius: 10,
          background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)',
          color: '#ffc107', fontSize: '0.82rem', fontWeight: 600,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }, children: ["⚠️ ",
        apiError,
        _jsxDEV("button", { onClick: () => setApiError(''), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, children: "✕" }, void 0, false)] }, void 0, true
      ),



      _jsxDEV("div", { style: { display: 'flex', gap: 2, marginBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }, children:
        [
        { key: 'alerts', label: '🚨 Alerts', count: alerts.length },
        { key: 'reports', label: '📋 Community Reports', count: reports.length }].
        map((t) =>
        !t.restricted &&
        _jsxDEV("button", { onClick: () => setTab(t.key),
          style: {
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px', fontSize: '0.85rem', fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? '#4caf50' : '#888',
            borderBottom: tab === t.key ? '2px solid #4caf50' : '2px solid transparent',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
          }, children: [

          t.label,
          _jsxDEV("span", { style: {
              background: tab === t.key ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.07)',
              color: tab === t.key ? '#81c784' : '#666',
              fontSize: '0.7rem', fontWeight: 700,
              padding: '1px 7px', borderRadius: 100
            }, children: t.count }, void 0, false)] }, t.key, true
        )

        ) }, void 0, false
      ),


      tab === 'reports' &&
      _jsxDEV("div", { children: [
        _jsxDEV("div", { style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }, children: [
          _jsxDEV("div", { style: { width: 8, height: 8, borderRadius: '50%', background: '#4caf50',
              boxShadow: '0 0 0 2px #4caf5044', animation: 'pulse-dot 2s infinite' } }, void 0, false),
          _jsxDEV("span", { style: { fontSize: '0.75rem', color: '#666' }, children: "Live — new reports appear instantly" }, void 0, false)] }, void 0, true
        ),
        _jsxDEV("style", { children: `
            @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
            @keyframes liveIn {
              from { opacity:0; transform:translateY(-8px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          ` }, void 0, false),
        rptLoad &&
        _jsxDEV("div", { style: { textAlign: 'center', color: '#555', padding: 20, fontSize: '0.85rem' }, children: "Loading reports…" }, void 0, false

        ),

        !rptLoad && reports.length === 0 &&
        _jsxDEV("div", { style: { textAlign: 'center', color: '#555', padding: 32, fontSize: '0.85rem' }, children: [
          _jsxDEV(FileText, { size: 32, style: { opacity: 0.3, display: 'block', margin: '0 auto 8px' } }, void 0, false), "No community reports yet."] }, void 0, true

        ),

        _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children:
          reports.map((r, i) =>
          _jsxDEV(ReportCard, { report: r, onImageClick: setLightbox }, r._id || r.refId || i, false)
          ) }, void 0, false
        )] }, void 0, true
      ),



      tab === 'alerts' && _jsxDEV(_Fragment, { children: [


        _jsxDEV("div", { className: "sev-counters", children:
          [
          { key: 'all', label: 'All', count: alerts.length, color: '#555' },
          { key: 'critical', label: 'Critical', count: counts.critical, color: '#ff1744' },
          { key: 'warning', label: 'Warning', count: counts.warning, color: '#ff9100' },
          { key: 'info', label: 'Info', count: counts.info, color: '#29b6f6' }].
          map((s) =>
          _jsxDEV("button", { className: `sev-counter ${severity === s.key ? 'active' : ''}`,
            style: { '--sc': s.color }, onClick: () => setSeverity(s.key), children: [
            _jsxDEV("span", { className: "sc-num", children: s.count }, void 0, false),
            _jsxDEV("span", { className: "sc-lbl", children: s.label }, void 0, false)] }, s.key, true
          )
          ) }, void 0, false
        ),


        _jsxDEV("div", { className: "filter-bar", children: [
          _jsxDEV("div", { className: "search-wrap", children: [
            _jsxDEV(Search, { size: 16 }, void 0, false),
            _jsxDEV("input", { placeholder: "Search by location or type…", value: search,
              onChange: (e) => setSearch(e.target.value), className: "search-input" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("select", { className: "filter-select", value: type, onChange: (e) => setType(e.target.value), children:
            TYPES.map((t) => _jsxDEV("option", { children: t }, t, false)) }, void 0, false
          ),
          _jsxDEV("select", { className: "filter-select", value: region, onChange: (e) => setRegion(e.target.value), children:
            REGIONS.map((r) => _jsxDEV("option", { children: r }, r, false)) }, void 0, false
          )] }, void 0, true
        ),


        showMap &&
        _jsxDEV("div", { className: "alert-map-strip", children: [
          _jsxDEV(MapContainer, { center: [26.2, 93.0], zoom: 6, className: "alerts-map", scrollWheelZoom: false, children: [
            _jsxDEV(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              attribution: "© OSM © CARTO" }, void 0, false),

            filtered.map((a) =>
            _jsxDEV(Circle, {
              center: [a.coordinates?.lat || 26, a.coordinates?.lng || 93], radius: 7000,
              pathOptions: { color: a.severity === 'critical' ? '#ff1744' : a.severity === 'warning' ? '#ff9100' : '#29b6f6',
                fillOpacity: 0.18, weight: 1.5 },
              eventHandlers: { click: () => setSelected(a) } }, a._id + '-c', false)
            ),

            filtered.map((a) => {
              const hasAdvisory = !!a.villageMessage;
              const icon = hasAdvisory ? makeAdvisoryIcon(a.severity) : makeDefaultIcon(a.severity);
              const lat = a.coordinates?.lat || 26;
              const lng = a.coordinates?.lng || 93;
              return (
                _jsxDEV(Marker, { position: [lat, lng], icon: icon,
                  eventHandlers: { click: () => setSelected(a) }, children:
                  _jsxDEV(Popup, { maxWidth: 280, children:
                    _jsxDEV("div", { style: { fontFamily: 'sans-serif' }, children: [
                      _jsxDEV("div", { style: { fontWeight: 800, color: a.severity === 'critical' ? '#ff1744' : a.severity === 'warning' ? '#ff9100' : '#29b6f6', marginBottom: 4 }, children:
                        a.headline || a.type + ' Alert' }, void 0, false
                      ),
                      a.headlineHindi && _jsxDEV("div", { style: { fontSize: '0.8rem', color: '#888', marginBottom: 6 }, children: a.headlineHindi }, void 0, false),
                      _jsxDEV("div", { style: { fontSize: '0.82rem', marginBottom: 6 }, children: [_jsxDEV("strong", { children: "📍" }, void 0, false), " ", a.location] }, void 0, true),
                      a.villageMessage &&
                      _jsxDEV("div", { style: { fontSize: '0.78rem', color: '#666', marginBottom: 8, lineHeight: 1.5 }, children: [
                        a.villageMessage.slice(0, 160), "…"] }, void 0, true
                      ),

                      a.solutions?.slice(0, 3).map((s, i) =>
                      _jsxDEV("div", { style: { fontSize: '0.75rem', color: '#4CAF50', marginBottom: 2 }, children: ["✅ ", s] }, i, true)
                      ),
                      hasAdvisory && _jsxDEV("div", { style: { fontSize: '0.7rem', color: '#ab47bc', marginTop: 6 }, children: "🔔 Village Advisory Active" }, void 0, false)] }, void 0, true
                    ) }, void 0, false
                  ) }, a._id, false
                ));

            })] }, void 0, true
          ),

          _jsxDEV("div", { style: { padding: '6px 12px', display: 'flex', gap: 16, fontSize: '0.72rem', color: '#888', flexWrap: 'wrap' }, children: [
            _jsxDEV("span", { children: "🔴 Critical circle" }, void 0, false),
            _jsxDEV("span", { children: "🟠 Warning circle" }, void 0, false),
            _jsxDEV("span", { children: "🔵 Info circle" }, void 0, false),
            _jsxDEV("span", { children: "🔔 Advisory marker (glowing = village message active)" }, void 0, false)] }, void 0, true
          )] }, void 0, true
        ),




        actionMsg &&
        _jsxDEV("div", { style: {
            margin: '0 0 12px',
            padding: '10px 16px',
            borderRadius: 10,
            background: actionMsg.startsWith('❌') ? 'rgba(255,23,68,0.12)' : 'rgba(76,175,80,0.12)',
            color: actionMsg.startsWith('❌') ? '#ff5252' : '#81c784',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }, children: [
          actionMsg,
          _jsxDEV("button", { onClick: () => setActionMsg(''), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, children: "✕" }, void 0, false)] }, void 0, true
        ),


        _jsxDEV("div", { className: `alerts-layout ${selected ? 'has-detail' : ''}`, children: [

          _jsxDEV("div", { className: "alerts-list-col", children: [
            filtered.length === 0 && !loading &&
            _jsxDEV("div", { className: "empty-state", children: [
              _jsxDEV(CheckCircle, { size: 40 }, void 0, false),
              _jsxDEV("p", { children:
                alerts.length === 0 ?
                'Connecting to backend… Alerts will appear shortly.' :
                'No alerts match the current filters.' }, void 0, false
              )] }, void 0, true
            ),



            (() => {
              const sysAlerts = filtered.filter((a) => a.source === 'system' || !a.source);
              return sysAlerts.length > 0 &&
              _jsxDEV(_Fragment, { children:
                _jsxDEV("div", { style: { padding: '8px 8px 10px', margin: '4px 0 10px', borderBottom: '1px solid rgba(255,183,77,0.2)', background: 'rgba(255,183,77,0.04)', borderRadius: '8px 8px 0 0' }, children:
                  _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [
                    _jsxDEV("h4", { style: { color: '#ffb74d', margin: 0, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }, children: [
                      _jsxDEV(Zap, { size: 13, color: "#ffb74d" }, void 0, false), " Real-Time Intelligence & Satellite Alerts"] }, void 0, true
                    ),
                    _jsxDEV("span", { style: { fontSize: '0.68rem', fontWeight: 700, color: '#ffb74d', background: 'rgba(255,183,77,0.15)', borderRadius: 100, padding: '2px 8px' }, children: [
                      sysAlerts.length, " alerts · GBIF · GFW · Satellite"] }, void 0, true
                    )] }, void 0, true
                  ) }, void 0, false
                ) }, void 0, false
              );

            })(),
            filtered.filter((a) => a.source === 'system' || !a.source).map((a) => {
              const Icon = SEV_ICON[a.severity] || AlertTriangle;
              return (
                _jsxDEV("div", {
                  className: `alert-card sev-${a.severity} ${selected?._id === a._id ? 'sel' : ''} ${a._live ? 'live-card' : ''}`,
                  onClick: () => setSelected(a), children: [
                  _jsxDEV("div", { className: `ac-strip sev-${a.severity}` }, void 0, false),
                  _jsxDEV("div", { className: "ac-icon", children: _jsxDEV(Icon, { size: 20 }, void 0, false) }, void 0, false),
                  _jsxDEV("div", { className: "ac-body", children: [
                    _jsxDEV("div", { className: "ac-head", children: [
                      a._live &&
                      _jsxDEV("span", { style: {
                          fontSize: '0.6rem', fontWeight: 800, color: '#ff5252',
                          background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.3)',
                          borderRadius: 100, padding: '1px 7px', letterSpacing: '0.5px',
                          textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4
                        }, children: [
                        _jsxDEV("span", { style: { width: 5, height: 5, borderRadius: '50%', background: '#ff5252', display: 'inline-block' } }, void 0, false), "LIVE"] }, void 0, true

                      ),

                      _jsxDEV("span", { className: `sev-badge sev-${a.severity}`, children: a.severity }, void 0, false),
                      _jsxDEV("span", { className: `status-badge ${a.status}`, children: a.status }, void 0, false),
                      a.villageMessage &&
                      _jsxDEV("span", { className: "advisory-chip", children: [_jsxDEV(MessageSquare, { size: 10 }, void 0, false), " Village Advisory"] }, void 0, true),

                      _jsxDEV("span", { className: "ac-time", children: [_jsxDEV(Clock, { size: 11 }, void 0, false), " ", timeAgo(a.createdAt)] }, void 0, true)] }, void 0, true
                    ),
                    _jsxDEV("div", { className: "ac-type", children: [a.type, " ", _jsxDEV("span", { style: { color: '#666', fontSize: '0.7rem', fontWeight: 400 }, children: "· System" }, void 0, false)] }, void 0, true),
                    _jsxDEV("div", { className: "ac-loc", children: [_jsxDEV(MapPin, { size: 12 }, void 0, false), " ", a.location] }, void 0, true),
                    _jsxDEV("p", { className: "ac-desc", children: a.description }, void 0, false),
                    _jsxDEV("div", { className: "ac-action", children: [a.action, " ", _jsxDEV(ChevronRight, { size: 12 }, void 0, false)] }, void 0, true)] }, void 0, true
                  )] }, a._id, true
                ));

            }),


            loading && alerts.length === 0 &&
            _jsxDEV("div", { style: { textAlign: 'center', padding: '32px 20px', color: '#555' }, children: [
              _jsxDEV(RefreshCw, { size: 24, style: { animation: 'spin 1s linear infinite', marginBottom: 8, display: 'block', margin: '0 auto 12px' } }, void 0, false),
              _jsxDEV("div", { style: { fontSize: '0.82rem' }, children: "Fetching real alerts from backend…" }, void 0, false),
              _jsxDEV("div", { style: { fontSize: '0.72rem', color: '#444', marginTop: 4 }, children: "GBIF · GFW · Satellite · Field Patrol" }, void 0, false)] }, void 0, true
            ),



            (() => {
              const fieldAlerts = filtered.filter((a) => a.source === 'asha_worker' || a.source === 'admin');
              return fieldAlerts.length > 0 &&
              _jsxDEV("div", { style: { padding: '8px 8px 10px', margin: '20px 0 10px', borderBottom: '1px solid rgba(100,181,246,0.2)', background: 'rgba(100,181,246,0.04)', borderRadius: '8px 8px 0 0' }, children:
                _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [
                  _jsxDEV("h4", { style: { color: '#64b5f6', margin: 0, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }, children: [
                    _jsxDEV(Users, { size: 13, color: "#64b5f6" }, void 0, false), " Asha Worker & Field Patrol Alerts"] }, void 0, true
                  ),
                  _jsxDEV("span", { style: { fontSize: '0.68rem', fontWeight: 700, color: '#64b5f6', background: 'rgba(100,181,246,0.15)', borderRadius: 100, padding: '2px 8px' }, children: [
                    fieldAlerts.length, " alerts · Field-Verified"] }, void 0, true
                  )] }, void 0, true
                ) }, void 0, false
              );

            })(),
            filtered.filter((a) => a.source === 'asha_worker' || a.source === 'admin').map((a) => {
              const Icon = SEV_ICON[a.severity] || AlertTriangle;
              return (
                _jsxDEV("div", {
                  className: `alert-card sev-${a.severity} ${selected?._id === a._id ? 'sel' : ''} ${a._live ? 'live-card' : ''}`,
                  onClick: () => setSelected(a), children: [
                  _jsxDEV("div", { className: `ac-strip sev-${a.severity}` }, void 0, false),
                  _jsxDEV("div", { className: "ac-icon", children: _jsxDEV(Icon, { size: 20 }, void 0, false) }, void 0, false),
                  _jsxDEV("div", { className: "ac-body", children: [
                    _jsxDEV("div", { className: "ac-head", children: [
                      a._live &&
                      _jsxDEV("span", { style: {
                          fontSize: '0.6rem', fontWeight: 800, color: '#ff5252',
                          background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.3)',
                          borderRadius: 100, padding: '1px 7px', letterSpacing: '0.5px',
                          textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4
                        }, children: [
                        _jsxDEV("span", { style: { width: 5, height: 5, borderRadius: '50%', background: '#ff5252', display: 'inline-block' } }, void 0, false), "LIVE"] }, void 0, true

                      ),

                      _jsxDEV("span", { className: `sev-badge sev-${a.severity}`, children: a.severity }, void 0, false),
                      _jsxDEV("span", { className: `status-badge ${a.status}`, children: a.status }, void 0, false),
                      a.villageMessage &&
                      _jsxDEV("span", { className: "advisory-chip", children: [_jsxDEV(MessageSquare, { size: 10 }, void 0, false), " Village Advisory"] }, void 0, true),

                      _jsxDEV("span", { className: "ac-time", children: [_jsxDEV(Clock, { size: 11 }, void 0, false), " ", timeAgo(a.createdAt)] }, void 0, true)] }, void 0, true
                    ),
                    _jsxDEV("div", { className: "ac-type", children: [a.type, " ", _jsxDEV("span", { style: { color: '#81c784', fontSize: '0.7rem', fontWeight: 600 }, children: "· Field Patrol Verified" }, void 0, false)] }, void 0, true),
                    _jsxDEV("div", { className: "ac-loc", children: [_jsxDEV(MapPin, { size: 12 }, void 0, false), " ", a.location] }, void 0, true),
                    _jsxDEV("p", { className: "ac-desc", children: a.description }, void 0, false),
                    _jsxDEV("div", { className: "ac-action", children: [a.action, " ", _jsxDEV(ChevronRight, { size: 12 }, void 0, false)] }, void 0, true)] }, void 0, true
                  )] }, a._id, true
                ));

            })] }, void 0, true
          ),


          selected &&
          _jsxDEV("div", { className: "detail-panel", children: [
            _jsxDEV("button", { className: "detail-close", onClick: () => setSelected(null), children: _jsxDEV(X, { size: 18 }, void 0, false) }, void 0, false),
            _jsxDEV("div", { className: `dp-sev-bar sev-${selected.severity}` }, void 0, false),
            _jsxDEV("div", { className: "dp-head", children: [
              _jsxDEV("span", { className: `sev-badge sev-${selected.severity} big`, children: selected.severity }, void 0, false),
              _jsxDEV("span", { className: `status-badge ${selected.status} big`, children: selected.status }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("h2", { className: "dp-type", children: [selected.type, " Alert"] }, void 0, true),
            _jsxDEV("div", { className: "dp-loc", children: [_jsxDEV(MapPin, { size: 14 }, void 0, false), " ", selected.location] }, void 0, true),
            _jsxDEV("div", { className: "dp-time", children: [_jsxDEV(Clock, { size: 14 }, void 0, false), " ", timeAgo(selected.createdAt)] }, void 0, true),
            _jsxDEV("div", { className: "dp-divider" }, void 0, false),
            _jsxDEV("h4", { children: "Description" }, void 0, false),
            _jsxDEV("p", { className: "dp-desc", children: selected.description }, void 0, false),
            selected.action &&
            _jsxDEV(_Fragment, { children: [
              _jsxDEV("div", { className: "dp-divider" }, void 0, false),
              _jsxDEV("h4", { children: "Current Action" }, void 0, false),
              _jsxDEV("div", { className: "dp-action-box", children: selected.action }, void 0, false)] }, void 0, true
            ),

            _jsxDEV("div", { className: "dp-divider" }, void 0, false),


            _jsxDEV(VillageAdvisory, { alert: selected }, void 0, false),

            _jsxDEV("div", { className: "dp-divider" }, void 0, false),
            _jsxDEV("div", { className: "dp-mini-map", children:
              _jsxDEV(MapContainer, { center: [selected.coordinates?.lat || 26, selected.coordinates?.lng || 93], zoom: 11,
                className: "detail-map", scrollWheelZoom: false, zoomControl: false, children: [
                _jsxDEV(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                  attribution: "© OSM © CARTO" }, void 0, false),
                _jsxDEV(Circle, { center: [selected.coordinates?.lat || 26, selected.coordinates?.lng || 93], radius: 8000,
                  pathOptions: { color: selected.severity === 'critical' ? '#ff1744' : selected.severity === 'warning' ? '#ff9100' : '#29b6f6',
                    fillOpacity: 0.3, weight: 2 } }, void 0, false),
                _jsxDEV(Marker, { position: [selected.coordinates?.lat || 26, selected.coordinates?.lng || 93], children:
                  _jsxDEV(Popup, { children: selected.location }, void 0, false) }, void 0, false
                )] }, void 0, true
              ) }, void 0, false
            ),


            canModerate && selected.status !== 'resolved' && !selected._id?.startsWith('s') &&
            _jsxDEV(_Fragment, { children: [
              _jsxDEV("div", { className: "dp-divider" }, void 0, false),
              _jsxDEV("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap', padding: '4px 0' }, children: [
                selected.status !== 'resolved' &&
                _jsxDEV("button", {
                  onClick: () => resolveAlert(selected._id),
                  style: {
                    background: 'rgba(76,175,80,0.15)', color: '#4CAF50',
                    border: '1px solid rgba(76,175,80,0.35)',
                    padding: '8px 18px', borderRadius: 10, fontSize: '0.82rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }, children: [

                  _jsxDEV(CheckCircle, { size: 14 }, void 0, false), " Mark Resolved"] }, void 0, true
                ),

                user?.role === 'admin' &&
                _jsxDEV("button", {
                  onClick: () => deleteAlert(selected._id),
                  style: {
                    background: 'rgba(255,23,68,0.1)', color: '#ff5252',
                    border: '1px solid rgba(255,23,68,0.3)',
                    padding: '8px 18px', borderRadius: 10, fontSize: '0.82rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    marginLeft: 'auto'
                  }, children: [

                  _jsxDEV(X, { size: 14 }, void 0, false), " Delete Alert"] }, void 0, true
                )] }, void 0, true

              )] }, void 0, true
            )] }, void 0, true

          )] }, void 0, true

        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default Alerts;