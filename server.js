const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'doorsteppers2025';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Submit waitlist entry
app.post('/api/waitlist', (req, res) => {
  const { fullName, email, location, services, wantToBeSteper, customerType, wouldPay } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const existing = db.prepare('SELECT id FROM waitlist WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'This email is already on the waitlist!' });
  }

  const stmt = db.prepare(`
    INSERT INTO waitlist (full_name, email, location, services, want_to_be_stepper, customer_type, would_pay, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(
    fullName.trim(),
    email.trim().toLowerCase(),
    location || '',
    Array.isArray(services) ? services.join(', ') : (services || ''),
    wantToBeSteper ? 1 : 0,
    customerType || '',
    wouldPay || ''
  );

  res.json({ success: true, message: "You're on the list! We'll reach out soon." });
});

// Admin: view all responses (password protected)
app.get('/api/admin/responses', (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const rows = db.prepare('SELECT * FROM waitlist ORDER BY submitted_at DESC').all();
  res.json({ total: rows.length, responses: rows });
});

// Admin: export CSV
app.get('/api/admin/export', (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send('Unauthorized');
  }
  const rows = db.prepare('SELECT * FROM waitlist ORDER BY submitted_at DESC').all();
  const headers = ['ID', 'Full Name', 'Email', 'Location', 'Services', 'Wants to be Stepper', 'Customer Type', 'Would Pay', 'Submitted At'];
  const csvRows = rows.map(r => [
    r.id, r.full_name, r.email, r.location, r.services,
    r.want_to_be_stepper ? 'Yes' : 'No',
    r.customer_type, r.would_pay, r.submitted_at
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="doorsteppers-waitlist.csv"');
  res.send(csv);
});

// Public count (for hero counter)
app.get('/api/count', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM waitlist').get();
  res.json({ count: row.count });
});

// Admin dashboard page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`DOORSTEPPERS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
