import React, { useState } from 'react';
import { BookOpen, TreePine, Bird, Fish, Bug, Leaf, ChevronRight, Clock, Tag, ExternalLink } from 'lucide-react';
import './Learn.css';import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const CATEGORIES = ['All', 'Conservation', 'Wildlife', 'Forests', 'Climate', 'Community'];

const ARTICLES = [
{
  id: 1, category: 'Forests', title: 'Understanding Deforestation: Causes & Global Impact',
  excerpt: 'Deforestation affects 15 billion trees every year. Learn about the primary drivers — from illegal logging to agricultural expansion — and what we can do to reverse the trend.',
  read: '8 min read', tag: 'Educational', image: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=600&q=80', featured: true
},
{
  id: 2, category: 'Wildlife', title: 'Human-Wildlife Conflict: Why It Happens & How to Prevent It',
  excerpt: 'As forest corridors shrink, animals increasingly venture into human settlements. Discover science-backed strategies to coexist peacefully with wildlife.',
  read: '6 min read', tag: 'Research', image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80', featured: true
},
{
  id: 3, category: 'Conservation', title: 'Community Rangers: The Frontline of Biodiversity Protection',
  excerpt: 'Meet the 400+ community rangers across India using BioGuard to report and prevent poaching. Their stories, tools, and impact.',
  read: '5 min read', tag: 'Story', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80', featured: false
},
{
  id: 4, category: 'Climate', title: 'How Forests Cool the Planet: The Science of Carbon Sinks',
  excerpt: 'Old-growth forests sequester massive amounts of carbon. Explore the chemistry behind carbon capture and why every tree matters in the fight against climate change.',
  read: '7 min read', tag: 'Science', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', featured: false
},
{
  id: 5, category: 'Wildlife', title: 'India\'s Big Five: Status, Threats, and Conservation Wins',
  excerpt: 'Tiger, Elephant, Rhino, Lion, Leopard — India\'s iconic megafauna. Get an updated look at their population trends and the policies protecting them.',
  read: '9 min read', tag: 'Wildlife', image: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=600&q=80', featured: false
},
{
  id: 6, category: 'Community', title: 'How to Report Environmental Violations: A Citizen\'s Guide',
  excerpt: 'You don\'t need to be a ranger to protect the forest. Learn how to document, report, and follow up on illegal activities using BioGuard\'s community tools.',
  read: '4 min read', tag: 'Guide', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80', featured: false
},
{
  id: 7, category: 'Forests', title: 'Satellite Technology in Forest Monitoring: How It Works',
  excerpt: 'From MODIS to Sentinel-2, learn how space-based sensors detect deforestation events within hours — and how BioGuard uses this data in real time.',
  read: '6 min read', tag: 'Technology', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80', featured: false
},
{
  id: 8, category: 'Conservation', title: 'Protected Area Networks: Are India\'s Wildlife Sanctuaries Enough?',
  excerpt: 'India has 988 protected areas covering 5% of its land. This analysis examines whether the current sanctuary system adequately protects wildlife corridors.',
  read: '10 min read', tag: 'Policy', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80', featured: false
}];


const SPECIES = [
{ name: 'Bengal Tiger', status: 'Vulnerable', population: '~3,800', icon: '🐯', color: '#ff6f00' },
{ name: 'Asian Elephant', status: 'Endangered', population: '~27,000', icon: '🐘', color: '#fb8c00' },
{ name: 'Snow Leopard', status: 'Vulnerable', population: '~4,500', icon: '🐆', color: '#ab47bc' },
{ name: 'Indian Rhino', status: 'Vulnerable', population: '~4,000', icon: '🦏', color: '#e53935' },
{ name: 'Red Panda', status: 'Endangered', population: '~10,000', icon: '🐼', color: '#d84315' },
{ name: 'Ganges Dolphin', status: 'Endangered', population: '~1,200', icon: '🐬', color: '#1565c0' }];


const STATUS_COLOR = { 'Vulnerable': '#fb8c00', 'Endangered': '#e53935', 'Critically Endangered': '#b71c1c' };

const TAG_COLOR = {
  Educational: '#1565c0', Research: '#6a1b9a', Story: '#2e7d32',
  Science: '#00695c', Wildlife: '#e65100', Guide: '#0277bd',
  Technology: '#283593', Policy: '#4a148c'
};

