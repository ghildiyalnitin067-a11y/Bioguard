import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Leaf, Mail, Lock, User, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const NE_STATES = ['Assam', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura', 'Sikkim'];
const ROLES = ['Community Member', 'Field Researcher', 'Forest Ranger', 'NGO Worker', 'Government Official', 'Journalist', 'Student'];

const SignUp = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Community Member', state: 'Assam' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {setError('Password must be at least 6 characters.');return;}
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const res = await signUp(form);
    setLoading(false);
    if (res.ok) navigate('/dashboard');else
    setError(res.error);
  };

  return (
    _jsxDEV("div", { className: "auth-page", children: [

      _jsxDEV("div", { className: "auth-left", children:
        _jsxDEV("div", { className: "auth-left-inner", children: [
          _jsxDEV("div", { className: "auth-brand", children: [
            _jsxDEV(Leaf, { size: 36, className: "auth-brand-icon" }, void 0, false),
            _jsxDEV("span", { children: "BioGuard" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("h1", { children: "Join the Conservation Network" }, void 0, false),
          _jsxDEV("p", { children: "Become part of a community protecting the rich biodiversity of North East India — 8 states, 82 protected areas, and thousands of species depend on us." }, void 0, false


          ),
          _jsxDEV("div", { className: "auth-feature-list", children:
            [
            '🗺️ Live threat maps across NE India',
            '🚨 Real-time deforestation & wildlife alerts',
            '📊 Analytics and conservation insights',
            '📝 Community incident reporting'].
            map((f) => _jsxDEV("div", { className: "af-item", children: f }, f, false)) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("div", { className: "auth-right", children:
        _jsxDEV("div", { className: "auth-form-card", children: [
          _jsxDEV("div", { className: "auth-form-header", children: [
            _jsxDEV("h2", { children: "Create your account" }, void 0, false),
            _jsxDEV("p", { children: "Free to join — for rangers, researchers & citizens" }, void 0, false)] }, void 0, true
          ),

          _jsxDEV("form", { onSubmit: submit, className: "auth-form", children: [
            error && _jsxDEV("div", { className: "auth-error", children: error }, void 0, false),

            _jsxDEV("div", { className: "auth-field", children: [
              _jsxDEV("label", { children: "Full Name" }, void 0, false),
              _jsxDEV("div", { className: "auth-input-wrap", children: [
                _jsxDEV(User, { size: 16 }, void 0, false),
                _jsxDEV("input", { name: "name", type: "text", required: true, placeholder: "Priya Sharma",
                  value: form.name, onChange: handle }, void 0, false)] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("div", { className: "auth-field", children: [
              _jsxDEV("label", { children: "Email Address" }, void 0, false),
              _jsxDEV("div", { className: "auth-input-wrap", children: [
                _jsxDEV(Mail, { size: 16 }, void 0, false),
                _jsxDEV("input", { name: "email", type: "email", required: true, placeholder: "you@example.com",
                  value: form.email, onChange: handle }, void 0, false)] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("div", { className: "auth-field", children: [
              _jsxDEV("label", { children: "Password" }, void 0, false),
              _jsxDEV("div", { className: "auth-input-wrap", children: [
                _jsxDEV(Lock, { size: 16 }, void 0, false),
                _jsxDEV("input", { name: "password", type: showPw ? 'text' : 'password', required: true, placeholder: "Min 6 characters",
                  value: form.password, onChange: handle }, void 0, false),
                _jsxDEV("button", { type: "button", className: "pw-toggle", onClick: () => setShowPw((p) => !p), children:
                  showPw ? _jsxDEV(EyeOff, { size: 15 }, void 0, false) : _jsxDEV(Eye, { size: 15 }, void 0, false) }, void 0, false
                )] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("div", { className: "auth-row-2", children: [
              _jsxDEV("div", { className: "auth-field", children: [
                _jsxDEV("label", { children: "Role" }, void 0, false),
                _jsxDEV("select", { name: "role", value: form.role, onChange: handle, className: "auth-select", children:
                  ROLES.map((r) => _jsxDEV("option", { children: r }, r, false)) }, void 0, false
                )] }, void 0, true
              ),
              _jsxDEV("div", { className: "auth-field", children: [
                _jsxDEV("label", { children: [_jsxDEV(MapPin, { size: 13 }, void 0, false), " State"] }, void 0, true),
                _jsxDEV("select", { name: "state", value: form.state, onChange: handle, className: "auth-select", children:
                  NE_STATES.map((s) => _jsxDEV("option", { children: s }, s, false)) }, void 0, false
                )] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("button", { type: "submit", className: `auth-btn ${loading ? 'loading' : ''}`, disabled: loading, children: [
              loading ? _jsxDEV("span", { className: "spin" }, void 0, false) : _jsxDEV(UserPlus, { size: 17 }, void 0, false),
              loading ? 'Creating account…' : 'Create Account'] }, void 0, true
            )] }, void 0, true
          ),

          _jsxDEV("p", { className: "auth-switch", children: ["Already have an account? ",
            _jsxDEV(Link, { to: "/signin", children: "Sign in" }, void 0, false)] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      )] }, void 0, true
    ));

};

export default SignUp;