// /api/updateOrderStatus.js
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, error: 'Method not allowed' });

  // Simple API-key protection. Set UPDATE_API_KEY in Vercel env vars to something long and secret.
  const expectedKey = process.env.UPDATE_API_KEY;
  const provided = req.headers['x-api-key'] || req.body.apiKey || '';

  if (!expectedKey || provided !== expectedKey) {
    return res.status(401).json({ success:false, error: 'Unauthorized' });
  }

  const { orderId, status } = req.body || {};
  if (!orderId || !status) return res.status(400).json({ success:false, error: 'Missing orderId or status' });

  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASS = process.env.DB_PASS;
  const DB_NAME = process.env.DB_NAME;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    return res.status(500).json({ success:false, error: 'Database not configured on server' });
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectTimeout: 10000
    });

    const [result] = await conn.execute(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [String(status).toUpperCase(), orderId]
    );

    await conn.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success:false, error: 'Order not found' });
    }

    return res.status(200).json({ success:true, message: 'Order updated', orderId, status: String(status).toUpperCase() });
  } catch (err) {
    console.error('DB update error', err);
    try { if (conn) await conn.end(); } catch(e){}
    return res.status(500).json({ success:false, error: 'Database error', detail: err.message });
  }
}
