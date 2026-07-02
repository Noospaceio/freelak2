'use client';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// ── EDIT THESE BEFORE DEPLOY ───────────────────────────────────────────────
const TICKER        = '$FREELAK';
const TOTAL_SUPPLY   = '22,222';
const CONTRACT_ADDR  = 'J1fL9JCSczPdRqcsAEkxUdB8Npx8cAuJsbZdwR74zmtG';
const BUY_LINK       = `https://jup.ag/swap/SOL-${CONTRACT_ADDR}`;
const DEXSCREENER    = `https://dexscreener.com/solana/${CONTRACT_ADDR}`;
const X_LINK         = 'https://x.com/freelakito';
const TG_LINK        = 'https://t.me/freelakito';

// ── MERCH / SHOP CONFIG ─────────────────────────────────────────────────────
const SHIRT_PRICE_EUR = 25;          // Basispreis pro Shirt
const NACHNAHME_FEE_EUR = 10;        // Aufschlag bei Nachnahme
const SOL_EUR_RATE = 65;             // grober Kurs für Anzeige, KEIN Live-Feed — bei Bedarf anpassen
const IBAN           = 'DE00 0000 0000 0000 0000 00'; // ← eintragen
const IBAN_HOLDER     = 'Vorname Nachname';             // ← Kontoinhaber eintragen
const SOL_WALLET      = 'DEINE_SOL_WALLET_ADRESSE';      // ← Treasury-Wallet für SOL-Zahlungen
const FREELAK_WALLET  = 'DEINE_FREELAK_TOKEN_ADRESSE';   // ← Wallet/Token-Account für $FREELAK-Zahlungen

const SHIRTS = [
  { id: 'shirt-1', name: 'Prison Break', img: '/merch/shirt-1.png', price: SHIRT_PRICE_EUR },
  { id: 'shirt-2', name: 'Free the Plant', img: '/merch/shirt-2.png', price: SHIRT_PRICE_EUR },
  { id: 'shirt-3', name: 'Mycelial Network', img: '/merch/shirt-3.png', price: SHIRT_PRICE_EUR },
  { id: 'shirt-4', name: 'Sacred Rebellion', img: '/merch/shirt-4.png', price: SHIRT_PRICE_EUR },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FITS = ['Herren', 'Damen'];

// ── Supabase-Client ─────────────────────────────────────────────────────────
// Erwartet ENV-Variablen NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : null;

function makeOrderRef() {
  return 'FL-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Copy-to-clipboard hook ──────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return { copied, copy };
}

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1400, 1);
        setVal(Math.floor(p * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Growth canvas ───────────────────────────────────────────────────────────
function GrowthField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const shoots = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: H + Math.random() * 60,
      speed: 0.15 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
      len: 40 + Math.random() * 90,
      hue: Math.random() > 0.5 ? '#3ecf6a' : '#d4af37',
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      shoots.forEach(s => {
        s.y -= s.speed;
        s.sway += 0.01;
        if (s.y < -s.len) {
          s.y = H + Math.random() * 40;
          s.x = Math.random() * W;
        }
        const wobble = Math.sin(s.sway) * 10;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + s.len);
        ctx.quadraticCurveTo(s.x + wobble, s.y + s.len / 2, s.x, s.y);
        ctx.strokeStyle = s.hue + '55';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = s.hue + 'aa';
        ctx.shadowColor = s.hue;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }} />;
}

