import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ShieldAlert, Users, AlertTriangle, Clock, MapPin,
  TrendingUp, CheckCircle, XCircle, Activity, RefreshCw, Plus, X } from
'lucide-react';
import { MapLayerControl, useMapLayer } from '../components/MapLayerControl';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ConflictMonitor.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const SEV_COLOR = { high: '#ff1744', medium: '#ff9100', low: '#fdd835' };
const STATUS_ICON = { ongoing: XCircle, contained: ShieldAlert, monitoring: Activity, resolved: CheckCircle };
const STATUS_COLOR = { ongoing: '#ff1744', contained: '#ff9100', monitoring: '#29b6f6', resolved: '#4CAF50' };
const STATES = ['All States', 'Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'];
const NE_STATES = ['Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'];

const QUICK_LOCATIONS = [
{ name: 'Custom Map Location', state: 'Assam', loc: '', lat: '', lng: '' },
{ name: 'Kaziranga Eastern Range', state: 'Assam', loc: 'Kaziranga National Park - Eastern Range', lat: 26.600, lng: 93.450 },
{ name: 'Manas Buffer Zone', state: 'Assam', loc: 'Manas National Park - Buffer Zone', lat: 26.720, lng: 91.100 },
{ name: 'Namdapha Tiger Corridor', state: 'Arunachal Pradesh', loc: 'Namdapha National Park', lat: 27.500, lng: 96.200 },
{ name: 'Keibul Lamjao Wetlands', state: 'Manipur', loc: 'Keibul Lamjao National Park', lat: 24.550, lng: 93.900 },
{ name: 'Nokrek Biosphere Reserve', state: 'Meghalaya', loc: 'Nokrek National Park', lat: 25.420, lng: 90.350 },
{ name: 'Dzukou Valley', state: 'Nagaland', loc: 'Dzukou Valley Trek', lat: 25.500, lng: 94.080 }];


const BLANK_FORM = { animal: '', location: '', state: 'Assam', lat: '', lng: '', severity: 'medium', casualties: 0, damage: '', response: '' };

