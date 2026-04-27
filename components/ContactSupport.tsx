import React, { useState } from 'react';
import { UserProfile } from '../types';

// Replace with your Formspree form ID from https://formspree.io
// Create a free account → New Form → copy the ID (e.g. "xpwzgkdo")
const FORMSPREE_ID = 'meevporj';

const PHONE = '+91 9825319795';
const EMAIL = 'cogriva@manthank.com';

const FAQS = [
  { q: 'My AI feature is not working', a: 'Check your internet connection. If the problem persists, the service may be temporarily down. Try again in a few minutes or contact us.' },
  { q: 'I lost my progress or data', a: 'Your data is saved to the cloud. Try signing out and back in. If data is still missing, email us with your account email and we\'ll restore it.' },
  { q: 'I forgot my password', a: 'On the login screen, tap "Forgot password?" and enter your email. You\'ll receive a reset link within a minute.' },
  { q: 'How do I change my grade / class?', a: 'Go to Profile (person icon in the sidebar) and tap Edit. You can update your grade and name there.' },
  { q: 'Can I use CogniStruct offline?', a: 'AI features require an internet connection. Your saved chapters and flashcards are available, but generation features need connectivity.' },
];

interface Props {
  profile?: UserProfile | null;
}

const ContactSupport: React.FC<Props> = ({ profile }) => {
  const [name,    setName]    = useState(profile?.full_name || '');
  const [email,   setEmail]   = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true); setError('');

    if (FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
      // Fallback: open mailto if Formspree not configured
      const body = encodeURIComponent(`Name: ${name}\n\n${message}`);
      const sub  = encodeURIComponent(subject || 'CogniStruct Support Request');
      window.open(`mailto:${EMAIL}?subject=${sub}&body=${body}`);
      setSending(false);
      return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, subject: subject || 'CogniStruct Support', message }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch {
      setError('Could not send your message. Please email us directly at ' + EMAIL);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl text-on-surface mb-1">Contact & Support</h2>
        <p className="text-secondary text-sm">We're here to help. Reach out anytime.</p>
      </div>

      {/* Quick contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href={`tel:${PHONE.replace(/\s/g, '')}`}
          className="flex items-center gap-4 p-5 rounded-2xl bg-white transition-all hover:shadow-card active:scale-[0.98]"
          style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}
        >
          <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center shadow-glow shrink-0">
            <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
          </div>
          <div>
            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-0.5">Call Us</p>
            <p className="font-bold text-on-surface text-sm">{PHONE}</p>
            <p className="text-xs text-secondary mt-0.5">Mon–Sat, 9 AM – 6 PM IST</p>
          </div>
        </a>

        <a
          href={`mailto:${EMAIL}`}
          className="flex items-center gap-4 p-5 rounded-2xl bg-white transition-all hover:shadow-card active:scale-[0.98]"
          style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fde8de' }}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#c85b32', fontVariationSettings: "'FILL' 1" }}>mail</span>
          </div>
          <div>
            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-0.5">Email Us</p>
            <p className="font-bold text-on-surface text-sm">{EMAIL}</p>
            <p className="text-xs text-secondary mt-0.5">We reply within 24 hours</p>
          </div>
        </a>
      </div>

      {/* Message form */}
      <div className="rounded-2xl bg-white p-6" style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}>
        <h3 className="font-headline text-xl text-on-surface mb-1">Send a Message</h3>
        <p className="text-secondary text-xs mb-5">Describe your issue and we'll get back to you.</p>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 primary-gradient rounded-full flex items-center justify-center mb-4 shadow-glow">
              <span className="material-symbols-outlined text-white text-[28px]">check_circle</span>
            </div>
            <h4 className="font-headline text-xl text-on-surface mb-2">Message Sent!</h4>
            <p className="text-secondary text-sm mb-5">We'll reply to your email within 24 hours.</p>
            <button
              onClick={() => setSent(false)}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-primary bg-primary-fixed"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-error-container rounded-xl flex items-start gap-3 text-sm text-on-error-container">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 ml-1">Your Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Manthan"
                  className="w-full px-4 py-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  style={{ background: '#f7f9fe', border: '1px solid rgba(199,196,216,0.3)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 ml-1">Reply Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  style={{ background: '#f7f9fe', border: '1px solid rgba(199,196,216,0.3)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 ml-1">Subject</label>
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mind map not loading"
                className="w-full px-4 py-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                style={{ background: '#f7f9fe', border: '1px solid rgba(199,196,216,0.3)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5 ml-1">Message <span className="text-error">*</span></label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                required rows={4}
                placeholder="Describe your problem in detail…"
                className="w-full px-4 py-3 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                style={{ background: '#f7f9fe', border: '1px solid rgba(199,196,216,0.3)' }}
              />
            </div>

            <button
              type="submit" disabled={sending || !message.trim()}
              className="w-full py-3.5 primary-gradient text-on-primary font-bold rounded-xl shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending
                ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Sending…</>
                : <><span className="material-symbols-outlined text-[18px]">send</span> Send Message</>
              }
            </button>
          </form>
        )}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl bg-white p-6" style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}>
        <h3 className="font-headline text-xl text-on-surface mb-4">Common Questions</h3>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#f7f9fe' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-semibold text-on-surface">{faq.q}</span>
                <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 ml-2 transition-transform duration-200"
                  style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-secondary leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ContactSupport;
