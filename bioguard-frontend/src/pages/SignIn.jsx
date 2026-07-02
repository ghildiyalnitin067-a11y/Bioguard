import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Leaf, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import './Auth.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasGoogleAuth = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

const SignIn = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn(form.email, form.password);
    setLoading(false);
    if (res.ok) navigate('/dashboard');else
    setError(res.error);
  };

  const handleGoogle = async (credentialResponse) => {
    setError('');
    setLoading(true);
    const res = await signInWithGoogle(credentialResponse.credential);
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
          _jsxDEV("h1", { children: "Protect North East India's Wilderness" }, void 0, false),
          _jsxDEV("p", { children: "Real-time biodiversity monitoring across Assam, Arunachal Pradesh, Meghalaya, Nagaland, Manipur, Mizoram, Tripura and Sikkim — together." }, void 0, false


          ),
          _jsxDEV("div", { className: "auth-quote", children: [
            _jsxDEV("blockquote", { children: "\"The forest is not a resource for us, it is a relative.\"" }, void 0, false),
            _jsxDEV("cite", { children: "— Indigenous Wisdom, NE India" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("div", { className: "auth-stats-row", children:
            [['82', 'Protected Areas'], ['65%', 'Forest Cover'], ['400+', 'Active Rangers']].map(([v, l]) =>
            _jsxDEV("div", { className: "auth-stat", children: [
              _jsxDEV("span", { className: "as-val", children: v }, void 0, false),
              _jsxDEV("span", { className: "as-lbl", children: l }, void 0, false)] }, l, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("div", { className: "auth-right", children:
        _jsxDEV("div", { className: "auth-form-card", children: [
          _jsxDEV("div", { className: "auth-form-header", children: [
            _jsxDEV("h2", { children: "Welcome back" }, void 0, false),
            _jsxDEV("p", { children: "Sign in to your BioGuard account" }, void 0, false)] }, void 0, true
          ),


          hasGoogleAuth &&
          _jsxDEV(_Fragment, { children: [
            _jsxDEV("div", { className: "google-btn-wrap", children:
              _jsxDEV(GoogleLogin, {
                onSuccess: handleGoogle,
                onError: () => setError('Google sign-in failed. Please try again.'),
                theme: "outline",
                shape: "rectangular",
                size: "large",
                width: "100%",
                text: "signin_with" }, void 0, false
              ) }, void 0, false
            ),
            _jsxDEV("div", { className: "auth-divider", children: _jsxDEV("span", { children: "or sign in with email" }, void 0, false) }, void 0, false)] }, void 0, true
          ),


          _jsxDEV("form", { onSubmit: submit, className: "auth-form", children: [
            error && _jsxDEV("div", { className: "auth-error", children: error }, void 0, false),

            _jsxDEV("div", { className: "auth-field", children: [
              _jsxDEV("label", { children: "Email Address" }, void 0, false),
              _jsxDEV("div", { className: "auth-input-wrap", children: [
                _jsxDEV(Mail, { size: 16 }, void 0, false),
                _jsxDEV("input", {
                  name: "email", type: "email", required: true,
                  placeholder: "ranger@bioguard.in",
                  value: form.email, onChange: handle }, void 0, false
                )] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("div", { className: "auth-field", children: [
              _jsxDEV("label", { children: "Password" }, void 0, false),
              _jsxDEV("div", { className: "auth-input-wrap", children: [
                _jsxDEV(Lock, { size: 16 }, void 0, false),
                _jsxDEV("input", {
                  name: "password", type: showPw ? 'text' : 'password', required: true,
                  placeholder: "••••••••",
                  value: form.password, onChange: handle }, void 0, false
                ),
                _jsxDEV("button", { type: "button", className: "pw-toggle", onClick: () => setShowPw((p) => !p), children:
                  showPw ? _jsxDEV(EyeOff, { size: 15 }, void 0, false) : _jsxDEV(Eye, { size: 15 }, void 0, false) }, void 0, false
                )] }, void 0, true
              )] }, void 0, true
            ),

            _jsxDEV("button", { type: "submit", className: `auth-btn ${loading ? 'loading' : ''}`, disabled: loading, children: [
              loading ? _jsxDEV("span", { className: "spin" }, void 0, false) : _jsxDEV(LogIn, { size: 17 }, void 0, false),
              loading ? 'Signing in…' : 'Sign In'] }, void 0, true
            )] }, void 0, true
          ),

          _jsxDEV("div", { className: "auth-demo-hint", children: [
            _jsxDEV("strong", { children: "Demo accounts:" }, void 0, false), " admin@bioguard.in / Admin@1234 \xA0|\xA0 ranger@bioguard.in / Ranger@1234"] }, void 0, true
          ),

          _jsxDEV("p", { className: "auth-switch", children: ["Don't have an account? ",
            _jsxDEV(Link, { to: "/signup", children: "Create one" }, void 0, false)] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      )] }, void 0, true
    ));

};

export default SignIn;