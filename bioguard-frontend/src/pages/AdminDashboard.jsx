import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShieldCheck, AlertTriangle, Activity,
  Trash2, CheckCircle, UserX, UserCheck,
  RefreshCw, Crown, FileText, Clock, MapPin,
  Eye, Filter, ChevronDown, ChevronUp, Phone, Mail, User } from
'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReportsInbox from '../components/ReportsInbox';
import './RoleDashboard.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";


const URGENCY_COLOR = {
  'High — immediate risk to life or wildlife': '#ff1744',
  'Medium — situation developing': '#ff9100',
  'Low — no immediate danger': '#29b6f6'
};
const TYPE_LABEL = {
  wildlife: '🐘 Wildlife Conflict', deforestation: '🌳 Illegal Logging',
  fire: '🔥 Forest Fire', poaching: '🎯 Poaching', other: '📋 Other'
};
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}


const BASE_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '') || 'http://localhost:4000';
const getToken = () => localStorage.getItem('bioguard-jwt') || '';
const SEV_COLORS = { critical: '#ff1744', warning: '#ff9100', info: '#29b6f6' };

const AlertsManager = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/alerts?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const json = await res.json();
      setAlerts(json.alerts || []);
    } catch (e) {setMsg('Failed to load alerts: ' + e.message);}
    setLoading(false);
  };

  useEffect(() => {load();}, []);

  const resolve = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/alerts/${id}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg('✅ Alert resolved.');load();
    } catch (e) {setMsg('❌ ' + e.message);}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this alert permanently?')) return;
    try {
      const res = await fetch(`${BASE_URL}/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMsg('🗑️ Alert deleted.');load();
    } catch (e) {setMsg('❌ ' + e.message);}
  };

  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.status === filter);

  return (
    _jsxDEV("div", { className: "panel", children: [
      _jsxDEV("div", { className: "panel-hdr", style: { flexWrap: 'wrap', gap: 8 }, children: [
        _jsxDEV("h3", { children: [_jsxDEV(AlertTriangle, { size: 15 }, void 0, false), " Alert Management"] }, void 0, true),
        _jsxDEV("div", { style: { display: 'flex', gap: 6, alignItems: 'center' }, children: [
          ['all', 'active', 'resolved'].map((s) =>
          _jsxDEV("button", { onClick: () => setFilter(s), style: {
              padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              background: filter === s ? 'rgba(76,175,80,0.2)' : 'transparent',
              color: filter === s ? '#4CAF50' : '#666',
              border: filter === s ? '1px solid rgba(76,175,80,0.4)' : '1px solid rgba(255,255,255,0.08)'
            }, children: s }, s, false)
          ),
          _jsxDEV("button", { className: "icon-btn", onClick: load, disabled: loading, style: { marginLeft: 4 }, children: [
            _jsxDEV(RefreshCw, { size: 13, className: loading ? 'spin-anim' : '' }, void 0, false), " Refresh"] }, void 0, true
          ),
          _jsxDEV(Link, { to: "/alerts", className: "panel-link", style: { marginLeft: 8 }, children: "Full page →" }, void 0, false)] }, void 0, true
        )] }, void 0, true
      ),

      msg &&
      _jsxDEV("div", { style: { margin: '0 0 12px', padding: '8px 14px', borderRadius: 8,
          background: msg.startsWith('❌') ? '#ff174415' : '#4CAF5015',
          color: msg.startsWith('❌') ? '#ff5252' : '#81c784', fontSize: '0.82rem',
          display: 'flex', justifyContent: 'space-between' }, children: [
        msg, _jsxDEV("button", { onClick: () => setMsg(''), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, children: "✕" }, void 0, false)] }, void 0, true
      ),


      loading ?
      _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#555' }, children: "Loading alerts…" }, void 0, false) :
      shown.length === 0 ?
      _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#555' }, children: ["No ", filter !== 'all' ? filter : '', " alerts found."] }, void 0, true) :

      _jsxDEV("div", { className: "admin-table-wrap", children:
        _jsxDEV("table", { className: "admin-table", children: [
          _jsxDEV("thead", { children: _jsxDEV("tr", { children: [
              _jsxDEV("th", { children: "Type" }, void 0, false), _jsxDEV("th", { children: "Severity" }, void 0, false), _jsxDEV("th", { children: "Location" }, void 0, false), _jsxDEV("th", { children: "State" }, void 0, false), _jsxDEV("th", { children: "Status" }, void 0, false), _jsxDEV("th", { children: "Created" }, void 0, false), _jsxDEV("th", { children: "Actions" }, void 0, false)] }, void 0, true
            ) }, void 0, false),
          _jsxDEV("tbody", { children:
            shown.map((a) =>
            _jsxDEV("tr", { children: [
              _jsxDEV("td", { style: { fontWeight: 700 }, children: a.type }, void 0, false),
              _jsxDEV("td", { children:
                _jsxDEV("span", { style: { color: SEV_COLORS[a.severity], fontWeight: 700, fontSize: '0.8rem',
                    background: (SEV_COLORS[a.severity] || '#888') + '18', padding: '2px 8px', borderRadius: 20 }, children:
                  a.severity }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV("td", { style: { fontSize: '0.82rem' }, children: a.location }, void 0, false),
              _jsxDEV("td", { style: { fontSize: '0.8rem', color: '#666' }, children: a.state }, void 0, false),
              _jsxDEV("td", { children:
                _jsxDEV("span", { style: { fontSize: '0.78rem', fontWeight: 700,
                    color: a.status === 'active' ? '#ff5252' : a.status === 'resolved' ? '#4CAF50' : '#888' }, children: ["● ",
                  a.status] }, void 0, true
                ) }, void 0, false
              ),
              _jsxDEV("td", { style: { fontSize: '0.78rem', color: '#666' }, children: timeAgo(a.createdAt) }, void 0, false),
              _jsxDEV("td", { className: "action-cell", children: [
                a.status !== 'resolved' &&
                _jsxDEV("button", { className: "tbl-btn", title: "Resolve", onClick: () => resolve(a._id), children:
                  _jsxDEV(CheckCircle, { size: 14 }, void 0, false) }, void 0, false
                ),

                _jsxDEV("button", { className: "tbl-btn danger", title: "Delete", onClick: () => remove(a._id), children:
                  _jsxDEV(Trash2, { size: 14 }, void 0, false) }, void 0, false
                )] }, void 0, true
              )] }, a._id, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      )] }, void 0, true

    ));

};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [msg, setMsg] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
      api.adminStats(),
      api.adminUsers()]
      );
      setStats(s.stats);
      setUsers(u.users);
    } catch (e) {setMsg(e.message);}
    setLoading(false);
  };

  useEffect(() => {load();}, []);

  const changeRole = async (id, role) => {
    await api.adminChangeRole(id, role);
    setMsg(`Role updated to ${role}`);
    load();
  };

  const toggleUser = async (id) => {
    await api.adminToggleUser(id);
    load();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    await api.adminDeleteUser(id);
    setMsg('User deleted');
    load();
  };

  return (
    _jsxDEV("div", { className: "page-root role-page", children: [

      _jsxDEV("div", { className: "page-header-bar", children: [
        _jsxDEV("div", { children: [
          _jsxDEV("div", { className: "role-badge admin-badge", children: [_jsxDEV(Crown, { size: 14 }, void 0, false), " Admin Dashboard"] }, void 0, true),
          _jsxDEV("h1", { className: "page-title", children: "System Control Panel" }, void 0, false),
          _jsxDEV("p", { className: "page-sub", children: "Full access — BioGuard NE India Platform" }, void 0, false)] }, void 0, true
        ),
        _jsxDEV("button", { className: "icon-btn", onClick: load, children: [_jsxDEV(RefreshCw, { size: 15 }, void 0, false), " Refresh"] }, void 0, true)] }, void 0, true
      ),

      msg && _jsxDEV("div", { className: "admin-msg", children: [msg, " ", _jsxDEV("button", { onClick: () => setMsg(''), children: "✕" }, void 0, false)] }, void 0, true),


      _jsxDEV("div", { className: "role-tabs", children:
        [
        { key: 'overview', label: 'Overview' },
        { key: 'reports', label: `Reports${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` },
        { key: 'users', label: 'Users' },
        { key: 'alerts', label: 'Alerts' }].
        map((t) =>
        _jsxDEV("button", { className: `rtab ${tab === t.key ? 'active' : ''}`,
          onClick: () => setTab(t.key), children:
          t.label }, t.key, false
        )
        ) }, void 0, false
      ),

      loading ? _jsxDEV("div", { className: "role-loading", children: _jsxDEV("div", { className: "role-spinner" }, void 0, false) }, void 0, false) : (


      tab === 'overview' && stats &&
      _jsxDEV("div", { className: "admin-overview", children: [
        _jsxDEV("div", { className: "admin-stat-grid", children:
          [
          { icon: Users, label: 'Total Users', value: stats.totalUsers, color: '#16a34a' },
          { icon: FileText, label: 'Total Reports', value: stats.totalReports, color: '#29b6f6' },
          { icon: AlertTriangle, label: 'Active Alerts', value: stats.activeAlerts, color: '#ff1744' },
          { icon: CheckCircle, label: 'Resolved Alerts', value: stats.resolvedAlerts, color: '#22c55e' },
          { icon: Activity, label: 'Ongoing Incidents', value: stats.ongoingIncidents, color: '#f97316' },
          { icon: Clock, label: 'Pending Reports', value: stats.pendingReports, color: '#facc15' }].
          map((s) =>
          _jsxDEV("div", { className: "admin-stat-card", style: { '--ac': s.color }, children: [
            _jsxDEV(s.icon, { size: 24, style: { color: 'var(--ac)' } }, void 0, false),
            _jsxDEV("div", { className: "asc-val", children: s.value }, void 0, false),
            _jsxDEV("div", { className: "asc-lbl", children: s.label }, void 0, false)] }, s.label, true
          )
          ) }, void 0, false
        ),

        _jsxDEV("div", { className: "panel", children: [
          _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: [_jsxDEV(Users, { size: 15 }, void 0, false), " Users by Role"] }, void 0, true) }, void 0, false),
          _jsxDEV("div", { className: "role-bar-group", children:
            [['user', 'Community', '#16a34a'], ['asha_worker', 'Field Workers', '#f97316'], ['admin', 'Admins', '#8b5cf6']].map(([r, l, c]) =>
            _jsxDEV("div", { className: "role-bar-item", children: [
              _jsxDEV("span", { style: { color: c, fontWeight: 700 }, children: l }, void 0, false),
              _jsxDEV("div", { className: "rbi-bar", children:
                _jsxDEV("div", { className: "rbi-fill", style: { width: `${(stats.usersByRole?.[r] || 0) / (stats.totalUsers || 1) * 100}%`, background: c } }, void 0, false) }, void 0, false
              ),
              _jsxDEV("span", { className: "rbi-count", children: stats.usersByRole?.[r] || 0 }, void 0, false)] }, r, true
            )
            ) }, void 0, false
          )] }, void 0, true
        )] }, void 0, true
      )),




      !loading && tab === 'reports' &&
      _jsxDEV(ReportsInbox, { onCountChange: setPendingCount }, void 0, false),



      !loading && tab === 'users' &&
      _jsxDEV("div", { className: "panel", children: [
        _jsxDEV("div", { className: "panel-hdr", children: _jsxDEV("h3", { children: [_jsxDEV(Users, { size: 15 }, void 0, false), " Registered Users"] }, void 0, true) }, void 0, false),
        _jsxDEV("div", { className: "admin-table-wrap", children:
          _jsxDEV("table", { className: "admin-table", children: [
            _jsxDEV("thead", { children: _jsxDEV("tr", { children: [
                _jsxDEV("th", { children: "Name" }, void 0, false), _jsxDEV("th", { children: "Email" }, void 0, false), _jsxDEV("th", { children: "Role" }, void 0, false), _jsxDEV("th", { children: "State" }, void 0, false), _jsxDEV("th", { children: "Status" }, void 0, false), _jsxDEV("th", { children: "Actions" }, void 0, false)] }, void 0, true
              ) }, void 0, false),
            _jsxDEV("tbody", { children:
              users.map((u) =>
              _jsxDEV("tr", { className: !u.isActive ? 'inactive-row' : '', children: [
                _jsxDEV("td", { children: _jsxDEV("strong", { children: u.name }, void 0, false) }, void 0, false),
                _jsxDEV("td", { children: u.email }, void 0, false),
                _jsxDEV("td", { children:
                  _jsxDEV("select", { className: "role-select", value: u.role,
                    disabled: u._id === user?.id,
                    onChange: (e) => changeRole(u._id, e.target.value), children: [
                    _jsxDEV("option", { value: "user", children: "user" }, void 0, false),
                    _jsxDEV("option", { value: "asha_worker", children: "asha_worker" }, void 0, false),
                    _jsxDEV("option", { value: "admin", children: "admin" }, void 0, false)] }, void 0, true
                  ) }, void 0, false
                ),
                _jsxDEV("td", { children: u.state }, void 0, false),
                _jsxDEV("td", { children: _jsxDEV("span", { className: `status-chip ${u.isActive ? 'active' : 'inactive'}`, children: u.isActive ? 'Active' : 'Inactive' }, void 0, false) }, void 0, false),
                _jsxDEV("td", { className: "action-cell", children: [
                  _jsxDEV("button", { className: "tbl-btn", onClick: () => toggleUser(u._id), title: u.isActive ? 'Deactivate' : 'Activate', children:
                    u.isActive ? _jsxDEV(UserX, { size: 14 }, void 0, false) : _jsxDEV(UserCheck, { size: 14 }, void 0, false) }, void 0, false
                  ),
                  u._id !== user?.id &&
                  _jsxDEV("button", { className: "tbl-btn danger", onClick: () => deleteUser(u._id), title: "Delete", children:
                    _jsxDEV(Trash2, { size: 14 }, void 0, false) }, void 0, false
                  )] }, void 0, true

                )] }, u._id, true
              )
              ) }, void 0, false
            )] }, void 0, true
          ) }, void 0, false
        )] }, void 0, true
      ),



      !loading && tab === 'alerts' &&
      _jsxDEV(AlertsManager, {}, void 0, false)] }, void 0, true

    ));

};

export default AdminDashboard;