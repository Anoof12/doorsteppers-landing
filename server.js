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

// TEMP: One-time seed endpoint — remove after use
app.post('/api/seed', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });

  const entries = [
    { full_name: 'Ahmad Fadzillah bin Razali', email: 'ahmad.fadzillah@gmail.com',      location: 'Cheras, Kuala Lumpur',        services: 'Food delivery, Grocery shopping',             want_to_be_stepper: 0, customer_type: 'busy_professional', would_pay: 'Yes, definitely',           submitted_at: '2025-05-17 09:14:32' },
    { full_name: 'Mei Ling Tan',               email: 'meilingt92@hotmail.com',           location: 'Mont Kiara, Kuala Lumpur',     services: 'Grocery shopping, Personal errands',          want_to_be_stepper: 0, customer_type: 'parent',            would_pay: 'Yes, definitely',           submitted_at: '2025-05-17 14:28:05' },
    { full_name: 'Priya Krishnamurthy',        email: 'priya.krishna@yahoo.com',          location: 'Bangsar, Kuala Lumpur',        services: 'Pharmacy / medical pickup, Personal errands', want_to_be_stepper: 0, customer_type: 'busy_professional', would_pay: 'Maybe, depends on price',   submitted_at: '2025-05-18 08:52:17' },
    { full_name: 'Syafiq Amirul bin Hassan',   email: 'syafiqamirul@gmail.com',           location: 'Setapak, Kuala Lumpur',        services: 'Food delivery',                               want_to_be_stepper: 1, customer_type: 'student',           would_pay: 'Maybe, depends on price',   submitted_at: '2025-05-18 19:03:44' },
    { full_name: 'Jessica Wong Xin Yi',        email: 'jessicawxy@gmail.com',             location: 'KLCC, Kuala Lumpur',           services: 'Gift buying, Personal errands',               want_to_be_stepper: 0, customer_type: 'expat',             would_pay: 'Yes, definitely',           submitted_at: '2025-05-19 11:37:59' },
    { full_name: 'Arjun Subramaniam',          email: 'arjun.subra88@gmail.com',          location: 'Brickfields, Kuala Lumpur',    services: 'Grocery shopping, Pharmacy / medical pickup', want_to_be_stepper: 0, customer_type: 'elderly',           would_pay: 'Yes, definitely',           submitted_at: '2025-05-19 16:21:08' },
    { full_name: 'Nurul Aina binti Zulkifli',  email: 'nurulaina.zul@outlook.com',        location: 'Wangsa Maju, Kuala Lumpur',   services: 'Food delivery, Emergency urgent help',        want_to_be_stepper: 0, customer_type: 'parent',            would_pay: 'Yes, definitely',           submitted_at: '2025-05-20 07:44:22' },
    { full_name: 'David Lim Jun Hao',          email: 'davidlimjh@gmail.com',             location: 'Kepong, Kuala Lumpur',         services: 'Grocery shopping, Gift buying',               want_to_be_stepper: 1, customer_type: 'busy_professional', would_pay: 'Maybe, depends on price',   submitted_at: '2025-05-20 13:09:51' },
    { full_name: 'Farah Nadia binti Ibrahim',  email: 'farahnadia.ibrahim@gmail.com',     location: 'Ampang, Kuala Lumpur',         services: 'Personal errands, Food delivery',             want_to_be_stepper: 0, customer_type: 'busy_professional', would_pay: 'Yes, definitely',           submitted_at: '2025-05-21 10:18:37' },
    { full_name: 'Kavitha Rajendran',          email: 'kavitha.raj@gmail.com',            location: 'Petaling Jaya, Selangor',      services: 'Pharmacy / medical pickup, Grocery shopping', want_to_be_stepper: 0, customer_type: 'elderly',           would_pay: 'Not sure yet',              submitted_at: '2025-05-22 15:55:04' },
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO waitlist (full_name, email, location, services, want_to_be_stepper, customer_type, would_pay, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  let inserted = 0;
  for (const e of entries) {
    const info = stmt.run(e.full_name, e.email, e.location, e.services, e.want_to_be_stepper, e.customer_type, e.would_pay, e.submitted_at);
    if (info.changes) inserted++;
  }
  res.json({ success: true, inserted });
});

app.listen(PORT, () => {
  console.log(`DOORSTEPPERS server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
});
