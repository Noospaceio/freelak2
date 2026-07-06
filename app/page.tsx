'use client';
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// ── EDIT THESE BEFORE DEPLOY ───────────────────────────────────────────────
const TICKER        = '$FREELAK';
const TOTAL_SUPPLY   = '22,222';
const CONTRACT_ADDR  = 'J1fL9JCSczPdRqcsAEkxUdB8Npx8cAuJsbZdwR74zmtG';
const BUY_LINK       = `https://jup.ag/swap/SOL-${CONTRACT_ADDR}`;
const DEXSCREENER    = `https://dexscreener.com/solana/${CONTRACT_ADDR}`;
const X_LINK         = 'https://x.com/FREELAKITO';
const TG_LINK        = 'https://t.me/+6M70BvHV8ywxOTgy';
const CONTACT_EMAIL  = 'FREELAKITO@proton.me';

// ── MERCH / SHOP CONFIG ─────────────────────────────────────────────────────
const SHIRT_PRICE_EUR = 44.99;       // Basispreis pro Shirt
const HOODIE_PRICE_EUR = 79.99;      // Basispreis pro Hoodie
const NACHNAHME_FEE_EUR = 10;        // Aufschlag bei Nachnahme (aktuell inaktiv)
const SOL_EUR_RATE = 65;             // grober Kurs für Anzeige, KEIN Live-Feed — bei Bedarf anpassen
const IBAN           = 'DE00 0000 0000 0000 0000 00'; // ← eintragen (aktuell inaktiv)
const IBAN_HOLDER     = 'Vorname Nachname';             // ← Kontoinhaber eintragen (aktuell inaktiv)
const BTC_WALLET      = 'bc1qc0ypgu2ctjap23rc8ec4afj25pyleh6pk92pma'; // ← BTC-Zahladresse
const SOL_WALLET      = '52Re7asd5AfyA2h6czfiB1LtcX1K31AMsTMyzvjEpSSR'; // ← Solana-Adresse für SOL-Zahlungen
const FREELAK_WALLET  = '52Re7asd5AfyA2h6czfiB1LtcX1K31AMsTMyzvjEpSSR'; // ← selbe Solana-Adresse, empfängt auch $FREELAK

// ── VERSAND ──────────────────────────────────────────────────────────────────
const SHIPPING_NATIONAL_EUR    = 5;   // Deutschland
const SHIPPING_EU_EUR          = 18;  // EU-weit
const SHIPPING_WORLDWIDE_EUR   = 35;  // Rest der Welt

const SHIRTS = [
  { id: 'shirt-cash', name: 'Cash Out', img: '/merch/shirt-cash.jpg', price: SHIRT_PRICE_EUR, type: 'shirt' },
  { id: 'hoodie-openprison', name: 'Open Prison', img: '/merch/hoodie-openprison.jpg', price: HOODIE_PRICE_EUR, type: 'hoodie' },
  { id: 'shirt-community', name: 'Community Protects Its Own', img: '/merch/shirt-community.jpg', price: SHIRT_PRICE_EUR, type: 'shirt' },
  { id: 'hoodie-xyz', name: 'Freelakito Tag', img: '/merch/hoodie-xyz.jpg', price: HOODIE_PRICE_EUR, type: 'hoodie' },
  { id: 'shirt-tag', name: 'Hashtag Freelak', img: '/merch/shirt-tag.jpg', price: SHIRT_PRICE_EUR, type: 'shirt' },
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// ── Globaler Sprach-Switch (EN / DE) ────────────────────────────────────────
type Lang = 'en' | 'de';
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
});
const useLang = () => useContext(LangContext);

