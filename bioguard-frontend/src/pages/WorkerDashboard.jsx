import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, MapPin, Bell, FileText, Leaf,
  AlertTriangle, CheckCircle, Clock, Plus } from
'lucide-react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportsInbox from '../components/ReportsInbox';
import './RoleDashboard.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: 'Wildlife', severity: 'warning', location: '', state: user?.state || 'Assam', lat: '', lng: '', description: '' });
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState('feed');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getAlerts({ limit: 20 }).
    then((d) => setAlerts(d.alerts || [])).
    catch((e) => setMsg(e.message)).
    finally(() => setLoading(false));
    api.getMyReports().
    then((d) => setMyReports(d.reports || [])).
    catch(() => {});
  }, []);

  const submitAlert = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      await api.createAlert({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) });
      setMsg('✅ Alert submitted successfully!');
      setForm({ ...form, location: '', lat: '', lng: '', description: '' });
      const d = await api.getAlerts({ limit: 20 });
      setAlerts(d.alerts || []);
      const r = await api.getMyReports();
      setMyReports(r.reports || []);
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
    setPosting(false);
  };

  const NE_STATES = ['Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'];

  const QUICK_LOCATIONS = [
  { name: 'Custom Map Location', state: 'Assam', loc: '', lat: '', lng: '' },
  { name: 'Kaziranga Eastern Range', state: 'Assam', loc: 'Kaziranga National Park - Eastern Range', lat: 26.600, lng: 93.450 },
  { name: 'Manas Buffer Zone', state: 'Assam', loc: 'Manas National Park - Buffer Zone', lat: 26.720, lng: 91.100 },
  { name: 'Namdapha Tiger Corridor', state: 'Arunachal Pradesh', loc: 'Namdapha National Park', lat: 27.500, lng: 96.200 },
  { name: 'Keibul Lamjao Wetlands', state: 'Manipur', loc: 'Keibul Lamjao National Park', lat: 24.550, lng: 93.900 },
  { name: 'Nokrek Biosphere Reserve', state: 'Meghalaya', loc: 'Nokrek National Park', lat: 25.420, lng: 90.350 },
  { name: 'Dzukou Valley', state: 'Nagaland', loc: 'Dzukou Valley Trek', lat: 25.500, lng: 94.080 }];


  const URGENCY_COLOR = {
    'High — immediate risk to life or wildlife': '#ff1744',
    'Medium — situation developing': '#ff9100',
    'Low — no immediate danger': '#29b6f6'
  };
  const STATUS_COLOR = { pending: '#facc15', reviewed: '#29b6f6', resolved: '#4CAF50' };

  return (
    _jsxDEV("div", { className: "page-root role-page", children: [
      _jsxDEV("div", { className: "page-header-bar", children:
        _jsxDEV("div", { children: [
          _jsxDEV("div", { className: "role-badge worker-badge", children: [_jsxDEV(ShieldAlert, { size: 14 }, void 0, false), " Field Worker Dashboard"] }, void 0, true),
          _jsxDEV("h1", { className: "page-title", children: ["Asha Worker — ", user?.state] }, void 0, true),
          _jsxDEV("p", { className: "page-sub", children: "Create alerts · Monitor incidents · File reports" }, void 0, false)] }, void 0, true
        ) }, void 0, false
      ),

      msg && _jsxDEV("div", { className: `admin-msg ${msg.startsWith('❌') ? 'error' : ''}`, children: [msg, " ", _jsxDEV("button", { onClick: () => setMsg(''), children: "✕" }, void 0, false)] }, void 0, true),


      _jsxDEV("div", { className: "worker-stats", children:
        [
        { icon: Bell, label: 'Alerts Today', value: alerts.filter((a) => a.status === 'active').length, color: '#ef4444' },
        { icon: FileText, label: 'My Reports', value: user?.reports || 0, color: '#16a34a' },
        { icon: MapPin, label: 'Active Zone', value: user?.state || 'NE India', color: '#f97316' },
        { icon: CheckCircle, label: 'Resolved (30d)', value: alerts.filter((a) => a.status === 'resolved').length, color: '#22c55e' }].
        map((s) =>
        _jsxDEV("div", { className: "worker-stat", style: { '--wc': s.color }, children: [
          _jsxDEV(s.icon, { size: 20, style: { color: 'var(--wc)' } }, void 0, false),
          _jsxDEV("div", { className: "ws-val", children: s.value }, void 0, false),
          _jsxDEV("div", { className: "ws-lbl", children: s.label }, void 0, false)] }, s.label, true
        )
        ) }, void 0, false
      ),

      _jsxDEV("div", { className: "role-tabs", children:
        ['feed', 'create', 'reports', 'map'].map((t) =>
        _jsxDEV("button", { className: `rtab ${tab === t ? 'active' : ''}`, onClick: () => setTab(t), children:
          t === 'feed' ? '📡 Live Feed' : t === 'create' ? '➕ Create Alert' : t === 'reports' ? '📋 Reports Inbox' : '🗺️ Map' }, t, false
        )
        ) }, void 0, false
      ),


      tab === 'feed' &&
      _jsxDEV("div", { className: "panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: [_jsxDEV(Bell, { size: 15 }, void 0, false), " Live Alert Feed"] }, void 0, true) }, void 0, false),
        loading ? _jsxDEV("div", { className: "role-loading", children: _jsxDEV("div", { className: "role-spinner" }, void 0, false) }, void 0, false) :
        _jsxDEV("div", { className: "worker-feed", children:
          alerts.map((a, i) =>
          _jsxDEV("div", { className: `wf-item sev-${a.severity}`, children: [
            _jsxDEV("div", { className: `wf-bar sev-${a.severity}` }, void 0, false),
            _jsxDEV("div", { className: "wf-body", children: [
              _jsxDEV("div", { className: "wf-top", children: [
                _jsxDEV("span", { className: `sev-badge ${a.severity}`, children: a.severity }, void 0, false),
                _jsxDEV("span", { className: "wf-type", children: a.type }, void 0, false),
                _jsxDEV("span", { className: "wf-time", children: [_jsxDEV(Clock, { size: 11 }, void 0, false), " ", new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })] }, void 0, true)] }, void 0, true
              ),
              _jsxDEV("div", { className: "wf-loc", children: [_jsxDEV(MapPin, { size: 11 }, void 0, false), " ", a.location] }, void 0, true),
              _jsxDEV("div", { className: "wf-desc", children: a.description }, void 0, false)] }, void 0, true
            )] }, a._id || i, true
          )
          ) }, void 0, false
        )] }, void 0, true

      ),



      tab === 'create' &&
      _jsxDEV("div", { className: "panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: [_jsxDEV(Plus, { size: 15 }, void 0, false), " Submit New Alert"] }, void 0, true) }, void 0, false),
        _jsxDEV("form", { className: "worker-form", onSubmit: submitAlert, children: [
          _jsxDEV("div", { className: "wf-grid", children: [
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "Alert Type" }, void 0, false),
              _jsxDEV("select", { value: form.type, onChange: (e) => setForm((f) => ({ ...f, type: e.target.value })), className: "auth-select", children:
                ['Wildlife', 'Deforestation', 'Wildfire', 'Poaching', 'Conflict', 'Other'].map((t) => _jsxDEV("option", { children: t }, t, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "Severity" }, void 0, false),
              _jsxDEV("select", { value: form.severity, onChange: (e) => setForm((f) => ({ ...f, severity: e.target.value })), className: "auth-select", children:
                ['info', 'warning', 'critical'].map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "Quick Location Fill" }, void 0, false),
              _jsxDEV("select", { className: "auth-select", onChange: (e) => {
                  const sel = QUICK_LOCATIONS.find((q) => q.name === e.target.value);
                  if (sel && sel.name !== 'Custom Map Location') {
                    setForm((f) => ({ ...f, state: sel.state, location: sel.loc, lat: sel.lat, lng: sel.lng }));
                  }
                }, children:
                QUICK_LOCATIONS.map((q) => _jsxDEV("option", { value: q.name, children: q.name }, q.name, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "State" }, void 0, false),
              _jsxDEV("select", { value: form.state, onChange: (e) => setForm((f) => ({ ...f, state: e.target.value })), className: "auth-select", children:
                NE_STATES.map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field full", children: [
              _jsxDEV("label", { children: "Location Description" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", required: true, placeholder: "e.g. Kaziranga NP, eastern range", value: form.location, onChange: (e) => setForm((f) => ({ ...f, location: e.target.value })) }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "Latitude" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", type: "number", step: "0.001", required: true, placeholder: "26.570", value: form.lat, onChange: (e) => setForm((f) => ({ ...f, lat: e.target.value })) }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [
              _jsxDEV("label", { children: "Longitude" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", type: "number", step: "0.001", required: true, placeholder: "93.170", value: form.lng, onChange: (e) => setForm((f) => ({ ...f, lng: e.target.value })) }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field full", children: [
              _jsxDEV("label", { children: "Description" }, void 0, false),
              _jsxDEV("textarea", { className: "edit-input", rows: 3, placeholder: "Describe what you observed…", value: form.description, onChange: (e) => setForm((f) => ({ ...f, description: e.target.value })) }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),
          _jsxDEV("button", { type: "submit", className: "auth-btn", disabled: posting, style: { maxWidth: 220 }, children:
            posting ? _jsxDEV(_Fragment, { children: [_jsxDEV("span", { className: "spin" }, void 0, false), " Submitting…"] }, void 0, true) : _jsxDEV(_Fragment, { children: [_jsxDEV(Plus, { size: 15 }, void 0, false), " Submit Alert"] }, void 0, true) }, void 0, false
          )] }, void 0, true
        )] }, void 0, true
      ),



      tab === 'reports' &&
      _jsxDEV(ReportsInbox, {}, void 0, false),


      tab === 'map' &&
      _jsxDEV("div", { className: "panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: ["🗺️ Live Alert Map — ", user?.state || 'NE India'] }, void 0, true) }, void 0, false),
        _jsxDEV("div", { style: { height: 400, borderRadius: 12, overflow: 'hidden' }, children:
          _jsxDEV(MapContainer, { center: [26.0, 93.0], zoom: 6, style: { height: '100%', width: '100%' }, scrollWheelZoom: false, children: [
            _jsxDEV(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              attribution: "© OSM © CARTO" }, void 0, false),
            alerts.map((a) =>
            _jsxDEV(React.Fragment, { children: [
              _jsxDEV(Circle, {
                center: [a.coordinates?.lat || 26, a.coordinates?.lng || 93],
                radius: a.severity === 'critical' ? 12000 : a.severity === 'warning' ? 8000 : 5000,
                pathOptions: {
                  color: a.severity === 'critical' ? '#ff1744' : a.severity === 'warning' ? '#ff9100' : '#29b6f6',
                  fillOpacity: 0.2, weight: 1.5,
                  className: 'map-pulse-circle'
                } }, void 0, false
              ),
              _jsxDEV(Marker, {
                position: [a.coordinates?.lat || 26, a.coordinates?.lng || 93],
                icon: L.divIcon({
                  html: `<div class="glow-marker" style="--mc: ${a.severity === 'critical' ? '#ff1744' : a.severity === 'warning' ? '#ff9100' : '#29b6f6'}">
                               <div class="core"></div>
                               <div class="ring"></div>
                             </div>`,
                  className: '',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                }), children:

                _jsxDEV(Popup, { children: [
                  _jsxDEV("strong", { children: a.type }, void 0, false), _jsxDEV("br", {}, void 0, false),
                  a.location, _jsxDEV("br", {}, void 0, false),
                  _jsxDEV("span", { style: { color: a.severity === 'critical' ? '#ff1744' : a.severity === 'warning' ? '#ff9100' : '#29b6f6', fontWeight: 700 }, children:
                    a.severity?.toUpperCase() }, void 0, false
                  )] }, void 0, true
                ) }, void 0, false
              )] }, a._id, true
            )
            )] }, void 0, true
          ) }, void 0, false
        ),
        _jsxDEV("p", { style: { color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }, children: ["Showing ",
          alerts.length, " active alerts · Click markers to view details ·",
          _jsxDEV(Link, { to: "/conflict", style: { color: '#4CAF50', marginLeft: 6 }, children: "Open Conflict Monitor →" }, void 0, false)] }, void 0, true
        )] }, void 0, true
      )] }, void 0, true

    ));

};

export default WorkerDashboard;