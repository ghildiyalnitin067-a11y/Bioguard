import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert, Map, Users, ChevronDown, Activity,
  TreePine, AlertTriangle, Globe, ArrowRight, Eye,
  TrendingUp, Zap, BookOpen, BarChart2, CheckCircle,
  MessageSquare, Star, Trash2 } from
'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Home.css';import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";


function useCounter(end, duration = 2000, startTrigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startTrigger) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, startTrigger]);
  return count;
}


function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {if (entry.isIntersecting) setInView(true);},
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}


const StatCard = ({ icon: Icon, end, suffix, label, color }) => {
  const [ref, inView] = useInView();
  const count = useCounter(end, 2200, inView);
  return (
    _jsxDEV("div", { className: "stat-card", ref: ref, style: { '--accent': color }, children: [
      _jsxDEV("div", { className: "stat-icon-wrap", children: _jsxDEV(Icon, { size: 28 }, void 0, false) }, void 0, false),
      _jsxDEV("div", { className: "stat-number", children: [count.toLocaleString(), suffix] }, void 0, true),
      _jsxDEV("div", { className: "stat-label", children: label }, void 0, false)] }, void 0, true
    ));

};


const FeatureCard = ({ icon: Icon, title, description, link, linkLabel, delay }) =>
_jsxDEV("div", { className: "feature-card", style: { animationDelay: delay }, children: [
  _jsxDEV("div", { className: "feature-icon-wrap", children: _jsxDEV(Icon, { size: 32 }, void 0, false) }, void 0, false),
  _jsxDEV("h3", { children: title }, void 0, false),
  _jsxDEV("p", { children: description }, void 0, false),
  _jsxDEV(Link, { to: link, className: "feature-link", children: [
    linkLabel, " ", _jsxDEV(ArrowRight, { size: 16 }, void 0, false)] }, void 0, true
  )] }, void 0, true
);