// ── Supabase-Client ─────────────────────────────────────────────────────────
// Erwartet ENV-Variablen NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
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
  const { lang } = useLang();
  const FITS = lang === 'de' ? ['Herren', 'Damen'] : ['Men', 'Women'];
  const topRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const prevCartLen = useRef(0);
  const [cart, setCart] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, { fit: string; size: string }>>(
    Object.fromEntries(SHIRTS.map(s => [s.id, { fit: FITS[0], size: 'M' }]))
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payment, setPayment] = useState<'paysafecard' | 'btc' | 'krypto' | 'ueberweisung' | 'nachnahme'>('btc');
  const [kryptoCoin, setKryptoCoin] = useState<'SOL' | 'FREELAK'>('SOL');
  const [shipping, setShipping] = useState<'national' | 'eu' | 'worldwide'>('national');
  const [form, setForm] = useState({ name: '', street: '', zip: '', city: '', country: 'Deutschland', email: '', phone: '', paysafecardCode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ ref: string; total: number; totalSol: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [checkoutOpen, orderResult]);

  useEffect(() => {
    if (cart.length > prevCartLen.current) {
      // kurz warten bis der Warenkorb im DOM steht, dann sanft dorthin ziehen
      setTimeout(() => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    }
    prevCartLen.current = cart.length;
  }, [cart]);

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
  const shippingFee = shipping === 'national' ? SHIPPING_NATIONAL_EUR : shipping === 'eu' ? SHIPPING_EU_EUR : SHIPPING_WORLDWIDE_EUR;
  const total = subtotal + nachnahmeFee + shippingFee;
  const totalSol = (total / SOL_EUR_RATE).toFixed(3);

  const canSubmit = form.name && form.street && form.zip && form.city && form.email &&
    (payment !== 'nachnahme' || form.phone) &&
    (payment !== 'paysafecard' || form.paysafecardCode) &&
    cart.length > 0;

  const submitOrder = async () => {
    if (!canSubmit) { setError(lang === 'de' ? 'Bitte fülle alle Pflichtfelder aus.' : 'Please fill in all required fields.'); return; }
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
          paysafecard_code: payment === 'paysafecard' ? form.paysafecardCode : null,
          shipping_region: shipping,
          shipping_fee: shippingFee,
          payment_status: 'pending',
          total_amount: total,
        });
        if (dbError) throw dbError;
      }
      setOrderResult({ ref, total, totalSol });
      setCart([]);
    } catch (e) {
      setError(lang === 'de'
        ? 'Etwas ist schiefgelaufen. Bitte versuch es erneut oder melde dich direkt über X/Telegram.'
        : 'Something went wrong. Please try again or reach out directly on X/Telegram.');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div ref={topRef} style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', scrollMarginTop: 80 }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>✓</div>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{lang === 'de' ? 'Bestellung erhalten' : 'Order received'}</h3>
        <p style={{ color: '#aaa', marginBottom: 24 }}>
          {lang === 'de' ? 'Deine Bestellnummer: ' : 'Your order number: '}<strong style={{ color: '#3ecf6a', fontFamily: 'monospace' }}>{orderResult.ref}</strong><br />
          {lang === 'de' ? 'Eine Bestätigung wird an deine E-Mail gesendet.' : 'A confirmation will be sent to your email.'}
        </p>

        {payment === 'paysafecard' && (
          <div style={{ background: 'rgba(62,207,106,0.05)', border: '1px solid rgba(62,207,106,0.2)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>{lang === 'de' ? 'Betrag:' : 'Amount:'}</strong> €{orderResult.total.toFixed(2)}</div>
            <div style={{ wordBreak: 'break-all' }}><strong>PaysafeCard-Code:</strong> {form.paysafecardCode}</div>
            <div style={{ color: '#888', marginTop: 8 }}>
              {lang === 'de'
                ? `Wir prüfen den Code und bestätigen deine Bestellung ${orderResult.ref} per E-Mail, sobald der Betrag verifiziert ist.`
                : `We'll verify the code and confirm your order ${orderResult.ref} by email once the amount checks out.`}
            </div>
          </div>
        )}

        {payment === 'btc' && (
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>{lang === 'de' ? 'Betrag:' : 'Amount:'}</strong> €{orderResult.total.toFixed(2)} {lang === 'de' ? '(in BTC-Gegenwert)' : '(BTC equivalent)'}</div>
            <div style={{ wordBreak: 'break-all' }}><strong>BTC-{lang === 'de' ? 'Adresse' : 'Address'}:</strong> {BTC_WALLET}</div>
            <div style={{ color: '#888', marginTop: 8 }}>
              {lang === 'de'
                ? `Schick uns nach der Zahlung einen Screenshot mit der Bestellnummer ${orderResult.ref} über X oder Telegram, damit wir sie schnell zuordnen können.`
                : `After paying, send us a screenshot with order number ${orderResult.ref} via X or Telegram so we can match it quickly.`}
            </div>
          </div>
        )}

        {payment === 'ueberweisung' && (
          <div style={{ background: 'rgba(62,207,106,0.05)', border: '1px solid rgba(62,207,106,0.2)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>IBAN:</strong> {IBAN}</div>
            <div><strong>{lang === 'de' ? 'Empfänger:' : 'Recipient:'}</strong> {IBAN_HOLDER}</div>
            <div><strong>{lang === 'de' ? 'Betrag:' : 'Amount:'}</strong> €{orderResult.total.toFixed(2)}</div>
            <div><strong>{lang === 'de' ? 'Verwendungszweck:' : 'Reference:'}</strong> {orderResult.ref}</div>
            <div style={{ color: '#888', marginTop: 8 }}>
              {lang === 'de'
                ? 'Bitte gib die Bestellnummer als Verwendungszweck an — sonst können wir deine Zahlung nicht zuordnen.'
                : "Please make sure to include the order number as the payment reference — otherwise we can't match your payment."}
            </div>
          </div>
        )}

        {payment === 'krypto' && (
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div><strong>{lang === 'de' ? 'Zahlung in:' : 'Paying in:'}</strong> {kryptoCoin === 'SOL' ? 'Solana (SOL)' : TICKER}</div>
            <div style={{ wordBreak: 'break-all' }}><strong>{lang === 'de' ? 'Adresse:' : 'Address:'}</strong> {kryptoCoin === 'SOL' ? SOL_WALLET : FREELAK_WALLET}</div>
            {kryptoCoin === 'SOL' && (
              <div>
                <strong>{lang === 'de' ? 'Ungefährer Betrag:' : 'Approx. amount:'}</strong> ~{orderResult.totalSol} SOL
                {lang === 'de' ? ' (Kurs schwankt — aktuellen Preis gerne selbst prüfen)' : ' (rate fluctuates — feel free to double-check the current price)'}
              </div>
            )}
            <div style={{ color: '#888', marginTop: 8 }}>
              {lang === 'de'
                ? `Schick uns nach der Zahlung einen Screenshot mit der Bestellnummer ${orderResult.ref} über X oder Telegram, damit wir sie schnell zuordnen können.`
                : `After paying, send us a screenshot with order number ${orderResult.ref} via X or Telegram so we can match it quickly.`}
            </div>
          </div>
        )}

        {payment === 'nachnahme' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
            <div>
              {lang === 'de' ? (
                <>Nichts weiter zu tun — du zahlst <strong>€{orderResult.total.toFixed(2)}</strong> (inkl. €{NACHNAHME_FEE_EUR} Nachnahme-Gebühr) bar an den Boten.</>
              ) : (
                <>Nothing else to do — you pay <strong>€{orderResult.total.toFixed(2)}</strong> (incl. €{NACHNAHME_FEE_EUR} COD fee) in cash to the courier.</>
              )}
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: '#888', marginTop: 20 }}>
          {lang === 'de' ? 'Fragen oder stornieren? Schreib uns: ' : 'Questions or want to cancel? Email us: '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#3ecf6a', textDecoration: 'none' }}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    );
  }

  return (
    <div ref={topRef} style={{ maxWidth: 900, margin: '0 auto', scrollMarginTop: 80 }}>
      {!checkoutOpen ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {SHIRTS.map(shirt => {
              const sel = selections[shirt.id];
              return (
                <div key={shirt.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: 16 }}>
                  <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 12, overflow: 'hidden', position: 'relative' }}>
                    <img src={shirt.img} alt={shirt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                      background: 'rgba(6,10,6,0.75)', border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37',
                    }}>
                      {shirt.type === 'hoodie' ? (lang === 'de' ? 'Hoodie' : 'Hoodie') : (lang === 'de' ? 'Shirt' : 'Shirt')}
                    </span>
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
                  }}>{lang === 'de' ? 'In den Warenkorb' : 'Add to cart'}</button>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div ref={cartRef} style={{ marginTop: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 16, padding: 20, scrollMarginTop: 80 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{lang === 'de' ? 'Warenkorb' : 'Cart'}</div>
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
                <span>{lang === 'de' ? 'Zwischensumme' : 'Subtotal'}</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <button onClick={() => setCheckoutOpen(true)} style={{
                width: '100%', marginTop: 16, padding: '13px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800, fontSize: 15,
              }}>{lang === 'de' ? 'Zur Kasse →' : 'Checkout →'}</button>
            </div>
          )}
        </>
      ) : (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>{lang === 'de' ? '← zurück' : '← back'}</button>

          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {(lang === 'de' ? [
              ['name', 'Name*'], ['street', 'Straße + Hausnummer*'], ['zip', 'PLZ*'], ['city', 'Stadt*'],
              ['country', 'Land*'], ['email', 'E-Mail*'], ['phone', `Telefon${payment === 'nachnahme' ? '*' : ' (optional)'}`],
            ] : [
              ['name', 'Name*'], ['street', 'Street + house number*'], ['zip', 'ZIP code*'], ['city', 'City*'],
              ['country', 'Country*'], ['email', 'Email*'], ['phone', `Phone${payment === 'nachnahme' ? '*' : ' (optional)'}`],
            ]).map(([key, label]) => (
              <input key={key} placeholder={label} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.03)', color: '#eee', fontSize: 14 }} />
            ))}
          </div>

          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, letterSpacing: '0.05em', color: '#d4af37' }}>{lang === 'de' ? 'VERSAND' : 'SHIPPING'}</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {(lang === 'de' ? [
              { id: 'national', label: 'Deutschland', fee: SHIPPING_NATIONAL_EUR },
              { id: 'eu', label: 'EU-weit', fee: SHIPPING_EU_EUR },
              { id: 'worldwide', label: 'Weltweit', fee: SHIPPING_WORLDWIDE_EUR },
            ] : [
              { id: 'national', label: 'Germany', fee: SHIPPING_NATIONAL_EUR },
              { id: 'eu', label: 'EU-wide', fee: SHIPPING_EU_EUR },
              { id: 'worldwide', label: 'Worldwide', fee: SHIPPING_WORLDWIDE_EUR },
            ]).map(s => (
              <label key={s.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${shipping === s.id ? '#3ecf6a' : 'rgba(255,255,255,0.12)'}`,
                background: shipping === s.id ? 'rgba(62,207,106,0.08)' : 'transparent', fontSize: 14,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" checked={shipping === s.id} onChange={() => setShipping(s.id as any)} />
                  {s.label}
                </span>
                <span style={{ color: '#888', fontSize: 13 }}>+€{s.fee.toFixed(2)}</span>
              </label>
            ))}
          </div>

          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, letterSpacing: '0.05em', color: '#d4af37' }}>{lang === 'de' ? 'ZAHLUNGSMETHODE' : 'PAYMENT METHOD'}</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
            {(lang === 'de' ? [
              { id: 'paysafecard', label: 'PaysafeCard (Code übermitteln)', active: true },
              { id: 'btc', label: 'Bitcoin (BTC)', active: true },
              { id: 'krypto', label: 'Solana (SOL) oder $FREELAK', active: true },
            ] : [
              { id: 'paysafecard', label: 'PaysafeCard (submit code)', active: true },
              { id: 'btc', label: 'Bitcoin (BTC)', active: true },
              { id: 'krypto', label: 'Solana (SOL) or $FREELAK', active: true },
            ]).map(p => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${payment === p.id ? '#3ecf6a' : 'rgba(255,255,255,0.12)'}`,
                background: payment === p.id ? 'rgba(62,207,106,0.08)' : 'transparent', fontSize: 14,
              }}>
                <input type="radio" checked={payment === p.id} onChange={() => setPayment(p.id as any)} />
                {p.label}
              </label>
            ))}

            {/* Aktuell inaktive Zahlungsmethoden — Code bleibt erhalten, nur zum Reaktivieren `active: true` setzen und aus der Disabled-Liste lösen */}
            {(lang === 'de' ? [
              { id: 'ueberweisung', label: 'Überweisung (SEPA)' },
              { id: 'nachnahme', label: `Nachnahme (+${NACHNAHME_FEE_EUR}€ Gebühr)` },
            ] : [
              { id: 'ueberweisung', label: 'Bank transfer (SEPA)' },
              { id: 'nachnahme', label: `Cash on delivery (+€${NACHNAHME_FEE_EUR} fee)` },
            ]).map(p => (
              <label key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, cursor: 'not-allowed',
                border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', fontSize: 14, color: '#555',
              }}>
                <input type="radio" disabled checked={false} />
                {p.label}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>{lang === 'de' ? 'bald verfügbar' : 'coming soon'}</span>
              </label>
            ))}
          </div>

          {payment === 'paysafecard' && (
            <div style={{ marginBottom: 20 }}>
              <input placeholder={lang === 'de' ? 'PaysafeCard-Code*' : 'PaysafeCard code*'} value={form.paysafecardCode}
                onChange={e => setForm(f => ({ ...f, paysafecardCode: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.03)', color: '#eee', fontSize: 14 }} />
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                {lang === 'de'
                  ? `Betrag: €${(subtotal + shippingFee).toFixed(2)} als PaysafeCard-Code. Code hier eintragen, wir bestätigen nach Prüfung.`
                  : `Amount: €${(subtotal + shippingFee).toFixed(2)} as a PaysafeCard code. Enter the code here — we'll confirm once verified.`}
              </div>
            </div>
          )}

          {payment === 'btc' && (
            <div style={{ marginBottom: 20, fontSize: 12, color: '#888', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '11px 14px' }}>
              {lang === 'de' ? 'BTC-Adresse: ' : 'BTC address: '}<span style={{ color: '#d4af37', wordBreak: 'break-all' }}>{BTC_WALLET}</span>
            </div>
          )}

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
              <span>{lang === 'de' ? 'Zwischensumme' : 'Subtotal'}</span><span>€{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999', marginBottom: 4 }}>
              <span>{lang === 'de' ? 'Versand' : 'Shipping'}</span><span>+€{shippingFee.toFixed(2)}</span>
            </div>
            {payment === 'nachnahme' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999', marginBottom: 4 }}>
                <span>{lang === 'de' ? 'Nachnahme-Gebühr' : 'COD fee'}</span><span>+€{NACHNAHME_FEE_EUR.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, marginTop: 6 }}>
              <span>{lang === 'de' ? 'Gesamt' : 'Total'}</span><span style={{ color: '#3ecf6a' }}>€{total.toFixed(2)}</span>
            </div>
          </div>

          {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button onClick={submitOrder} disabled={submitting} style={{
            width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', cursor: submitting ? 'default' : 'pointer',
            background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800, fontSize: 15,
            opacity: submitting ? 0.6 : 1,
          }}>{submitting ? (lang === 'de' ? 'Wird gesendet…' : 'Sending…') : (lang === 'de' ? 'Bestellung aufgeben' : 'Place order')}</button>
        </div>
      )}
    </div>
  );
}

// ── Get Help ─────────────────────────────────────────────────────────────────
const HELP_CONTENT = {
  en: {
    eyebrow: 'NOT ALONE',
    title: 'Need help?',
    intro: "If you're facing legal trouble over cannabis, you're not alone. These are real organizations that can help — this is not legal advice, just pointers to people who actually can give it.",
    resources: [
      {
        name: 'Grüne Hilfe Netzwerk e.V.',
        desc: 'National self-help network for cannabis & law — including support for people currently incarcerated.',
        contact: 'berlin@gruene-hilfe.de · 030 2424827',
        link: 'https://www.gruene-hilfe.de/',
      },
      {
        name: 'Deutscher Hanfverband (DHV)',
        desc: 'Free initial legal consultation with a lawyer for supporters, arranged through their contact form.',
        contact: 'kontakt@hanfverband.de',
        link: 'https://hanfverband.de/hanfverband/kontakt',
      },
      {
        name: 'Hanf Museum Berlin',
        desc: 'Free in-person legal consultation with a defense lawyer, every Thursday 6–8pm. Berlin only, registration required.',
        contact: 'berlin@gruene-hilfe.de · 030 2424827',
        link: 'https://www.hanfmuseum.de/hanf-rechtsberatung-im-hanf-museum-berlin',
      },
    ],
    disclaimer: 'This is not legal advice. Always verify current contact details before relying on them.',
  },
  de: {
    eyebrow: 'NICHT ALLEIN',
    title: 'Brauchst du Hilfe?',
    intro: 'Wenn du selbst Ärger mit dem BtMG hast, bist du nicht allein. Das sind echte Anlaufstellen, die helfen können — keine Rechtsberatung, nur Vermittlung an Leute, die das wirklich dürfen.',
    resources: [
      {
        name: 'Grüne Hilfe Netzwerk e.V.',
        desc: 'Bundesweites Selbsthilfenetzwerk zu Cannabis & Recht — inklusive Gefangenenbetreuung für Menschen, die aktuell im Vollzug sitzen.',
        contact: 'berlin@gruene-hilfe.de · 030 2424827',
        link: 'https://www.gruene-hilfe.de/',
      },
      {
        name: 'Deutscher Hanfverband (DHV)',
        desc: 'Kostenlose Erstberatung mit einem Anwalt für Unterstützer, vermittelt über das Kontaktformular.',
        contact: 'kontakt@hanfverband.de',
        link: 'https://hanfverband.de/hanfverband/kontakt',
      },
      {
        name: 'Hanf Museum Berlin',
        desc: 'Kostenlose Rechtsberatung vor Ort durch einen Strafverteidiger, jeden Donnerstag 18–20 Uhr. Nur Berlin, Anmeldung nötig.',
        contact: 'berlin@gruene-hilfe.de · 030 2424827',
        link: 'https://www.hanfmuseum.de/hanf-rechtsberatung-im-hanf-museum-berlin',
      },
    ],
    disclaimer: 'Das ist keine Rechtsberatung. Bitte aktuelle Kontaktdaten vor Verlass immer selbst prüfen.',
  },
};

function GetHelp() {
  const { lang } = useLang();
  const t = HELP_CONTENT[lang];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 14, textAlign: 'center' }}>
        {t.eyebrow}
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>{t.title}</h2>
      <p style={{ color: '#999', fontSize: 14, lineHeight: 1.7, textAlign: 'center', maxWidth: 560, margin: '0 auto 30px' }}>
        {t.intro}
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
        {t.resources.map(r => (
          <a key={r.name} href={r.link} target="_blank" rel="noreferrer" style={{
            display: 'block', textDecoration: 'none', color: 'inherit',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.name}</div>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6, marginBottom: 8 }}>{r.desc}</div>
            <div style={{ fontSize: 12, color: '#3ecf6a', fontFamily: 'monospace' }}>{r.contact}</div>
          </a>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
        {t.disclaimer}
      </p>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = lang === 'de'
    ? [
        { id: 'story', label: 'Story' },
        { id: 'tokenomics', label: 'Tokenomics' },
        { id: 'merch', label: 'Merch' },
        { id: 'buy', label: 'Kaufen' },
        { id: 'help', label: 'Hilfe' },
      ]
    : [
        { id: 'story', label: 'Story' },
        { id: 'tokenomics', label: 'Tokenomics' },
        { id: 'merch', label: 'Merch' },
        { id: 'buy', label: 'Buy' },
        { id: 'help', label: 'Help' },
      ];
  const LangSwitch = ({ compact = false }: { compact?: boolean }) => (
    <div style={{ display: 'flex', gap: 4 }}>
      {(['en', 'de'] as const).map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding: compact ? '5px 10px' : '4px 10px', borderRadius: 999, cursor: 'pointer',
          fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
          border: `1px solid ${lang === l ? '#3ecf6a' : 'rgba(255,255,255,0.15)'}`,
          background: lang === l ? 'rgba(62,207,106,0.12)' : 'transparent',
          color: lang === l ? '#3ecf6a' : '#888',
        }}>{l.toUpperCase()}</button>
      ))}
    </div>
  );
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
        <div className="fl-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)} style={{
              background: 'none', border: '1px solid transparent', borderRadius: 99,
              padding: '5px 14px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12,
              color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
            }}>{l.label}</button>
          ))}
          <span style={{ marginLeft: 6 }}><LangSwitch /></span>
        </div>
        <div className="fl-nav-cta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href={BUY_LINK} target="_blank" rel="noreferrer" style={{
            background: 'rgba(62,207,106,0.14)', border: '1px solid rgba(62,207,106,0.4)',
            borderRadius: 99, padding: '6px 18px', fontFamily: 'monospace', fontSize: 12,
            fontWeight: 700, color: '#3ecf6a', textDecoration: 'none', letterSpacing: '0.08em',
          }}>{lang === 'de' ? `${TICKER} kaufen →` : `Buy ${TICKER} →`}</a>
        </div>
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
          <div style={{ padding: '4px 16px 8px' }}><LangSwitch compact /></div>
          <a href={BUY_LINK} target="_blank" rel="noreferrer" style={{
            display: 'block', marginTop: 8, background: 'rgba(62,207,106,0.12)',
            border: '1px solid rgba(62,207,106,0.35)', borderRadius: 10, padding: '12px 16px',
            fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#3ecf6a', textAlign: 'center', textDecoration: 'none',
          }}>{lang === 'de' ? `${TICKER} kaufen →` : `Buy ${TICKER} →`}</a>
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
  const [lang, setLang] = useState<Lang>('en');
  const { copied, copy } = useCopy();
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6 },
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
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
              {lang === 'de' ? 'GESTARTET AUS DEM OFFENEN VOLLZUG · SOLANA' : 'LAUNCHED FROM OPEN PRISON · SOLANA'}
            </div>
            <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4.2rem)', fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>
              {TICKER}
            </h1>
            <p style={{ maxWidth: 560, margin: '0 auto', fontSize: 18, color: '#aaa', lineHeight: 1.6 }}>
              {lang === 'de'
                ? 'Ein Memecoin mit einer echten Geschichte dahinter. Ein Typ, ein Handy, eine Chance — geschmuggelt hinter die Mauern eines offenen Vollzugs nach einer Cannabis-Verurteilung.'
                : 'A meme coin with a real story behind it. One guy, one phone, one chance — smuggled from behind the wall of an open prison after a cannabis conviction.'}
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}>
              <motion.a href={BUY_LINK} target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                style={{ background: 'linear-gradient(135deg,#3ecf6a,#2a9950)', color: '#04220f', fontWeight: 800,
                  padding: '14px 34px', borderRadius: 999, textDecoration: 'none', fontSize: 16 }}>
                {lang === 'de' ? `${TICKER} kaufen →` : `Buy ${TICKER} →`}
              </motion.a>
              <motion.a href={DEXSCREENER} target="_blank" rel="noreferrer" whileHover={{ scale: 1.05 }}
                style={{ border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37', fontWeight: 700,
                  padding: '14px 30px', borderRadius: 999, textDecoration: 'none', fontSize: 16 }}>
                {lang === 'de' ? 'Chart ansehen 📈' : 'View Chart 📈'}
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
              <span style={{ color: copied ? '#3ecf6a' : '#666' }}>{copied ? (lang === 'de' ? '✓ kopiert' : '✓ copied') : '⧉'}</span>
            </div>
          </motion.div>
        </section>

        {/* Der Rest (Stats, Story, Tokenomics, Buy, Footer) bleibt unverändert */}
        <motion.section {...fadeUp} style={{ padding: '20px 20px 70px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            {(lang === 'de' ? [
              { label: 'Gesamtangebot', val: 22222, display: '22.222' },
              { label: 'Chain', val: 0, display: 'Solana' },
              { label: 'Steuer', val: 0, display: '0%' },
              { label: 'LP', val: 0, display: 'Gesperrt' },
            ] : [
              { label: 'Total Supply', val: 22222, display: '22,222' },
              { label: 'Chain', val: 0, display: 'Solana' },
              { label: 'Tax', val: 0, display: '0%' },
              { label: 'LP', val: 0, display: 'Locked' },
            ]).map((s, i) => (
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
            {lang === 'de' ? 'DIE GESCHICHTE' : 'THE STORY'}
          </div>
          {lang === 'de' ? (
            <>
              <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>Weggesperrt. Nicht mundtot.</h2>

              <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
                Lakito wurde zu 4 Jahren verurteilt, nachdem er in Frankfurt mit über 130kg Haschisch und Gras
                erwischt wurde. Doch er ist kein gewöhnlicher Gefangener — er ist ein Freiheitskämpfer, ein
                moderner Schamane auf dem grünen Pfad, den einst Terence McKenna mit seinen Worten erleuchtet
                hat: die heilige Rebellion der Pflanze gegen die Maschinerie der Kontrolle.
              </p>

              <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
                Von innen im offenen Vollzug, bewaffnet mit nichts außer einem geschmuggelten Handy und
                unbeugsamem Willen, startete er $FREELAK — einen Memecoin, geboren aus Widerstand. 22.222
                Token. Nicht mehr. Nicht weniger. Ein limitiertes Sakrament für alle, die den Ruf des Grünen hören.
              </p>

              <p style={{ color: '#bbb', lineHeight: 1.75, marginBottom: 20 }}>
                Das ist mehr als ein Coin. Es ist ein Signal. Ein lebendiges myzelartiges Netzwerk von Seelen,
                die verstehen, dass wahre Freiheit nicht gewährt, sondern zurückerobert wird. Wer $FREELAK
                hält und in Not gerät, steht nicht allein. Die Community schützt ihre eigenen Leute. Wir heben
                einander auf. Kein Kämpfer wird zurückgelassen.
              </p>

              <p style={{ color: '#888', lineHeight: 1.75, fontStyle: 'italic' }}>
                "Ein Handy, eine Wallet, 22.222 Coins. Der Rest ist Community." — Lakito
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </motion.section>

        <motion.section id="tokenomics" {...fadeUp} style={{ background: 'rgba(255,255,255,0.02)', padding: '70px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.3em', color: '#d4af37', marginBottom: 14, textAlign: 'center' }}>
              TOKENOMICS
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30, textAlign: 'center' }}>
              {lang === 'de' ? `Nur ${TOTAL_SUPPLY} ${TICKER}. Für immer.` : `Only ${TOTAL_SUPPLY} ${TICKER}. Ever.`}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {(lang === 'de' ? [
                { icon: '🔒', title: 'Festes Angebot', desc: `${TOTAL_SUPPLY} Token geprägt, keine weiteren möglich.` },
                { icon: '🌿', title: 'Keine Steuer', desc: '0% Kauf/Verkauf — reiner Markt, keine versteckten Gebühren.' },
                { icon: '💧', title: 'LP gesperrt', desc: 'Liquidität gesichert — geht nirgendwohin.' },
              ] : [
                { icon: '🔒', title: 'Fixed Supply', desc: `${TOTAL_SUPPLY} tokens minted, zero more possible.` },
                { icon: '🌿', title: 'No Tax', desc: '0% buy/sell — pure market, no hidden fees.' },
                { icon: '💧', title: 'LP Locked', desc: 'Liquidity secured — not going anywhere.' },
              ]).map((c, i) => (
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
            {lang === 'de' ? 'Trag die Rebellion' : 'Wear the rebellion'}
          </h2>
          <Merch />
        </motion.section>

        <motion.section id="buy" {...fadeUp} style={{ maxWidth: 620, margin: '0 auto', padding: '70px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 30 }}>
            {lang === 'de' ? `Wie man ${TICKER} kauft` : `How to buy ${TICKER}`}
          </h2>
          <div style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
            {(lang === 'de' ? [
              { n: '1', t: 'Hol dir eine Solana-Wallet', d: 'Phantom oder Solflare — herunterladen, erstellen, mit SOL aufladen.' },
              { n: '2', t: 'Kopiere die Contract-Adresse', d: 'Tippe oben auf die CA — prüfe vor dem Kauf, dass sie überall übereinstimmt.' },
              { n: '3', t: 'Tausche auf Jupiter', d: `CA einfügen, SOL gegen ${TICKER} tauschen, bestätigen.` },
            ] : [
              { n: '1', t: 'Get a Solana wallet', d: 'Phantom or Solflare — download, create, fund with SOL.' },
              { n: '2', t: 'Copy the contract address', d: 'Tap the CA above — verify it matches everywhere before buying.' },
              { n: '3', t: 'Swap on Jupiter', d: `Paste the CA, swap SOL for ${TICKER}, confirm.` },
            ]).map(s => (
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
            {lang === 'de' ? `${TICKER} auf Jupiter kaufen →` : `Buy ${TICKER} on Jupiter →`}
          </motion.a>
        </motion.section>

        <motion.section id="help" {...fadeUp} style={{ padding: '70px 24px' }}>
          <GetHelp />
        </motion.section>

        <footer style={{ textAlign: 'center', padding: '50px 20px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
            <a href={X_LINK} target="_blank" rel="noreferrer" style={{ color: '#3ecf6a', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13 }}>X / Twitter</a>
            <a href={TG_LINK} target="_blank" rel="noreferrer" style={{ color: '#3ecf6a', textDecoration: 'none', fontFamily: 'monospace', fontSize: 13 }}>Telegram</a>
          </div>
          <p style={{ fontSize: 11, color: '#555', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            {lang === 'de'
              ? `${TICKER} ist ein Memecoin ohne inneren Wert oder Gewinnerwartung. Keine Anlageberatung. Mach deine eigene Recherche.`
              : `${TICKER} is a memecoin with no intrinsic value or expectation of financial return. Not investment advice. Do your own research.`}
          </p>
          <p style={{ fontSize: 11, color: '#444', marginTop: 14 }}>© {new Date().getFullYear()} FreeLakito · Solana</p>
        </footer>
      </div>
    </LangContext.Provider>
  );
}
