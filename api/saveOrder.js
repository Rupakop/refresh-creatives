import mysql from "mysql2/promise";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name,
    phone,
    address,
    city,
    items,
    amount,
    upi_id
  } = req.body;

  if (!name || !phone || !address || !items || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    await connection.execute(
      "INSERT INTO orders (customer_name, phone, address, city, items, amount, upi_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        phone,
        address,
        city,
        JSON.stringify(items),
        amount,
        upi_id,
        "PENDING"
      ]
    );

    await connection.end();

    return res.status(200).json({ success: true, message: "Order saved" });

  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ error: "Database error" });
  }
}
