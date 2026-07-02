import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, TreePine, Flame, Crosshair, Camera,
  MapPin, Upload, CheckCircle, ChevronRight, ChevronLeft,
  User, Phone, Mail, Send, Loader } from
'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notifyReport } from '../services/notifications';
import './Report.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const INCIDENT_TYPES = [
{ key: 'wildlife', label: 'Wildlife Conflict', icon: AlertTriangle, color: '#e53935', desc: 'Animal near settlements, dangerous sighting, or livestock attack' },
{ key: 'deforestation', label: 'Illegal Logging', icon: TreePine, color: '#fb8c00', desc: 'Illegal tree felling, land clearing, or mining without permits' },
{ key: 'fire', label: 'Forest Fire', icon: Flame, color: '#ff6f00', desc: 'Active wildfire, slash-and-burn, or suspicious smoke' },
{ key: 'poaching', label: 'Poaching Activity', icon: Crosshair, color: '#7b1fa2', desc: 'Illegal hunting, snares, traps, or poacher sightings' },
{ key: 'other', label: 'Other Threat', icon: Camera, color: '#1565c0', desc: 'Pollution, encroachment, or any other environmental threat' }];


const REGIONS = ['Karnataka', 'Kerala', 'Tamil Nadu', 'Uttarakhand', 'Assam', 'Madhya Pradesh', 'Rajasthan', 'Arunachal Pradesh', 'Maharashtra', 'Other', 'Manipur', 'Meghalaya', 'Nagaland'];

const QUICK_LOCATIONS = [
{ name: 'Custom Location', region: '' },
{ name: 'Kaziranga Eastern Range', region: 'Assam', loc: 'Kaziranga National Park - Eastern Range' },
{ name: 'Manas Buffer Zone', region: 'Assam', loc: 'Manas National Park - Buffer Zone' },
{ name: 'Namdapha Tiger Corridor', region: 'Arunachal Pradesh', loc: 'Namdapha National Park' },
{ name: 'Keibul Lamjao Wetlands', region: 'Manipur', loc: 'Keibul Lamjao National Park' },
{ name: 'Nokrek Biosphere Reserve', region: 'Meghalaya', loc: 'Nokrek National Park' },
{ name: 'Dzukou Valley', region: 'Nagaland', loc: 'Dzukou Valley Trek' },
{ name: 'Rajaji Elephant Corridor', region: 'Uttarakhand', loc: 'Rajaji National Park' }];

const URGENCY = ['Low — no immediate danger', 'Medium — situation developing', 'High — immediate risk to life or wildlife'];

const STEPS = ['Incident Type', 'Location & Details', 'Evidence', 'Contact Info'];

