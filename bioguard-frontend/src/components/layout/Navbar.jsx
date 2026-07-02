import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf, Menu, X, Sun, Moon, LogIn, UserPlus, ChevronDown, LogOut, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const NAV_LINKS = [
{ name: 'Home', path: '/' },
{ name: 'Dashboard', path: '/dashboard' },
{ name: 'Alerts', path: '/alerts' },
{ name: 'Conflict Monitor', path: '/conflict' },
{ name: 'Analytics', path: '/analytics' },
{ name: 'Report', path: '/report' },
{ name: 'Learn', path: '/learn' }];


const Navbar = () => {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);


  const isHome = location.pathname === '/';

  const isSolid = !isHome || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  useEffect(() => {
    const handler = (e) => {if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    signOut();
    navigate('/');
  };

  return (
    _jsxDEV("nav", { className: `navbar ${isSolid ? 'scrolled' : ''} theme-${theme}`, children: [
      _jsxDEV("div", { className: "navbar-container", children: [


        _jsxDEV(Link, { to: "/", className: "navbar-logo", children: [
          _jsxDEV(Leaf, { className: "logo-icon", size: 28 }, void 0, false),
          _jsxDEV("span", { children: "BioGuard" }, void 0, false)] }, void 0, true
        ),


        _jsxDEV("div", { className: "navbar-links", children:
          NAV_LINKS.map((l) =>
          _jsxDEV(NavLink, {

            to: l.path,
            className: ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`, children:
            l.name }, l.name, false)
          ) }, void 0, false
        ),


        _jsxDEV("div", { className: "navbar-right", children: [

          _jsxDEV("button", { className: "theme-toggle", onClick: toggle, title: theme === 'dark' ? 'Switch to Light' : 'Switch to Dark', children:
            theme === 'dark' ? _jsxDEV(Sun, { size: 18 }, void 0, false) : _jsxDEV(Moon, { size: 18 }, void 0, false) }, void 0, false
          ),


          !user ?
          _jsxDEV("div", { className: "auth-buttons", children: [
            _jsxDEV(Link, { to: "/signin", className: "nav-signin", children: ["  ", _jsxDEV(LogIn, { size: 15 }, void 0, false), " Sign In  "] }, void 0, true),
            _jsxDEV(Link, { to: "/signup", className: "nav-signup", children: ["  ", _jsxDEV(UserPlus, { size: 15 }, void 0, false), " Sign Up  "] }, void 0, true)] }, void 0, true
          ) :

          _jsxDEV("div", { className: "user-menu", ref: dropRef, children: [
            _jsxDEV("button", { className: "user-trigger", onClick: () => setDropdownOpen((o) => !o), children: [
              _jsxDEV("img", {
                src: user.avatar,
                alt: user.name,
                className: "user-avatar",
                onError: (e) => {e.target.src = `https://api.dicebear.com/8.x/adventurer/svg?seed=${user.email}`;} }, void 0, false
              ),
              _jsxDEV("span", { className: "user-name", children: user.name.split(' ')[0] }, void 0, false),
              _jsxDEV(ChevronDown, { size: 14, className: `chevron ${dropdownOpen ? 'open' : ''}` }, void 0, false)] }, void 0, true
            ),
            dropdownOpen &&
            _jsxDEV("div", { className: "user-dropdown", children: [
              _jsxDEV("div", { className: "ud-header", children: [
                _jsxDEV("img", {
                  src: user.avatar,
                  alt: user.name,
                  className: "ud-avatar",
                  onError: (e) => {e.target.src = `https://api.dicebear.com/8.x/adventurer/svg?seed=${user.email}`;} }, void 0, false
                ),
                _jsxDEV("div", { className: "ud-header-info", children: [
                  _jsxDEV("strong", { children: user.name }, void 0, false),
                  _jsxDEV("span", { className: "ud-email", children: user.email }, void 0, false),
                  user.joinedVia === 'google' &&
                  _jsxDEV("span", { className: "ud-google-badge", children: [
                    _jsxDEV("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", children: [
                      _jsxDEV("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }, void 0, false),
                      _jsxDEV("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }, void 0, false),
                      _jsxDEV("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }, void 0, false),
                      _jsxDEV("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" }, void 0, false)] }, void 0, true
                    ), "Google Account"] }, void 0, true

                  )] }, void 0, true

                )] }, void 0, true
              ),
              _jsxDEV(Link, { to: "/profile", className: "ud-item", onClick: () => setDropdownOpen(false), children: [
                _jsxDEV(User, { size: 15 }, void 0, false), " My Profile"] }, void 0, true
              ),
              _jsxDEV("button", { className: "ud-item danger", onClick: handleSignOut, children: [
                _jsxDEV(LogOut, { size: 15 }, void 0, false), " Sign Out"] }, void 0, true
              )] }, void 0, true
            )] }, void 0, true

          ),



          _jsxDEV("button", { className: "mobile-menu-icon", onClick: () => setMobileOpen((o) => !o), children:
            mobileOpen ? _jsxDEV(X, { size: 26 }, void 0, false) : _jsxDEV(Menu, { size: 26 }, void 0, false) }, void 0, false
          )] }, void 0, true
        )] }, void 0, true
      ),


      _jsxDEV("div", { className: `mobile-menu ${mobileOpen ? 'open' : ''}`, children: [
        NAV_LINKS.map((l) =>
        _jsxDEV(NavLink, {

          to: l.path,
          className: "mobile-nav-item",
          onClick: () => setMobileOpen(false), children:
          l.name }, l.name, false)
        ),
        _jsxDEV("div", { className: "mobile-auth", children:
          !user ?
          _jsxDEV(_Fragment, { children: [
            _jsxDEV(Link, { to: "/signin", className: "mobile-auth-btn", onClick: () => setMobileOpen(false), children: "Sign In" }, void 0, false),
            _jsxDEV(Link, { to: "/signup", className: "mobile-auth-btn primary", onClick: () => setMobileOpen(false), children: "Sign Up" }, void 0, false)] }, void 0, true
          ) :

          _jsxDEV(_Fragment, { children: [
            _jsxDEV(Link, { to: "/profile", className: "mobile-auth-btn", onClick: () => setMobileOpen(false), children: "My Profile" }, void 0, false),
            _jsxDEV("button", { className: "mobile-auth-btn danger", onClick: handleSignOut, children: "Sign Out" }, void 0, false)] }, void 0, true
          ) }, void 0, false

        )] }, void 0, true
      )] }, void 0, true
    ));

};

export default Navbar;