const Home = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [heroVisible, setHeroVisible] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [impactRef, impactInView] = useInView(0.1);

  const [testimonials, setTestimonials] = useState([]);
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('');
  const [tContent, setTContent] = useState('');
  const [tRating, setTRating] = useState(5);
  const [tMsg, setTMsg] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);


  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${base.endsWith('/') ? base.slice(0, -1) : base}/api/testimonials`).
    then((res) => res.json()).
    then((data) => setTestimonials(data.testimonials || [])).
    catch(() => {});
  }, []);


  const fetchAlerts = React.useCallback(async () => {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base.endsWith('/') ? base.slice(0, -1) : base}/api/alerts?limit=15`);
      if (res.ok) {
        const json = await res.json();
        if (json.alerts?.length) {
          setAlerts((prev) => {
            const wsOnly = prev.filter((a) => a._live && !json.alerts.find((x) => x._id === a._id));
            return [...wsOnly, ...json.alerts];
          });
        }
      }
    } catch (e) {console.error('[Home] Failed to fetch live alerts', e);}
  }, []);

  useEffect(() => {
    fetchAlerts();
    const t1 = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(t1);
  }, [fetchAlerts]);


  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const WS_URL = API_URL.replace(/^http/, 'ws');
    const connect = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);
        wsRef.current.onclose = () => setTimeout(connect, 5000);
        wsRef.current.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.event === 'new_alert') {
              const a = { ...msg.data, _id: msg.data._id || msg.data.id, _live: true };
              setAlerts((prev) => prev.find((x) => x._id === a._id) ? prev : [a, ...prev.slice(0, 14)]);
            }
            if (msg.event === 'realtime_alert_batch' && msg.data?.alerts) {
              const batch = msg.data.alerts.map((a) => ({
                ...a, _id: a._id || a.id || `rt-${Date.now()}-${Math.random()}`, _live: true
              }));
              setAlerts((prev) => {
                const newOnes = batch.filter((a) => !prev.find((x) => x._id === a._id));
                return newOnes.length > 0 ? [...newOnes, ...prev].slice(0, 15) : prev;
              });
            }
          } catch (_) {}
        };
      } catch (_) {}
    };
    connect();
    return () => {if (wsRef.current) wsRef.current.close();};
  }, []);

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault();
    if (!tName || !tRole || !tContent) {
      setTMsg('Please fill all fields');
      return;
    }
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    try {
      const res = await fetch(`${base.endsWith('/') ? base.slice(0, -1) : base}/api/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tName, role: tRole, content: tContent, rating: tRating })
      });
      if (res.ok) {
        const json = await res.json();
        setTestimonials([json.testimonial, ...testimonials]);
        setTName('');setTRole('');setTContent('');setTRating(5);
        setTMsg('Thank you for your review!');
        setTimeout(() => {
          setTMsg('');
          setShowReviewModal(false);
        }, 1500);
      } else {
        setTMsg('Failed to submit review');
      }
    } catch {
      setTMsg('Error submitting review');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    try {
      const token = localStorage.getItem('bioguard-jwt');
      const res = await fetch(`${base.endsWith('/') ? base.slice(0, -1) : base}/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t._id !== id));
      } else {
        alert('Failed to delete review');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    _jsxDEV("div", { className: `home-container ${heroVisible ? 'fade-in' : ''}`, children: [


      _jsxDEV("div", {
        className: "alert-ticker",
        onMouseEnter: () => setTickerPaused(true),
        onMouseLeave: () => setTickerPaused(false), children: [

        _jsxDEV("span", { className: "ticker-label", children: [_jsxDEV(Zap, { size: 14 }, void 0, false), " LIVE ALERTS"] }, void 0, true),
        _jsxDEV("div", { className: "ticker-track-wrapper", children:
          _jsxDEV("div", { className: `ticker-track ${tickerPaused ? 'paused' : ''}`, children: [
            [...alerts, ...alerts].map((a, i) => {
              const severityType = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info';
              const label = a.severity ? a.severity.toUpperCase() : 'INFO';
              const text = a.headline || a.description || `${a.type} Alert in ${a.location}`;
              return (
                _jsxDEV("span", { className: `ticker-item ticker-${severityType}`, children: [
                  _jsxDEV("span", { className: "ticker-badge", children: label }, void 0, false), " ", text,
                  _jsxDEV("span", { className: "ticker-sep", children: "  •  " }, void 0, false)] }, i, true
                ));

            }),
            alerts.length === 0 &&
            _jsxDEV("span", { className: "ticker-item ticker-info", children: [
              _jsxDEV("span", { className: "ticker-badge", children: "INFO" }, void 0, false), " Connected to live real-time network... Waiting for updates."] }, void 0, true
            )] }, void 0, true

          ) }, void 0, false
        )] }, void 0, true
      ),


      _jsxDEV("section", { className: "hero-section", children: [
        _jsxDEV("div", { className: "hero-overlay" }, void 0, false),
        _jsxDEV("div", { className: "hero-particles", children:
          [...Array(12)].map((_, i) =>
          _jsxDEV("span", { className: "particle", style: {
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`
            } }, i, false)
          ) }, void 0, false
        ),

        _jsxDEV("div", { className: "hero-content", children: [
          _jsxDEV("div", { className: "hero-badge", children: [
            _jsxDEV(Activity, { size: 14 }, void 0, false), " Real-Time Biodiversity Intelligence"] }, void 0, true
          ),
          _jsxDEV("h1", { className: "hero-title", children: ["Protecting\xA0",
            _jsxDEV("span", { className: "hero-highlight", children: "Forests" }, void 0, false), " &", _jsxDEV("br", {}, void 0, false), "Wildlife with Technology"] }, void 0, true

          ),
          _jsxDEV("p", { className: "hero-description", children: "India's most advanced platform for monitoring deforestation, predicting human-wildlife conflict, and mobilising community conservation — in real time." }, void 0, false


          ),
          _jsxDEV("div", { className: "hero-buttons", children: [
            _jsxDEV(Link, { to: "/dashboard", className: "btn btn-primary", id: "hero-dashboard-btn", children: [
              _jsxDEV(BarChart2, { size: 18 }, void 0, false), " Explore Dashboard"] }, void 0, true
            ),
            _jsxDEV(Link, { to: "/report", className: "btn btn-secondary", id: "hero-report-btn", children: [
              _jsxDEV(AlertTriangle, { size: 18 }, void 0, false), " Report Incident"] }, void 0, true
            )] }, void 0, true
          ),
          _jsxDEV("div", { className: "hero-trust", children:
            ['Satellite Data', 'AI-Powered Alerts', 'Community-Driven', 'Open Source'].map((tag) =>
            _jsxDEV("span", { className: "trust-tag", children: [_jsxDEV(CheckCircle, { size: 12 }, void 0, false), " ", tag] }, tag, true)
            ) }, void 0, false
          )] }, void 0, true
        ),

        _jsxDEV("button", { className: "scroll-indicator", onClick: scrollToFeatures, "aria-label": "Scroll down", children:
          _jsxDEV(ChevronDown, { size: 32 }, void 0, false) }, void 0, false
        )] }, void 0, true
      ),


      _jsxDEV("section", { className: "stats-section", children:
        _jsxDEV("div", { className: "stats-grid", children: [
          _jsxDEV(StatCard, { icon: TreePine, end: 2847, suffix: "+", label: "Deforestation Alerts This Month", color: "#4CAF50" }, void 0, false),
          _jsxDEV(StatCard, { icon: ShieldAlert, end: 134, suffix: "", label: "Active Conflict Zones Monitored", color: "#fb8c00" }, void 0, false),
          _jsxDEV(StatCard, { icon: Users, end: 12400, suffix: "+", label: "Community Reports Filed", color: "#29b6f6" }, void 0, false),
          _jsxDEV(StatCard, { icon: Globe, end: 98, suffix: "%", label: "Alert Accuracy Rate", color: "#ab47bc" }, void 0, false)] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("section", { id: "features", className: `features-section ${featuresInView ? 'animate-in' : ''}`, ref: featuresRef, children:
        _jsxDEV("div", { className: "section-container", children: [
          _jsxDEV("div", { className: "section-header", children: [
            _jsxDEV("span", { className: "section-eyebrow", children: "What We Do" }, void 0, false),
            _jsxDEV("h2", { className: "section-title", children: "Core Capabilities" }, void 0, false),
            _jsxDEV("p", { className: "section-subtitle", children: "Six powerful modules working in concert to protect India's natural heritage and the communities that live alongside it." }, void 0, false


            )] }, void 0, true
          ),

          _jsxDEV("div", { className: "features-grid", children: [
            _jsxDEV(FeatureCard, {
              icon: Map,
              title: "Real-Time Forest Monitoring",
              description: "Track forest coverage, active fires, and deforestation hotspots using interactive satellite-derived map layers updated every 24 hours.",
              link: "/dashboard",
              linkLabel: "Open Map",
              delay: "0s" }, void 0, false
            ),
            _jsxDEV(FeatureCard, {
              icon: ShieldAlert,
              title: "Wildlife Conflict Alerts",
              description: "Predict and monitor animal movement near human settlements. Instant SMS + in-app alerts for every potential conflict zone.",
              link: "/alerts",
              linkLabel: "View Alerts",
              delay: "0.1s" }, void 0, false
            ),
            _jsxDEV(FeatureCard, {
              icon: Users,
              title: "Community Reporting",
              description: "A crowdsourced network: locals can report illegal logging, poaching, or dangerous wildlife proximity — securely and anonymously.",
              link: "/report",
              linkLabel: "Submit Report",
              delay: "0.2s" }, void 0, false
            ),
            _jsxDEV(FeatureCard, {
              icon: Eye,
              title: "Conflict Monitor",
              description: "A live geospatial dashboard showing ongoing human-wildlife conflict incidents with severity levels, response status, and trend lines.",
              link: "/conflict",
              linkLabel: "Monitor Now",
              delay: "0.3s" }, void 0, false
            ),
            _jsxDEV(FeatureCard, {
              icon: TrendingUp,
              title: "Analytics & Insights",
              description: "Deep-dive charts and time-series analysis on deforestation rate, biodiversity index, and conflict frequency — exportable as PDF.",
              link: "/analytics",
              linkLabel: "View Analytics",
              delay: "0.4s" }, void 0, false
            ),
            _jsxDEV(FeatureCard, {
              icon: BookOpen,
              title: "Learn & Awareness",
              description: "Curated educational resources, species guides, and conservation best-practices for students, NGOs, and policy makers alike.",
              link: "/learn",
              linkLabel: "Start Learning",
              delay: "0.5s" }, void 0, false
            )] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("section", { className: "how-section", children:
        _jsxDEV("div", { className: "section-container how-inner", children: [
          _jsxDEV("div", { className: "how-text", children: [
            _jsxDEV("span", { className: "section-eyebrow", children: "How It Works" }, void 0, false),
            _jsxDEV("h2", { className: "section-title left", children: "Three Steps to Conservation" }, void 0, false),
            _jsxDEV("div", { className: "steps", children:
              [
              { num: '01', title: 'Satellite Ingestion', desc: 'NASA MODIS & Sentinel-2 imagery is processed nightly to detect land-cover change.' },
              { num: '02', title: 'AI Alert Engine', desc: 'Machine-learning models flag deforestation events and predict wildlife movement corridors.' },
              { num: '03', title: 'Community Action', desc: 'Rangers, locals, and NGOs receive instant alerts and can submit ground-truth reports.' }].
              map((s) =>
              _jsxDEV("div", { className: "step", children: [
                _jsxDEV("span", { className: "step-num", children: s.num }, void 0, false),
                _jsxDEV("div", { children: [
                  _jsxDEV("h4", { children: s.title }, void 0, false),
                  _jsxDEV("p", { children: s.desc }, void 0, false)] }, void 0, true
                )] }, s.num, true
              )
              ) }, void 0, false
            ),
            _jsxDEV(Link, { to: "/dashboard", className: "btn btn-primary inline-btn", children: ["Explore Live Map ",
              _jsxDEV(ArrowRight, { size: 18 }, void 0, false)] }, void 0, true
            )] }, void 0, true
          ),

          _jsxDEV("div", { className: "map-preview-wrap", children:
            _jsxDEV("div", { className: "map-preview-card", children: [
              _jsxDEV("div", { className: "map-preview-header", children: [
                _jsxDEV("span", { className: "map-dot red" }, void 0, false), _jsxDEV("span", { className: "map-dot yellow" }, void 0, false), _jsxDEV("span", { className: "map-dot green" }, void 0, false),
                _jsxDEV("span", { className: "map-title-tag", children: "BioGuard · Live Map" }, void 0, false),
                _jsxDEV("span", { className: "live-badge", children: [_jsxDEV("span", { className: "pulse-ring" }, void 0, false), " LIVE"] }, void 0, true)] }, void 0, true
              ),
              _jsxDEV("div", { className: "map-preview-body", children: [

                _jsxDEV("div", { className: "fake-map", children: [
                  _jsxDEV("div", { className: "fake-forest zone1" }, void 0, false),
                  _jsxDEV("div", { className: "fake-forest zone2" }, void 0, false),
                  _jsxDEV("div", { className: "fake-forest zone3" }, void 0, false),
                  _jsxDEV("div", { className: "fake-river" }, void 0, false),
                  _jsxDEV("div", { className: "fake-alert fa1", children: _jsxDEV(AlertTriangle, { size: 12 }, void 0, false) }, void 0, false),
                  _jsxDEV("div", { className: "fake-alert fa2", children: _jsxDEV(AlertTriangle, { size: 12 }, void 0, false) }, void 0, false),
                  _jsxDEV("div", { className: "fake-ping fp1" }, void 0, false),
                  _jsxDEV("div", { className: "fake-ping fp2" }, void 0, false),
                  _jsxDEV("div", { className: "map-grid-overlay" }, void 0, false)] }, void 0, true
                ),
                _jsxDEV("div", { className: "map-legend", children: [
                  _jsxDEV("span", { className: "legend-item", children: [_jsxDEV("span", { className: "legend-dot", style: { background: '#4CAF50' } }, void 0, false), " Forest Cover"] }, void 0, true),
                  _jsxDEV("span", { className: "legend-item", children: [_jsxDEV("span", { className: "legend-dot", style: { background: '#fb8c00' } }, void 0, false), " Alert Zone"] }, void 0, true),
                  _jsxDEV("span", { className: "legend-item", children: [_jsxDEV("span", { className: "legend-dot", style: { background: '#e53935' } }, void 0, false), " Critical"] }, void 0, true)] }, void 0, true
                )] }, void 0, true
              )] }, void 0, true
            ) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("section", { className: `impact-section ${impactInView ? 'animate-in' : ''}`, ref: impactRef, children:
        _jsxDEV("div", { className: "section-container", children: [
          _jsxDEV("div", { className: "section-header light", children: [
            _jsxDEV("span", { className: "section-eyebrow light", children: "Our Impact" }, void 0, false),
            _jsxDEV("h2", { className: "section-title light", children: "Measurable Conservation Results" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("div", { className: "impact-grid", children:
            [
            { value: '34%', label: 'Reduction in repeat conflict incidents in monitored zones' },
            { value: '2.1M', label: 'Hectares of forest under active satellite surveillance' },
            { value: '6 min', label: 'Average time from detection to alert dispatch' },
            { value: '42+', label: 'Partner NGOs and forest departments using BioGuard' }].
            map((item) =>
            _jsxDEV("div", { className: "impact-card", children: [
              _jsxDEV("div", { className: "impact-value", children: item.value }, void 0, false),
              _jsxDEV("div", { className: "impact-label", children: item.label }, void 0, false)] }, item.value, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ) }, void 0, false
      ),




      _jsxDEV("section", { className: "testimonials-section", children:
        _jsxDEV("div", { className: "section-container", children: [
          _jsxDEV("div", { className: "section-header", style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '40px' }, children: [
            _jsxDEV("div", { style: { textAlign: 'left' }, children: [
              _jsxDEV("span", { className: "section-eyebrow", children: "Community & Users" }, void 0, false),
              _jsxDEV("h2", { className: "section-title left", style: { margin: 0 }, children: "What People Say" }, void 0, false),
              _jsxDEV("p", { className: "section-subtitle", style: { margin: '8px 0 0', maxWidth: '500px' }, children: "Real experiences from field workers, conservationists, and citizens." }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("button", { onClick: () => setShowReviewModal(true), className: "btn btn-primary", style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [
              _jsxDEV(MessageSquare, { size: 18 }, void 0, false), " Write a Review"] }, void 0, true
            )] }, void 0, true
          ),

          _jsxDEV("div", { className: "testimonials-track", children: [
            testimonials.map((t) =>
            _jsxDEV("div", { className: "testimonial-card", style: { position: 'relative' }, children: [
              isAdmin &&
              _jsxDEV("button", {
                onClick: () => handleDeleteTestimonial(t._id),
                style: { position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', opacity: 0.8 },
                title: "Delete Testimonial", children:

                _jsxDEV(Trash2, { size: 16 }, void 0, false) }, void 0, false
              ),

              _jsxDEV("div", { style: { display: 'flex', gap: '4px', color: '#fb8c00' }, children:
                [...Array(5)].map((_, i) => _jsxDEV(Star, { size: 18, fill: i < t.rating ? 'currentColor' : 'none', color: i < t.rating ? 'currentColor' : '#ddd' }, i, false)) }, void 0, false
              ),
              _jsxDEV("p", { className: "testimonial-text", children: ["\"", t.content, "\""] }, void 0, true),
              _jsxDEV("div", { className: "testimonial-author-wrap", children: [
                _jsxDEV("div", { className: "testimonial-author", children: t.name }, void 0, false),
                _jsxDEV("div", { className: "testimonial-author-role", children: t.role }, void 0, false)] }, void 0, true
              )] }, t._id, true
            )
            ),
            testimonials.length === 0 && _jsxDEV("div", { style: { color: '#666', padding: '20px 0' }, children: "No reviews yet. Be the first to share your experience!" }, void 0, false)] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ),


      showReviewModal &&
      _jsxDEV("div", { className: "review-modal-overlay", onClick: () => setShowReviewModal(false), children:
        _jsxDEV("div", { className: "review-modal-content", onClick: (e) => e.stopPropagation(), children: [
          _jsxDEV("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }, children: [
            _jsxDEV("h3", { className: "review-modal-title", children: [
              _jsxDEV(MessageSquare, { size: 24, color: "#4CAF50" }, void 0, false), " Add Your Review"] }, void 0, true
            ),
            _jsxDEV("button", { className: "review-modal-close", onClick: () => setShowReviewModal(false), children: "×" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("form", { onSubmit: handleTestimonialSubmit, style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [
            _jsxDEV("input", { className: "review-input", value: tName, onChange: (e) => setTName(e.target.value), placeholder: "Your Name", required: true }, void 0, false),
            _jsxDEV("input", { className: "review-input", value: tRole, onChange: (e) => setTRole(e.target.value), placeholder: "Your Role (e.g. Forest Ranger)", required: true }, void 0, false),
            _jsxDEV("textarea", { className: "review-input", value: tContent, onChange: (e) => setTContent(e.target.value), placeholder: "Share your experience...", required: true, rows: 4, style: { resize: 'vertical' } }, void 0, false),
            _jsxDEV("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }, children: [
              _jsxDEV("span", { style: { fontSize: '0.95rem', color: '#666', fontWeight: 600 }, children: "Rating:" }, void 0, false),
              [...Array(5)].map((_, i) =>
              _jsxDEV(Star, { size: 26, onClick: () => setTRating(i + 1), style: { cursor: 'pointer', transition: 'transform 0.1s' }, onMouseDown: (e) => e.currentTarget.style.transform = 'scale(0.9)', onMouseUp: (e) => e.currentTarget.style.transform = 'scale(1)',
                fill: i < tRating ? '#fb8c00' : 'none', color: i < tRating ? '#fb8c00' : '#ddd' }, i, false)
              )] }, void 0, true
            ),
            tMsg && _jsxDEV("div", { style: { fontSize: '0.9rem', color: tMsg.includes('Thank') ? '#2e7d32' : '#c62828', background: tMsg.includes('Thank') ? '#e8f5e9' : '#ffebee', padding: '12px', borderRadius: '8px', fontWeight: 500 }, children: tMsg }, void 0, false),
            _jsxDEV("button", { type: "submit", className: "btn btn-primary", style: { width: '100%', justifyContent: 'center', marginTop: '12px' }, children: "Submit Review" }, void 0, false

            )] }, void 0, true
          )] }, void 0, true
        ) }, void 0, false
      ),



      _jsxDEV("section", { className: "cta-section", children: [
        _jsxDEV("div", { className: "cta-content", children: [
          _jsxDEV(TreePine, { size: 48, className: "cta-icon" }, void 0, false),
          _jsxDEV("h2", { children: "Join the Conservation Network" }, void 0, false),
          _jsxDEV("p", { children: "Whether you're a ranger, researcher, NGO, or a concerned citizen — your eyes on the ground can make a difference." }, void 0, false


          ),
          _jsxDEV("div", { className: "cta-buttons", children: [
            _jsxDEV(Link, { to: "/report", className: "btn btn-primary", id: "cta-report-btn", children: "Report an Incident" }, void 0, false

            ),
            _jsxDEV(Link, { to: "/learn", className: "btn btn-outline", id: "cta-learn-btn", children: "Learn More" }, void 0, false

            )] }, void 0, true
          )] }, void 0, true
        ),
        _jsxDEV("div", { className: "cta-bg-shapes", children: [
          _jsxDEV("span", { className: "cta-shape s1" }, void 0, false),
          _jsxDEV("span", { className: "cta-shape s2" }, void 0, false),
          _jsxDEV("span", { className: "cta-shape s3" }, void 0, false)] }, void 0, true
        )] }, void 0, true
      )] }, void 0, true

    ));

};

export default Home;