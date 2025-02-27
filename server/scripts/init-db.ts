// src/scripts/init-db.ts
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

dotenv.config();

interface Restaurant {
  name: string;
  location: string;
  address: string;
  website: string;
  cuisine: string[];
  acceptsCommodoreCash: boolean;
}

async function initializeDatabase() {
  console.log("Initializing database...");

  // Read restaurants data
  const restaurantsData: Restaurant[] = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../../ton_restaurants.json"),
      "utf8",
    ),
  );

  // Create connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "dormdash_user",
    password: process.env.DB_PASSWORD || "dormdash_VU",
    database: process.env.DB_NAME || "dormdash",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const connection = await pool.getConnection();

  try {
    console.log("Connected to the database");

    // Start a transaction
    await connection.beginTransaction();

    // Insert cuisines
    const allCuisines = new Set<string>();
    restaurantsData.forEach((restaurant) => {
      restaurant.cuisine.forEach((cuisine) => allCuisines.add(cuisine));
    });

    console.log(`Found ${allCuisines.size} unique cuisines`);

    for (const cuisine of allCuisines) {
      await connection.execute(
        "INSERT IGNORE INTO cuisines (name) VALUES (?)",
        [cuisine],
      );
    }

    // Get all cuisines with their IDs
    const [cuisinesRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT id, name FROM cuisines",
    );
    const cuisineMap: { [key: string]: number } = {};
    cuisinesRows.forEach((row) => {
      cuisineMap[row.name] = row.id;
    });

    // Insert restaurants and their cuisines
    console.log(`Inserting ${restaurantsData.length} restaurants`);

    for (const restaurant of restaurantsData) {
      // Insert restaurant
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT INTO restaurants 
        (name, location, address, website, accepts_commodore_cash) 
        VALUES (?, ?, ?, ?, ?)`,
        [
          restaurant.name,
          restaurant.location,
          restaurant.address,
          restaurant.website,
          restaurant.acceptsCommodoreCash ? 1 : 0,
        ],
      );

      const restaurantId = result.insertId;

      // Insert restaurant cuisines
      for (const cuisine of restaurant.cuisine) {
        const cuisineId = cuisineMap[cuisine];
        if (cuisineId) {
          await connection.execute(
            "INSERT INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES (?, ?)",
            [restaurantId, cuisineId],
          );
        }
      }
    }

    // Commit the transaction
    await connection.commit();
    console.log("Database initialized successfully");
  } catch (error) {
    await connection.rollback();
    console.error("Error initializing database:", error);
  } finally {
    connection.release();
    await pool.end();
  }
}

initializeDatabase()
  .then(() => {
    console.log("Database initialization completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
