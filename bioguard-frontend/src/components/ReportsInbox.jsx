








import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, Eye, CheckCircle, Trash2,
  AlertTriangle, MapPin, Phone, Mail, User, RefreshCw,
  Edit3, Flag, Save, X } from
'lucide-react';
import api from '../services/api';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const URGENCY_COLOR = {
  'High — immediate risk to life or wildlife': '#ff1744',
  'Medium — situation developing': '#ff9100',
  'Low — no immediate danger': '#29b6f6'
};
const RISK_COLOR = { critical: '#ff1744', high: '#ff9100', medium: '#facc15', low: '#4CAF50' };
const STATUS_STYLE = {
  pending: { bg: '#facc1520', color: '#facc15' },
  reviewed: { bg: '#29b6f620', color: '#29b6f6' },
  resolved: { bg: '#4CAF5020', color: '#4CAF50' },
  fake: { bg: '#e53e3e20', color: '#fc8181' }
};
const TYPE_LABEL = {
  wildlife: '🐘 Wildlife', deforestation: '🌳 Logging',
  fire: '🔥 Fire', poaching: '🎯 Poaching', other: '📋 Other'
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const ReportsInbox = ({ onCountChange }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getReports({ limit: 100 });
      const data = res.reports || [];
      setReports(data);
      onCountChange?.(data.filter((r) => r.status === 'pending').length);
    } catch (e) {setMsg('Failed to load: ' + e.message);}
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);

  const filteredReports = filter === 'all' ? reports : reports.filter((r) => r.status === filter);


  const updateStatus = async (id, status) => {
    try {
      await api.updateReport(id, { status, isFake: status === 'fake' });
      setMsg(`✅ Report marked as ${status}`);
      await load();
    } catch (e) {setMsg('❌ ' + e.message);}
  };

  const deleteReport = async (id, refId) => {
    if (!window.confirm(`Delete report ${refId}? This cannot be undone.`)) return;
    try {
      await api.deleteReport(id);
      setMsg(`🗑️ Report ${refId} deleted.`);
      await load();
    } catch (e) {setMsg('❌ ' + e.message);}
  };

  const startEdit = (r) => {
    setEditing(r._id);
    setEditForm({
      riskLevel: r.riskLevel || 'medium',
      urgency: r.urgency || '',
      moderatorNote: r.moderatorNote || ''
    });
  };

  const saveEdit = async (id) => {
    try {
      await api.updateReport(id, editForm);
      setMsg('✅ Report updated.');
      setEditing(null);
      await load();
    } catch (e) {setMsg('❌ ' + e.message);}
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    _jsxDEV("div", { className: "panel", children: [

      _jsxDEV("div", { className: "panel-hdr", style: { flexWrap: 'wrap', gap: 10 }, children: [
        _jsxDEV("h3", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: ["📋 Reports Inbox",

          pendingCount > 0 &&
          _jsxDEV("span", { style: { background: '#ff174430', color: '#ff5252',
              fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20 }, children: [
            pendingCount, " pending"] }, void 0, true
          )] }, void 0, true

        ),
        _jsxDEV("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }, children: [
          ['all', 'pending', 'reviewed', 'resolved', 'fake'].map((s) =>
          _jsxDEV("button", {
            onClick: () => setFilter(s),
            style: {
              padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
              border: filter === s ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: filter === s ? STATUS_STYLE[s]?.bg || '#ffffff20' : 'transparent',
              color: filter === s ? STATUS_STYLE[s]?.color || '#fff' : '#666',
              cursor: 'pointer'
            }, children:
            s }, s, false
          )
          ),
          _jsxDEV("button", { className: "icon-btn", onClick: load, disabled: loading, style: { marginLeft: 4 }, children: [
            _jsxDEV(RefreshCw, { size: 13, className: loading ? 'spin-anim' : '' }, void 0, false), " Refresh"] }, void 0, true
          )] }, void 0, true
        )] }, void 0, true
      ),

      msg &&
      _jsxDEV("div", { style: { margin: '0 0 12px', padding: '8px 14px', borderRadius: 8,
          background: msg.startsWith('❌') ? '#ff174415' : '#4CAF5015',
          color: msg.startsWith('❌') ? '#ff5252' : '#81c784', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }, children: [
        msg,
        _jsxDEV("button", { onClick: () => setMsg(''), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }, children: "✕" }, void 0, false)] }, void 0, true
      ),


      loading ?
      _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#555' }, children: "Loading reports…" }, void 0, false) :
      filteredReports.length === 0 ?
      _jsxDEV("div", { style: { padding: 40, textAlign: 'center', color: '#555' }, children: ["No ",
        filter !== 'all' ? filter : '', " reports found.",
        filter === 'all' && _jsxDEV(_Fragment, { children: [" Community members can submit via ", _jsxDEV(Link, { to: "/report", style: { color: '#4CAF50' }, children: "Report page" }, void 0, false), "."] }, void 0, true)] }, void 0, true
      ) :

      _jsxDEV("div", { style: { display: 'flex', flexDirection: 'column', gap: 10 }, children:
        filteredReports.map((r) => {
          const urgColor = URGENCY_COLOR[r.urgency] || '#888';
          const isOpen = expanded === r._id;
          const isEditing = editing === r._id;
          const ss = STATUS_STYLE[r.status] || { bg: '#88888820', color: '#888' };
          const rc = RISK_COLOR[r.riskLevel || 'medium'];

          return (
            _jsxDEV("div", { style: {
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${urgColor}`,
                borderRadius: 12, overflow: 'hidden',
                background: r.isFake ? 'rgba(229,62,62,0.04)' : 'rgba(255,255,255,0.02)'
              }, children: [

              _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', cursor: 'pointer' },
                onClick: () => setExpanded(isOpen ? null : r._id), children: [

                _jsxDEV("div", { style: { flex: 1, minWidth: 0 }, children: [
                  _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }, children: [
                    _jsxDEV("span", { style: { fontWeight: 800, fontSize: '0.82rem', color: '#c8e6c9' }, children:
                      TYPE_LABEL[r.type] || r.type }, void 0, false
                    ),

                    _jsxDEV("span", { style: { fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                        background: ss.bg, color: ss.color }, children: ["● ",
                      r.status] }, void 0, true
                    ),

                    _jsxDEV("span", { style: { fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                        background: rc + '25', color: rc, border: `1px solid ${rc}40` }, children: ["⚡ ",
                      r.riskLevel || 'medium', " risk"] }, void 0, true
                    ),
                    r.isFake &&
                    _jsxDEV("span", { style: { fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800,
                        background: '#e53e3e30', color: '#fc8181' }, children: "🚫 FAKE" }, void 0, false),

                    _jsxDEV("span", { style: { fontSize: '0.62rem', color: '#444', marginLeft: 'auto', whiteSpace: 'nowrap' }, children: ["#",
                      r.refId, " · ", timeAgo(r.createdAt)] }, void 0, true
                    )] }, void 0, true
                  ),
                  _jsxDEV("div", { style: { fontSize: '0.77rem', color: '#777', display: 'flex', gap: 10, flexWrap: 'wrap' }, children: [
                    _jsxDEV("span", { children: [_jsxDEV(MapPin, { size: 11 }, void 0, false), " ", r.location, ", ", r.region] }, void 0, true),
                    r.anonymous ? _jsxDEV("span", { children: "👤 Anonymous" }, void 0, false) : r.contactName && _jsxDEV("span", { children: [_jsxDEV(User, { size: 11 }, void 0, false), " ", r.contactName] }, void 0, true)] }, void 0, true
                  )] }, void 0, true
                ),

                isOpen ? _jsxDEV(ChevronUp, { size: 15, color: "#555" }, void 0, false) : _jsxDEV(ChevronDown, { size: 15, color: "#555" }, void 0, false)] }, void 0, true
              ),


              isOpen &&
              _jsxDEV("div", { style: { padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }, children: [


                _jsxDEV("p", { style: { fontSize: '0.83rem', color: '#aaa', lineHeight: 1.7, margin: '12px 0 10px' }, children:
                  r.description }, void 0, false
                ),


                !r.anonymous && (r.contactPhone || r.contactEmail) &&
                _jsxDEV("div", { style: { display: 'flex', gap: 14, marginBottom: 10, fontSize: '0.77rem', color: '#777' }, children: [
                  r.contactPhone && _jsxDEV("span", { children: [_jsxDEV(Phone, { size: 12 }, void 0, false), " ", r.contactPhone] }, void 0, true),
                  r.contactEmail && _jsxDEV("span", { children: [_jsxDEV(Mail, { size: 12 }, void 0, false), " ", r.contactEmail] }, void 0, true)] }, void 0, true
                ),



                r.submittedBy &&
                _jsxDEV("div", { style: { fontSize: '0.73rem', color: '#555', marginBottom: 10 }, children: ["👤 Submitted by: ",
                  _jsxDEV("strong", { style: { color: '#888' }, children: r.submittedBy.name || 'User' }, void 0, false),
                  r.submittedBy.role && ` (${r.submittedBy.role})`] }, void 0, true
                ),



                r.files?.length > 0 &&
                _jsxDEV("div", { style: { fontSize: '0.75rem', color: '#666', marginBottom: 10 }, children: ["📎 ",
                  r.files.length, " file(s): ", r.files.join(', ')] }, void 0, true
                ),



                r.moderatorNote && !isEditing &&
                _jsxDEV("div", { style: { background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px',
                    fontSize: '0.77rem', color: '#888', marginBottom: 10, borderLeft: '3px solid #555' }, children: ["📝 Moderator Note: ",
                  r.moderatorNote] }, void 0, true
                ),



                isEditing ?
                _jsxDEV("div", { style: { background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    padding: '12px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }, children: [
                  _jsxDEV("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap' }, children: [

                    _jsxDEV("div", { style: { flex: 1, minWidth: 140 }, children: [
                      _jsxDEV("label", { style: { fontSize: '0.72rem', color: '#888', display: 'block', marginBottom: 4 }, children: "⚡ Risk Level" }, void 0, false),
                      _jsxDEV("select", { value: editForm.riskLevel,
                        onChange: (e) => setEditForm((f) => ({ ...f, riskLevel: e.target.value })),
                        style: { width: '100%', background: '#1a1a2e', color: '#e0e0e0',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem' }, children:
                        ['low', 'medium', 'high', 'critical'].map((l) => _jsxDEV("option", { children: l }, l, false)) }, void 0, false
                      )] }, void 0, true
                    ),

                    _jsxDEV("div", { style: { flex: 2, minWidth: 200 }, children: [
                      _jsxDEV("label", { style: { fontSize: '0.72rem', color: '#888', display: 'block', marginBottom: 4 }, children: "🚨 Urgency" }, void 0, false),
                      _jsxDEV("select", { value: editForm.urgency,
                        onChange: (e) => setEditForm((f) => ({ ...f, urgency: e.target.value })),
                        style: { width: '100%', background: '#1a1a2e', color: '#e0e0e0',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', fontSize: '0.82rem' }, children: [
                        _jsxDEV("option", { value: "Low — no immediate danger", children: "Low — no immediate danger" }, void 0, false),
                        _jsxDEV("option", { value: "Medium — situation developing", children: "Medium — situation developing" }, void 0, false),
                        _jsxDEV("option", { value: "High — immediate risk to life or wildlife", children: "High — immediate risk to life or wildlife" }, void 0, false)] }, void 0, true
                      )] }, void 0, true
                    )] }, void 0, true
                  ),

                  _jsxDEV("div", { children: [
                    _jsxDEV("label", { style: { fontSize: '0.72rem', color: '#888', display: 'block', marginBottom: 4 }, children: "📝 Moderator Note" }, void 0, false),
                    _jsxDEV("textarea", {
                      value: editForm.moderatorNote,
                      onChange: (e) => setEditForm((f) => ({ ...f, moderatorNote: e.target.value })),
                      rows: 2,
                      placeholder: "Add a note explaining your review decision…",
                      style: { width: '100%', background: '#1a1a2e', color: '#e0e0e0',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px',
                        fontSize: '0.82rem', resize: 'vertical', boxSizing: 'border-box' } }, void 0, false)] }, void 0, true
                  ),
                  _jsxDEV("div", { style: { display: 'flex', gap: 8 }, children: [
                    _jsxDEV("button", { onClick: () => saveEdit(r._id), style: {
                        background: '#4CAF5020', color: '#4CAF50', border: '1px solid #4CAF5040',
                        padding: '6px 16px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }, children: [
                      _jsxDEV(Save, { size: 13 }, void 0, false), " Save Changes"] }, void 0, true
                    ),
                    _jsxDEV("button", { onClick: () => setEditing(null), style: {
                        background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 16px', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }, children: [
                      _jsxDEV(X, { size: 13 }, void 0, false), " Cancel"] }, void 0, true
                    )] }, void 0, true
                  )] }, void 0, true
                ) :
                null,


                !isEditing &&
                _jsxDEV("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }, children: [

                  _jsxDEV("button", { onClick: () => startEdit(r), style: {
                      background: '#8b5cf620', color: '#a78bfa', border: '1px solid #8b5cf640',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }, children: [
                    _jsxDEV(Edit3, { size: 12 }, void 0, false), " Edit Details"] }, void 0, true
                  ),


                  r.status !== 'reviewed' && r.status !== 'fake' &&
                  _jsxDEV("button", { onClick: () => updateStatus(r._id, 'reviewed'), style: {
                      background: '#29b6f620', color: '#29b6f6', border: '1px solid #29b6f640',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }, children: [
                    _jsxDEV(Eye, { size: 12 }, void 0, false), " Mark Reviewed"] }, void 0, true
                  ),

                  r.status !== 'resolved' && r.status !== 'fake' &&
                  _jsxDEV("button", { onClick: () => updateStatus(r._id, 'resolved'), style: {
                      background: '#4CAF5020', color: '#4CAF50', border: '1px solid #4CAF5040',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }, children: [
                    _jsxDEV(CheckCircle, { size: 12 }, void 0, false), " Mark Resolved"] }, void 0, true
                  ),

                  r.status !== 'fake' &&
                  _jsxDEV("button", { onClick: () => updateStatus(r._id, 'fake'), style: {
                      background: '#e53e3e20', color: '#fc8181', border: '1px solid #e53e3e40',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }, children: [
                    _jsxDEV(Flag, { size: 12 }, void 0, false), " Mark Fake"] }, void 0, true
                  ),

                  r.status !== 'pending' &&
                  _jsxDEV("button", { onClick: () => updateStatus(r._id, 'pending'), style: {
                      background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }, children: "↩ Reset Pending" }, void 0, false

                  ),



                  _jsxDEV("button", { onClick: () => deleteReport(r._id, r.refId), style: {
                      background: '#ff174415', color: '#ff5252', border: '1px solid #ff174430',
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }, children: [
                    _jsxDEV(Trash2, { size: 12 }, void 0, false), " Delete"] }, void 0, true
                  )] }, void 0, true
                )] }, void 0, true

              )] }, r._id, true

            ));

        }) }, void 0, false
      )] }, void 0, true

    ));

};

export default ReportsInbox;