const Learn = () => {
  const [cat, setCat] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const shown = cat === 'All' ? ARTICLES : ARTICLES.filter((a) => a.category === cat);
  const featured = shown.filter((a) => a.featured);
  const rest = shown.filter((a) => !a.featured);

  return (
    _jsxDEV("div", { className: "page-root learn-page", children: [

      _jsxDEV("div", { className: "learn-hero", children:
        _jsxDEV("div", { className: "lh-content", children: [
          _jsxDEV(Leaf, { size: 40, className: "lh-icon" }, void 0, false),
          _jsxDEV("h1", { children: "Learn & Discover" }, void 0, false),
          _jsxDEV("p", { children: "Science-backed resources on biodiversity, forest conservation, and human-wildlife coexistence — curated for students, NGOs, and everyday citizens." }, void 0, false)] }, void 0, true
        ) }, void 0, false
      ),


      _jsxDEV("div", { className: "cat-nav", children:
        CATEGORIES.map((c) =>
        _jsxDEV("button", { className: `cat-tab ${cat === c ? 'active' : ''}`, onClick: () => setCat(c), children: c }, c, false)
        ) }, void 0, false
      ),

      _jsxDEV("div", { className: "learn-body", children: [


        featured.length > 0 &&
        _jsxDEV("div", { className: "featured-grid", children:
          featured.map((a) =>
          _jsxDEV("div", { className: "featured-card", children: [
            _jsxDEV("div", { className: "fc-img", style: { backgroundImage: `url(${a.image})` }, children: [
              _jsxDEV("div", { className: "fc-overlay" }, void 0, false),
              _jsxDEV("span", { className: "fc-cat", children: a.category }, void 0, false)] }, void 0, true
            ),
            _jsxDEV("div", { className: "fc-body", children: [
              _jsxDEV("div", { className: "fc-meta", children: [
                _jsxDEV("span", { className: "fc-tag", style: { background: TAG_COLOR[a.tag] + '22', color: TAG_COLOR[a.tag], border: `1px solid ${TAG_COLOR[a.tag]}44` }, children: [
                  _jsxDEV(Tag, { size: 11 }, void 0, false), " ", a.tag] }, void 0, true
                ),
                _jsxDEV("span", { className: "fc-read", children: [_jsxDEV(Clock, { size: 11 }, void 0, false), " ", a.read] }, void 0, true)] }, void 0, true
              ),
              _jsxDEV("h2", { className: "fc-title", children: a.title }, void 0, false),
              _jsxDEV("p", { className: "fc-excerpt", children: a.excerpt }, void 0, false),
              _jsxDEV("button", { className: "fc-btn", children: ["Read Article ", _jsxDEV(ExternalLink, { size: 14 }, void 0, false)] }, void 0, true)] }, void 0, true
            )] }, a.id, true
          )
          ) }, void 0, false
        ),



        rest.length > 0 &&
        _jsxDEV(_Fragment, { children: [
          _jsxDEV("h3", { className: "section-label", children: "More Articles" }, void 0, false),
          _jsxDEV("div", { className: "article-grid", children:
            rest.map((a) =>
            _jsxDEV("div", { className: `article-card ${expanded === a.id ? 'expanded' : ''}`,
              onClick: () => setExpanded(expanded === a.id ? null : a.id), children: [
              _jsxDEV("div", { className: "ac-img", style: { backgroundImage: `url(${a.image})` }, children:
                _jsxDEV("span", { className: "ac-cat", children: a.category }, void 0, false) }, void 0, false
              ),
              _jsxDEV("div", { className: "ac-body", children: [
                _jsxDEV("div", { className: "ac-meta", children: [
                  _jsxDEV("span", { className: "ac-tag", style: { background: TAG_COLOR[a.tag] + '22', color: TAG_COLOR[a.tag] }, children: [
                    _jsxDEV(Tag, { size: 10 }, void 0, false), " ", a.tag] }, void 0, true
                  ),
                  _jsxDEV("span", { className: "ac-read", children: [_jsxDEV(Clock, { size: 10 }, void 0, false), " ", a.read] }, void 0, true)] }, void 0, true
                ),
                _jsxDEV("h3", { className: "ac-title", children: a.title }, void 0, false),
                expanded === a.id && _jsxDEV("p", { className: "ac-excerpt", children: a.excerpt }, void 0, false),
                _jsxDEV("span", { className: "ac-more", children: [expanded === a.id ? 'Show less' : 'Read more', " ", _jsxDEV(ChevronRight, { size: 13 }, void 0, false)] }, void 0, true)] }, void 0, true
              )] }, a.id, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ),



        _jsxDEV("div", { className: "species-section", children: [
          _jsxDEV("div", { className: "section-hdr", children: [
            _jsxDEV(Bird, { size: 20 }, void 0, false), " ", _jsxDEV("h3", { children: "Species Spotlight — Conservation Status" }, void 0, false)] }, void 0, true
          ),
          _jsxDEV("div", { className: "species-grid", children:
            SPECIES.map((s) =>
            _jsxDEV("div", { className: "species-card", style: { '--sc': s.color }, children: [
              _jsxDEV("div", { className: "sp-emoji", children: s.icon }, void 0, false),
              _jsxDEV("div", { className: "sp-name", children: s.name }, void 0, false),
              _jsxDEV("div", { className: "sp-status", style: { color: STATUS_COLOR[s.status] }, children: s.status }, void 0, false),
              _jsxDEV("div", { className: "sp-pop", children: ["Est. population: ", _jsxDEV("strong", { children: s.population }, void 0, false)] }, void 0, true)] }, s.name, true
            )
            ) }, void 0, false
          )] }, void 0, true
        ),


        _jsxDEV("div", { className: "resources-section", children: [
          _jsxDEV("h3", { children: "External Resources" }, void 0, false),
          _jsxDEV("div", { className: "resource-grid", children:
            [
            { name: 'Wildlife Institute of India', url: 'https://wii.gov.in', icon: TreePine },
            { name: 'WWF India', url: 'https://wwfindia.org', icon: Bird },
            { name: 'MoEFCC — Forest Data', url: 'https://moef.gov.in', icon: Leaf },
            { name: 'IUCN Red List', url: 'https://iucnredlist.org', icon: Bug },
            { name: 'NASA FIRMS Fire Map', url: 'https://firms.modaps.eosdis.nasa.gov', icon: Fish },
            { name: 'Global Forest Watch', url: 'https://globalforestwatch.org', icon: BookOpen }].
            map((r) =>
            _jsxDEV("a", { href: r.url, target: "_blank", rel: "noreferrer", className: "resource-card", children: [
              _jsxDEV(r.icon, { size: 18 }, void 0, false),
              _jsxDEV("span", { children: r.name }, void 0, false),
              _jsxDEV(ExternalLink, { size: 13 }, void 0, false)] }, r.name, true
            )
            ) }, void 0, false
          )] }, void 0, true
        )] }, void 0, true

      )] }, void 0, true
    ));

};

export default Learn;