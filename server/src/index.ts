// server/src/index.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { OAuth2Client } from "google-auth-library";
import jsonwebtoken from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

interface UserPayload {
  id: string;
  email: string;
  name: string;
}

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

interface OrderData {
  restaurantId: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  notes?: string;
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const GOOGLE_CLIENT_ID =
  "895573352563-bglvrv3e9visj279hc9g157787jd4on3.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "dormdash_user",
  password: process.env.DB_PASSWORD || "dormdash_VU",
  database: process.env.DB_NAME || "dormdash",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verify Google token
async function verifyGoogleToken(token: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}

// Authentication middleware
async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = jsonwebtoken.verify(token, JWT_SECRET) as UserPayload;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

// API Routes

// Google Sign-In
app.post("/api/auth/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID token is required" });
    }

    // Verify the Google token
    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists in database
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute<mysql.RowDataPacket[]>(
        "SELECT id, name, email, image FROM users WHERE email = ?",
        [email],
      );

      let userId: string;

      if (users.length === 0) {
        // Create new user
        userId = uuidv4();
        await connection.execute(
          "INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)",
          [userId, name, email, picture],
        );
      } else {
        // User exists
        userId = users[0].id;

        // Update user information if needed
        await connection.execute(
          "UPDATE users SET name = ?, image = ? WHERE id = ?",
          [name, picture, userId],
        );
      }

      // Generate JWT token
      const token = jsonwebtoken.sign({ id: userId, email, name }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(200).json({
        token,
        user: {
          id: userId,
          email,
          name,
          image: picture,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in Google sign-in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
app.get(
  "/api/user/profile",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const connection = await pool.getConnection();
      try {
        const [users] = await connection.execute<mysql.RowDataPacket[]>(
          "SELECT id, name, email, image, created_at FROM users WHERE id = ?",
          [userId],
        );

        if (users.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ user: users[0] });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get all restaurants
app.get("/api/restaurants", async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [restaurants] = await connection.execute<mysql.RowDataPacket[]>(`
        SELECT r.id, r.name, r.location, r.address, r.website, r.accepts_commodore_cash,
               GROUP_CONCAT(c.name) AS cuisines
        FROM restaurants r
        LEFT JOIN restaurant_cuisines rc ON r.id = rc.restaurant_id
        LEFT JOIN cuisines c ON rc.cuisine_id = c.id
        GROUP BY r.id
      `);

      // Transform the result
      const formattedRestaurants = restaurants.map((restaurant) => ({
        ...restaurant,
        accepts_commodore_cash: Boolean(restaurant.accepts_commodore_cash),
        cuisines: restaurant.cuisines ? restaurant.cuisines.split(",") : [],
      }));

      res.status(200).json({ restaurants: formattedRestaurants });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new order
app.post(
  "/api/orders",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId, totalAmount, deliveryFee, deliveryAddress, notes } =
        req.body as OrderData;
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (!restaurantId || !totalAmount || !deliveryFee || !deliveryAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const orderId = uuidv4();

      const connection = await pool.getConnection();
      try {
        await connection.execute(
          `INSERT INTO orders 
        (id, customer_id, restaurant_id, total_amount, delivery_fee, delivery_address, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            customerId,
            restaurantId,
            totalAmount,
            deliveryFee,
            deliveryAddress,
            notes,
          ],
        );

        res.status(201).json({
          orderId,
          message: "Order created successfully",
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get user's orders
app.get(
  "/api/user/orders",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const connection = await pool.getConnection();
      try {
        const [orders] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT o.*, r.name as restaurant_name 
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         WHERE o.customer_id = ?
         ORDER BY o.created_at DESC`,
          [userId],
        );

        res.status(200).json({ orders });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get available delivery requests
app.get(
  "/api/delivery/requests",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const connection = await pool.getConnection();
      try {
        const [orders] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT o.*, r.name as restaurant_name, u.name as customer_name
         FROM orders o
         JOIN restaurants r ON o.restaurant_id = r.id
         JOIN users u ON o.customer_id = u.id
         WHERE o.status = 'pending' AND o.deliverer_id IS NULL
         ORDER BY o.created_at ASC`,
        );

        res.status(200).json({ deliveryRequests: orders });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error fetching delivery requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Accept a delivery request
app.post(
  "/api/delivery/accept/:orderId",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orderId } = req.params;
      const delivererId = req.user?.id;

      if (!delivererId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const connection = await pool.getConnection();
      try {
        // Start transaction
        await connection.beginTransaction();

        // Check if order exists and is still pending
        const [orders] = await connection.execute<mysql.RowDataPacket[]>(
          "SELECT status, deliverer_id FROM orders WHERE id = ?",
          [orderId],
        );

        if (orders.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: "Order not found" });
        }

        if (orders[0].status !== "pending" || orders[0].deliverer_id !== null) {
          await connection.rollback();
          return res
            .status(400)
            .json({ error: "Order is already assigned or not pending" });
        }

        // Assign the deliverer and update status
        await connection.execute(
          'UPDATE orders SET deliverer_id = ?, status = "accepted" WHERE id = ?',
          [delivererId, orderId],
        );

        // Commit transaction
        await connection.commit();

        res
          .status(200)
          .json({ message: "Delivery request accepted successfully" });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error accepting delivery request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Update order status
app.put(
  "/api/orders/:orderId/status",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body as { status: string };
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      if (
        ![
          "pending",
          "accepted",
          "picked_up",
          "delivered",
          "cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const connection = await pool.getConnection();
      try {
        // Check if the user is the deliverer of this order
        const [orders] = await connection.execute<mysql.RowDataPacket[]>(
          "SELECT deliverer_id, customer_id FROM orders WHERE id = ?",
          [orderId],
        );

        if (orders.length === 0) {
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orders[0];

        // Only the deliverer can update the status (except for cancellation which customer can do too)
        if (
          order.deliverer_id !== userId &&
          (status !== "cancelled" || order.customer_id !== userId)
        ) {
          return res
            .status(403)
            .json({ error: "Unauthorized to update this order" });
        }

        // Update the order status
        await connection.execute("UPDATE orders SET status = ? WHERE id = ?", [
          status,
          orderId,
        ]);

        res.status(200).json({ message: `Order status updated to ${status}` });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