const ConflictMonitor = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'asha_worker' || user?.role === 'admin';

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterSev, setFilterSev] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterState, setFilterState] = useState('All States');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState('');
  const { activeLayer, setActiveLayer, layerConfig } = useMapLayer('satellite');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getIncidents({ limit: 100 });
      setIncidents(res.incidents || []);
    } catch (e) {
      setMsg('Failed to load incidents: ' + e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);

  const filtered = incidents.filter((i) => {
    const sv = filterSev === 'all' || i.severity === filterSev;
    const st = filterStatus === 'all' || i.status === filterStatus;
    const ss = filterState === 'All States' || i.state === filterState;
    return sv && st && ss;
  });

  const ongoing = incidents.filter((i) => i.status === 'ongoing').length;
  const highSev = incidents.filter((i) => i.severity === 'high').length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;
  const casualties = incidents.reduce((s, i) => s + (i.casualties || 0), 0);

  const submitIncident = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      await api.createIncident({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) });
      setMsg('✅ Incident logged successfully!');
      setForm(BLANK_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
    setPosting(false);
  };

  const updateStatus = async (id, status) => {
    await api.updateIncident(id, { status });
    await load();
  };

  return (
    _jsxDEV("div", { className: "page-root cm-page", children: [
      _jsxDEV("div", { className: "page-header-bar", children: [
        _jsxDEV("div", { children: [
          _jsxDEV("h1", { className: "page-title", children: "Conflict Monitor — North East India" }, void 0, false),
          _jsxDEV("p", { className: "page-sub", children: ["Human-wildlife conflict tracking · ",
            incidents.length, " incidents in DB · Live from MongoDB"] }, void 0, true

          )] }, void 0, true
        ),
        _jsxDEV("div", { style: { display: 'flex', gap: 10 }, children: [
          _jsxDEV("span", { className: "live-pill", children: [_jsxDEV("span", { className: "live-dot" }, void 0, false), " LIVE"] }, void 0, true),
          _jsxDEV("button", { className: "icon-btn", onClick: load, disabled: loading, children: [
            _jsxDEV(RefreshCw, { size: 14, className: loading ? 'spin-anim' : '' }, void 0, false), " Refresh"] }, void 0, true
          ),
          canCreate &&
          _jsxDEV("button", { className: "icon-btn create-btn", onClick: () => setShowForm((f) => !f), children:
            showForm ? _jsxDEV(_Fragment, { children: [_jsxDEV(X, { size: 14 }, void 0, false), " Cancel"] }, void 0, true) : _jsxDEV(_Fragment, { children: [_jsxDEV(Plus, { size: 14 }, void 0, false), " Log Incident"] }, void 0, true) }, void 0, false
          )] }, void 0, true

        )] }, void 0, true
      ),

      msg && _jsxDEV("div", { className: `admin-msg ${msg.startsWith('❌') ? 'error' : ''}`, children: [msg, " ", _jsxDEV("button", { onClick: () => setMsg(''), children: "✕" }, void 0, false)] }, void 0, true),


      showForm && canCreate &&
      _jsxDEV("div", { className: "panel", style: { marginBottom: 20 }, children: [
        _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: [_jsxDEV(Plus, { size: 15 }, void 0, false), " Log New Conflict Incident"] }, void 0, true) }, void 0, false),
        _jsxDEV("form", { className: "worker-form", onSubmit: submitIncident, children: [
          _jsxDEV("div", { className: "wf-grid", children: [
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Animal / Species" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", required: true, placeholder: "e.g. Asian Elephant", value: form.animal, onChange: (e) => setForm((f) => ({ ...f, animal: e.target.value })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Quick Location Fill" }, void 0, false),
              _jsxDEV("select", { className: "auth-select", onChange: (e) => {
                  const sel = QUICK_LOCATIONS.find((q) => q.name === e.target.value);
                  if (sel && sel.name !== 'Custom Map Location') {
                    setForm((f) => ({ ...f, state: sel.state, location: sel.loc, lat: sel.lat, lng: sel.lng }));
                  }
                }, children:
                QUICK_LOCATIONS.map((q) => _jsxDEV("option", { value: q.name, children: q.name }, q.name, false)) }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "State" }, void 0, false),
              _jsxDEV("select", { className: "auth-select", value: form.state, onChange: (e) => setForm((f) => ({ ...f, state: e.target.value })), children:
                NE_STATES.map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Severity" }, void 0, false),
              _jsxDEV("select", { className: "auth-select", value: form.severity, onChange: (e) => setForm((f) => ({ ...f, severity: e.target.value })), children:
                ['low', 'medium', 'high'].map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Casualties" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", type: "number", min: 0, value: form.casualties, onChange: (e) => setForm((f) => ({ ...f, casualties: parseInt(e.target.value) || 0 })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field full", children: [_jsxDEV("label", { children: "Location Description" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", required: true, placeholder: "e.g. Kaziranga NP, eastern range, Assam", value: form.location, onChange: (e) => setForm((f) => ({ ...f, location: e.target.value })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Latitude" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", type: "number", step: "0.001", required: true, placeholder: "26.570", value: form.lat, onChange: (e) => setForm((f) => ({ ...f, lat: e.target.value })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field", children: [_jsxDEV("label", { children: "Longitude" }, void 0, false),
              _jsxDEV("input", { className: "edit-input", type: "number", step: "0.001", required: true, placeholder: "93.170", value: form.lng, onChange: (e) => setForm((f) => ({ ...f, lng: e.target.value })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field full", children: [_jsxDEV("label", { children: "Damage Description" }, void 0, false),
              _jsxDEV("textarea", { className: "edit-input", rows: 2, placeholder: "Describe damage…", value: form.damage, onChange: (e) => setForm((f) => ({ ...f, damage: e.target.value })) }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "wf-field full", children: [_jsxDEV("label", { children: "Response Action" }, void 0, false),
              _jsxDEV("textarea", { className: "edit-input", rows: 2, placeholder: "What response was taken?", value: form.response, onChange: (e) => setForm((f) => ({ ...f, response: e.target.value })) }, void 0, false)] }, void 0, true)] }, void 0, true
          ),
          _jsxDEV("button", { type: "submit", className: "auth-btn", disabled: posting, style: { maxWidth: 220 }, children:
            posting ? 'Submitting…' : _jsxDEV(_Fragment, { children: [_jsxDEV(Plus, { size: 14 }, void 0, false), " Log Incident"] }, void 0, true) }, void 0, false
          )] }, void 0, true
        )] }, void 0, true
      ),



      _jsxDEV("div", { className: "cm-stats", children:
        [
        { icon: AlertTriangle, label: 'Ongoing Incidents', value: ongoing, color: '#ff1744' },
        { icon: ShieldAlert, label: 'High Severity', value: highSev, color: '#ff9100' },
        { icon: CheckCircle, label: 'Resolved', value: resolved, color: '#4CAF50' },
        { icon: Users, label: 'Human Casualties', value: casualties, color: '#ab47bc' }].
        map((s) =>
        _jsxDEV("div", { className: "cm-stat", style: { '--c': s.color }, children: [
          _jsxDEV("div", { className: "cms-icon", children: _jsxDEV(s.icon, { size: 22 }, void 0, false) }, void 0, false),
          _jsxDEV("div", { className: "cms-val", children: s.value }, void 0, false),
          _jsxDEV("div", { className: "cms-lbl", children: s.label }, void 0, false)] }, s.label, true
        )
        ) }, void 0, false
      ),


      _jsxDEV("div", { className: "panel cm-map-panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: [
          _jsxDEV("h3", { children: [_jsxDEV(MapPin, { size: 15 }, void 0, false), " Conflict Zone Map — North East India"] }, void 0, true),
          _jsxDEV("div", { className: "map-legend-row", children:
            Object.entries(SEV_COLOR).map(([k, c]) =>
            _jsxDEV("span", { className: "leg-item", children: [
              _jsxDEV("span", { className: "leg-dot", style: { background: c } }, void 0, false), k] }, k, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ),
        loading ?
        _jsxDEV("div", { style: { height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }, children: "Loading map data…" }, void 0, false) :

        _jsxDEV("div", { style: { position: 'relative' }, children: [
          _jsxDEV(MapContainer, { center: [26.0, 93.0], zoom: 6, className: "cm-map", scrollWheelZoom: false, children: [
            _jsxDEV(TileLayer, { url: layerConfig.url, attribution: layerConfig.attribution }, void 0, false),
            filtered.map((i) =>
            _jsxDEV(React.Fragment, { children: [
              _jsxDEV(Circle, {
                center: [i.coordinates?.lat || 26, i.coordinates?.lng || 93],
                radius: i.severity === 'high' ? 10000 : i.severity === 'medium' ? 7000 : 5000,
                pathOptions: {
                  color: SEV_COLOR[i.severity] || '#aaa',
                  fillColor: SEV_COLOR[i.severity] || '#aaa',
                  fillOpacity: 0.3, weight: 2,
                  className: i.status === 'ongoing' ? 'map-glow-pulse' : ''
                },
                eventHandlers: { click: () => setSelected(i) }, children:

                _jsxDEV(Popup, { children: [
                  _jsxDEV("strong", { children: i.animal }, void 0, false), _jsxDEV("br", {}, void 0, false),
                  i.location, _jsxDEV("br", {}, void 0, false),
                  _jsxDEV("span", { style: { color: SEV_COLOR[i.severity], fontWeight: 700 }, children: i.severity?.toUpperCase() }, void 0, false),
                  _jsxDEV("br", {}, void 0, false), _jsxDEV("small", { children: ["Status: ", i.status] }, void 0, true)] }, void 0, true
                ) }, void 0, false
              ),
              _jsxDEV(Marker, {
                position: [i.coordinates?.lat || 26, i.coordinates?.lng || 93],
                eventHandlers: { click: () => setSelected(i) },
                icon: L.divIcon({
                  html: `<div class="glow-marker" style="--mc: ${SEV_COLOR[i.severity] || '#aaa'}">
                               <div class="core"></div>
                               ${i.status === 'ongoing' ? '<div class="ring"></div>' : ''}
                             </div>`,
                  className: '',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                }) }, void 0, false
              )] }, i._id, true
            )
            )] }, void 0, true
          ),
          _jsxDEV(MapLayerControl, { activeLayer: activeLayer, setActiveLayer: setActiveLayer }, void 0, false)] }, void 0, true
        )] }, void 0, true

      ),


      _jsxDEV("div", { className: "panel cm-table-panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: [
          _jsxDEV("h3", { children: ["Incident Log ", _jsxDEV("span", { style: { fontSize: '0.72rem', color: '#555', fontWeight: 400 }, children: "Live from MongoDB" }, void 0, false)] }, void 0, true),
          _jsxDEV("div", { className: "cm-filters", children: [
            _jsxDEV("select", { className: "filter-select", value: filterState, onChange: (e) => setFilterState(e.target.value), children:
              STATES.map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false
            ),
            _jsxDEV("select", { className: "filter-select", value: filterSev, onChange: (e) => setFilterSev(e.target.value), children: [
              _jsxDEV("option", { value: "all", children: "All Severity" }, void 0, false),
              _jsxDEV("option", { value: "high", children: "High" }, void 0, false),
              _jsxDEV("option", { value: "medium", children: "Medium" }, void 0, false),
              _jsxDEV("option", { value: "low", children: "Low" }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("select", { className: "filter-select", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [
              _jsxDEV("option", { value: "all", children: "All Status" }, void 0, false),
              _jsxDEV("option", { value: "ongoing", children: "Ongoing" }, void 0, false),
              _jsxDEV("option", { value: "contained", children: "Contained" }, void 0, false),
              _jsxDEV("option", { value: "monitoring", children: "Monitoring" }, void 0, false),
              _jsxDEV("option", { value: "resolved", children: "Resolved" }, void 0, false)] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true
        ),

        loading ?
        _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#666' }, children: "Loading incidents from database…" }, void 0, false) :
        filtered.length === 0 ?
        _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#555' }, children: ["No incidents found.",
          canCreate && _jsxDEV(_Fragment, { children: [" Click ", _jsxDEV("strong", { children: "\"Log Incident\"" }, void 0, false), " to add one."] }, void 0, true)] }, void 0, true
        ) :

        _jsxDEV("div", { className: "cm-table-wrap", children:
          _jsxDEV("table", { className: "cm-table", children: [
            _jsxDEV("thead", { children: _jsxDEV("tr", { children: [
                _jsxDEV("th", { children: "Animal / Species" }, void 0, false), _jsxDEV("th", { children: "Location" }, void 0, false), _jsxDEV("th", { children: "State" }, void 0, false),
                _jsxDEV("th", { children: "Date" }, void 0, false), _jsxDEV("th", { children: "Severity" }, void 0, false), _jsxDEV("th", { children: "Status" }, void 0, false), _jsxDEV("th", { children: "Response" }, void 0, false),
                canCreate && _jsxDEV("th", { children: "Actions" }, void 0, false)] }, void 0, true
              ) }, void 0, false),
            _jsxDEV("tbody", { children:
              filtered.map((i) => {
                const SIcon = STATUS_ICON[i.status] || Activity;
                return (
                  _jsxDEV("tr", { className: selected?._id === i._id ? 'tr-sel' : '',
                    onClick: () => setSelected(i === selected ? null : i), children: [
                    _jsxDEV("td", { className: "animal-cell", children: i.animal }, void 0, false),
                    _jsxDEV("td", { children: [_jsxDEV(MapPin, { size: 11 }, void 0, false), " ", i.location] }, void 0, true),
                    _jsxDEV("td", { style: { fontSize: '0.8rem', color: '#666' }, children: i.state }, void 0, false),
                    _jsxDEV("td", { style: { fontSize: '0.8rem' }, children: i.date || new Date(i.createdAt).toLocaleDateString('en-IN') }, void 0, false),
                    _jsxDEV("td", { children:
                      _jsxDEV("span", { className: "sev-pill", style: {
                          background: (SEV_COLOR[i.severity] || '#aaa') + '22',
                          color: SEV_COLOR[i.severity] || '#aaa',
                          border: `1px solid ${SEV_COLOR[i.severity] || '#aaa'}44`
                        }, children: i.severity }, void 0, false) }, void 0, false
                    ),
                    _jsxDEV("td", { children:
                      _jsxDEV("span", { className: "status-pill", style: { color: STATUS_COLOR[i.status] || '#aaa' }, children: [
                        _jsxDEV(SIcon, { size: 12 }, void 0, false), " ", i.status] }, void 0, true
                      ) }, void 0, false
                    ),
                    _jsxDEV("td", { className: "response-cell", children: i.response }, void 0, false),
                    canCreate &&
                    _jsxDEV("td", { onClick: (e) => e.stopPropagation(), children:
                      i.status !== 'resolved' &&
                      _jsxDEV("button", {
                        className: "tbl-btn",
                        title: "Mark Resolved",
                        onClick: () => updateStatus(i._id, 'resolved'), children:
                        _jsxDEV(CheckCircle, { size: 13 }, void 0, false) }, void 0, false
                      ) }, void 0, false

                    )] }, i._id, true

                  ));

              }) }, void 0, false
            )] }, void 0, true
          ) }, void 0, false
        ),


        selected &&
        _jsxDEV("div", { className: "cm-detail", children:
          _jsxDEV("div", { className: "cm-detail-grid", children: [
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "Species:" }, void 0, false), " ", selected.animal] }, void 0, true),
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "State:" }, void 0, false), " ", selected.state] }, void 0, true),
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "Location:" }, void 0, false), " ", selected.location] }, void 0, true),
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "Date:" }, void 0, false), " ", selected.date || new Date(selected.createdAt).toLocaleDateString('en-IN')] }, void 0, true),
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "Casualties:" }, void 0, false), " ", selected.casualties] }, void 0, true),
            _jsxDEV("div", { children: [_jsxDEV("strong", { children: "Severity:" }, void 0, false), " ", _jsxDEV("span", { style: { color: SEV_COLOR[selected.severity] }, children: selected.severity }, void 0, false)] }, void 0, true),
            selected.damage && _jsxDEV("div", { className: "full-col", children: [_jsxDEV("strong", { children: "Damage:" }, void 0, false), " ", selected.damage] }, void 0, true),
            selected.response && _jsxDEV("div", { className: "full-col", children: [_jsxDEV("strong", { children: "Response:" }, void 0, false), " ", selected.response] }, void 0, true)] }, void 0, true
          ) }, void 0, false
        )] }, void 0, true

      )] }, void 0, true
    ));

};

export default ConflictMonitor;