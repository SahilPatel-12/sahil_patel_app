import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  Truck, 
  Calendar, 
  DollarSign, 
  User, 
  MapPin, 
  Sparkles, 
  Filter, 
  RefreshCw,
  Layers,
  ShoppingCart,
  Phone,
  Copy,
  Video,
  Trash2,
  Upload
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { uploadToR2 } from './lib/r2'

const ITEM_NAMES_MAP = {
  '1': 'Ganesh Puja Special',
  '2': 'Laxmi Puja Special',
  '3': 'Shiv Puja Special',
  '4': 'Hanuman Puja Special',
  '5': 'Kedarnath Puja Special',
  '6': 'Tirupati Puja Special',
  '7': 'Shanti Path Special',
  '8': 'Navgrah Homa Special',
  'p4': 'Premium Puja Kit',
  'p5': 'Panchdhatu Ganesh Idol',
  'p6': 'Sandalwood Paste',
  'p7': 'Bhagavad Gita Pocket',
  'p8': 'Organic Incense Sticks',
  'rec_1': 'Panch Mewa Prasad Box',
  'rec_2': 'Sandalwood Chandan Paste',
  'rec_3': 'Sacred Rudraksha Mala',
  'add_1': 'Aromatic Kapur Tablets'
};

export default function OrdersManagerPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [productCatalog, setProductCatalog] = useState({})

  // Drawer / Modal states
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [tempOrderStatus, setTempOrderStatus] = useState('')
  const [tempPaymentStatus, setTempPaymentStatus] = useState('')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from('website_pooja_products')
        .select('id, name')
      if (!error && data) {
        const mapping = {}
        data.forEach(item => {
          mapping[item.id] = item.name
        })
        setProductCatalog(mapping)
      }
    } catch (err) {
      console.error('Error fetching catalog:', err)
    }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          app_users(
            profiles(full_name, phone, email)
          ),
          order_items(*),
          puja_booking_details(*),
          shipping_addresses(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching admin orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchCatalog()

    // Realtime channel for orders to sync status updates
    const channel = supabase
      .channel('admin-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOpenOrderDetails = (order) => {
    setSelectedOrder(order)
    setTempOrderStatus(order.order_status)
    setTempPaymentStatus(order.payment_status)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: tempOrderStatus,
          payment_status: tempPaymentStatus
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      // Update locally inside selectedOrder to reflect instantly in modal
      setSelectedOrder(prev => ({
        ...prev,
        order_status: tempOrderStatus,
        payment_status: tempPaymentStatus
      }))

      alert('Order status updated successfully!')
      fetchOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleCopyText = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    alert(message);
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;
    
    setUploadingVideo(true);
    setUploadProgress(0);
    
    try {
      // Upload file to Cloudflare R2 under puja-recordings folder with exact real-time progress callbacks
      const publicUrl = await uploadToR2(file, 'puja-recordings', (percent) => {
        setUploadProgress(percent);
      });
      
      // Let admin see the 100% success state briefly
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Check if we already have a record in puja_booking_details
      const { data: existingBooking } = await supabase
        .from('puja_booking_details')
        .select('id')
        .eq('order_id', selectedOrder.id)
        .maybeSingle();

      let error;
      if (existingBooking) {
        // Update existing row
        const { error: err } = await supabase
          .from('puja_booking_details')
          .update({ puja_video_url: publicUrl })
          .eq('order_id', selectedOrder.id);
        error = err;
      } else {
        // Insert a new row if it was missing for any reason
        const { error: err } = await supabase
          .from('puja_booking_details')
          .insert({
            order_id: selectedOrder.id,
            devotee_name: selectedOrder.app_users?.profiles?.full_name || 'Devotee',
            puja_video_url: publicUrl
          });
        error = err;
      }
        
      if (error) throw error;
      
      // Update locally inside selectedOrder to reflect instantly
      setSelectedOrder(prev => {
        const updatedDetails = [...(prev.puja_booking_details || [])];
        if (updatedDetails.length > 0) {
          updatedDetails[0] = { ...updatedDetails[0], puja_video_url: publicUrl };
        } else {
          updatedDetails.push({
            order_id: prev.id,
            devotee_name: prev.app_users?.profiles?.full_name || 'Devotee',
            puja_video_url: publicUrl
          });
        }
        return { ...prev, puja_booking_details: updatedDetails };
      });
      
      alert('Personalized Puja video uploaded and delivered successfully!');
      fetchOrders();
    } catch (err) {
      console.error('Error uploading puja video:', err);
      alert(`Failed to upload video: ${err.message || err}`);
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveVideo = async () => {
    if (!selectedOrder || !window.confirm('Are you sure you want to delete this devotee\'s video recording?')) return;
    
    setUploadingVideo(true);
    try {
      // Update puja_booking_details in Supabase
      const { error } = await supabase
        .from('puja_booking_details')
        .update({ puja_video_url: null })
        .eq('order_id', selectedOrder.id);
        
      if (error) throw error;
      
      // Update locally inside selectedOrder
      setSelectedOrder(prev => {
        const updatedDetails = [...(prev.puja_booking_details || [])];
        if (updatedDetails.length > 0) {
          updatedDetails[0] = { ...updatedDetails[0], puja_video_url: null };
        }
        return { ...prev, puja_booking_details: updatedDetails };
      });
      
      alert('Sacred video recording removed successfully.');
      fetchOrders();
    } catch (err) {
      console.error('Error removing video:', err);
      alert('Failed to delete video recording. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const getItemName = (itemId) => {
    return ITEM_NAMES_MAP[itemId] || productCatalog[itemId] || itemId;
  }

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const customerName = order.app_users?.profiles?.full_name || 'Guest'
    const devoteeName = order.puja_booking_details?.[0]?.devotee_name || ''
    const gotra = order.puja_booking_details?.[0]?.gotra || ''
    const recipientName = order.shipping_addresses?.[0]?.full_name || ''
    const searchString = `${order.id} ${customerName} ${devoteeName} ${gotra} ${recipientName}`.toLowerCase()

    const matchesSearch = searchString.includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter
    const matchesType = typeFilter === 'All' || order.order_type === typeFilter
    const matchesPayment = paymentFilter === 'All' || order.payment_status === paymentFilter

    return matchesSearch && matchesStatus && matchesType && matchesPayment
  })

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending'
      case 'Confirmed': return 'status-confirmed'
      case 'Processing': return 'status-processing'
      case 'Shipped': return 'status-shipped'
      case 'Delivered': return 'status-delivered'
      case 'Completed': return 'status-completed'
      case 'Cancelled': return 'status-cancelled'
      default: return ''
    }
  }

  const getPaymentBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'payment-pending'
      case 'completed': return 'payment-completed'
      case 'failed': return 'payment-failed'
      case 'refunded': return 'payment-refunded'
      default: return ''
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Sacred Orders & Pujas</h1>
          <p>Manage Devotee bookings, Prasad shipping dispatches, and Puja performance milestones.</p>
        </div>
        <button className="primary-btn flex items-center gap-2" onClick={fetchOrders}>
          <RefreshCw size={16} />
          <span>Refresh System</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><Clock size={24} /></div>
          <div className="stat-info">
            <h3 className="stat-value">{orders.filter(o => o.order_status === 'Pending').length}</h3>
            <p className="stat-label">Pending Orders</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon yellow"><Sparkles size={24} /></div>
          <div className="stat-info">
            <h3 className="stat-value">{orders.filter(o => o.order_status === 'Processing').length}</h3>
            <p className="stat-label">Pujas Performing</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon blue"><Truck size={24} /></div>
          <div className="stat-info">
            <h3 className="stat-value">{orders.filter(o => o.order_status === 'Shipped').length}</h3>
            <p className="stat-label">Shipments In Transit</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h3 className="stat-value">{orders.filter(o => o.order_status === 'Completed').length}</h3>
            <p className="stat-label">Completed Sevas</p>
          </div>
        </div>
      </div>

      {/* Filters card */}
      <div className="glass-card filter-card">
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, Devotee name, Gotra, or Recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label><Filter size={14} /> Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label><Layers size={14} /> Order Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="puja">Puja Only</option>
              <option value="product">Product Only</option>
              <option value="mixed">Mixed Order</option>
            </select>
          </div>

          <div className="filter-group">
            <label><DollarSign size={14} /> Payment</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="All">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid Table */}
      <div className="glass-card table-card">
        {loading ? (
          <div className="loader-container">
            <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} size={32} />
            <p className="mt-3">Querying Vedic database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No sacred orders match your search parameters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Info</th>
                  <th>Order Type</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const customerName = order.app_users?.profiles?.full_name || 'Guest'
                  const customerPhone = order.app_users?.profiles?.phone || ''
                  
                  return (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id.substring(0, 8).toUpperCase()}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="cell-user-info">
                          <span style={{ fontWeight: '600', display: 'block' }}>{customerName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${order.order_type}`}>
                          {order.order_type === 'mixed' ? 'Mixed' : (order.order_type === 'puja' ? 'Puja Seva' : 'Product')}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>₹{order.total_amount}</td>
                      <td>
                        <span className={`status-pill ${getPaymentBadgeClass(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${getStatusBadgeClass(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleOpenOrderDetails(order)}
                          title="View & Edit Details"
                        >
                          <Eye size={15} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal Drawer */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Order Details</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#f97316' }}>ID: {selectedOrder.id}</span>
                  <button 
                    className="copy-btn-inline" 
                    onClick={() => handleCopyText(selectedOrder.id, 'Order ID copied!')}
                    title="Copy Order ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="order-details-layout">
                
                {/* Sidebar: Customer & Status Modification */}
                <div className="order-sidebar">
                  <div>
                    <h3 className="section-title"><User size={16} /> Customer Account</h3>
                    <div className="details-box">
                      <div>
                        <span className="label">Devotee Profile</span>
                        <span className="value font-semibold">{selectedOrder.app_users?.profiles?.full_name || 'Guest'}</span>
                      </div>
                      <div>
                        <span className="label">Registered Phone</span>
                        <span className="value" style={{ color: 'var(--text-muted)' }}>{selectedOrder.app_users?.profiles?.phone || 'No Phone Linked'}</span>
                      </div>
                      <div>
                        <span className="label">Email Address</span>
                        <span className="value" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedOrder.app_users?.profiles?.email || 'No email'}</span>
                      </div>

                      {/* Messaging and Call Action Row */}
                      {selectedOrder.app_users?.profiles?.phone && (
                        <div className="flex gap-2 mt-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                          <a 
                            href={`tel:${selectedOrder.app_users.profiles.phone}`}
                            className="action-btn-small call-btn flex items-center justify-center gap-2 w-full"
                            title="Call Devotee"
                          >
                            <Phone size={13} />
                            <span>Call</span>
                          </a>
                          <a 
                            href={`https://wa.me/${selectedOrder.app_users.profiles.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${selectedOrder.app_users.profiles.full_name || 'Devotee'}, this is Mantra Puja Admin regarding your order #${selectedOrder.id.substring(0, 8).toUpperCase()}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn-small whatsapp-btn flex items-center justify-center gap-2 w-full"
                            title="WhatsApp Devotee"
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.028L2 22l5.135-1.348a9.963 9.963 0 004.877 1.28h.004c5.505 0 9.988-4.478 9.99-9.985A9.974 9.974 0 0012.012 2zm5.79 13.967c-.247.697-1.205 1.266-1.654 1.32-.416.05-.956.079-1.576-.118-2.617-.833-4.32-3.486-4.452-3.66-.13-.173-.974-1.29-.974-2.463 0-1.173.614-1.748.832-1.983.218-.235.48-.294.64-.294.16 0 .32.002.46.008.145.006.338-.056.529.404.195.47.668 1.63.725 1.747.057.118.096.255.018.411-.077.157-.117.255-.235.392-.118.138-.248.308-.354.412-.12.117-.245.244-.105.485.14.24.62.1.02.24 1.014.903 1.574 1.493 2.198 1.83.623.338 1.11.237 1.344.02.16-.148.69-.804.873-1.077.183-.274.366-.228.614-.136.248.091 1.573.743 1.844.878.272.136.453.204.516.31.064.108.064.62-.183 1.317z"/>
                            </svg>
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="section-title"><RefreshCw size={15} /> Update Status</h3>
                    <div className="details-box">
                      <div className="status-form-group">
                        <label>Fulfillment Milestone</label>
                        <select 
                          className="status-select"
                          value={tempOrderStatus} 
                          onChange={(e) => setTempOrderStatus(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing (Puja Performance)</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="status-form-group" style={{ marginTop: '0.25rem' }}>
                        <label>Payment State</label>
                        <select 
                          className="status-select"
                          value={tempPaymentStatus} 
                          onChange={(e) => setTempPaymentStatus(e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      <button 
                        className="primary-btn btn-block"
                        onClick={handleUpdateStatus}
                        disabled={updatingStatus}
                        style={{ marginTop: '0.5rem' }}
                      >
                        {updatingStatus ? 'Updating System...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content: Devotee Sankalp & Shipping Coordinates */}
                <div className="order-main-content">
                  
                  {/* Puja Booking details */}
                  {(selectedOrder.order_type === 'puja' || selectedOrder.order_type === 'mixed' || selectedOrder.order_items?.some(item => item.item_type === 'puja')) && (
                    <div>
                      <h3 className="section-title orange"><Sparkles size={16} /> Vedic Puja Sankalp Details</h3>
                      {selectedOrder.puja_booking_details?.[0] ? (
                        <div className="details-grid">
                          <div>
                            <span className="label">Devotee Name</span>
                            <span className="value">{selectedOrder.puja_booking_details[0].devotee_name}</span>
                          </div>
                          <div>
                            <span className="label">Gotra</span>
                            <span className="value">{selectedOrder.puja_booking_details[0].gotra || 'Not Specified'}</span>
                          </div>
                          <div>
                            <span className="label">Auspicious Date</span>
                            <span className="value flex items-center gap-2">
                              <Calendar size={14} style={{ color: '#f97316' }} />
                              {selectedOrder.puja_booking_details[0].preferred_date}
                            </span>
                          </div>
                          <div>
                            <span className="label">Time Chanting Slot</span>
                            <span className="value">{selectedOrder.puja_booking_details[0].preferred_time}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="label">Sankalp Wish / Special Notes</span>
                            <span className="value italic">"{selectedOrder.puja_booking_details[0].special_notes || 'Family peace, health & prosperity'}"</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Loading devotee sankalp details...</p>
                      )}

                      {/* Puja Video Recording Upload Section */}
                      {(selectedOrder.puja_booking_details?.[0] || selectedOrder.order_items?.some(item => item.item_type === 'puja')) && (
                        <div style={{ marginTop: '1.5rem' }}>
                          <h4 className="section-title" style={{ fontSize: '0.95rem', color: '#f59e0b', borderBottom: 'none', paddingBottom: 0 }}>
                            <Video size={15} /> Personalized Puja Video Recording
                          </h4>
                          <div className="details-box" style={{ marginTop: '0.5rem' }}>
                            {selectedOrder.puja_booking_details?.[0]?.puja_video_url ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <video 
                                  src={selectedOrder.puja_booking_details[0].puja_video_url} 
                                  controls 
                                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)', maxHeight: '200px' }} 
                                />
                                <div className="flex gap-2">
                                  <button 
                                    className="action-btn-small call-btn flex items-center justify-center gap-1 w-full"
                                    onClick={() => handleCopyText(selectedOrder.puja_booking_details[0].puja_video_url, 'Video URL copied!')}
                                  >
                                    <Copy size={13} />
                                    <span>Copy Video URL</span>
                                  </button>
                                  <button 
                                    className="action-btn-small call-btn flex items-center justify-center gap-1"
                                    style={{ color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)' }}
                                    onClick={handleRemoveVideo}
                                    disabled={uploadingVideo}
                                  >
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="upload-zone-hover"
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  padding: '1.5rem', 
                                  border: '2px dashed var(--border)', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  position: 'relative', 
                                  transition: 'all 0.2s' 
                                }} 
                              >
                                {uploadingVideo ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                                    <RefreshCw className="animate-spin" style={{ color: 'var(--primary)' }} size={24} />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', width: '100%', maxWidth: '280px' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                        Uploading: {uploadProgress}%
                                      </span>
                                      <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                      </div>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {uploadProgress < 100 ? 'Syncing with Cloudflare R2 CDN...' : 'Registering in Supabase...'}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Select Video File (.mp4, .mov, etc.)</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max size 50MB. Plays inside Devotee app instantly.</span>
                                  </div>
                                )}
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  onChange={handleVideoUpload}
                                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                                  disabled={uploadingVideo}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipping Details */}
                  {(selectedOrder.order_type === 'product' || selectedOrder.order_type === 'mixed') && (
                    <div>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                        <h3 className="section-title blue" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}><MapPin size={16} /> Prasad Shipping Coordinates</h3>
                        {selectedOrder.shipping_addresses?.[0] && (
                          <button 
                            className="action-btn-small call-btn flex items-center gap-1"
                            onClick={() => {
                              const address = selectedOrder.shipping_addresses[0];
                              const copyStr = `${address.full_name}\n${address.phone}\n${address.address_line_1}${address.address_line_2 ? ', ' + address.address_line_2 : ''}\n${address.city}, ${address.state} - ${address.pincode}\nLandmark: ${address.landmark || 'N/A'}`;
                              handleCopyText(copyStr, 'Shipping address copied for print label!');
                            }}
                            title="Copy address to clipboard"
                          >
                            <Copy size={13} />
                            <span>Copy Address</span>
                          </button>
                        )}
                      </div>
                      {selectedOrder.shipping_addresses?.[0] ? (
                        <div className="details-grid">
                          <div>
                            <span className="label">Recipient Name</span>
                            <span className="value">{selectedOrder.shipping_addresses[0].full_name}</span>
                          </div>
                          <div>
                            <span className="label">Contact Phone</span>
                            <span className="value">{selectedOrder.shipping_addresses[0].phone}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="label">Delivery Address</span>
                            <span className="value">
                              {selectedOrder.shipping_addresses[0].address_line_1}
                              {selectedOrder.shipping_addresses[0].address_line_2 ? `, ${selectedOrder.shipping_addresses[0].address_line_2}` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="label">City / State</span>
                            <span className="value">{selectedOrder.shipping_addresses[0].city}, {selectedOrder.shipping_addresses[0].state}</span>
                          </div>
                          <div>
                            <span className="label">Pincode</span>
                            <span className="value font-bold" style={{ letterSpacing: '0.05em' }}>{selectedOrder.shipping_addresses[0].pincode}</span>
                          </div>
                          {selectedOrder.shipping_addresses[0].landmark && (
                            <div className="col-span-2">
                              <span className="label">Landmark</span>
                              <span className="value">{selectedOrder.shipping_addresses[0].landmark}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Loading shipping address details...</p>
                      )}
                    </div>
                  )}

                  {/* Ordered items listing */}
                  <div>
                    <h3 className="section-title"><ShoppingCart size={16} /> Selected Sacred Items</h3>
                    <div className="items-list">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.id} className="item-row">
                          <div className="item-meta">
                            <span className="item-title">{getItemName(item.item_id)}</span>
                            <span className="item-id">Category: {item.item_type === 'puja' ? 'Puja Seva' : 'E-Commerce Product'} | ID: {item.item_id.substring(0, 8)}</span>
                          </div>
                          <div className="item-price-calc">
                            <span className="item-qty-price">₹{item.price} &times; {item.quantity}</span>
                            <span className="item-subtotal">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="total-payable-container">
                      <span className="total-payable-label">Total Sacred Payable Amount:</span>
                      <span className="total-payable-amount">₹{selectedOrder.total_amount}</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
