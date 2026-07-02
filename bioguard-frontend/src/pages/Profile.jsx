import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, MapPin, Shield, Edit3, Save, X,
  FileText, Bell, LogOut, CheckCircle, Activity, Clock } from
'lucide-react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Profile.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const ACT_ICON = { alert: Bell, report: FileText, join: CheckCircle, login: Activity };
const ACT_COLOR = { alert: '#fb8c00', report: '#4CAF50', join: '#1976d2', login: '#ab47bc' };

const Profile = () => {
  const { user, signOut, updateProfile } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', state: user?.state || '' });

  if (!user) {
    navigate('/signin');
    return null;
  }

  const saveEdit = () => {updateProfile({ name: form.name, bio: form.bio, state: form.state });setEditing(false);};
  const cancelEdit = () => {setForm({ name: user.name, bio: user.bio, state: user.state });setEditing(false);};

  const handleSignOut = () => {signOut();navigate('/');};

  return (
    _jsxDEV("div", { className: "page-root profile-page", children: [

      _jsxDEV("div", { className: "profile-banner", children: [
        _jsxDEV("div", { className: "pb-overlay" }, void 0, false),
        _jsxDEV("div", { className: "pb-content", children: [
          _jsxDEV("div", { className: "pb-avatar-wrap", children: [
            _jsxDEV("img", {
              src: user.avatar,
              alt: user.name,
              className: "pb-avatar",
              onError: (e) => {e.target.src = `https://api.dicebear.com/8.x/adventurer/svg?seed=${user.email}`;} }, void 0, false
            ),
            _jsxDEV("div", { className: "pb-online" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("div", { className: "pb-info", children: [
            _jsxDEV("div", { className: "pb-name-row", children: [
              _jsxDEV("h1", { className: "pb-name", children: user.name }, void 0, false),
              user.joinedVia === 'google' &&
              _jsxDEV("span", { className: "pb-google-badge", children: [
                _jsxDEV("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", children: [
                  _jsxDEV("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }, void 0, false),
                  _jsxDEV("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }, void 0, false),
                  _jsxDEV("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }, void 0, false),
                  _jsxDEV("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" }, void 0, false)] }, void 0, true
                ), "Google Account"] }, void 0, true

              )] }, void 0, true

            ),
            _jsxDEV("div", { className: "pb-meta", children: [
              _jsxDEV("span", { children: [_jsxDEV(Shield, { size: 13 }, void 0, false), " ", user.role] }, void 0, true),
              _jsxDEV("span", { children: [_jsxDEV(MapPin, { size: 13 }, void 0, false), " ", user.state] }, void 0, true),
              _jsxDEV("span", { children: [_jsxDEV(Clock, { size: 13 }, void 0, false), " Joined ", user.joined] }, void 0, true)] }, void 0, true
            )] }, void 0, true
          ),
          _jsxDEV("div", { className: "pb-actions", children: [
            _jsxDEV("button", { className: "pb-btn", onClick: () => setEditing((e) => !e), children: [
              _jsxDEV(Edit3, { size: 15 }, void 0, false), " ", editing ? 'Cancel' : 'Edit Profile'] }, void 0, true
            ),
            _jsxDEV("button", { className: "pb-btn danger", onClick: handleSignOut, children: [
              _jsxDEV(LogOut, { size: 15 }, void 0, false), " Sign Out"] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true
        )] }, void 0, true
      ),


      _jsxDEV("div", { className: "profile-body", children: [


        _jsxDEV("div", { className: "profile-left", children: [


          _jsxDEV("div", { className: "pcard", children: [
            _jsxDEV("h3", { children: [_jsxDEV(Activity, { size: 16 }, void 0, false), " Your Activity"] }, void 0, true),
            _jsxDEV("div", { className: "pstat-grid", children:
              [
              { val: user.reports, lbl: 'Reports Filed', color: '#4CAF50' },
              { val: user.alertsReceived, lbl: 'Alerts Received', color: '#fb8c00' },
              { val: 8, lbl: 'Conflicts Logged', color: '#e53935' },
              { val: 3, lbl: 'Badges Earned', color: '#ab47bc' }].
              map((s) =>
              _jsxDEV("div", { className: "pstat", style: { '--c': s.color }, children: [
                _jsxDEV("div", { className: "pstat-val", children: s.val }, void 0, false),
                _jsxDEV("div", { className: "pstat-lbl", children: s.lbl }, void 0, false)] }, s.lbl, true
              )
              ) }, void 0, false
            )] }, void 0, true
          ),


          _jsxDEV("div", { className: "pcard", children:
            !editing ?
            _jsxDEV(_Fragment, { children: [
              _jsxDEV("h3", { children: [_jsxDEV(User, { size: 16 }, void 0, false), " About"] }, void 0, true),
              _jsxDEV("p", { className: "profile-bio", children: user.bio || 'No bio yet — click Edit Profile to add one.' }, void 0, false),
              _jsxDEV("div", { className: "profile-detail-row", children: [
                _jsxDEV("span", { className: "pdr-label", children: [_jsxDEV(Mail, { size: 13 }, void 0, false), " Email"] }, void 0, true),
                _jsxDEV("span", { className: "pdr-val", children: user.email }, void 0, false)] }, void 0, true
              ),
              _jsxDEV("div", { className: "profile-detail-row", children: [
                _jsxDEV("span", { className: "pdr-label", children: [_jsxDEV(Shield, { size: 13 }, void 0, false), " Role"] }, void 0, true),
                _jsxDEV("span", { className: "pdr-val", children: user.role }, void 0, false)] }, void 0, true
              ),
              _jsxDEV("div", { className: "profile-detail-row", children: [
                _jsxDEV("span", { className: "pdr-label", children: [_jsxDEV(MapPin, { size: 13 }, void 0, false), " State"] }, void 0, true),
                _jsxDEV("span", { className: "pdr-val", children: user.state }, void 0, false)] }, void 0, true
              ),
              _jsxDEV("div", { className: "profile-detail-row", children: [
                _jsxDEV("span", { className: "pdr-label", children: "🔐 Signed in via" }, void 0, false),
                _jsxDEV("span", { className: "pdr-val", style: { display: 'flex', alignItems: 'center', gap: 5 }, children:
                  user.joinedVia === 'google' ?
                  _jsxDEV("span", { style: { display: 'flex', alignItems: 'center', gap: 4, color: '#4285F4', fontWeight: 600 }, children: [
                    _jsxDEV("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", children: [
                      _jsxDEV("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }, void 0, false),
                      _jsxDEV("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }, void 0, false),
                      _jsxDEV("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }, void 0, false),
                      _jsxDEV("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" }, void 0, false)] }, void 0, true
                    ), "Google"] }, void 0, true

                  ) :
                  '✉️ Email & Password' }, void 0, false
                )] }, void 0, true
              )] }, void 0, true
            ) :

            _jsxDEV(_Fragment, { children: [
              _jsxDEV("h3", { children: [_jsxDEV(Edit3, { size: 16 }, void 0, false), " Edit Profile"] }, void 0, true),
              _jsxDEV("div", { className: "edit-form", children: [
                _jsxDEV("label", { children: "Display Name" }, void 0, false),
                _jsxDEV("input", { className: "edit-input", value: form.name,
                  onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })) }, void 0, false),

                _jsxDEV("label", { children: "Bio" }, void 0, false),
                _jsxDEV("textarea", { className: "edit-input", rows: 3, placeholder: "Tell the community about yourself…",
                  value: form.bio,
                  onChange: (e) => setForm((f) => ({ ...f, bio: e.target.value })) }, void 0, false),

                _jsxDEV("label", { children: "State / Region" }, void 0, false),
                _jsxDEV("select", { className: "edit-input", value: form.state,
                  onChange: (e) => setForm((f) => ({ ...f, state: e.target.value })), children:
                  ['Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim', 'Uttarakhand', 'Other'].map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false
                ),

                _jsxDEV("div", { style: { fontSize: '0.78rem', color: '#666', marginTop: 4, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, borderLeft: '3px solid #555' }, children: ["🔐 Role: ",
                  _jsxDEV("strong", { style: { color: '#aaa' }, children: user.role }, void 0, false), " — Roles can only be changed by an admin."] }, void 0, true
                ),

                _jsxDEV("div", { className: "edit-actions", children: [
                  _jsxDEV("button", { className: "edit-btn save", onClick: saveEdit, children: [_jsxDEV(Save, { size: 15 }, void 0, false), " Save"] }, void 0, true),
                  _jsxDEV("button", { className: "edit-btn cancel", onClick: cancelEdit, children: [_jsxDEV(X, { size: 15 }, void 0, false), " Cancel"] }, void 0, true)] }, void 0, true
                )] }, void 0, true
              )] }, void 0, true
            ) }, void 0, false

          ),


          _jsxDEV("div", { className: "pcard", children: [
            _jsxDEV("h3", { children: "⚙️ Preferences" }, void 0, false),
            _jsxDEV("div", { className: "pref-row", children: [
              _jsxDEV("span", { children: "Appearance" }, void 0, false),
              _jsxDEV("button", { className: "theme-pill", onClick: toggle, children:
                theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode' }, void 0, false
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "pref-row", children: [
              _jsxDEV("span", { children: "Email notifications" }, void 0, false),
              _jsxDEV("div", { className: "toggle-wrap", children: [
                _jsxDEV("input", { type: "checkbox", id: "email-notif", defaultChecked: true }, void 0, false),
                _jsxDEV("label", { htmlFor: "email-notif", className: "toggle-label" }, void 0, false)] }, void 0, true
              )] }, void 0, true
            ),
            _jsxDEV("div", { className: "pref-row", children: [
              _jsxDEV("span", { children: "Push alerts" }, void 0, false),
              _jsxDEV("div", { className: "toggle-wrap", children: [
                _jsxDEV("input", { type: "checkbox", id: "push-notif", defaultChecked: true }, void 0, false),
                _jsxDEV("label", { htmlFor: "push-notif", className: "toggle-label" }, void 0, false)] }, void 0, true
              )] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true
        ),


        _jsxDEV("div", { className: "profile-right", children: [
          _jsxDEV("div", { className: "pcard full", children: [
            _jsxDEV("h3", { children: [_jsxDEV(Clock, { size: 16 }, void 0, false), " Recent Activity"] }, void 0, true),
            _jsxDEV("div", { className: "act-timeline", children:
              (user.recentActivity || []).map((a, i) => {
                const Icon = ACT_ICON[a.type] || Activity;
                return (
                  _jsxDEV("div", { className: "atl-item", children: [
                    _jsxDEV("div", { className: "atl-icon", style: { background: ACT_COLOR[a.type] + '22', color: ACT_COLOR[a.type] }, children:
                      _jsxDEV(Icon, { size: 16 }, void 0, false) }, void 0, false
                    ),
                    _jsxDEV("div", { className: "atl-body", children: [
                      _jsxDEV("div", { className: "atl-text", children: a.text }, void 0, false),
                      _jsxDEV("div", { className: "atl-time", children: a.time }, void 0, false)] }, void 0, true
                    )] }, i, true
                  ));

              }) }, void 0, false
            )] }, void 0, true
          ),


          _jsxDEV("div", { className: "pcard full", children: [
            _jsxDEV("h3", { children: ["📍 Coverage Area — ", user.state] }, void 0, true),
            _jsxDEV("div", { className: "coverage-map", style: { height: 220, borderRadius: 12, overflow: 'hidden' }, children:
              _jsxDEV(MapContainer, {
                center: [26.2, 93.0],
                zoom: 5,
                style: { height: '100%', width: '100%' },
                scrollWheelZoom: false,
                zoomControl: false,
                attributionControl: false, children: [

                _jsxDEV(TileLayer, { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" }, void 0, false),
                _jsxDEV(Circle, {
                  center: [26.2, 93.0],
                  radius: 300000,
                  pathOptions: { color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.12, weight: 1.5 } }, void 0, false
                )] }, void 0, true
              ) }, void 0, false
            ),
            _jsxDEV("p", { style: { fontSize: '0.78rem', color: '#555', marginTop: 8 }, children: "Your sightings and reports contribute to NE India's biodiversity dataset." }, void 0, false)] }, void 0, true
          )] }, void 0, true
        )] }, void 0, true

      )] }, void 0, true
    ));

};

export default Profile;