const Report = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: '', region: '', location: '', urgency: '', description: '',
    files: [], imageData: [], name: '', phone: '', email: '', anonymous: false
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${API_URL}/api/locations/suggestions`).
    then((res) => res.json()).
    then((data) => setSuggestions(data.locations || [])).
    catch(() => {});
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const filteredSuggestions = suggestions.filter((s) =>
  s.name.toLowerCase().includes((form.location || '').toLowerCase()) ||
  s.state.toLowerCase().includes((form.location || '').toLowerCase())
  ).slice(0, 10);

  const canNext = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return form.region && form.location && form.urgency && form.description;
    if (step === 2) return true;
    if (step === 3) return form.anonymous || form.name && form.phone;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token = localStorage.getItem('bioguard-jwt');
      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: form.type,
          region: form.region,
          location: form.location,
          urgency: form.urgency,
          description: form.description,
          files: form.files,
          imageData: form.imageData,
          anonymous: form.anonymous,
          name: form.name,
          phone: form.phone,
          email: form.email,
          userId: user?._id || user?.id || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setRefId(data.refId);
      setSubmitted(true);
      notifyReport(data.refId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }


  async function handleFileChange(e) {
    const picked = Array.from(e.target.files);
    const names = picked.map((f) => f.name);
    const images = picked.filter((f) => f.type.startsWith('image/'));
    let dataUrls = [];
    try {
      dataUrls = await Promise.all(images.map(readAsDataURL));
    } catch (_) {}
    setForm((f) => ({
      ...f,
      files: [...f.files, ...names],
      imageData: [...f.imageData, ...dataUrls]
    }));
  }

  if (submitted) return (
    _jsxDEV("div", { className: "page-root rp-page", children:
      _jsxDEV("div", { className: "success-screen", children: [
        _jsxDEV("div", { className: "success-icon", children: _jsxDEV(CheckCircle, { size: 64 }, void 0, false) }, void 0, false),
        _jsxDEV("h2", { children: "Report Submitted!" }, void 0, false),
        _jsxDEV("p", { children: ["Thank you for contributing to conservation. Your report has been assigned ID ", _jsxDEV("strong", { children: ["#", refId] }, void 0, true), " and will be reviewed within 30 minutes."] }, void 0, true),
        _jsxDEV("button", { className: "btn-primary-rp", onClick: () => {setSubmitted(false);setStep(0);setRefId('');setForm({ type: '', region: '', location: '', urgency: '', description: '', files: [], imageData: [], name: '', phone: '', email: '', anonymous: false });}, children: "Submit Another Report" }, void 0, false

        )] }, void 0, true
      ) }, void 0, false
    ));


  return (
    _jsxDEV("div", { className: "page-root rp-page", children: [
      _jsxDEV("div", { className: "page-header-bar", children:
        _jsxDEV("div", { children: [
          _jsxDEV("h1", { className: "page-title", children: "Community Report" }, void 0, false),
          _jsxDEV("p", { className: "page-sub", children: "Report illegal activities or wildlife threats securely and anonymously" }, void 0, false)] }, void 0, true
        ) }, void 0, false
      ),

      _jsxDEV("div", { className: "report-container", children: [

        _jsxDEV("div", { className: "stepper", children:
          STEPS.map((s, i) =>
          _jsxDEV(React.Fragment, { children: [
            _jsxDEV("div", { className: `step-node ${i < step ? 'done' : i === step ? 'active' : ''}`, children: [
              _jsxDEV("div", { className: "step-circle", children:
                i < step ? _jsxDEV(CheckCircle, { size: 16 }, void 0, false) : _jsxDEV("span", { children: i + 1 }, void 0, false) }, void 0, false
              ),
              _jsxDEV("span", { className: "step-label", children: s }, void 0, false)] }, void 0, true
            ),
            i < STEPS.length - 1 && _jsxDEV("div", { className: `step-line ${i < step ? 'done' : ''}` }, void 0, false)] }, s, true
          )
          ) }, void 0, false
        ),

        _jsxDEV("div", { className: "step-content", children: [


          step === 0 &&
          _jsxDEV("div", { className: "step-panel", children: [
            _jsxDEV("h2", { className: "step-title", children: "What are you reporting?" }, void 0, false),
            _jsxDEV("p", { className: "step-hint", children: "Select the category that best describes the incident." }, void 0, false),
            _jsxDEV("div", { className: "type-grid", children:
              INCIDENT_TYPES.map((t) =>
              _jsxDEV("button", {
                className: `type-card ${form.type === t.key ? 'sel' : ''}`,
                style: { '--tc': t.color },
                onClick: () => set('type', t.key), children: [
                _jsxDEV("div", { className: "tc-icon", children: _jsxDEV(t.icon, { size: 28 }, void 0, false) }, void 0, false),
                _jsxDEV("div", { className: "tc-label", children: t.label }, void 0, false),
                _jsxDEV("div", { className: "tc-desc", children: t.desc }, void 0, false),
                form.type === t.key && _jsxDEV("div", { className: "tc-check", children: _jsxDEV(CheckCircle, { size: 18 }, void 0, false) }, void 0, false)] }, t.key, true
              )
              ) }, void 0, false
            )] }, void 0, true
          ),



          step === 1 &&
          _jsxDEV("div", { className: "step-panel", children: [
            _jsxDEV("h2", { className: "step-title", children: "Location & Details" }, void 0, false),
            _jsxDEV("p", { className: "step-hint", children: "Help responders locate the incident quickly." }, void 0, false),
            _jsxDEV("div", { className: "form-grid", children: [

              _jsxDEV("div", { className: "form-group", children: [
                _jsxDEV("label", { children: "State / Region *" }, void 0, false),
                _jsxDEV("select", { className: "form-select", value: form.region, onChange: (e) => set('region', e.target.value), children: [
                  _jsxDEV("option", { value: "", children: "Select region…" }, void 0, false),
                  REGIONS.map((r) => _jsxDEV("option", { children: r }, r, false))] }, void 0, true
                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "form-group", style: { position: 'relative' }, children: [
                _jsxDEV("label", { children: "Specific Location *" }, void 0, false),
                _jsxDEV("div", { className: "input-icon-wrap", children: [
                  _jsxDEV(MapPin, { size: 15 }, void 0, false),
                  _jsxDEV("input", { className: "form-input", placeholder: "Search village, park, or landmark…",
                    value: form.location,
                    onChange: (e) => {
                      set('location', e.target.value);
                      setShowSuggestions(true);
                    },
                    onFocus: () => setShowSuggestions(true),
                    onBlur: () => setTimeout(() => setShowSuggestions(false), 200) }, void 0, false
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
                        if (loc.state) set('region', loc.state);
                        setShowSuggestions(false);
                      }, style: {
                        padding: '10px 14px', cursor: 'pointer', fontSize: '0.82rem',
                        borderBottom: i < filteredSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 2,
                        background: 'transparent'
                      },
                      onMouseEnter: (e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)',
                      onMouseLeave: (e) => e.currentTarget.style.background = 'transparent', children: [

                      _jsxDEV("span", { style: { color: '#fff', fontWeight: 600 }, children: loc.name }, void 0, false),
                      _jsxDEV("span", { style: { fontSize: '0.7rem', color: '#888' }, children: [loc.state, " • ", loc.type] }, void 0, true)] }, i, true
                    )
                    ) }, void 0, false
                  )] }, void 0, true

                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "form-group full", children: [
                _jsxDEV("label", { children: "Urgency Level *" }, void 0, false),
                _jsxDEV("div", { className: "urgency-opts", children:
                  URGENCY.map((u, i) =>
                  _jsxDEV("label", { className: `urgency-opt ${form.urgency === u ? 'sel' : ''}`, children: [
                    _jsxDEV("input", { type: "radio", name: "urgency", value: u, checked: form.urgency === u,
                      onChange: () => set('urgency', u) }, void 0, false),
                    _jsxDEV("span", { className: `urg-dot urg-${i}` }, void 0, false),
                    u] }, u, true
                  )
                  ) }, void 0, false
                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "form-group full", children: [
                _jsxDEV("label", { children: "Description *" }, void 0, false),
                _jsxDEV("textarea", { className: "form-textarea", rows: 5,
                  placeholder: "Describe what you saw — animal species, number of people involved, time of occurrence, suspicious activity details…",
                  value: form.description, onChange: (e) => set('description', e.target.value) }, void 0, false)] }, void 0, true
              )] }, void 0, true
            )] }, void 0, true
          ),



          step === 2 &&
          _jsxDEV("div", { className: "step-panel", children: [
            _jsxDEV("h2", { className: "step-title", children: ["Upload Evidence ", _jsxDEV("span", { className: "optional", children: "(Optional)" }, void 0, false)] }, void 0, true),
            _jsxDEV("p", { className: "step-hint", children: "Photos, videos, or documents help us verify and prioritise your report." }, void 0, false),
            _jsxDEV("div", { className: "upload-zone", onClick: () => document.getElementById('file-input').click(), children: [
              _jsxDEV(Upload, { size: 40 }, void 0, false),
              _jsxDEV("p", { children: "Click to upload or drag & drop" }, void 0, false),
              _jsxDEV("span", { children: "PNG, JPG, MP4, PDF — Max 20MB each" }, void 0, false),
              _jsxDEV("input", { id: "file-input", type: "file", multiple: true, hidden: true,
                accept: "image/*,video/*,.pdf",
                onChange: handleFileChange }, void 0, false)] }, void 0, true
            ),
            form.files.length > 0 &&
            _jsxDEV("div", { className: "file-list", children:
              form.files.map((f, i) => {
                const preview = form.imageData.find((d, di) => di === i) ||
                form.imageData[i];
                return (
                  _jsxDEV("div", { className: "file-item", children: [
                    preview ?
                    _jsxDEV("img", { src: preview, alt: f,
                      style: { width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 } }, void 0, false) :

                    _jsxDEV(Camera, { size: 14 }, void 0, false),

                    _jsxDEV("span", { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: f }, void 0, false),
                    _jsxDEV("button", { onClick: () => setForm((fm) => ({
                        ...fm,
                        files: fm.files.filter((_, j) => j !== i),
                        imageData: fm.imageData.filter((_, j) => j !== i)
                      })), children: "×" }, void 0, false)] }, i, true
                  ));

              }) }, void 0, false
            ),

            _jsxDEV("div", { className: "anon-notice", children: [
              _jsxDEV(CheckCircle, { size: 16 }, void 0, false), " Your identity is ", _jsxDEV("strong", { children: "never" }, void 0, false), " shared with authorities without your consent."] }, void 0, true
            )] }, void 0, true
          ),



          step === 3 &&
          _jsxDEV("div", { className: "step-panel", children: [
            _jsxDEV("h2", { className: "step-title", children: "Contact Information" }, void 0, false),
            _jsxDEV("p", { className: "step-hint", children: "Optionally share your details so responders can follow up." }, void 0, false),
            _jsxDEV("label", { className: "anon-toggle", children: [
              _jsxDEV("input", { type: "checkbox", checked: form.anonymous, onChange: (e) => set('anonymous', e.target.checked) }, void 0, false),
              _jsxDEV("span", { className: "toggle-track", children: _jsxDEV("span", { className: "toggle-thumb" }, void 0, false) }, void 0, false), "Submit anonymously"] }, void 0, true

            ),
            !form.anonymous &&
            _jsxDEV("div", { className: "form-grid", children: [
              _jsxDEV("div", { className: "form-group", children: [
                _jsxDEV("label", { children: "Full Name *" }, void 0, false),
                _jsxDEV("div", { className: "input-icon-wrap", children: [_jsxDEV(User, { size: 15 }, void 0, false),
                  _jsxDEV("input", { className: "form-input", placeholder: "Your name",
                    value: form.name, onChange: (e) => set('name', e.target.value) }, void 0, false)] }, void 0, true
                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "form-group", children: [
                _jsxDEV("label", { children: "Phone *" }, void 0, false),
                _jsxDEV("div", { className: "input-icon-wrap", children: [_jsxDEV(Phone, { size: 15 }, void 0, false),
                  _jsxDEV("input", { className: "form-input", placeholder: "+91 XXXXX XXXXX",
                    value: form.phone, onChange: (e) => set('phone', e.target.value) }, void 0, false)] }, void 0, true
                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "form-group full", children: [
                _jsxDEV("label", { children: "Email (optional)" }, void 0, false),
                _jsxDEV("div", { className: "input-icon-wrap", children: [_jsxDEV(Mail, { size: 15 }, void 0, false),
                  _jsxDEV("input", { className: "form-input", placeholder: "you@example.com",
                    value: form.email, onChange: (e) => set('email', e.target.value) }, void 0, false)] }, void 0, true
                )] }, void 0, true
              )] }, void 0, true
            ),


            _jsxDEV("div", { className: "summary-box", children: [
              _jsxDEV("h4", { children: "Report Summary" }, void 0, false),
              _jsxDEV("div", { className: "summary-row", children: [_jsxDEV("span", { children: "Type:" }, void 0, false), _jsxDEV("span", { children: INCIDENT_TYPES.find((t) => t.key === form.type)?.label }, void 0, false)] }, void 0, true),
              _jsxDEV("div", { className: "summary-row", children: [_jsxDEV("span", { children: "Region:" }, void 0, false), _jsxDEV("span", { children: form.region }, void 0, false)] }, void 0, true),
              _jsxDEV("div", { className: "summary-row", children: [_jsxDEV("span", { children: "Location:" }, void 0, false), _jsxDEV("span", { children: form.location }, void 0, false)] }, void 0, true),
              _jsxDEV("div", { className: "summary-row", children: [_jsxDEV("span", { children: "Urgency:" }, void 0, false), _jsxDEV("span", { children: form.urgency }, void 0, false)] }, void 0, true),
              _jsxDEV("div", { className: "summary-row", children: [_jsxDEV("span", { children: "Evidence:" }, void 0, false), _jsxDEV("span", { children: [form.files.length, " file(s)",
                  form.imageData.length > 0 && ` · ${form.imageData.length} image(s)`] }, void 0, true)] }, void 0, true)] }, void 0, true
            )] }, void 0, true
          )] }, void 0, true

        ),


        _jsxDEV("div", { className: "step-nav", children: [
          step > 0 &&
          _jsxDEV("button", { className: "nav-btn secondary", onClick: () => setStep((s) => s - 1), children: [
            _jsxDEV(ChevronLeft, { size: 16 }, void 0, false), " Back"] }, void 0, true
          ),

          _jsxDEV("div", { style: { flex: 1 } }, void 0, false),
          error && _jsxDEV("span", { className: "rp-error", children: error }, void 0, false),
          step < STEPS.length - 1 ?
          _jsxDEV("button", { className: "nav-btn primary", onClick: () => setStep((s) => s + 1), disabled: !canNext(), children: ["Next ",
            _jsxDEV(ChevronRight, { size: 16 }, void 0, false)] }, void 0, true
          ) :

          _jsxDEV("button", { className: "nav-btn submit", onClick: handleSubmit, disabled: !canNext() || loading, children:
            loading ? _jsxDEV(_Fragment, { children: [_jsxDEV(Loader, { size: 16, className: "spin-icon" }, void 0, false), " Submitting…"] }, void 0, true) : _jsxDEV(_Fragment, { children: [_jsxDEV(Send, { size: 16 }, void 0, false), " Submit Report"] }, void 0, true) }, void 0, false
          )] }, void 0, true

        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default Report;