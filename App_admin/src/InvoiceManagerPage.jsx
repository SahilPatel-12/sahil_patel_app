import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Edit3, 
  Save, 
  Check, 
  Loader2, 
  AlertTriangle, 
  X, 
  ShoppingBag, 
  Sparkles, 
  Package, 
  Activity, 
  Grid,
  FileText
} from 'lucide-react';
import { supabase } from './lib/supabase';

// Helper to sanitize numeric inputs
const parseNum = (val) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

export default function InvoiceManagerPage() {
  const [activeTab, setActiveTab] = useState('store_products'); // store_products, one_rupee_poojas, general_poojas, combo_poojas, problem_poojas
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingOverride, setIsSavingOverride] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Global defaults state
  const [globalInvoiceSettings, setGlobalInvoiceSettings] = useState({
    store_products: { gst_percent: 0, discount_percent: 0, delivery_charge: 100 },
    one_rupee_poojas: { gst_percent: 0, discount_percent: 0, delivery_charge: 0 },
    general_poojas: { gst_percent: 0, discount_percent: 0, delivery_charge: 0 },
    problem_poojas: { gst_percent: 0, discount_percent: 0, delivery_charge: 0 },
    combo_poojas: { gst_percent: 0, discount_percent: 0, delivery_charge: 0 }
  });

  // Items in active category
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Override Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [overrideSettings, setOverrideSettings] = useState({
    override_global: false,
    gst_percent: 0,
    discount_percent: 0,
    delivery_charge: 0
  });

  // Tracks if the current table is missing the 'invoice_settings' column in the database
  const [isColumnMissing, setIsColumnMissing] = useState(false);

  // Map tabs to DB Tables
  const getTabTable = (tab) => {
    switch (tab) {
      case 'store_products': return 'website_pooja_products';
      case 'one_rupee_poojas': return 'one_rupee_poojas';
      case 'general_poojas': return 'general_poojas';
      case 'problem_poojas': return 'problem_poojas';
      case 'combo_poojas': return 'combo_poojas';
      default: return 'website_pooja_products';
    }
  };

  // Map tabs to display titles
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'store_products': return 'Store Products';
      case 'one_rupee_poojas': return '₹1 Pujas';
      case 'general_poojas': return 'Vedic Pujas (All)';
      case 'problem_poojas': return 'Problem Pujas (Health/Wealth)';
      case 'combo_poojas': return 'Festival Pujas (Combos)';
      default: return 'Products';
    }
  };

  // Fetch both Global settings and item repository lists
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setIsColumnMissing(false);
    
    try {
      // 1. Fetch Global Settings
      const { data: globalData, error: globalErr } = await supabase
        .from('website_settings')
        .select('*')
        .eq('key', 'global_invoice_settings')
        .maybeSingle();

      if (globalErr) throw globalErr;

      let currentGlobal = { ...globalInvoiceSettings };
      if (globalData && globalData.value) {
        // Merge with defaults to prevent missing keys
        currentGlobal = {
          ...currentGlobal,
          ...globalData.value
        };
        setGlobalInvoiceSettings(currentGlobal);
      } else {
        // Create initial global row if not present
        await supabase
          .from('website_settings')
          .insert([{ key: 'global_invoice_settings', value: globalInvoiceSettings }]);
      }

      // 2. Fetch Category Items
      const table = getTabTable(activeTab);
      
      // Try to fetch including invoice_settings
      let { data: itemsData, error: itemsErr } = await supabase
        .from(table)
        .select('*');

      if (itemsErr) {
        // Fallback: If invoice_settings column is missing, select everything EXCEPT it to prevent crash
        console.warn(`Fallback fetch: checking if column invoice_settings is missing for table ${table}.`, itemsErr);
        
        // Try fetching without invoice_settings column
        const fallbackQuery = await supabase.from(table).select('id, title, original_price, offer_price');
        
        // Products and Combos use slightly different name keys
        if (activeTab === 'store_products') {
          const prodQuery = await supabase.from(table).select('id, name, original_price, offer_price');
          if (prodQuery.error) throw prodQuery.error;
          itemsData = prodQuery.data.map(item => ({ ...item, title: item.name }));
        } else if (activeTab === 'combo_poojas') {
          const comboQuery = await supabase.from(table).select('id, title, original_price, price');
          if (comboQuery.error) throw comboQuery.error;
          itemsData = comboQuery.data.map(item => ({ ...item, offer_price: item.price }));
        } else {
          if (fallbackQuery.error) throw fallbackQuery.error;
          itemsData = fallbackQuery.data;
        }

        setIsColumnMissing(true);
        setError(`Individual overrides are unavailable because the 'invoice_settings' column has not been added to table '${table}' in your database yet. Apply the migrations or run the SQL script in your Supabase console to enable overrides.`);
      }

      // Map product names to title for consistency
      const formattedItems = (itemsData || []).map(item => ({
        ...item,
        title: item.title || item.name || 'Unnamed Item',
        offer_price: item.offer_price || item.price || '0',
        original_price: item.original_price || '0',
        invoice_settings: item.invoice_settings || { override_global: false }
      }));

      setItems(formattedItems);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred while loading settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 6000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Save Global Invoice Defaults
  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    setIsSavingGlobal(true);
    try {
      const { error: saveErr } = await supabase
        .from('website_settings')
        .upsert({
          key: 'global_invoice_settings',
          value: globalInvoiceSettings
        });

      if (saveErr) throw saveErr;
      showMessage('Global invoice settings saved successfully!');
    } catch (err) {
      console.error('Error saving global settings:', err);
      showMessage(err.message || 'Failed to save settings.', true);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  // Open item editor modal
  const handleEditOverride = (item) => {
    if (isColumnMissing) {
      showMessage("Cannot configure override. Please apply the DB migration first.", true);
      return;
    }
    setSelectedItem(item);
    
    const settings = item.invoice_settings || {};
    setOverrideSettings({
      override_global: settings.override_global || false,
      gst_percent: settings.gst_percent ?? 0,
      discount_percent: settings.discount_percent ?? 0,
      delivery_charge: settings.delivery_charge ?? 0
    });
    
    setShowModal(true);
  };

  // Save Item Override
  const handleSaveOverride = async () => {
    setIsSavingOverride(true);
    const table = getTabTable(activeTab);
    
    try {
      const cleanOverride = {
        override_global: overrideSettings.override_global,
        gst_percent: parseNum(overrideSettings.gst_percent),
        discount_percent: parseNum(overrideSettings.discount_percent),
        delivery_charge: parseNum(overrideSettings.delivery_charge)
      };

      const { error: updateErr } = await supabase
        .from(table)
        .update({ invoice_settings: cleanOverride })
        .eq('id', selectedItem.id);

      if (updateErr) throw updateErr;

      showMessage(`Invoice override for "${selectedItem.title}" updated successfully!`);
      setShowModal(false);
      setSelectedItem(null);
      fetchData(); // reload
    } catch (err) {
      console.error('Override save error:', err);
      showMessage(err.message || 'Failed to save override settings.', true);
    } finally {
      setIsSavingOverride(false);
    }
  };

  // Filter items by search query
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-content" style={{ color: '#f8fafc', padding: '24px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Invoice Manager</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
          Configure dynamic invoice parameters, GST percentages, promo discounts, and delivery rates.
        </p>
      </div>

      {/* Categories Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
        {[
          { key: 'store_products', label: 'Store Products', icon: <ShoppingBag size={16} /> },
          { key: 'one_rupee_poojas', label: '₹1 Pujas', icon: <Package size={16} /> },
          { key: 'general_poojas', label: 'Vedic Pujas', icon: <Sparkles size={16} /> },
          { key: 'combo_poojas', label: 'Festival Pujas', icon: <Grid size={16} /> },
          { key: 'problem_poojas', label: 'Problem Pujas', icon: <Activity size={16} /> }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`settings-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setSearchQuery('');
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 16px', 
              borderBottom: activeTab === tab.key ? '3px solid #ea580c' : '3px solid transparent',
              color: activeTab === tab.key ? '#ffffff' : '#94a3b8',
              fontWeight: '700',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          padding: '16px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid #ef4444', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          color: '#f87171' 
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 'bold' }}>Database Alert: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          padding: '16px', 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid #10b981', 
          borderRadius: '12px', 
          marginBottom: '20px', 
          color: '#34d399' 
        }}>
          <Check size={20} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader2 className="animate-spin animate-spin-slow" size={32} style={{ color: '#ea580c' }} />
          <span style={{ marginLeft: '12px', color: '#94a3b8' }}>Syncing Devotional Invoice Details...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Global Default Settings Card */}
          <div className="glass-card page-card" style={{ backgroundColor: '#161622', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ffffff' }}>
              Overall default invoice settings for {getTabTitle(activeTab)}
            </h3>
            <p className="card-description" style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>
              Configure fallbacks that will be applied to all items in this category unless an override is set.
            </p>

            <form onSubmit={handleSaveGlobal} className="settings-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Temple Seva & GST Fee (%)</label>
                  <input 
                    type="number" 
                    value={globalInvoiceSettings[activeTab]?.gst_percent ?? 0}
                    onChange={(e) => setGlobalInvoiceSettings(prev => ({
                      ...prev,
                      [activeTab]: {
                        ...prev[activeTab],
                        gst_percent: parseNum(e.target.value)
                      }
                    }))}
                    min="0"
                    max="100"
                    className="input-field" 
                  />
                </div>

                <div className="form-group">
                  <label>Divine Promo Discount (%)</label>
                  <input 
                    type="number" 
                    value={globalInvoiceSettings[activeTab]?.discount_percent ?? 0}
                    onChange={(e) => setGlobalInvoiceSettings(prev => ({
                      ...prev,
                      [activeTab]: {
                        ...prev[activeTab],
                        discount_percent: parseNum(e.target.value)
                      }
                    }))}
                    min="0"
                    max="100"
                    className="input-field" 
                  />
                </div>

                <div className="form-group">
                  <label>Delivery Charge (₹)</label>
                  <input 
                    type="number" 
                    value={globalInvoiceSettings[activeTab]?.delivery_charge ?? 0}
                    onChange={(e) => setGlobalInvoiceSettings(prev => ({
                      ...prev,
                      [activeTab]: {
                        ...prev[activeTab],
                        delivery_charge: parseNum(e.target.value)
                      }
                    }))}
                    min="0"
                    className="input-field" 
                  />
                </div>
              </div>

              <button type="submit" className="action-btn-primary" disabled={isSavingGlobal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isSavingGlobal ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Category Defaults</span>
              </button>
            </form>
          </div>

          {/* Section 2: Individual Repository Overrides List */}
          <div className="glass-card table-card" style={{ backgroundColor: '#161622', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>Individual Items List</h3>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>Configure item-specific settings or overrides.</p>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: '250px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder={`Search ${getTabTitle(activeTab)}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px 8px 36px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Package size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
                <span>No items found matching "{searchQuery}"</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>Item Name</th>
                      <th style={{ width: '15%' }}>Prices</th>
                      <th style={{ width: '25%' }}>Invoice Mode</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isOverridden = item.invoice_settings?.override_global;
                      
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td>
                            <span style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>
                              {item.title}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 'bold' }}>
                                Offer: {item.offer_price}
                              </span>
                              <span style={{ fontSize: '10px', color: '#64748b', textDecoration: 'line-through' }}>
                                Orig: {item.original_price}
                              </span>
                            </div>
                          </td>
                          <td>
                            {isOverridden ? (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                backgroundColor: 'rgba(234, 88, 12, 0.15)', 
                                color: '#ea580c', 
                                fontSize: '11px',
                                fontWeight: 'bold',
                                border: '1px solid rgba(234, 88, 12, 0.2)'
                              }}>
                                <Sparkles size={12} />
                                Overridden Settings
                              </span>
                            ) : (
                              <span style={{ 
                                display: 'inline-flex', 
                                padding: '4px 8px', 
                                borderRadius: '6px', 
                                backgroundColor: 'rgba(255,255,255,0.04)', 
                                color: '#94a3b8', 
                                fontSize: '11px',
                                border: '1px solid rgba(255,255,255,0.05)'
                              }}>
                                Inherited (Global)
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleEditOverride(item)}
                              className="action-btn-primary"
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '12px', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.08)'
                              }}
                            >
                              <Edit3 size={14} />
                              <span>Configure</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Override Settings Modal */}
      {showModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card page-card" style={{
            width: '100%',
            maxWidth: '550px',
            backgroundColor: '#161622',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} style={{ color: '#ea580c' }} />
                <h3 style={{ margin: 0, fontSize: '18px', color: '#ffffff' }}>Configure Invoice Overrides</h3>
              </div>
              <button 
                onClick={() => { setShowModal(false); setSelectedItem(null); }}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>SELECTED ITEM</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{selectedItem.title}</span>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                Category: {getTabTitle(activeTab)} • ID: {selectedItem.id}
              </span>
            </div>

            {/* Checkbox override toggler */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <input
                type="checkbox"
                id="modal_override_toggle"
                checked={overrideSettings.override_global}
                onChange={(e) => setOverrideSettings(prev => ({ ...prev, override_global: e.target.checked }))}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#ea580c' }}
              />
              <label htmlFor="modal_override_toggle" style={{ fontWeight: '700', fontSize: '14px', cursor: 'pointer', color: '#ffffff' }}>
                Override global default settings for this item
              </label>
            </div>

            {overrideSettings.override_global ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  <div className="form-group">
                    <label>Temple Seva & GST Fee (%)</label>
                    <input
                      type="number"
                      value={overrideSettings.gst_percent}
                      onChange={(e) => setOverrideSettings(prev => ({ ...prev, gst_percent: parseNum(e.target.value) }))}
                      min="0"
                      max="100"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Divine Promo Discount (%)</label>
                    <input
                      type="number"
                      value={overrideSettings.discount_percent}
                      onChange={(e) => setOverrideSettings(prev => ({ ...prev, discount_percent: parseNum(e.target.value) }))}
                      min="0"
                      max="100"
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Delivery Charge (₹)</label>
                    <input
                      type="number"
                      value={overrideSettings.delivery_charge}
                      onChange={(e) => setOverrideSettings(prev => ({ ...prev, delivery_charge: parseNum(e.target.value) }))}
                      min="0"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '10px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                  This item inherits all values from category defaults. To set specific rates, check the box above.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => { setShowModal(false); setSelectedItem(null); }}
                disabled={isSavingOverride}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="action-btn-primary" 
                onClick={handleSaveOverride}
                disabled={isSavingOverride}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                {isSavingOverride ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Save Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
