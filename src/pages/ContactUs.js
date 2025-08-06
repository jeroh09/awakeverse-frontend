// src/pages/ContactUs.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://api.awakeverse.com'}/api/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error sending message.');
      }
      setStatus('Thank you! Your message has been sent.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Message</label>
          <textarea
            name="message"
            rows={5}
            value={form.message}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
          {errors.message && <div style={{ color: 'red' }}>{errors.message}</div>}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
      <button
        onClick={() => navigate(-1)}
        disabled={loading}
        style={{ marginTop: '1rem', padding: '0.5rem', cursor: 'pointer' }}
      >
        Back
      </button>
    </div>
  );
}
