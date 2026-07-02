import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";








const RoleGuard = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      _jsxDEV("div", { style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '80vh', flexDirection: 'column', gap: 16,
          color: 'var(--text-muted)'
        }, children: [
        _jsxDEV("div", { style: { width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: '#16a34a', animation: 'spin 0.8s linear infinite' } }, void 0, false),
        _jsxDEV("span", { children: "Checking access…" }, void 0, false)] }, void 0, true
      ));

  }


  if (!user) {
    return _jsxDEV(Navigate, { to: "/signin", state: { from: location }, replace: true }, void 0, false);
  }


  if (roles.length > 0 && !roles.includes(user.role)) {
    return _jsxDEV(AccessDenied, { requiredRoles: roles, userRole: user.role }, void 0, false);
  }

  return children;
};

const AccessDenied = ({ requiredRoles, userRole }) =>
_jsxDEV("div", { style: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '70vh', gap: 20, padding: 40, textAlign: 'center'
  }, children: [
  _jsxDEV("div", { style: { fontSize: '4rem' }, children: "🚫" }, void 0, false),
  _jsxDEV("div", { children: [
    _jsxDEV("h2", { style: { color: 'var(--text-heading)', marginBottom: 8 }, children: "Access Denied" }, void 0, false),
    _jsxDEV("p", { style: { color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 4 }, children: ["This page requires: ",
      _jsxDEV("strong", { style: { color: '#ef4444' }, children: requiredRoles.join(' or ') }, void 0, false)] }, void 0, true
    ),
    _jsxDEV("p", { style: { color: 'var(--text-muted)', fontSize: '0.88rem' }, children: ["Your role: ",
      _jsxDEV("strong", { style: { color: '#16a34a' }, children: userRole }, void 0, false)] }, void 0, true
    )] }, void 0, true
  )] }, void 0, true
);


export default RoleGuard;