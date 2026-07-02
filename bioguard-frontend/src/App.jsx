import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleGuard from './components/RoleGuard';
import Navbar from './components/layout/Navbar';


import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import ConflictMonitor from './pages/ConflictMonitor';
import Analytics from './pages/Analytics';
import Report from './pages/Report';
import Learn from './pages/Learn';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';

import NotificationManager from './components/NotificationManager';
import AlertToastBar from './components/AlertToastBar';
import './App.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";







const SmartDashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return _jsxDEV(Navigate, { to: "/signin", replace: true }, void 0, false);
  if (user.role === 'admin') return _jsxDEV(Navigate, { to: "/admin-dashboard", replace: true }, void 0, false);
  if (user.role === 'asha_worker') return _jsxDEV(Navigate, { to: "/worker-dashboard", replace: true }, void 0, false);
  return _jsxDEV(Dashboard, {}, void 0, false);
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const hasGoogleAuth = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

function App() {
  const content =
  _jsxDEV(ThemeProvider, { children:
    _jsxDEV(AuthProvider, { children:
      _jsxDEV(Router, { children:
        _jsxDEV("div", { className: "app-container", children: [
          _jsxDEV(Navbar, {}, void 0, false),
          _jsxDEV(NotificationManager, {}, void 0, false),
          _jsxDEV(AlertToastBar, {}, void 0, false),
          _jsxDEV("main", { className: "main-content", children:
            _jsxDEV(Routes, { children: [

              _jsxDEV(Route, { path: "/", element: _jsxDEV(Home, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/signin", element: _jsxDEV(SignIn, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/signup", element: _jsxDEV(SignUp, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/learn", element: _jsxDEV(Learn, {}, void 0, false) }, void 0, false),


              _jsxDEV(Route, { path: "/dashboard", element:
                _jsxDEV(RoleGuard, { roles: ['user', 'asha_worker', 'admin'], children:
                  _jsxDEV(SmartDashboard, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV(Route, { path: "/profile", element:
                _jsxDEV(RoleGuard, { roles: ['user', 'asha_worker', 'admin'], children:
                  _jsxDEV(Profile, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV(Route, { path: "/alerts", element:
                _jsxDEV(RoleGuard, { roles: ['user', 'asha_worker', 'admin'], children:
                  _jsxDEV(Alerts, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV(Route, { path: "/report", element:
                _jsxDEV(RoleGuard, { roles: ['user', 'asha_worker', 'admin'], children:
                  _jsxDEV(Report, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),


              _jsxDEV(Route, { path: "/conflict", element:
                _jsxDEV(RoleGuard, { roles: ['asha_worker', 'admin'], children:
                  _jsxDEV(ConflictMonitor, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV(Route, { path: "/analytics", element:
                _jsxDEV(RoleGuard, { roles: ['asha_worker', 'admin'], children:
                  _jsxDEV(Analytics, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),
              _jsxDEV(Route, { path: "/worker-dashboard", element:
                _jsxDEV(RoleGuard, { roles: ['asha_worker', 'admin'], children:
                  _jsxDEV(WorkerDashboard, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),


              _jsxDEV(Route, { path: "/admin-dashboard", element:
                _jsxDEV(RoleGuard, { roles: ['admin'], children:
                  _jsxDEV(AdminDashboard, {}, void 0, false) }, void 0, false
                ) }, void 0, false
              ),


              _jsxDEV(Route, { path: "*", element: _jsxDEV(Navigate, { to: "/", replace: true }, void 0, false) }, void 0, false)] }, void 0, true
            ) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ) }, void 0, false
    ) }, void 0, false
  );


  return hasGoogleAuth ?
  _jsxDEV(GoogleOAuthProvider, { clientId: GOOGLE_CLIENT_ID, children: content }, void 0, false) :
  content;
}

export default App;