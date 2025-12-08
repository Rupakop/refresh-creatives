// /api/checkOrderStatus.js
// DEV-FRIENDLY: returns real DB status if DB configured, otherwise simulates payment after a short delay.
// Query parameters:
//   GET /api/checkOrderStatus?orderId=123&created_at=2025-12-08T...Z

import mysql from 'mysql2/promise';

export default async function handler(req, res){
  const { orderId, created_at } = req.method === 'GET' ? req.query : (req.body || {});
  if(!orderId) return res.status(400).json({ success:false, error: 'Missing orderId' });

  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASS = process.env.DB_PASS;
  const DB_NAME = process.env.DB_NAME;

  // If DB vars are missing - simulate:
  if(!DB_HOST || !DB_USER || !DB_NAME){
    // simulate: if created_at older than 10 seconds => PAID
    const created = created_at ? new Date(created_at) : new Date();
    const now = new Date();
    const seconds = Math.floor((now - created) / 1000);
    const demoDelay = 10; // seconds to simulate payment success
    if(seconds >= demoDelay){
      return res.status(200).json({ success:true, simulated:true, status:'PAID', created_at: created.toISOString(), note: `Simulated after ${seconds}s` });
    } else {
      return res.status(200).json({ success:true, simulated:true, status:'PENDING', created_at: created.toISOString(), note: `Will simulate PAID after ${demoDelay - seconds}s` });
    }
  }

  // DB exists -> query orders table for payment_status
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectTimeout: 10000
    });

    const [rows] = await connection.execute('SELECT id, payment_status, created_at FROM orders WHERE id = ? LIMIT 1', [orderId]);
    await connection.end();

    if(!rows || rows.length === 0) return res.status(404).json({ success:false, error: 'Order not found' });

    const row = rows[0];
    return res.status(200).json({ success:true, status: row.payment_status || 'PENDING', created_at: row.created_at });

  } catch(err){
    console.error('DB error', err);
    try { if(connection) await connection.end(); } catch(e){}
    return res.status(500).json({ success:false, error: 'Database error', detail: err.message });
  }
}

