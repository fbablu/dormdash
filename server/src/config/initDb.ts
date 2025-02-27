import pool from "./db";

async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    try {
      // Create user_favorites table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          user_id VARCHAR(255) NOT NULL,
          restaurant_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, restaurant_name)
        )
      `);

      // Create restaurants table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          website VARCHAR(255),
          accepts_commodore_cash BOOLEAN DEFAULT false
        )
      `);

      console.log("Database tables verified/created");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export default initDatabase;
