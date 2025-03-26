// src/scripts/init-db.ts
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

dotenv.config();

export interface Restaurant {
  name: string;
  location: string;
  address: string;
  website: string;
  cuisine: string[];
  acceptsCommodoreCash: boolean;
}

// break into smaller functions for testing
export function readRestaurantData() {
  let restaurantData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../data/ton_restaurants.json"),
      "utf8",
    ),
  );
  return restaurantData;
}

export function createConnectionPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "dormdash_user",
    password: process.env.DB_PASSWORD || "dormdash_VU",
    database: process.env.DB_NAME || "dormdash",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export async function createCuisinesIfNotExists(connection: mysql.Connection) {
  const [result] = await connection.execute(`
    CREATE TABLE IF NOT EXISTS cuisines (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  return result;
}

export async function createRestaurantsIfNotExists(connection: mysql.Connection) {
  const [result] = await connection.execute(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      location VARCHAR(255) NOT NULL,
      address VARCHAR(255) NOT NULL,
      website VARCHAR(255) NOT NULL,
      accepts_commodore_cash BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  return result;
}

export async function createRestaurantCuisinesTable(connection: mysql.Connection) {
  const [result] = await connection.execute(`
    CREATE TABLE IF NOT EXISTS restaurant_cuisines (
      restaurant_id INT,
      cuisine_id INT,
      PRIMARY KEY (restaurant_id, cuisine_id),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (cuisine_id) REFERENCES cuisines(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  return result;
}


export async function initializeDatabase(
  pool: mysql.Pool,
  connection: mysql.PoolConnection,
  restaurantsData: Restaurant[],
) {
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

    // store results for all restaurants
    const allRestaurants = [];
    const allRestaurantCuisines = [];
    for (const restaurant of restaurantsData) {
      // Insert restaurant
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT IGNORE INTO restaurants 
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
      allRestaurants.push(result);
      allRestaurantCuisines.push(restaurant.cuisine);
    }

    // inserting all restaurant cuisines
    for (let i = 0; i < restaurantsData.length; i++) {
      const restaurant = restaurantsData[i];
      const restaurantId = allRestaurants[i].insertId;

      // Insert restaurant cuisines
      for (const cuisine of restaurant.cuisine) {
        const cuisineId = cuisineMap[cuisine];
        if (cuisineId) {
          await connection.execute(
            "INSERT IGNORE INTO restaurant_cuisines (restaurant_id, cuisine_id) VALUES (?, ?)",
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

// uncomment to initialize the database
// initializeDatabase()
//   .then(() => {
//     console.log("Database initialization completed");
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error("Database initialization failed:", err);
//     process.exit(1);
//   });
