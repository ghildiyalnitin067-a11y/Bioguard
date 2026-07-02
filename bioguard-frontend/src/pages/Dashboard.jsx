import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, TreePine, Eye, Zap, ArrowUpRight,
  ArrowDownRight, Clock, MapPin, Activity, ChevronRight, RefreshCw,
  Radio, Bell } from
'lucide-react';
import { MapLayerControl, useMapLayer } from '../components/MapLayerControl';
import api from '../services/api';
import './Dashboard.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const SEV_COLOR = { critical: '#ff1744', warning: '#ff9100', info: '#29b6f6' };

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}


function makeLiveGlowIcon(severity) {
  const c = SEV_COLOR[severity] || '#ff9100';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${c}22;
        border:2.5px solid ${c};display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 0 0 ${c}99;animation:liveMarkerPulse 1.5s ease-out infinite;">
        <span style="font-size:14px;">🔴</span>
      </div>
    </div>
    <style>
      @keyframes liveMarkerPulse {
        0%   { box-shadow: 0 0 0 0 ${c}99; }
        70%  { box-shadow: 0 0 0 14px ${c}00; }
        100% { box-shadow: 0 0 0 0 ${c}00; }
      }
    </style>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}


function makeDbIcon(severity) {
  const c = SEV_COLOR[severity] || '#29b6f6';
  return L.divIcon({
    html: `<div class="glow-marker" style="--mc:${c}">
             <div class="core"></div>
             <div class="ring"></div>
           </div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);


  const [mlZones, setMlZones] = useState([]);
  const [gbifData, setGbifData] = useState([]);
  const [forestAlerts, setForestAlerts] = useState([]);
  const [clickPrediction, setClickPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const { activeLayer, setActiveLayer, layerConfig } = useMapLayer('satellite');

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setPredicting(true);
        setClickPrediction({ lat, lng, loading: true });
        try {
          const data = await api.predictRiskPython(lat, lng);
          setClickPrediction({ lat, lng, data, loading: false });
        } catch (err) {
          setClickPrediction({ lat, lng, error: 'Failed to predict risk.', loading: false });
        }
        setPredicting(false);
      }
    });
    return null;
  };


  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const WS_URL = API_URL.replace(/^http/, 'ws');

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);

          setTimeout(connect, 5000);
        };
        ws.onerror = () => {};

        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);


            if (msg.event === 'new_alert') {
              const a = { ...msg.data, _id: msg.data._id || msg.data.id, _live: true, _liveAt: Date.now() };
              setLiveAlerts((prev) => {
                if (prev.find((x) => x._id === a._id)) return prev;
                return [a, ...prev.slice(0, 9)];
              });
              setAlerts((prev) => {
                if (prev.find((x) => x._id === a._id)) return prev;
                return [a, ...prev.slice(0, 49)];
              });
              setLiveCount((c) => c + 1);

              setActivity((prev) => [{
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                event: `🔴 LIVE — ${a.type} alert at ${a.location}`,
                type: a.severity === 'critical' ? 'danger' : 'warning'
              }, ...prev.slice(0, 7)]);
            }


            if (msg.event === 'realtime_alert_batch' && msg.data?.alerts) {
              const batch = msg.data.alerts.map((a) => ({
                ...a, _id: a._id || a.id || `rt-${Date.now()}-${Math.random()}`,
                _live: true, _liveAt: Date.now(), source: a.source || 'system'
              }));
              setLiveAlerts((prev) => {
                const merged = [...batch.filter((a) => !prev.find((x) => x._id === a._id)), ...prev];
                return merged.slice(0, 10);
              });
              setLiveCount((c) => c + batch.length);
            }


            if (msg.event === 'alert_resolved') {
              setAlerts((prev) => prev.map((a) =>
              a._id === (msg.data._id || msg.data.id) ? { ...a, status: 'resolved' } : a
              ));
            }
          } catch (_) {}
        };
      } catch (_) {}
    };

    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, statsRes, mlRes, forestRes] = await Promise.all([
      api.getAlerts({ limit: 50 }),
      api.adminStats().catch(() => null),
      api.getMLPredictions().catch(() => ({ predictions: [] })),
      api.getForestAlerts().catch(() => ({ alerts: [] }))]
      );

      const live = alertRes.alerts || [];
      setAlerts(live);
      if (!selected && live.length) setSelected(live[0]);

      if (statsRes) setStats(statsRes.stats);
      if (mlRes.predictions) setMlZones(mlRes.predictions);
      if (forestRes.alerts) setForestAlerts(forestRes.alerts);


      api.getWildlifeData(26.2, 93.0, 300, 100).then((data) => {
        if (data.occurrences) setGbifData(data.occurrences);
      }).catch(() => {});


      const acts = live.slice(0, 8).map((a) => ({
        time: new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        event: `${a.type} alert — ${a.location} (${a.action || 'Monitoring'})`,
        type: a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'
      }));
      setActivity(acts.length ? acts : [
      { time: '--', event: 'No recent activity. Submit alerts to populate this log.', type: 'info' }]
      );
    } catch (e) {
      console.error('[Dashboard] load error', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);


  const allAlerts = React.useMemo(() => {
    const ids = new Set();
    const merged = [];
    for (const a of [...liveAlerts, ...alerts]) {
      if (!ids.has(a._id)) {ids.add(a._id);merged.push(a);}
    }
    return merged;
  }, [liveAlerts, alerts]);

  const filtered = filter === 'all' ? allAlerts : allAlerts.filter((a) => a.severity === filter);

  const statCards = [
  {
    icon: TreePine,
    label: 'NE Forest Cover',
    value: '65.0%',
    delta: '−0.4%',
    down: true,
    color: '#4CAF50'
  },
  {
    icon: AlertTriangle,
    label: 'Active Alerts',
    value: stats ? stats.activeAlerts : allAlerts.filter((a) => a.status === 'active').length,
    delta: stats ? `${stats.totalAlerts} total` : '—',
    down: false,
    color: '#ff9100'
  },
  {
    icon: Eye,
    label: 'Protected Areas',
    value: '82',
    delta: '8 states',
    down: false,
    color: '#29b6f6'
  },
  {
    icon: Zap,
    label: 'Incidents (DB)',
    value: stats ? stats.totalIncidents : '—',
    delta: stats ? `${stats.ongoingIncidents || 0} ongoing` : '—',
    down: (stats?.ongoingIncidents || 0) > 0,
    color: '#ab47bc'
  }];


  return (
    _jsxDEV("div", { className: "page-root db-page", children: [
      _jsxDEV("style", { children: `
        @keyframes liveRingPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(1.15); }
        }
        @keyframes liveSlideIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes wsDot {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }
      ` }, void 0, false),


      _jsxDEV("div", { className: "page-header-bar", children: [
        _jsxDEV("div", { children: [
          _jsxDEV("h1", { className: "page-title", children: "Live Dashboard — North East India" }, void 0, false),
          _jsxDEV("p", { className: "page-sub", children: ["Real-time biodiversity monitoring · ",
            allAlerts.length, " alerts · Assam · Arunachal Pradesh · Meghalaya · Nagaland · Manipur · Mizoram · Tripura · Sikkim"] }, void 0, true

          )] }, void 0, true
        ),
        _jsxDEV("div", { className: "header-actions", children: [

          _jsxDEV("span", { style: {
              fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
              color: wsConnected ? '#4caf50' : '#ff5252',
              background: wsConnected ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)',
              border: `1px solid ${wsConnected ? 'rgba(76,175,80,0.3)' : 'rgba(255,82,82,0.3)'}`,
              borderRadius: 100, padding: '4px 10px'
            }, children: [
            _jsxDEV("span", { style: {
                width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                background: wsConnected ? '#4caf50' : '#ff5252',
                animation: wsConnected ? 'wsDot 2s infinite' : 'none'
              } }, void 0, false),
            wsConnected ? 'WS Live' : 'WS Offline'] }, void 0, true
          ),
          liveCount > 0 &&
          _jsxDEV("span", { style: {
              fontSize: '0.7rem', fontWeight: 800, color: '#ff5252',
              background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.3)',
              borderRadius: 100, padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 5
            }, children: [
            _jsxDEV(Bell, { size: 12 }, void 0, false), " ", liveCount, " Live"] }, void 0, true
          ),

          _jsxDEV("span", { className: "live-pill", children: [_jsxDEV("span", { className: "live-dot" }, void 0, false), " LIVE"] }, void 0, true),
          _jsxDEV("button", { className: "icon-btn", onClick: load, disabled: loading, children: [
            _jsxDEV(RefreshCw, { size: 14, className: loading ? 'spin-anim' : '' }, void 0, false), " Refresh"] }, void 0, true
          )] }, void 0, true
        )] }, void 0, true
      ),


      _jsxDEV("div", { className: "stat-row", children:
        statCards.map((s) =>
        _jsxDEV("div", { className: "stat-card", style: { '--c': s.color }, children: [
          _jsxDEV("div", { className: "sc-icon", children: _jsxDEV(s.icon, { size: 22 }, void 0, false) }, void 0, false),
          _jsxDEV("div", { className: "sc-body", children: [
            _jsxDEV("div", { className: "sc-value", children: s.value }, void 0, false),
            _jsxDEV("div", { className: "sc-label", children: s.label }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("div", { className: `sc-delta ${s.down ? 'bad' : 'good'}`, children: [
            s.down ? _jsxDEV(ArrowDownRight, { size: 13 }, void 0, false) : _jsxDEV(ArrowUpRight, { size: 13 }, void 0, false), " ", s.delta] }, void 0, true
          )] }, s.label, true
        )
        ) }, void 0, false
      ),


      _jsxDEV("div", { className: "db-grid", children: [

        _jsxDEV("div", { className: "panel map-panel", children: [
          _jsxDEV("div", { className: "panel-hdr", children: [
            _jsxDEV("h3", { children: [_jsxDEV(Activity, { size: 16 }, void 0, false), " Threat Map — North East India"] }, void 0, true),
            _jsxDEV("span", { className: "panel-tag", children: [
              allAlerts.length, " alerts · ", liveAlerts.length > 0 &&
              _jsxDEV("span", { style: { color: '#ff5252', fontWeight: 700 }, children: [
                liveAlerts.length, " 🔴 LIVE"] }, void 0, true
              )] }, void 0, true

            )] }, void 0, true
          ),
          _jsxDEV("div", { style: { position: 'relative' }, children: [
            _jsxDEV(MapContainer, { center: [26.2, 93.0], zoom: 7, className: "leaflet-map", scrollWheelZoom: false, children: [
              _jsxDEV(TileLayer, { url: layerConfig.url, attribution: layerConfig.attribution }, void 0, false),
              _jsxDEV(MapClickHandler, {}, void 0, false),


              mlZones.map((z) =>
              _jsxDEV(Circle, {
                center: [z.lat, z.lng],
                radius: z.risk_score * 30000,
                pathOptions: {
                  color: z.risk_level === 'critical' ? '#ff0a54' : z.risk_level === 'high' ? '#ff5400' : z.risk_level === 'medium' ? '#ffdd00' : '#00f5d4',
                  fillColor: z.risk_level === 'critical' ? '#ff0a54' : z.risk_level === 'high' ? '#ff5400' : z.risk_level === 'medium' ? '#ffdd00' : '#00f5d4',
                  fillOpacity: Math.min(0.5, z.risk_score),
                  weight: 0
                }, children:
                _jsxDEV(Popup, { children: [
                  _jsxDEV("strong", { children: ["ML Prediction: ", z.zone_name] }, void 0, true), _jsxDEV("br", {}, void 0, false), "Risk Level: ",
                  _jsxDEV("span", { style: { color: z.risk_level === 'critical' ? '#ff0a54' : '#ff5400', fontWeight: 'bold' }, children: z.risk_level?.toUpperCase() }, void 0, false), _jsxDEV("br", {}, void 0, false), "Risk Score: ",
                  (z.risk_score * 100).toFixed(0), "/100", _jsxDEV("br", {}, void 0, false),
                  _jsxDEV("em", { style: { fontSize: '0.8rem' }, children: z.prediction }, void 0, false)] }, void 0, true
                ) }, z.id, false
              )
              ),


              forestAlerts.map((f, i) =>
              _jsxDEV(Circle, {
                center: [f.lat, f.lng],
                radius: f.area_ha ? f.area_ha * 100 : 2000,
                pathOptions: { color: '#ab47bc', fillOpacity: 0.6, weight: 1.5 }, children:
                _jsxDEV(Popup, { children: [
                  _jsxDEV("strong", { children: "Global Forest Watch Alert" }, void 0, false), _jsxDEV("br", {}, void 0, false), "Type: ",
                  f.alertType, _jsxDEV("br", {}, void 0, false), "Location: ",
                  f.location, _jsxDEV("br", {}, void 0, false), "Area: ",
                  f.area_ha, " ha", _jsxDEV("br", {}, void 0, false), "Date: ",
                  f.date] }, void 0, true
                ) }, `f-${i}`, false
              )
              ),


              liveAlerts.map((a) => {
                const lat = a.coordinates?.lat || a.lat || 26.5;
                const lng = a.coordinates?.lng || a.lng || 93.0;
                const c = SEV_COLOR[a.severity] || '#ff9100';
                return (
                  _jsxDEV(React.Fragment, { children: [

                    _jsxDEV(Circle, {
                      center: [lat, lng],
                      radius: a.severity === 'critical' ? 22000 : 16000,
                      pathOptions: { color: c, fillColor: c, fillOpacity: 0.12, weight: 1.5 } }, void 0, false
                    ),
                    _jsxDEV(Circle, {
                      center: [lat, lng],
                      radius: a.severity === 'critical' ? 10000 : 7000,
                      pathOptions: { color: c, fillColor: c, fillOpacity: 0.25, weight: 0 } }, void 0, false
                    ),
                    _jsxDEV(Marker, {
                      position: [lat, lng],
                      icon: makeLiveGlowIcon(a.severity),
                      eventHandlers: { click: () => setSelected(a) }, children:

                      _jsxDEV(Popup, { children:
                        _jsxDEV("div", { style: { minWidth: 220 }, children: [
                          _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }, children: [
                            _jsxDEV("span", { style: { background: '#ff174422', border: '1px solid #ff174466', color: '#ff5252', fontSize: '0.65rem', fontWeight: 800, padding: '1px 7px', borderRadius: 100 }, children: "🔴 LIVE" }, void 0, false),
                            _jsxDEV("span", { style: { fontSize: '0.72rem', color: c, fontWeight: 700 }, children: a.severity?.toUpperCase() }, void 0, false)] }, void 0, true
                          ),
                          _jsxDEV("strong", { style: { fontSize: '0.88rem' }, children: [a.type, " Alert"] }, void 0, true), _jsxDEV("br", {}, void 0, false),
                          _jsxDEV("span", { style: { fontSize: '0.78rem', color: '#555' }, children: ["📍 ", a.location] }, void 0, true), _jsxDEV("br", {}, void 0, false),
                          a.description && _jsxDEV("em", { style: { fontSize: '0.75rem', color: '#777', display: 'block', marginTop: 4 }, children: [a.description.slice(0, 100), "…"] }, void 0, true),
                          a.solutions?.slice(0, 2).map((s, i) =>
                          _jsxDEV("div", { style: { fontSize: '0.72rem', color: '#4CAF50', marginTop: 3 }, children: ["✅ ", s] }, i, true)
                          )] }, void 0, true
                        ) }, void 0, false
                      ) }, void 0, false
                    )] }, `live-${a._id}`, true
                  ));

              }),


              filtered.filter((a) => !a._live).map((a) =>
              _jsxDEV(React.Fragment, { children: [
                a.status !== 'resolved' &&
                _jsxDEV(Circle, {
                  center: [a.coordinates?.lat || 26.5, a.coordinates?.lng || 93],
                  radius: a.severity === 'critical' ? 15000 : a.severity === 'warning' ? 10000 : 7000,
                  pathOptions: {
                    color: SEV_COLOR[a.severity] || '#29b6f6',
                    fillOpacity: 0.15, weight: 1.5
                  } }, void 0, false
                ),

                _jsxDEV(Marker, {
                  position: [a.coordinates?.lat || 26.5, a.coordinates?.lng || 93],
                  eventHandlers: { click: () => setSelected(a) },
                  icon: makeDbIcon(a.severity), children:

                  _jsxDEV(Popup, { children: [
                    _jsxDEV("strong", { children: a.type }, void 0, false), _jsxDEV("br", {}, void 0, false),
                    _jsxDEV("span", { children: a.location }, void 0, false), _jsxDEV("br", {}, void 0, false),
                    _jsxDEV("em", { style: { fontSize: '0.8em', color: SEV_COLOR[a.severity] }, children: a.severity?.toUpperCase() }, void 0, false), _jsxDEV("br", {}, void 0, false),
                    _jsxDEV("small", { children: a.description }, void 0, false)] }, void 0, true
                  ) }, void 0, false
                )] }, a._id, true
              )
              ),


              clickPrediction &&
              _jsxDEV(Popup, { position: [clickPrediction.lat, clickPrediction.lng], onClose: () => setClickPrediction(null), children:
                _jsxDEV("div", { style: { minWidth: '240px', fontFamily: 'sans-serif' }, children:
                  clickPrediction.loading ?
                  _jsxDEV("div", { style: { color: '#666', padding: '8px 0' }, children: "⏳ Running ML prediction…" }, void 0, false) :
                  clickPrediction.error ?
                  _jsxDEV("div", { style: { color: 'red' }, children: clickPrediction.error }, void 0, false) :
                  clickPrediction.data ? (() => {
                    const d = clickPrediction.data;
                    const COLOR = { Critical: '#ff0a54', High: '#ff5400', Medium: '#ffdd00', Low: '#00f5d4',
                      critical: '#ff0a54', high: '#ff5400', medium: '#ffdd00', low: '#00f5d4' };
                    const lvl = d.risk_level || 'Low';
                    const score = Math.round(d.risk_score * 100);
                    const c = COLOR[lvl] || '#69f0ae';
                    const f = d.features_used || {};
                    return (
                      _jsxDEV(_Fragment, { children: [
                        _jsxDEV("div", { style: { fontWeight: 800, fontSize: '0.88rem', marginBottom: 6, borderBottom: '1px solid #eee', paddingBottom: 4 }, children: "🤖 Python RF — ML Risk Analysis" }, void 0, false

                        ),
                        _jsxDEV("div", { style: { marginBottom: 8 }, children: [
                          _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 }, children: [
                            _jsxDEV("span", { style: { fontWeight: 700, color: c, textTransform: 'uppercase', fontSize: '0.85rem' }, children: lvl }, void 0, false),
                            _jsxDEV("span", { style: { fontWeight: 700, fontSize: '0.85rem' }, children: [score, "/100"] }, void 0, true)] }, void 0, true
                          ),
                          _jsxDEV("div", { style: { background: '#e0e0e0', borderRadius: 4, height: 8, overflow: 'hidden' }, children:
                            _jsxDEV("div", { style: { width: `${score}%`, background: c, height: '100%' } }, void 0, false) }, void 0, false
                          )] }, void 0, true
                        ),
                        _jsxDEV("div", { style: { fontSize: '0.72rem', color: '#aaa' }, children: ["📍 ",
                          clickPrediction.lat.toFixed(4), ", ", clickPrediction.lng.toFixed(4)] }, void 0, true
                        )] }, void 0, true
                      ));

                  })() : null }, void 0, false
                ) }, void 0, false
              )] }, void 0, true

            ),
            _jsxDEV(MapLayerControl, { activeLayer: activeLayer, setActiveLayer: setActiveLayer }, void 0, false),


            liveAlerts.length > 0 &&
            _jsxDEV("div", { style: {
                position: 'absolute', top: 10, left: 10, zIndex: 1000,
                background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,23,68,0.35)', borderRadius: 12,
                padding: '8px 12px', maxWidth: 220,
                boxShadow: '0 4px 20px rgba(255,23,68,0.2)'
              }, children: [
              _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }, children: [
                _jsxDEV("span", { style: { width: 7, height: 7, borderRadius: '50%', background: '#ff5252', display: 'inline-block', animation: 'wsDot 1.5s infinite' } }, void 0, false),
                _jsxDEV("span", { style: { fontSize: '0.65rem', fontWeight: 800, color: '#ff5252', textTransform: 'uppercase', letterSpacing: '0.5px' }, children: [
                  liveAlerts.length, " Live Alert", liveAlerts.length > 1 ? 's' : ''] }, void 0, true
                )] }, void 0, true
              ),
              liveAlerts.slice(0, 3).map((a) =>
              _jsxDEV("div", { style: {
                  fontSize: '0.7rem', color: '#ccc', marginBottom: 3,
                  animation: 'liveSlideIn 0.4s ease',
                  display: 'flex', alignItems: 'center', gap: 5
                }, children: [
                _jsxDEV("span", { style: { color: SEV_COLOR[a.severity] || '#ff9100', fontWeight: 700 }, children: "●" }, void 0, false),
                a.type, " — ", a.location?.slice(0, 28), a.location?.length > 28 ? '…' : ''] }, a._id, true
              )
              ),
              liveAlerts.length > 3 &&
              _jsxDEV("div", { style: { fontSize: '0.65rem', color: '#666', marginTop: 2 }, children: ["+", liveAlerts.length - 3, " more"] }, void 0, true)] }, void 0, true

            )] }, void 0, true

          ),
          _jsxDEV("div", { className: "map-legend-row", style: { display: 'flex', gap: '15px', flexWrap: 'wrap', padding: '10px', fontSize: '0.8rem' }, children: [
            _jsxDEV("span", { style: { fontWeight: 'bold', color: '#aaa' }, children: "ML Risk Heatmap:" }, void 0, false),
            [['#ff0a54', 'Critical'], ['#ff5400', 'High'], ['#ffdd00', 'Medium'], ['#00f5d4', 'Low']].map(([c, l]) =>
            _jsxDEV("span", { className: "leg-item", style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [
              _jsxDEV("span", { className: "leg-dot", style: { background: c, width: '10px', height: '10px', borderRadius: '50%', opacity: 0.5 } }, void 0, false), l] }, l, true
            )
            ),
            _jsxDEV("span", { style: { fontWeight: 'bold', color: '#aaa', marginLeft: '10px' }, children: "Live WS Alerts:" }, void 0, false),
            _jsxDEV("span", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [
              _jsxDEV("span", { style: { width: 10, height: 10, borderRadius: '50%', background: '#ff5252', opacity: 0.8 } }, void 0, false), "🔴 Pulsing = Live"] }, void 0, true
            ),
            _jsxDEV("span", { className: "leg-item", style: { marginLeft: 'auto', color: '#aaa', fontSize: '0.75rem' }, children: "*Click Map to Predict Risk Profile" }, void 0, false

            )] }, void 0, true
          )] }, void 0, true
        ),


        _jsxDEV("div", { className: "panel alerts-panel", children: [
          _jsxDEV("div", { className: "panel-hdr", children: [
            _jsxDEV("h3", { children: [
              _jsxDEV(Radio, { size: 14, style: { marginRight: 5, verticalAlign: 'middle' } }, void 0, false), "Live Alerts",

              liveCount > 0 &&
              _jsxDEV("span", { style: {
                  marginLeft: 8, fontSize: '0.62rem', fontWeight: 800, color: '#ff5252',
                  background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.25)',
                  borderRadius: 100, padding: '1px 7px'
                }, children: [
                liveCount, " NEW"] }, void 0, true
              )] }, void 0, true

            ),
            _jsxDEV(Link, { to: "/alerts", className: "panel-link", children: ["View all ", _jsxDEV(ChevronRight, { size: 14 }, void 0, false)] }, void 0, true)] }, void 0, true
          ),
          _jsxDEV("div", { className: "filter-tabs", children:
            ['all', 'critical', 'warning', 'info'].map((f) =>
            _jsxDEV("button", { className: `ftab ${filter === f ? 'active' : ''}`,
              onClick: () => setFilter(f), children: f }, f, false)
            ) }, void 0, false
          ),
          _jsxDEV("div", { className: "alert-scroll", children: [
            loading && _jsxDEV("div", { style: { padding: 20, color: '#666', fontSize: '0.85rem' }, children: "Loading alerts…" }, void 0, false),
            !loading && filtered.length === 0 &&
            _jsxDEV("div", { style: { padding: '20px', color: '#666', fontSize: '0.85rem', textAlign: 'center' }, children: ["No alerts yet.",
              _jsxDEV("br", {}, void 0, false), "Asha Workers can create alerts from their dashboard."] }, void 0, true
            ),

            filtered.map((a) =>
            _jsxDEV("div", {
              className: `alert-row sev-${a.severity} ${selected?._id === a._id ? 'sel' : ''}`,
              onClick: () => setSelected(a),
              style: { animation: a._live ? 'liveSlideIn 0.4s ease' : 'none' }, children: [
              _jsxDEV("div", { className: `sev-bar sev-${a.severity}` }, void 0, false),
              _jsxDEV("div", { className: "ar-body", children: [
                _jsxDEV("div", { className: "ar-top", children: [
                  a._live &&
                  _jsxDEV("span", { style: {
                      fontSize: '0.6rem', fontWeight: 800, color: '#ff5252',
                      background: 'rgba(255,23,68,0.12)', border: '1px solid rgba(255,23,68,0.3)',
                      borderRadius: 100, padding: '1px 6px', letterSpacing: '0.5px',
                      display: 'inline-flex', alignItems: 'center', gap: 3
                    }, children: [
                    _jsxDEV("span", { style: { width: 5, height: 5, borderRadius: '50%', background: '#ff5252', display: 'inline-block' } }, void 0, false), "LIVE"] }, void 0, true

                  ),

                  _jsxDEV("span", { className: `sev-badge ${a.severity}`, children: a.severity }, void 0, false),
                  _jsxDEV("span", { className: "ar-time", children: [_jsxDEV(Clock, { size: 11 }, void 0, false), " ", timeAgo(a.createdAt || a._liveAt)] }, void 0, true)] }, void 0, true
                ),
                _jsxDEV("div", { className: "ar-type", children: a.type }, void 0, false),
                _jsxDEV("div", { className: "ar-loc", children: [_jsxDEV(MapPin, { size: 11 }, void 0, false), " ", a.location] }, void 0, true)] }, void 0, true
              )] }, a._id, true
            )
            )] }, void 0, true
          ),

          selected &&
          _jsxDEV("div", { className: "alert-detail", children: [
            _jsxDEV("div", { className: "ad-header", children: [
              _jsxDEV("span", { className: `sev-badge ${selected.severity}`, children: selected.severity }, void 0, false),
              _jsxDEV("span", { style: { fontSize: '0.72rem', color: selected.status === 'active' ? '#ff5252' : '#69f0ae', fontWeight: 600 }, children: ["● ",
                selected.status || 'active'] }, void 0, true
              ),
              selected._live &&
              _jsxDEV("span", { style: { fontSize: '0.62rem', fontWeight: 800, color: '#ff5252',
                  background: 'rgba(255,23,68,0.1)', borderRadius: 100, padding: '1px 7px',
                  border: '1px solid rgba(255,23,68,0.3)', marginLeft: 'auto' }, children: "🔴 LIVE" }, void 0, false

              )] }, void 0, true

            ),
            _jsxDEV("div", { className: "ad-type", children: selected.type }, void 0, false),
            _jsxDEV("div", { className: "ad-loc", children: [_jsxDEV(MapPin, { size: 12 }, void 0, false), " ", selected.location] }, void 0, true),
            selected.headline &&
            _jsxDEV("div", { style: { marginTop: 8, background: '#ff174418', borderLeft: '3px solid #ff1744',
                padding: '6px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, color: '#ff6b6b' }, children:
              selected.headline }, void 0, false
            ),

            _jsxDEV("p", { className: "ad-desc", children: selected.description }, void 0, false),
            selected.action &&
            _jsxDEV("div", { style: { fontSize: '0.78rem', color: '#4CAF50', fontWeight: 600, marginBottom: 6 }, children: ["⚡ ",
              selected.action] }, void 0, true
            ),

            _jsxDEV(Link, { to: "/alerts", className: "ad-btn", children: "View Full Alert + Advisory →" }, void 0, false)] }, void 0, true
          )] }, void 0, true

        )] }, void 0, true
      ),


      _jsxDEV("div", { className: "panel activity-panel-wrap", children: [
        _jsxDEV("div", { className: "panel-hdr", children: [
          _jsxDEV("h3", { children: "System Activity Log" }, void 0, false),
          _jsxDEV("span", { className: "panel-tag", children: "NE India region · Live from DB + WebSocket" }, void 0, false)] }, void 0, true
        ),
        _jsxDEV("div", { className: "activity-list", children:
          activity.map((a, i) =>
          _jsxDEV("div", { className: "act-item", children: [
            _jsxDEV("span", { className: "act-time", children: a.time }, void 0, false),
            _jsxDEV("span", { className: `act-dot dot-${a.type}` }, void 0, false),
            _jsxDEV("span", { className: "act-event", children: a.event }, void 0, false)] }, i, true
          )
          ) }, void 0, false
        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default Dashboard;