// ── Merch ────────────────────────────────────────────────────────────────────
function Merch() {
  const [cart, setCart] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, { fit: string; size: string }>>(
    Object.fromEntries(SHIRTS.map(s => [s.id, { fit: 'Herren', size: 'M' }]))
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payment, setPayment] = useState<'ueberweisung' | 'krypto' | 'nachnahme'>('ueberweisung');
  const [kryptoCoin, setKryptoCoin] = useState<'SOL' | 'FREELAK'>('SOL');
  const [form, setForm] = useState({ name: '', street: '', zip: '', city: '', country: 'Deutschland', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ ref: string } | null>(null);
  const [error, setError] = useState('');

  const updateSelection = (id: string, patch: Partial<{ fit: string; size: string }>) =>
    setSelections(s => ({ ...s, [id]: { ...s[id], ...patch } }));

  const addToCart = (shirt: typeof SHIRTS[number]) => {
    const sel = selections[shirt.id];
    setCart(c => {
      const idx = c.findIndex(i => i.shirtId === shirt.id && i.fit === sel.fit && i.size === sel.size);
      if (idx >= 0) {
        const next = [...c];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...c, { shirtId: shirt.id, name: shirt.name, fit: sel.fit, size: sel.size, price: shirt.price, qty: 1 }];
    });
  };

  const removeFromCart = (i: number) => setCart(c => c.filter((_, idx) => idx !== i));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const nachnahmeFee = payment === 'nachnahme' ? NACHNAHME_FEE_EUR : 0;
  const total = subtotal + nachnahmeFee;
  const totalSol = (total / SOL_EUR_RATE).toFixed(3);

  const canSubmit = form.name && form.street && form.zip && form.city && form.email &&
    (payment !== 'nachnahme' || form.phone) && cart.length > 0;

  const submitOrder = async () => {
    if (!canSubmit) { setError('Bitte alle Pflichtfelder ausfüllen.'); return; }
    setSubmitting(true);
    setError('');
    const ref = makeOrderRef();
    try {
      if (supabase) {
        const { error: dbError } = await supabase.from('orders').insert({
          order_ref: ref,
          items: cart,
          name: form.name,
          street: form.street,
          zip: form.zip,
          city: form.city,
          country: form.country,
          email: form.email,
          phone: form.phone,
          payment_method: payment,
          payment_currency: payment === 'krypto' ? kryptoCoin : null,
          payment_status: 'pending',
          total_amount: total,
        });
        if (dbError) throw dbError;
      }
      setOrderResult({ ref });
      setCart([]);
    } catch (e) {
      setError('Da ist was schiefgelaufen. Versuch es nochmal oder melde dich direkt über X/Telegram.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>✓</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Bestellung eingegangen</h3>
        <p style={{ color: '#aaa', marginBottom: 24 }}>
          Deine Bestellnummer: <strong style={{ color: '#3ecf6a', fontFamily: 'monospace' }}>{orderResult.ref}</strong><br />
          Bestätigung geht an deine E-Mail-Adresse.
        </p>

        {payment === 'ueberweisung' && (
          <div style={{ background: 'rgba(62,207,106,0.05)', border: '1px solid rgba(62,207,106,0.2)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>IBAN:</strong> {IBAN}</div>
            <div><strong>Empfänger:</strong> {IBAN_HOLDER}</div>
            <div><strong>Betrag:</strong> {total.toFixed(2)}€</div>
            <div><strong>Verwendungszweck:</strong> {orderResult.ref}</div>
            <div style={{ color: '#888', marginTop: 8 }}>Bitte unbedingt die Bestellnummer als Verwendungszweck angeben, sonst können wir die Zahlung nicht zuordnen.</div>
          </div>
        )}

        {payment === 'krypto' && (
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>Zahlung in:</strong> {kryptoCoin}</div>
            <div style={{ wordBreak: 'break-all' }}><strong>Adresse:</strong> {kryptoCoin === 'SOL' ? SOL_WALLET : FREELAK_WALLET}</div>
            {kryptoCoin === 'SOL' && <div><strong>Ungefährer Betrag:</strong> ~{totalSol} SOL (Kurs schwankt, gerne aktuellen Kurs selbst prüfen)</div>}
            <div style={{ color: '#888', marginTop: 8 }}>Schick uns nach der Zahlung kurz einen Screenshot mit Bestellnummer {orderResult.ref} über X oder Telegram, damit wir's schnell zuordnen können.</div>
          </div>
        )}

        {payment === 'nachnahme' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div>Nichts weiter zu tun — du zahlst <strong>{total.toFixed(2)}€</strong> (inkl. {NACHNAHME_FEE_EUR}€ Nachnahme-Gebühr) bar beim Zusteller.</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {!checkoutOpen ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {SHIRTS.map(shirt => {
              const sel = selections[shirt.id];
              return (
                <div key={shirt.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: 16 }}>
                  <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                    <img src={shirt.img} alt={shirt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{shirt.name}</div>
                  <div style={{ color: '#3ecf6a', fontFamily: 'monospace', fontWeight: 700, marginBottom: 12 }}>{shirt.price}€</div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {FITS.map(f => (
                      <button key={f} onClick={() => updateSelection(shirt.id, { fit: f })} style={{
                        flex: 1, padding: '6px 0', fontSize: 11, borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${sel.fit === f ? '#3ecf6a' : 'rgba(255,255,255,0.15)'}`,
                        background: sel.fit === f ? 'rgba(62,207,106,0.12)' : 'transparent',
                        color: sel.fit === f ? '#3ecf6a' : '#999',
                      }}>{f}</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
                    {SIZES.map(sz => (
                      <button key={sz} onClick={() => updateSelection(shirt.id, { size: sz })} style={{
                        width: 34, height: 30, fontSize: 11, borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${sel.size === sz ? '#d4af37' : 'rgba(255,255,255,0.15)'}`,
                        background: sel.size === sz ? 'rgba(212,175,55,0.15)' : 'transparent',
                        color: sel.size === sz ? '#d4af37' : '#999',
                      }}>{sz}</button>
                    ))}
                  </div>
                  <button onClick={() => addToCart(shirt)} style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'rgba(62,207,106,0.15)', color: '#3ecf6a', fontWeight: 700, fontSize: 13,
                  }}>In den Warenkorb</button>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div style={{ marginTop: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Warenkorb</div>
              {cart.map((i, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
                  <span>{i.qty}× {i.name} ({i.fit}, {i.size})</span>
                  <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: '#3ecf6a', fontFamily: 'monospace' }}>{(i.price * i.qty).toFixed(2)}€</span>
                    <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 700 }}>
                <span>Zwischensumme</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <button onClick={() => setCheckoutOpen(true)} style={{
                width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800, fontSize: 15,
              }}>Zur Kasse →</button>
            </div>
          )}
        </>
      ) : (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>← zurück</button>

          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {[
              ['name', 'Name*'], ['street', 'Straße + Hausnummer*'], ['zip', 'PLZ*'], ['city', 'Stadt*'],
              ['country', 'Land*'], ['email', 'E-Mail*'], ['phone', `Telefon${payment === 'nachnahme' ? '*' : ' (optional)'}`],
            ].map(([key, label]) => (
              <input key={key} placeholder={label} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.03)', color: '#eee', fontSize: 14 }} />
            ))}
          </div>

          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, letterSpacing: '0.05em', color: '#d4af37' }}>ZAHLUNGSMETHODE</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              { id: 'ueberweisung', label: 'SEPA-Überweisung' },
              { id: 'krypto', label: 'Krypto (SOL oder $FREELAK)' },
              { id: 'nachnahme', label: `Nachnahme (+${NACHNAHME_FEE_EUR}€ Gebühr)` },
            ].map(p => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${payment === p.id ? '#3ecf6a' : 'rgba(255,255,255,0.12)'}`,
                background: payment === p.id ? 'rgba(62,207,106,0.08)' : 'transparent', fontSize: 14,
              }}>
                <input type="radio" checked={payment === p.id} onChange={() => setPayment(p.id as any)} />
                {p.label}
              </label>
            ))}
          </div>

          {payment === 'krypto' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['SOL', 'FREELAK'] as const).map(c => (
                <button key={c} onClick={() => setKryptoCoin(c)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  border: `1px solid ${kryptoCoin === c ? '#d4af37' : 'rgba(255,255,255,0.15)'}`,
                  background: kryptoCoin === c ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: kryptoCoin === c ? '#d4af37' : '#999',
                }}>{c === 'SOL' ? 'SOL' : TICKER}</button>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999', marginBottom: 4 }}>
              <span>Zwischensumme</span><span>{subtotal.toFixed(2)}€</span>
            </div>
            {payment === 'nachnahme' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999', marginBottom: 4 }}>
                <span>Nachnahme-Gebühr</span><span>+{NACHNAHME_FEE_EUR.toFixed(2)}€</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginTop: 6 }}>
              <span>Gesamt</span><span style={{ color: '#3ecf6a' }}>{total.toFixed(2)}€</span>
            </div>
          </div>

          {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button onClick={submitOrder} disabled={submitting} style={{
            width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', cursor: submitting ? 'default' : 'pointer',
            background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800, fontSize: 15,
            opacity: submitting ? 0.6 : 1,
          }}>{submitting ? 'Wird gesendet…' : 'Bestellung abschicken'}</button>
        </div>
      )}
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    { id: 'story', label: 'Story' },
    { id: 'tokenomics', label: 'Tokenomics' },
    { id: 'merch', label: 'Merch' },
    { id: 'buy', label: 'Buy' },
  ];
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };
  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56,
        background: scrolled ? 'rgba(6,10,6,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(212,175,55,0.15)' : '1px solid transparent',
        transition: 'background 0.35s, border-color 0.35s',
      }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img 
            src="/logo.png" 
            alt="FreeLakito Logo" 
            style={{ height: 36, width: 'auto' }} 
          />
        </button>
        <div className="fl-nav-desktop" style={{ display: 'flex', gap: 4 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: 'none', border: '1px solid transparent', borderRadius: 99,
              padding: '5px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
            }}>{l.label}</button>
          ))}
        </div>
        <a href={BUY_LINK} target="_blank" rel="noreferrer" className="fl-nav-cta" style={{
          background: 'rgba(62,207,106,0.14)', border: '1px solid rgba(62,207,106,0.4)',
          borderRadius: 99, padding: '6px 18px', fontFamily: 'monospace', fontSize: 12,
          fontWeight: 700, color: '#3ecf6a', textDecoration: 'none', letterSpacing: '0.08em',
        }}>Buy {TICKER} →</a>
        <button onClick={() => setMenuOpen(o => !o)} className="fl-nav-mobile-btn"
          style={{ background: 'none', border: 'none', display: 'none', flexDirection: 'column', gap: 5 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{ width: 22, height: 1.5, background: '#3ecf6a', borderRadius: 99,
              transform: menuOpen ? (i === 0 ? 'translateY(6.5px) rotate(45deg)' : i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'scaleX(0)') : 'none',
              transition: 'all 0.25s' }} />
          ))}
        </button>
      </nav>
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
        background: 'rgba(6,10,6,0.97)', backdropFilter: 'blur(14px)',
        overflow: 'hidden', maxHeight: menuOpen ? 260 : 0, transition: 'max-height 0.3s ease',
      }}>
        <div style={{ padding: '12px 20px 20px' }}>
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '11px 16px', fontFamily: 'monospace', fontSize: 14, color: 'rgba(255,255,255,0.6)',
            }}>{l.label}</button>
          ))}
          <a href={BUY_LINK} target="_blank" rel="noreferrer" style={{
            display: 'block', marginTop: 8, background: 'rgba(62,207,106,0.12)',
            border: '1px solid rgba(62,207,106,0.35)', borderRadius: 10, padding: '12px 16px',
            fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#3ecf6a', textAlign: 'center', textDecoration: 'none',
          }}>Buy {TICKER} →</a>
        </div>
      </div>
      <style>{`
        .fl-nav-desktop { display: flex !important; }
        .fl-nav-mobile-btn { display: none !important; }
        .fl-nav-cta { display: inline-flex !important; }
        @media (max-width: 680px) {
          .fl-nav-desktop { display: none !important; }
          .fl-nav-mobile-btn { display: flex !important; }
          .fl-nav-cta { display: none !important; }
        }
        html { scroll-behavior: smooth; }
        [id] { scroll-margin-top: 72px; }
        body { background: #060a06; }
      `}</style>
    </>
  );
}

export default function FreeLakito() {
  const { copied, copy } = useCopy();
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6 },
  };

  return (
    <>
      <div style={{ background: '#060a06', color: '#eee', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', paddingTop: 56 }}>
        <Nav />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '96px 20px 80px' }}>
          <GrowthField />
          <motion.div style={{ position: 'relative', zIndex: 1 }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>

            {/* Logo zentriert und passend über dem Text */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <img 
                src="/logo.png" 
                alt="FreeLakito Logo" 
                style={{ 
                  maxWidth: '180px', 
                  width: '40%', 
                  height: 'auto', 
                  margin: '0 auto',
                  filter: 'drop-shadow(0 10px 30px rgba(62,207,106,0.35))' 
                }} 
              />
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 18 }}>
              LAUNCHED FROM OPEN PRISON · SOLANA
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>
              {TICKER}
            </h1>
            <p style={{ maxWidth: 560, margin: '0 auto', fontSize: 18, color: '#aaa', lineHeight: 1.6 }}>
              A meme coin with a real story behind it. One guy, one phone, one chance — smuggled from
              behind the wall of an open prison after a cannabis conviction.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              <motion.a href={BUY_LINK} target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                style={{ background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800,
                  padding: '14px 34px', borderRadius: 999, textDecoration: 'none', fontSize: 16 }}>
                Buy {TICKER} →
              </motion.a>
              <motion.a href={DEXSCREENER} target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }}
                style={{ border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', fontWeight: 700,
                  padding: '14px 30px', borderRadius: 999, textDecoration: 'none', fontSize: 16 }}>
                View Chart 📈
              </motion.a>
            </div>

            {/* CA */}
            <div onClick={() => copy(CONTRACT_ADDR)} style={{
              marginTop: 34, display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: 99, padding: '8px 18px', fontFamily: 'monospace', fontSize: 12, color: '#ccc',
            }}>
              <span style={{ opacity: 0.6 }}>CA:</span>
              <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {CONTRACT_ADDR}
              </span>
              <span style={{ color: copied ? '#3ecf6a' : '#666' }}>{copied ? '✓ copied' : '⧉'}</span>
            </div>
          </motion.div>
        </section>

        {/* Der Rest (Stats, Story, Tokenomics, Buy, Footer) bleibt unverändert */}
        <motion.section {...fadeUp} style={{ padding: '20px 20px 70px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            {[
              { label: 'Total Supply', val: 22222, display: '22,222' },
              { label: 'Chain', val: 0, display: 'Solana' },
              { label: 'Tax', val: 0, display: '0%' },
              { label: 'LP', val: 0, display: 'Locked' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(62,207,106,0.05)', border: '1px solid rgba(62,207,106,0.15)',
                borderRadius: 16, padding: '20px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: '#3ecf6a' }}>
                  {i === 0 ? <Counter to={22222} /> : s.display}
                </div>
                <div style={{ fontSize: 11, color: '#777', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section id="story" {...fadeUp} style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 14 }}>
            THE STORY
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>Locked up. Not shut up.</h2>
          
          <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
            Lakito was sentenced to 4 years after being caught in Frankfurt with over 130kg of hashish and grass. 
            But he is no ordinary prisoner — he is a freedom fighter, a modern-day shaman walking the verdant path 
            that Terence McKenna once lit up with his words: the sacred rebellion of the plant against the machinery of control.
          </p>
          
          <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
            From inside an open prison, armed with nothing but a smuggled phone and unbreakable will, 
            he launched $FREELAK — a memecoin born in defiance. 22,222 tokens. No more. No less. 
            A limited sacrament for those who hear the call of the green.
          </p>
          
          <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
            This is more than a coin. It is a signal. A living mycelial network of souls who understand 
            that true freedom is not granted — it is reclaimed. Whoever holds $FREELAK and falls into hardship 
            will not stand alone. The community protects its own. We lift each other. No warrior gets left behind.
          </p>
          
          <p style={{ color: '#888', lineHeight: 1.75, fontStyle: 'italic' }}>
            "One phone, one wallet, 22,222 coins. The rest is Community." — Lakito
          </p>
        </motion.section>

        <motion.section id="tokenomics" {...fadeUp} style={{ background: 'rgba(255,255,255,0.02)', padding: '70px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 14, textAlign: 'center' }}>
              TOKENOMICS
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30, textAlign: 'center' }}>
              Only {TOTAL_SUPPLY} {TICKER}. Ever.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {[
                { icon: '🔒', title: 'Fixed Supply', desc: `${TOTAL_SUPPLY} tokens minted, zero more possible.` },
                { icon: '🌿', title: 'No Tax', desc: '0% buy/sell — pure market, no hidden fees.' },
                { icon: '💧', title: 'LP Locked', desc: 'Liquidity secured — not going anywhere.' },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: 16, padding: '22px 18px' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#d4af37' }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section id="merch" {...fadeUp} style={{ padding: '70px 24px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 14, textAlign: 'center' }}>
            MERCH
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30, textAlign: 'center' }}>
            Wear the rebellion
          </h2>
          <Merch />
        </motion.section>

        <motion.section id="buy" {...fadeUp} style={{ maxWidth: 620, margin: '0 auto', padding: '70px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30 }}>How to buy {TICKER}</h2>
          <div style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            {[
              { n: '1', t: 'Get a Solana wallet', d: 'Phantom or Solflare — download, create, fund with SOL.' },
              { n: '2', t: 'Copy the contract address', d: 'Tap the CA above — verify it matches everywhere before buying.' },
              { n: '3', t: 'Swap on Jupiter', d: `Paste the CA, swap SOL for ${TICKER}, confirm.` },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(62,207,106,0.04)', border: '1px solid rgba(62,207,106,0.12)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 20, color: '#3ecf6a' }}>{s.n}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{s.t}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <motion.a href={BUY_LINK} target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }}
            style={{ display: 'inline-block', marginTop: 30, background: 'linear-gradient(135deg,#3ecf6a,#2a9950)',
              color: '#04220f', fontWeight: 800, padding: '15px 40px', borderRadius: 999, textDecoration: 'none', fontSize: 17 }}>
            Buy {TICKER} on Jupiter →
          </motion.a>
        </motion.section>

        <footer style={{ textAlign: 'center', padding: '50px 20px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
            <a href={X_LINK} target="_blank" rel="noreferrer" style={{ color: '#3ecf6a', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13 }}>X / Twitter</a>
            <a href={TG_LINK} target="_blank" rel="noreferrer" style={{ color: '#3ecf6a', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13 }}>Telegram</a>
          </div>
          <p style={{ fontSize: 11, color: '#555', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            {TICKER} is a memecoin with no intrinsic value or expectation of financial return.
            Not investment advice. Do your own research.
          </p>
          <p style={{ fontSize: 11, color: '#444', marginTop: 14 }}>© {new Date().getFullYear()} FreeLakito · Solana</p>
        </footer>
      </div>
    </>
  );
}
