// /api/saveOrder.js
// DEV-FRIENDLY VERSION — WORKS EVEN WITHOUT DATABASE
// When DB environment variables exist, it will save to MySQL.
// When DB is missing, it returns a simulated success so your
// frontend flow works without errors.

import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { name, phone, address, city, items, amount, upi_id } = req.body || {};

  // Basic validation
  if (!name || !phone || !address || !items || !amount) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  // Read DB environment variables from Vercel
  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASS = process.env.DB_PASS;
  const DB_NAME = process.env.DB_NAME;

  // If DB is NOT configured → return simulated success
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.warn('⚠️ WARNING: DB not configured — returning simulated success.');

    return res.status(200).json({
      success: true,
      insertId: Math.floor(Math.random() * 100000) + 1000, // random fake ID
      message: 'Simulated save (DB not configured yet)',
      created_at: new Date().toISOString(),

      // Echo back data so frontend can show full summary
      echoed: {
        name,
        phone,
        address,
        city,
        items,
        amount,
        upi_id
      }
    });
  }

  // If DB exists → try saving for real
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectTimeout: 10000
    });

    const insertSql = `
      INSERT INTO orders (customer_name, phone, address, city, items, amount, upi_id, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertSql, [
      name,
      phone,
      address,
      city || '',
      JSON.stringify(items),
      Math.round(Number(amount)),
      upi_id || '',
      'PENDING'
    ]);

    await connection.end();

    return res.status(200).json({
      success: true,
      insertId: result.insertId,
      message: 'Order saved',
      created_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ DB error:', err);

    try { if (connection) await connection.end(); } catch (e) {}

    return res.status(500).json({
      success: false,
      error: 'Database error (check logs)',
      detail: err.message
    });
  }
}
