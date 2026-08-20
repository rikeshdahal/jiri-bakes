'use client';

import { useState, type FormEvent } from 'react';
import { useCart } from './AppShell';

type Step = 'cart' | 'checkout' | 'success' | 'track';

interface TrackedOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string; step: number }> = {
  pending:   { label: 'Order Received',   color: '#E87B32', bg: 'rgba(232,123,50,0.12)',  border: 'rgba(232,123,50,0.3)',  icon: '📋', step: 1 },
  baking:    { label: 'Being Baked',      color: '#8A7654', bg: 'rgba(245,211,92,0.18)',  border: 'rgba(245,211,92,0.4)',  icon: '👨‍🍳', step: 2 },
  ready:     { label: 'Ready for Pickup', color: '#28551C', bg: 'rgba(40,85,28,0.12)',    border: 'rgba(40,85,28,0.25)',   icon: '✅', step: 3 },
  completed: { label: 'Delivered',        color: '#27ae60', bg: 'rgba(39,174,96,0.12)',   border: 'rgba(39,174,96,0.25)',  icon: '🎉', step: 4 },
  cancelled: { label: 'Cancelled',        color: '#c0392b', bg: 'rgba(192,57,43,0.10)',   border: 'rgba(192,57,43,0.25)',  icon: '❌', step: 0 },
};

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQty, removeItem, clearCart, subtotal } = useCart();

  const [step, setStep] = useState<Step>('cart');
  const [customerName, setCustomerName]       = useState('');
  const [customerPhone, setCustomerPhone]     = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes]                     = useState('');
  const [paymentMethod, setPaymentMethod]     = useState<'cod' | 'visit'>('cod');
  const [submitting, setSubmitting]           = useState(false);
  const [lastOrderId, setLastOrderId]         = useState('');
  const [error, setError]                     = useState('');

  // Track order state
  const [trackInput, setTrackInput]           = useState('');
  const [tracking, setTracking]               = useState(false);
  const [trackedOrders, setTrackedOrders]     = useState<TrackedOrder[]>([]);
  const [trackError, setTrackError]           = useState('');

  const deliveryFee = paymentMethod === 'visit' ? 0 : (subtotal >= 2000 || subtotal === 0 ? 0 : 100);
  const grandTotal  = subtotal + deliveryFee;

  // ─── Place order ───────────────────────────────────────────────────────────
  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) { setError('Please provide your name and phone number.'); return; }
    if (items.length === 0)              { setError('Your cart is empty.');                        return; }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name:    customerName,
          customer_phone:   customerPhone,
          customer_address: paymentMethod === 'visit' ? 'Visit to store – Lokanthali, Bhaktapur' : (customerAddress || 'Lokanthali, Bhaktapur'),
          items: items.map((i) => ({ product_id: i.id, name: i.name, price: i.price, quantity: i.qty })),
          total:            grandTotal,
          payment_method:   paymentMethod === 'cod' ? 'Cash on Delivery' : 'Visit Store / Pay in Person',
          notes:            notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to place order.'); return; }

      setLastOrderId(json.data?.id || '');
      setStep('success');
      clearCart();
    } catch {
      setError('Connection error. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Track order ───────────────────────────────────────────────────────────
  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) { setTrackError('Enter your Order ID or phone number.'); return; }
    setTracking(true);
    setTrackError('');
    setTrackedOrders([]);
    try {
      const isId = trackInput.trim().startsWith('ord-');
      const qs   = isId ? `id=${encodeURIComponent(trackInput.trim())}` : `phone=${encodeURIComponent(trackInput.trim())}`;
      const res  = await fetch(`/api/track?${qs}`);
      const json = await res.json();
      if (!res.ok) { setTrackError(json.error || 'Not found.'); return; }
      setTrackedOrders(json.data || []);
    } catch {
      setTrackError('Connection error. Try again.');
    } finally {
      setTracking(false);
    }
  };

  const handleClose = () => {
    closeCart();
    setTimeout(() => { setStep('cart'); setTrackedOrders([]); setTrackInput(''); setTrackError(''); }, 350);
  };

  if (!isOpen) return null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .cqb { width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
               background:#FAF6EE;border:1px solid #E8DFCE;color:var(--color-brown-deep);font-size:1rem;cursor:pointer;transition:all .2s; }
        .cqb:hover { background:var(--color-green);color:#FFFDF5;border-color:var(--color-green); }
        .pay-opt { display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:14px;border:2px solid #E8DFCE;
                   cursor:pointer;transition:all .22s;background:#FAF6EE; }
        .pay-opt.selected { border-color:var(--color-green);background:rgba(40,85,28,0.06); }
        .drawer-input { width:100%;padding:11px 14px;border-radius:10px;border:1px solid #E8DFCE;background:#FAF6EE;
                        font-size:.88rem;font-family:inherit;outline:none;transition:border .2s; }
        .drawer-input:focus { border-color:var(--color-green); }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose} style={{ position:'absolute',inset:0,background:'rgba(27,20,14,0.6)',backdropFilter:'blur(4px)' }} />

      {/* Panel */}
      <div style={{
        position:'relative', width:'100%', maxWidth:480, height:'100%',
        background:'#FFFDF5', boxShadow:'-8px 0 40px rgba(0,0,0,0.22)',
        display:'flex', flexDirection:'column', zIndex:10,
        animation:'slideInRight .3s cubic-bezier(.4,0,.2,1)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid #E8DFCE', background:'#FAF6EE', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Tab switcher */}
            <div style={{ display:'flex', gap:6 }}>
              {(['cart','track'] as const).map((t) => (
                <button key={t} onClick={() => { setStep(t === 'track' ? 'track' : 'cart'); }}
                  style={{
                    padding:'6px 14px', borderRadius:9999, fontSize:'.75rem', fontWeight:600,
                    fontFamily:'inherit', cursor:'pointer', border:'1px solid transparent', transition:'all .2s',
                    background: (step === t || (t==='cart' && (step==='checkout'||step==='success'))) ? 'var(--color-green)' : 'transparent',
                    color:      (step === t || (t==='cart' && (step==='checkout'||step==='success'))) ? '#FFFDF5' : 'var(--color-brown)',
                    borderColor:(step === t || (t==='cart' && (step==='checkout'||step==='success'))) ? 'var(--color-green)' : '#D8C9A4',
                  }}>
                  {t === 'cart' ? '🛒 Bag' : '📦 Track'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleClose} style={{ width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,0.05)',border:'none',cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'22px' }}>

          {/* ════ CART VIEW ════ */}
          {step === 'cart' && (
            items.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 20px', color:'var(--color-text-tertiary)' }}>
                <div style={{ fontSize:'3rem', marginBottom:14 }}>🥐</div>
                <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:'var(--color-brown-deep)', marginBottom:8 }}>Your bag is empty</h4>
                <p style={{ fontSize:'.85rem', maxWidth:260, margin:'0 auto 24px', lineHeight:1.65 }}>
                  Explore our artisan sourdoughs, honey cakes, and morning croissants to fill your bag.
                </p>
                <button onClick={handleClose} style={{ padding:'12px 28px', borderRadius:9999, background:'var(--color-green)', color:'#FFFDF5', fontSize:'.85rem', fontWeight:600, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(40,85,28,.25)' }}>
                  Browse Bakery Menu
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display:'flex', gap:12, padding:'12px', borderRadius:14, background:'#FAF6EE', border:'1px solid #E8DFCE', alignItems:'center' }}>
                    <div style={{ width:54, height:54, borderRadius:10, overflow:'hidden', flexShrink:0, border:'1px solid #E8DFCE', background:'#EEE8D5' }}>
                      <img src={item.img} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { e.currentTarget.style.display='none'; }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h4 style={{ fontSize:'.88rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</h4>
                      <div style={{ fontSize:'.82rem', fontFamily:'var(--font-display)', color:'var(--color-green)', fontWeight:600 }}>
                        NPR {(item.price * item.qty).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button className="cqb" onClick={() => updateQty(item.id, -1)} aria-label="Decrease">−</button>
                      <span style={{ fontSize:'.88rem', fontWeight:700, minWidth:18, textAlign:'center', color:'var(--color-brown-deep)' }}>{item.qty}</span>
                      <button className="cqb" onClick={() => updateQty(item.id, 1)}  aria-label="Increase">+</button>
                      <button onClick={() => removeItem(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#c0392b', fontSize:'.8rem', marginLeft:4, padding:4 }} title="Remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ════ CHECKOUT VIEW ════ */}
          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {error && (
                <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(192,57,43,.09)', color:'#c0392b', fontSize:'.8rem', border:'1px solid rgba(192,57,43,.2)' }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label style={{ display:'block', fontSize:'.82rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:5 }}>Full Name *</label>
                <input className="drawer-input" type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Maya Shrestha" />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display:'block', fontSize:'.82rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:5 }}>Phone Number * (used for order tracking)</label>
                <input className="drawer-input" type="tel" required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 9841234567" />
              </div>

              {/* ── Payment Method ── */}
              <div>
                <label style={{ display:'block', fontSize:'.82rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:10 }}>Payment Method *</label>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* COD */}
                  <div className={`pay-opt${paymentMethod === 'cod' ? ' selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${paymentMethod==='cod'?'var(--color-green)':'#D8C9A4'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      {paymentMethod === 'cod' && <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--color-green)' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--color-brown-deep)', marginBottom:3 }}>💵 Cash on Delivery</div>
                      <div style={{ fontSize:'.78rem', color:'var(--color-text-tertiary)', lineHeight:1.5 }}>
                        Pay cash when your order arrives at your door. Delivery within Lokanthali area.
                        {deliveryFee > 0 && <span style={{ color:'var(--color-orange)', fontWeight:600 }}> +NPR {deliveryFee} delivery fee.</span>}
                        {deliveryFee === 0 && subtotal >= 2000 && <span style={{ color:'var(--color-green)', fontWeight:600 }}> FREE delivery on orders NPR 2000+!</span>}
                      </div>
                    </div>
                  </div>

                  {/* Visit Store */}
                  <div className={`pay-opt${paymentMethod === 'visit' ? ' selected' : ''}`} onClick={() => setPaymentMethod('visit')}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${paymentMethod==='visit'?'var(--color-green)':'#D8C9A4'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      {paymentMethod === 'visit' && <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--color-green)' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--color-brown-deep)', marginBottom:3 }}>🏪 Visit Store & Pay</div>
                      <div style={{ fontSize:'.78rem', color:'var(--color-text-tertiary)', lineHeight:1.5 }}>
                        Reserve your order and pay in person at our bakery in Lokanthali, Bhaktapur. Mon–Sat 7AM–8PM.
                        <span style={{ color:'var(--color-green)', fontWeight:600 }}> No delivery fee.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address (only for COD) */}
              {paymentMethod === 'cod' && (
                <div>
                  <label style={{ display:'block', fontSize:'.82rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:5 }}>Delivery Address *</label>
                  <input className="drawer-input" type="text" required value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="e.g. Lokanthali Chowk, near temple, Bhaktapur" />
                </div>
              )}

              {/* Notes */}
              <div>
                <label style={{ display:'block', fontSize:'.82rem', fontWeight:600, color:'var(--color-brown-deep)', marginBottom:5 }}>Special Instructions (Optional)</label>
                <textarea className="drawer-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={paymentMethod === 'visit' ? 'e.g. Pick up at 3PM, write Happy Birthday on cake' : 'e.g. Slice sourdough, write Happy Birthday on cake'} style={{ resize:'none' }} />
              </div>

              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(40,85,28,.07)', border:'1px solid rgba(40,85,28,.15)', fontSize:'.78rem', color:'var(--color-green)', lineHeight:1.5 }}>
                📦 After placing, use your <strong>Order ID</strong> or <strong>phone number</strong> in the <em>Track</em> tab to follow your order live.
              </div>
            </form>
          )}

          {/* ════ SUCCESS VIEW ════ */}
          {step === 'success' && (
            <div style={{ textAlign:'center', padding:'40px 10px' }}>
              <div style={{ width:70, height:70, borderRadius:'50%', background:'rgba(40,85,28,.12)', color:'var(--color-green)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:'1.8rem' }}>✓</div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.55rem', color:'var(--color-brown-deep)', marginBottom:8 }}>Order Confirmed!</h3>
              <p style={{ fontSize:'.85rem', color:'var(--color-text-tertiary)', marginBottom:22, lineHeight:1.65 }}>
                Thank you, <strong>{customerName}</strong>!
                {paymentMethod === 'cod' ? ' Our bakers are preparing your fresh artisan treats for delivery.' : ' Your order is reserved — please visit us at Lokanthali Bakery.'}
              </p>

              <div style={{ padding:'16px 20px', borderRadius:14, background:'#FAF6EE', border:'1px solid #E8DFCE', marginBottom:22, textAlign:'left', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem' }}>
                  <span style={{ color:'var(--color-text-tertiary)' }}>Order ID:</span>
                  <span style={{ fontWeight:700, color:'var(--color-brown-deep)', fontFamily:'monospace', letterSpacing:.5 }}>{lastOrderId}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem' }}>
                  <span style={{ color:'var(--color-text-tertiary)' }}>Payment:</span>
                  <span style={{ fontWeight:600, color:'var(--color-green)' }}>{paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay at Store'}</span>
                </div>
              </div>

              <button onClick={() => { setTrackInput(lastOrderId); setStep('track'); }}
                style={{ width:'100%', padding:'13px', borderRadius:9999, background:'rgba(40,85,28,.1)', color:'var(--color-green)', fontSize:'.88rem', fontWeight:600, border:'1.5px solid rgba(40,85,28,.2)', cursor:'pointer', marginBottom:10, transition:'all .2s' }}>
                📦 Track My Order
              </button>
              <button onClick={handleClose}
                style={{ width:'100%', padding:'13px', borderRadius:9999, background:'var(--color-green)', color:'#FFFDF5', fontSize:'.88rem', fontWeight:600, border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(40,85,28,.25)' }}>
                Back to Bakery
              </button>
            </div>
          )}

          {/* ════ TRACK VIEW ════ */}
          {step === 'track' && (
            <div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:'var(--color-brown-deep)', marginBottom:6 }}>Track Your Order</h3>
              <p style={{ fontSize:'.82rem', color:'var(--color-text-tertiary)', marginBottom:20, lineHeight:1.6 }}>
                Enter your <strong>Order ID</strong> (e.g. ord-12345) or the <strong>phone number</strong> used when ordering.
              </p>

              <form onSubmit={handleTrack} style={{ display:'flex', gap:8, marginBottom:22 }}>
                <input className="drawer-input" value={trackInput} onChange={(e) => setTrackInput(e.target.value)}
                  placeholder="Order ID or phone number" style={{ flex:1 }} />
                <button type="submit" disabled={tracking} style={{ padding:'11px 18px', borderRadius:10, background:'var(--color-green)', color:'#FFFDF5', fontWeight:600, fontSize:'.84rem', border:'none', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity:tracking?.7:1 }}>
                  {tracking ? '...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(192,57,43,.09)', color:'#c0392b', fontSize:'.82rem', border:'1px solid rgba(192,57,43,.2)', marginBottom:16 }}>
                  {trackError}
                </div>
              )}

              {trackedOrders.length > 0 && trackedOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const steps = ['pending', 'baking', 'ready', 'completed'];
                const currentStep = steps.indexOf(order.status);

                return (
                  <div key={order.id} style={{ background:'#FAF6EE', borderRadius:16, border:'1px solid #E8DFCE', padding:'18px', marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:'.88rem', color:'var(--color-brown-deep)' }}>{order.id}</span>
                      <span style={{ padding:'4px 12px', borderRadius:9999, fontSize:'.72rem', fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Progress Bar (hide if cancelled) */}
                    {order.status !== 'cancelled' && (
                      <div style={{ display:'flex', gap:0, marginBottom:18, position:'relative' }}>
                        {steps.map((s, i) => {
                          const sCfg = STATUS_CONFIG[s];
                          const done = i <= currentStep;
                          return (
                            <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                              {/* connector line */}
                              {i < steps.length - 1 && (
                                <div style={{ position:'absolute', top:12, left:'50%', width:'100%', height:3, background: i < currentStep ? 'var(--color-green)' : '#E8DFCE', zIndex:0, transition:'background .4s' }} />
                              )}
                              <div style={{ width:24, height:24, borderRadius:'50%', background: done ? 'var(--color-green)' : '#E8DFCE', color: done ? '#FFFDF5' : '#BBB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', zIndex:1, position:'relative', transition:'all .4s', border:`2px solid ${done ? 'var(--color-green)' : '#E8DFCE'}` }}>
                                {done ? '✓' : i + 1}
                              </div>
                              <div style={{ fontSize:'.6rem', fontWeight:600, color: done ? 'var(--color-green)' : '#BBB', marginTop:5, textAlign:'center', letterSpacing:'.2px', lineHeight:1.3 }}>
                                {sCfg.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Order details */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'.82rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'var(--color-text-tertiary)' }}>Customer:</span>
                        <span style={{ fontWeight:600, color:'var(--color-brown-deep)' }}>{order.customer_name}</span>
                      </div>
                      {order.items?.length > 0 && (
                        <div>
                          <span style={{ color:'var(--color-text-tertiary)', display:'block', marginBottom:5 }}>Items ordered:</span>
                          <ul style={{ paddingLeft:16, display:'flex', flexDirection:'column', gap:3 }}>
                            {order.items.map((it, i) => (
                              <li key={i} style={{ color:'var(--color-brown-deep)', fontSize:'.8rem' }}>
                                {it.name} × {it.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #E8DFCE', paddingTop:8, marginTop:4 }}>
                        <span style={{ color:'var(--color-text-tertiary)' }}>Total:</span>
                        <span style={{ fontFamily:'var(--font-display)', fontWeight:600, color:'var(--color-green)', fontSize:'1rem' }}>NPR {order.total.toLocaleString()}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'var(--color-text-tertiary)' }}>Placed:</span>
                        <span style={{ color:'var(--color-brown-deep)' }}>
                          {new Date(order.created_at).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {trackedOrders.length === 0 && !trackError && (
                <div style={{ textAlign:'center', padding:'36px 0', color:'var(--color-text-tertiary)', fontSize:'.86rem' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📦</div>
                  Enter your details above to see your order status.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / Summary ── */}
        {items.length > 0 && (step === 'cart' || step === 'checkout') && (
          <div style={{ padding:'18px 22px', borderTop:'1px solid #E8DFCE', background:'#FAF6EE' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'.84rem', color:'var(--color-text-tertiary)' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight:600, color:'var(--color-brown-deep)' }}>NPR {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:'.84rem', color:'var(--color-text-tertiary)' }}>
              <span>Delivery</span>
              <span style={{ fontWeight:600, color: deliveryFee===0 ? 'var(--color-green)' : 'var(--color-brown-deep)' }}>
                {deliveryFee === 0 ? 'FREE' : `NPR ${deliveryFee}`}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16, fontSize:'1.05rem', fontWeight:700 }}>
              <span style={{ color:'var(--color-brown-deep)' }}>Total</span>
              <span style={{ fontFamily:'var(--font-display)', color:'var(--color-green)', fontSize:'1.22rem' }}>NPR {grandTotal.toLocaleString()}</span>
            </div>

            {step === 'cart' ? (
              <button onClick={() => setStep('checkout')}
                style={{ width:'100%', padding:'14px', borderRadius:9999, background:'var(--color-green)', color:'#FFFDF5', fontSize:'.92rem', fontWeight:600, border:'none', cursor:'pointer', boxShadow:'0 4px 16px rgba(40,85,28,.25)', transition:'all .2s' }}>
                Checkout →
              </button>
            ) : (
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setStep('cart')}
                  style={{ padding:'13px 18px', borderRadius:9999, background:'transparent', border:'1.5px solid #E8DFCE', color:'var(--color-brown-deep)', fontSize:'.84rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  ← Back
                </button>
                <button type="submit" form="checkout-form" disabled={submitting}
                  style={{ flex:1, padding:'13px', borderRadius:9999, background:'var(--color-green)', color:'#FFFDF5', fontSize:'.9rem', fontWeight:600, border:'none', cursor:'pointer', opacity:submitting?.7:1, boxShadow:'0 4px 16px rgba(40,85,28,.25)', fontFamily:'inherit' }}>
                  {submitting ? 'Placing Order...' : `Place Order · NPR ${grandTotal.toLocaleString()}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
