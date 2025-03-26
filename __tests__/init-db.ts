// test code for init-db.ts
import * as initDb from "@/server/scripts/init-db";
import mysql, { RowDataPacket } from "mysql2/promise";

describe("check init-db.ts", () => {
  let pool: mysql.Pool;
  let connection: mysql.PoolConnection;

  beforeEach(async () => {
    // Create a fresh pool and connection before each test
    pool = initDb.createConnectionPool();
    connection = await pool.getConnection();
  });

  afterEach(async () => {
    // Only release and end if not already released
    try {
      if (connection && connection.connection._closing === false) {
        connection.release();
      }
      if (pool) {
        await pool.end();
      }
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  it("test table creation", async () => {
    let res1 = await initDb.createCuisinesIfNotExists(connection);
    let res2 = await initDb.createRestaurantsIfNotExists(connection);
    let res3 = await initDb.createRestaurantCuisinesTable(connection);
    // check the number of tables in the database
    const [tables] = await connection.execute<mysql.RowDataPacket[]>("SHOW TABLES");
    // console.log("tables", tables);
    expect(tables.length).toBe(3);

    // check the number of columns in the each table
    const [cuisines] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM cuisines");
    // console.log("cuisines", cuisines);
    expect(cuisines.length).toBe(2+2);

    const [restaurants] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM restaurants");
    // console.log("restaurants", restaurants);
    expect(restaurants.length).toBe(6+2);

    const [restaurant_cuisines] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM restaurant_cuisines");
    // console.log("restaurant_cuisines", restaurant_cuisines);
    expect(restaurant_cuisines.length).toBe(2+2);
  });

  it("test restaurant json data loading", () => {
    const restaurantsData = initDb.readRestaurantData();
    expect(restaurantsData).toBeDefined();
  });

  it("test database pool connection", async () => {
    try {
      connection = await pool.getConnection();
      expect(connection).toBeDefined();
    } catch (err) {
      console.error(err);
    }
  });

  it("test insert restaurant cuisines into the database", async () => {
    try {
      // Note: initializeDatabase handles its own connection release
      await initDb.initializeDatabase(pool, connection, initDb.readRestaurantData());
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  // it("test restaurants table creation", async () => {
  //   await connection.execute(`
  //     CREATE TABLE IF NOT EXISTS restaurants (
  //       id INT PRIMARY KEY AUTO_INCREMENT,
  //       name VARCHAR(255) NOT NULL,
  //       address VARCHAR(255) NOT NULL,
  //       phone VARCHAR(20),
  //       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  //     )
  //   `);
  // });

  // it("test restaurant_cuisines table creation", async () => {
  //   await connection.execute(`
  //     CREATE TABLE IF NOT EXISTS restaurant_cuisines (
  //       restaurant_id INT,
  //       cuisine_id INT,
  //       PRIMARY KEY (restaurant_id, cuisine_id),
  //       FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
  //       FOREIGN KEY (cuisine_id) REFERENCES cuisines(id)
  //     )
  //   `);
  // });
});

