require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Reading schema initialization script...");
    const schemaSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    
    console.log("Executing schema initialization...");
    await client.query(schemaSql);
    
    console.log("Schema initialized successfully.");

    const hashedPassword = await bcrypt.hash("admin123", 10);

    console.log("Seeding admin user...");
    const result = await client.query(`
      INSERT INTO "User" (username, password, name, role)
      VALUES ($1, $2, $3, 'OWNER')
      ON CONFLICT (username) 
      DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role
      RETURNING *;
    `, ["admin", hashedPassword, "Warehouse Owner"]);

    console.log("Database seeded successfully with user:", result.rows[0].username);
  } catch (err) {
    console.error("Error during database initialization:", err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
