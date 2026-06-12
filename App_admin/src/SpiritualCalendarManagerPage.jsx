import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Calendar, Sparkles, BookOpen, Save, Check, X,
  ArrowLeft, RefreshCw, Loader2, List, Trash, PlusCircle, AlertTriangle
} from 'lucide-react';
import { supabase } from './lib/supabase';

export default function SpiritualCalendarManagerPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Existing pujas pool for recommendation selector
  const [pujaPool, setPujaPool] = useState([]);
  
  // Active edit/add event state
  const [editingEvent, setEditingEvent] = useState(null);
  const [isNew, setIsNew] = useState(false);
  
  // Form active sub-tab (for layout clean organization)
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'lists', 'mantras_timings', 'puja'

  // Input states for dynamic lists
  const [newWhy, setNewWhy] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newHow, setNewHow] = useState('');
  const [newAllowed, setNewAllowed] = useState('');
  const [newProhibited, setNewProhibited] = useState('');
  const [newMantra, setNewMantra] = useState({ name: '', mantra: '', count: '108 times' });
  const [newTiming, setNewTiming] = useState({ label: '', value: '' });

  // Fetch calendar events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('spiritual_calendar')
        .select('*')
        .order('date_key', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching spiritual calendar:', err);
      alert('Failed to load calendar events: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pujas pool for recommendation autocomplete
  const fetchPujaPool = async () => {
    try {
      const { data: gen } = await supabase.from('general_poojas').select('id, title, price, duration');
      const { data: one } = await supabase.from('one_rupee_poojas').select('id, title, offer_price, tagline');
      
      const pool = [
        ...(gen || []).map(p => ({
          name: p.title,
          price: p.price,
          duration: p.duration || '45 mins',
          route: '/all_pujas'
        })),
        ...(one || []).map(p => ({
          name: p.title,
          price: p.offer_price || '₹1',
          duration: '45 mins',
          route: '/one_rupee_store'
        }))
      ];
      setPujaPool(pool);
    } catch (err) {
      console.error('Error fetching puja pool:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchPujaPool();
  }, []);

  // Format date_key (YYYY-MM-DD) into nice readable string: e.g. "June 11, 2026"
  const getFormattedDateStr = (dateVal) => {
    if (!dateVal) return '';
    try {
      const date = new Date(dateVal);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const handleDateChange = (dateVal) => {
    setEditingEvent(prev => ({
      ...prev,
      date_key: dateVal,
      date_str: getFormattedDateStr(dateVal)
    }));
  };

  // Initiate new event creation
  const handleAddNew = () => {
    setEditingEvent({
      date_key: '',
      title: '',
      date_str: '',
      deity: '',
      deity_label: '',
      vrat_type: '',
      importance: 'normal',
      one_liner: '',
      description: '',
      why_observe: [],
      benefits: [],
      how_to_perform: [],
      food_guidelines: { allowed: [], prohibited: [] },
      mantras_prayers: [],
      vrat_katha: '',
      puja_timings: [],
      recommended_puja: { name: '', price: '', duration: '', route: '/all_pujas', deity: '' }
    });
    setIsNew(true);
    setFormTab('basic');
  };

  const handleEdit = (event) => {
    // Ensure lists are formatted as arrays/objects
    setEditingEvent({
      ...event,
      why_observe: Array.isArray(event.why_observe) ? event.why_observe : [],
      benefits: Array.isArray(event.benefits) ? event.benefits : [],
      how_to_perform: Array.isArray(event.how_to_perform) ? event.how_to_perform : [],
      food_guidelines: event.food_guidelines && typeof event.food_guidelines === 'object' && !Array.isArray(event.food_guidelines)
        ? {
            allowed: Array.isArray(event.food_guidelines.allowed) ? event.food_guidelines.allowed : [],
            prohibited: Array.isArray(event.food_guidelines.prohibited) ? event.food_guidelines.prohibited : []
          }
        : { allowed: [], prohibited: [] },
      mantras_prayers: Array.isArray(event.mantras_prayers) ? event.mantras_prayers : [],
      puja_timings: Array.isArray(event.puja_timings) ? event.puja_timings : [],
      recommended_puja: event.recommended_puja && typeof event.recommended_puja === 'object'
        ? {
            name: event.recommended_puja.name || '',
            price: event.recommended_puja.price || '',
            duration: event.recommended_puja.duration || '',
            route: event.recommended_puja.route || '/all_pujas',
            deity: event.recommended_puja.deity || ''
          }
        : { name: '', price: '', duration: '', route: '/all_pujas', deity: '' }
    });
    setIsNew(false);
    setFormTab('basic');
  };

  // Confirm delete
  const handleDelete = async (dateKey) => {
    if (!window.confirm(`Are you sure you want to delete the event on ${dateKey}?`)) return;
    
    try {
      const { error } = await supabase
        .from('spiritual_calendar')
        .delete()
        .eq('date_key', dateKey);

      if (error) throw error;
      alert('Event successfully deleted!');
      fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event: ' + err.message);
    }
  };

  // Handle standard input fields change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingEvent(prev => ({ ...prev, [name]: value }));
  };

  const handlePresetDeity = (deityName, deityLabel) => {
    setEditingEvent(prev => ({
      ...prev,
      deity: deityName,
      deity_label: deityLabel
    }));
  };

  const handlePresetVratType = (type) => {
    setEditingEvent(prev => ({
      ...prev,
      vrat_type: type
    }));
  };

  const handleListInputKeyDown = (e, addFn) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFn();
    }
  };

  // Autocomplete selection of Recommended Puja
  const handleSelectPujaRecommendation = (e) => {
    const idx = e.target.value;
    if (idx === '') return;
    const selected = pujaPool[idx];
    if (selected) {
      setEditingEvent(prev => ({
        ...prev,
        recommended_puja: {
          ...prev.recommended_puja,
          name: selected.name,
          price: selected.price,
          duration: selected.duration,
          route: selected.route,
          deity: prev.deity_label || prev.deity || ''
        }
      }));
    }
  };

  // Add list item helpers
  const addWhy = () => {
    if (!newWhy.trim()) return;
    setEditingEvent(prev => ({ ...prev, why_observe: [...prev.why_observe, newWhy.trim()] }));
    setNewWhy('');
  };

  const removeWhy = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      why_observe: prev.why_observe.filter((_, i) => i !== idx)
    }));
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setEditingEvent(prev => ({ ...prev, benefits: [...prev.benefits, newBenefit.trim()] }));
    setNewBenefit('');
  };

  const removeBenefit = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== idx)
    }));
  };

  const addHow = () => {
    if (!newHow.trim()) return;
    setEditingEvent(prev => ({ ...prev, how_to_perform: [...prev.how_to_perform, newHow.trim()] }));
    setNewHow('');
  };

  const removeHow = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      how_to_perform: prev.how_to_perform.filter((_, i) => i !== idx)
    }));
  };

  const addAllowed = () => {
    if (!newAllowed.trim()) return;
    setEditingEvent(prev => ({
      ...prev,
      food_guidelines: {
        ...prev.food_guidelines,
        allowed: [...prev.food_guidelines.allowed, newAllowed.trim()]
      }
    }));
    setNewAllowed('');
  };

  const removeAllowed = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      food_guidelines: {
        ...prev.food_guidelines,
        allowed: prev.food_guidelines.allowed.filter((_, i) => i !== idx)
      }
    }));
  };

  const addProhibited = () => {
    if (!newProhibited.trim()) return;
    setEditingEvent(prev => ({
      ...prev,
      food_guidelines: {
        ...prev.food_guidelines,
        prohibited: [...prev.food_guidelines.prohibited, newProhibited.trim()]
      }
    }));
    setNewProhibited('');
  };

  const removeProhibited = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      food_guidelines: {
        ...prev.food_guidelines,
        prohibited: prev.food_guidelines.prohibited.filter((_, i) => i !== idx)
      }
    }));
  };

  const addMantra = () => {
    if (!newMantra.name.trim() || !newMantra.mantra.trim()) return;
    setEditingEvent(prev => ({
      ...prev,
      mantras_prayers: [...prev.mantras_prayers, { ...newMantra }]
    }));
    setNewMantra({ name: '', mantra: '', count: '108 times' });
  };

  const removeMantra = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      mantras_prayers: prev.mantras_prayers.filter((_, i) => i !== idx)
    }));
  };

  const addTiming = () => {
    if (!newTiming.label.trim() || !newTiming.value.trim()) return;
    setEditingEvent(prev => ({
      ...prev,
      puja_timings: [...prev.puja_timings, { ...newTiming }]
    }));
    setNewTiming({ label: '', value: '' });
  };

  const removeTiming = (idx) => {
    setEditingEvent(prev => ({
      ...prev,
      puja_timings: prev.puja_timings.filter((_, i) => i !== idx)
    }));
  };

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingEvent.date_key) {
      alert('Event Date (date_key) is required.');
      return;
    }
    if (!editingEvent.title) {
      alert('Event Title is required.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('spiritual_calendar')
        .upsert([editingEvent]);

      if (error) throw error;
      alert('Calendar event successfully saved!');
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Error saving calendar event:', err);
      alert('Failed to save calendar event: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter events by title, deity, or date
  const filteredEvents = events.filter(e => {
    const title = e.title || '';
    const deity = e.deity || '';
    const date = e.date_key || '';
    const searchString = `${title} ${deity} ${date}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  return (
    <div className="page-content">
      {editingEvent ? (
        // EDIT / ADD FORM MODE
        <div className="page-content-form">
          <div className="page-header">
            <div className="flex items-center gap-3">
              <button className="icon-btn" onClick={() => setEditingEvent(null)}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="gradient-text">
                  {isNew ? 'Create New Spiritual Event' : `Edit Event: ${editingEvent.date_key}`}
                </h1>
                <p>Manage ritual significance, dietary rules, and recommended pujas.</p>
              </div>
            </div>
            <button 
              className="primary-btn flex items-center gap-2" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save Event</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="form-layout-grid" style={{ textAlign: 'left' }}>
            {/* Left Column: Core Event Information */}
            <div className="form-column">
              
              {/* Card 1: Basic Event Details */}
              <div className="glass-card">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                  <Calendar size={18} className="text-indigo-400" /> Basic Event Details
                </h3>
                <div className="input-grid-2">
                  <div className="form-group">
                    <label>Event Date (date_key) *</label>
                    <input 
                      type="date" 
                      value={editingEvent.date_key}
                      onChange={(e) => handleDateChange(e.target.value)}
                      disabled={!isNew}
                      className="input-field"
                      required
                    />
                    {!isNew && <small style={{ color: '#64748b', marginTop: '2px' }}>Primary key date cannot be modified after creation.</small>}
                  </div>
                  
                  <div className="form-group">
                    <label>Display Date Text (Auto-formats, edit if needed) *</label>
                    <input 
                      type="text" 
                      name="date_str"
                      value={editingEvent.date_str}
                      onChange={handleInputChange}
                      placeholder="e.g. June 11, 2026"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Event / Vrat Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={editingEvent.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Shani Pradosh Vrat"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Card 2: Deity & Vrat Classification */}
              <div className="glass-card">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                  <Sparkles size={18} className="text-indigo-400" /> Deity & Vrat Classification
                </h3>
                
                <div className="input-grid-2">
                  <div className="form-group">
                    <label>Associated Deity Name</label>
                    <input 
                      type="text" 
                      name="deity"
                      value={editingEvent.deity}
                      onChange={handleInputChange}
                      placeholder="e.g. Lord Shiva 🔱"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Deity Icon Label (Lowercase mapping identifier)</label>
                    <input 
                      type="text" 
                      name="deity_label"
                      value={editingEvent.deity_label}
                      onChange={handleInputChange}
                      placeholder="e.g. shiva, hanuman, ganesha, lakshmi"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Presets Row for Deity */}
                <div className="flex flex-wrap gap-2 mt-2" style={{ marginBottom: '1.25rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Quick Preset:</span>
                  {[
                    { name: 'Lord Shiva 🔱', label: 'shiva' },
                    { name: 'Lord Hanuman 🧡', label: 'hanuman' },
                    { name: 'Lord Ganesha 🐘', label: 'ganesha' },
                    { name: 'Maa Durga 🛡️', label: 'durga' },
                    { name: 'Maa Lakshmi 🌸', label: 'lakshmi' },
                    { name: 'Lord Vishnu 🕉️', label: 'vishnu' },
                    { name: 'Surya Dev ☀️', label: 'surya' }
                  ].map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => handlePresetDeity(d.name, d.label)}
                      className="badge-preset"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="input-grid-2" style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Vrat/Fasting Type</label>
                    <input 
                      type="text" 
                      name="vrat_type"
                      value={editingEvent.vrat_type}
                      onChange={handleInputChange}
                      placeholder="e.g. Pradosh, Ekadashi, Weekly"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fasting Importance Level</label>
                    <select 
                      name="importance"
                      value={editingEvent.importance || 'normal'}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="normal">Normal 🍃</option>
                      <option value="medium">Medium ⭐</option>
                      <option value="high">High 🔥</option>
                    </select>
                  </div>
                </div>

                {/* Presets Row for Vrat Type */}
                <div className="flex flex-wrap gap-2 mt-2" style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>Quick Preset:</span>
                  {['Ekadashi', 'Pradosh', 'Chaturthi', 'Weekly', 'Navratri', 'Festival'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handlePresetVratType(t)}
                      className="badge-preset"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 3: Significance Description & Vrat Katha */}
              <div className="glass-card">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                  <BookOpen size={18} className="text-indigo-400" /> Significance & Vrat Katha
                </h3>
                
                <div className="form-group">
                  <label>One-Liner Hook / Short Significance</label>
                  <input 
                    type="text" 
                    name="one_liner"
                    value={editingEvent.one_liner}
                    onChange={handleInputChange}
                    placeholder="e.g. Observed to seek Lord Shiva's divine grace during the auspicious twilight window..."
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Detailed Spiritual Significance Description</label>
                  <textarea 
                    name="description"
                    value={editingEvent.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Provide a complete theological description of the day's alignment and history..."
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>📖 Vrat Katha (Fasting Story / Legend)</label>
                  <textarea 
                    name="vrat_katha"
                    value={editingEvent.vrat_katha}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Paste the traditional legend or religious mythological story of this Vrat here..."
                    className="input-field"
                  />
                </div>
              </div>

              {/* Card 4: step-by-step Rituals & Diet Rules */}
              <div className="glass-card space-y-6">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  <List size={18} className="text-indigo-400" /> step-by-step Rituals & Diet Rules
                </h3>

                {/* Why Observe */}
                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Why Observe (Significance bullets)</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={newWhy}
                      onChange={(e) => setNewWhy(e.target.value)}
                      onKeyDown={(e) => handleListInputKeyDown(e, addWhy)}
                      placeholder="Add why observe detail..."
                      className="input-field"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={addWhy} className="primary-btn flex items-center gap-1" style={{ padding: '0.65rem 1.25rem' }}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  <ul className="space-y-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
                    {editingEvent.why_observe.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm py-2 px-3 rounded mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <span>• {item}</span>
                        <button type="button" onClick={() => removeWhy(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Sacred Benefits</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyDown={(e) => handleListInputKeyDown(e, addBenefit)}
                      placeholder="Add benefit detail..."
                      className="input-field"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={addBenefit} className="primary-btn flex items-center gap-1" style={{ padding: '0.65rem 1.25rem' }}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  <ul className="space-y-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
                    {editingEvent.benefits.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm py-2 px-3 rounded mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <span>✨ {item}</span>
                        <button type="button" onClick={() => removeBenefit(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How to Perform */}
                <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Step-by-Step Puja Rituals</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={newHow}
                      onChange={(e) => setNewHow(e.target.value)}
                      onKeyDown={(e) => handleListInputKeyDown(e, addHow)}
                      placeholder="Add ritual step..."
                      className="input-field"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={addHow} className="primary-btn flex items-center gap-1" style={{ padding: '0.65rem 1.25rem' }}>
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  <ul className="space-y-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
                    {editingEvent.how_to_perform.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm py-2 px-3 rounded mt-1" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                        <span>{idx + 1}. {item}</span>
                        <button type="button" onClick={() => removeHow(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Food Guidelines */}
                <div>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>🍎 Diet & Food Guidelines</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Allowed */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <h4 className="font-bold text-green-400 mb-2" style={{ fontSize: '0.9rem' }}>Allowed Foods (Falahar)</h4>
                      <div className="flex gap-1 mb-2">
                        <input 
                          type="text" 
                          value={newAllowed}
                          onChange={(e) => setNewAllowed(e.target.value)}
                          onKeyDown={(e) => handleListInputKeyDown(e, addAllowed)}
                          placeholder="e.g. Fruits, Milk, Sabudana"
                          className="input-field"
                          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        />
                        <button type="button" onClick={addAllowed} className="primary-btn py-1 px-3" style={{ backgroundColor: '#10b981' }}>
                          Add
                        </button>
                      </div>
                      <ul className="space-y-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {editingEvent.food_guidelines.allowed.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            <span className="text-green-300">✓ {item}</span>
                            <button type="button" onClick={() => removeAllowed(idx)} className="text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prohibited */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <h4 className="font-bold text-red-400 mb-2" style={{ fontSize: '0.9rem' }}>Prohibited Foods (Restricted)</h4>
                      <div className="flex gap-1 mb-2">
                        <input 
                          type="text" 
                          value={newProhibited}
                          onChange={(e) => setNewProhibited(e.target.value)}
                          onKeyDown={(e) => handleListInputKeyDown(e, addProhibited)}
                          placeholder="e.g. Onion, Garlic, Grains"
                          className="input-field"
                          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        />
                        <button type="button" onClick={addProhibited} className="primary-btn py-1 px-3" style={{ backgroundColor: '#ef4444' }}>
                          Add
                        </button>
                      </div>
                      <ul className="space-y-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
                        {editingEvent.food_guidelines.prohibited.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs py-1 px-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            <span className="text-red-300">✗ {item}</span>
                            <button type="button" onClick={() => removeProhibited(idx)} className="text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recommendations, Mantras & Timings */}
            <div className="form-column">
              
              {/* Card 5: Link Recommended Puja */}
              <div className="glass-card">
                <h3 className="gradient-text mb-2 flex items-center gap-2" style={{ fontSize: '1.2rem' }}>
                  <Sparkles size={18} className="text-indigo-400" /> Link Recommended Puja
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Quickly auto-fill puja details by selecting from your published catalog.
                </p>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label>Auto-fill from active Puja catalog</label>
                  <select onChange={handleSelectPujaRecommendation} className="input-field">
                    <option value="">-- Select from catalogs --</option>
                    {pujaPool.map((p, idx) => (
                      <option key={idx} value={idx}>{p.name} ({p.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <div className="form-group">
                    <label>Recommended Puja Name</label>
                    <input 
                      type="text" 
                      value={editingEvent.recommended_puja.name}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev,
                        recommended_puja: { ...prev.recommended_puja, name: e.target.value }
                      }))}
                      placeholder="e.g. Maha Hanuman Shanti Puja"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Puja Price Tag</label>
                    <input 
                      type="text" 
                      value={editingEvent.recommended_puja.price}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev,
                        recommended_puja: { ...prev.recommended_puja, price: e.target.value }
                      }))}
                      placeholder="e.g. ₹501"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Puja Duration</label>
                    <input 
                      type="text" 
                      value={editingEvent.recommended_puja.duration}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev,
                        recommended_puja: { ...prev.recommended_puja, duration: e.target.value }
                      }))}
                      placeholder="e.g. 45 mins"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Internal Navigation Route (Expo route)</label>
                    <input 
                      type="text" 
                      value={editingEvent.recommended_puja.route}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev,
                        recommended_puja: { ...prev.recommended_puja, route: e.target.value }
                      }))}
                      placeholder="e.g. /all_pujas or /one_rupee_store"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Deity Name for Booking</label>
                    <input 
                      type="text" 
                      value={editingEvent.recommended_puja.deity}
                      onChange={(e) => setEditingEvent(prev => ({
                        ...prev,
                        recommended_puja: { ...prev.recommended_puja, deity: e.target.value }
                      }))}
                      placeholder="e.g. Hanuman"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Card 6: recommended Mantras & Chants */}
              <div className="glass-card">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  🕉️ Chants & Mantras
                </h3>
                
                <div className="space-y-2 mb-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input 
                    type="text" 
                    value={newMantra.name}
                    onChange={(e) => setNewMantra(prev => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => handleListInputKeyDown(e, addMantra)}
                    placeholder="Mantra Name (e.g. Shiva Mantra)"
                    className="input-field"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <input 
                    type="text" 
                    value={newMantra.mantra}
                    onChange={(e) => setNewMantra(prev => ({ ...prev, mantra: e.target.value }))}
                    onKeyDown={(e) => handleListInputKeyDown(e, addMantra)}
                    placeholder="Sanskrit Chant (Om Namah Shivaya)"
                    className="input-field"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newMantra.count}
                      onChange={(e) => setNewMantra(prev => ({ ...prev, count: e.target.value }))}
                      onKeyDown={(e) => handleListInputKeyDown(e, addMantra)}
                      placeholder="Chant Count (108 times)"
                      className="input-field"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', flex: 1 }}
                    />
                    <button type="button" onClick={addMantra} className="primary-btn flex items-center justify-center gap-1 py-1 px-3" style={{ fontSize: '0.85rem' }}>
                      Add
                    </button>
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="admin-table text-xs">
                    <thead>
                      <tr>
                        <th>Mantra Name</th>
                        <th>Chant Line</th>
                        <th>Count</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingEvent.mantras_prayers.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold">{item.name}</td>
                          <td className="font-serif italic" style={{ whiteSpace: 'normal', minWidth: '100px' }}>{item.mantra}</td>
                          <td>{item.count}</td>
                          <td>
                            <button type="button" onClick={() => removeMantra(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {editingEvent.mantras_prayers.length === 0 && (
                        <tr><td colSpan="4" className="text-center text-gray-400 py-3">No mantras added yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 7: Auspicious Puja Timings */}
              <div className="glass-card">
                <h3 className="gradient-text mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                  ⏰ Auspicious Puja Timings
                </h3>

                <div className="space-y-2 mb-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input 
                    type="text" 
                    value={newTiming.label}
                    onChange={(e) => setNewTiming(prev => ({ ...prev, label: e.target.value }))}
                    onKeyDown={(e) => handleListInputKeyDown(e, addTiming)}
                    placeholder="Timing Label (e.g. Parana Time, Puja Shubh Muhurat)"
                    className="input-field"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTiming.value}
                      onChange={(e) => setNewTiming(prev => ({ ...prev, value: e.target.value }))}
                      onKeyDown={(e) => handleListInputKeyDown(e, addTiming)}
                      placeholder="Timing Value (e.g. 06:15 AM to 08:30 AM)"
                      className="input-field"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', flex: 1 }}
                    />
                    <button type="button" onClick={addTiming} className="primary-btn flex items-center justify-center gap-1 py-1 px-3" style={{ fontSize: '0.85rem' }}>
                      Add
                    </button>
                  </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="admin-table text-xs">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Muhurat Window</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingEvent.puja_timings.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold">{item.label}</td>
                          <td className="font-mono">{item.value}</td>
                          <td>
                            <button type="button" onClick={() => removeTiming(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {editingEvent.puja_timings.length === 0 && (
                        <tr><td colSpan="3" className="text-center text-gray-400 py-3">No timings added yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </form>

          {/* Action buttons footer */}
          <div className="mt-6 pt-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button 
              type="button" 
              onClick={() => setEditingEvent(null)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSave}
              className="primary-btn flex items-center gap-2"
              disabled={saving}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              <span>Save Calendar Event</span>
            </button>
          </div>
        </div>
      ) : (
        // LIST & CRUD VIEW MODE
        <div>
          <div className="page-header">
            <div>
              <h1 className="gradient-text">Spiritual Calendar</h1>
              <p>Dynamic Vedic Panchang, fasting reminders, food guidelines, and Rashi remedies database.</p>
            </div>
            <button className="primary-btn flex items-center gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              <span>Add Calendar Event</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="stats-grid">
            <div className="glass-card stat-card">
              <div className="stat-icon orange"><Calendar size={24} /></div>
              <div className="stat-info">
                <h3>{events.length}</h3>
                <p>Total Configured Dates</p>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-icon green"><Sparkles size={24} /></div>
              <div className="stat-info">
                <h3>{events.filter(e => e.importance === 'high').length}</h3>
                <p>High Priority Vrats (🔥)</p>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-icon blue"><BookOpen size={24} /></div>
              <div className="stat-info">
                <h3>{events.filter(e => e.vrat_katha).length}</h3>
                <p>Vrats with Katha Legends</p>
              </div>
            </div>
          </div>

          {/* Filters card */}
          <div className="glass-card filter-card mb-6">
            <div className="search-bar-container w-full">
              <Calendar size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search event title, associated deity, or dates (YYYY-MM-DD)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Events Table List */}
          <div className="glass-card table-card">
            {loading ? (
              <div className="loader-container py-12">
                <RefreshCw className="animate-spin text-orange-500 mb-2" size={32} />
                <p>Loading spiritual calendar schedules...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state py-12 text-center">
                <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2" />
                <p>No calendar events matching your search filters found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Date</th>
                      <th>Event Title</th>
                      <th>Date String</th>
                      <th>Target Deity</th>
                      <th>Fasting Type</th>
                      <th>Priority</th>
                      <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((item) => (
                      <tr key={item.date_key}>
                        <td className="font-mono font-semibold text-orange-600">{item.date_key}</td>
                        <td className="font-bold">{item.title}</td>
                        <td>{item.date_str}</td>
                        <td>{item.deity || <span className="text-gray-400 text-xs">None</span>}</td>
                        <td>
                          {item.vrat_type ? (
                            <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>
                              {item.vrat_type}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td>
                          {item.importance === 'high' && <span className="badge-status success">High Priority 🔥</span>}
                          {item.importance === 'medium' && <span className="badge-status warning">Medium Priority ⭐</span>}
                          {item.importance === 'normal' && <span className="badge-status info">Normal 🍃</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(item)}
                              style={{ display: 'flex', items: 'center', gap: '2px', padding: '0.4rem 0.8rem' }}
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(item.date_key)}
                              style={{ display: 'flex', items: 'center', gap: '2px', padding: '0.4rem 0.8rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
