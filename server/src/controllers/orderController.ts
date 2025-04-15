// src/controllers/orderController.ts
// Contributor: @Fardeen Bablu
// time spent: 60 minutes

import { Request, Response } from "express";
import { db } from "../config/firebase";
import { Order } from "../types";

const ordersCollection = db.collection("orders");
const usersCollection = db.collection("users");
const restaurantsCollection = db.collection("restaurants");

export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orderData = req.body;

    // Validate required fields
    if (
      !orderData.restaurantId ||
      !orderData.items ||
      !orderData.deliveryAddress
    ) {
      return res.status(400).json({
        error: "Restaurant ID, items, and delivery address are required",
      });
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res
        .status(400)
        .json({ error: "Order must include at least one item" });
    }

    // Check if restaurant exists
    const restaurantDoc = await restaurantsCollection
      .doc(orderData.restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const restaurantData = restaurantDoc.data();

    // Calculate total amount (in a real app, you'd verify prices against the database)
    const itemsTotal = orderData.items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0,
    );

    const deliveryFee =
      orderData.deliveryFee || restaurantData?.deliveryFee || 3.99;
    const totalAmount = itemsTotal + deliveryFee;

    const now = new Date();

    // Create order object
    const newOrder: Omit<Order, "id"> = {
      customerId: req.user.uid,
      restaurantId: orderData.restaurantId,
      restaurantName: restaurantData?.name || "Unknown Restaurant",
      items: orderData.items,
      totalAmount,
      deliveryFee,
      status: "pending",
      timestamp: now,
      paymentMethod: orderData.paymentMethod || "commodore_cash",
      notes: orderData.notes,
      deliveryAddress: orderData.deliveryAddress,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    const orderRef = await ordersCollection.add(newOrder);

    return res.status(201).json({
      message: "Order placed successfully",
      data: { orderId: orderRef.id },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
};

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get orders for the current user
    const ordersSnapshot = await ordersCollection
      .where("customerId", "==", req.user.uid)
      .orderBy("timestamp", "desc")
      .get();

    if (ordersSnapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });

    return res.status(200).json({ data: orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const orderDoc = await ordersCollection.doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

    // Check if the user is authorized to view this order
    if (
      orderData.customerId !== req.user.uid &&
      orderData.delivererId !== req.user.uid &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: "Forbidden - You are not authorized to view this order",
      });
    }

    return res.status(200).json({ data: orderData });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status
    const validStatuses = [
      "pending",
      "accepted",
      "picked_up",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const orderDoc = await ordersCollection.doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data() as Order;

    // Check if the user is authorized to update this order
    if (
      orderData.customerId !== req.user.uid &&
      orderData.delivererId !== req.user.uid &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: "Forbidden - You are not authorized to update this order",
      });
    }

    // Check for valid status transitions
    if (orderData.status === "delivered" || orderData.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot update a completed or cancelled order" });
    }

    // Customer can only cancel their own orders
    if (
      status === "cancelled" &&
      req.user.uid !== orderData.customerId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        error: "Forbidden - Only the customer or admin can cancel an order",
      });
    }

    // Update order status
    await ordersCollection.doc(id).update({
      status,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "Order status updated successfully",
      data: { id, status },
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
};

export const getDeliveryRequests = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get pending orders available for delivery
    const ordersSnapshot = await ordersCollection
      .where("status", "==", "pending")
      .orderBy("timestamp", "desc")
      .get();

    if (ordersSnapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const availableOrders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() } as Order;

      // Don't show the user's own orders in available deliveries
      if (order.customerId !== req.user?.uid) {
        availableOrders.push(order);
      }
    });

    return res.status(200).json({ data: availableOrders });
  } catch (error) {
    console.error("Error fetching delivery requests:", error);
    return res.status(500).json({ error: "Failed to fetch delivery requests" });
  }
};

export const acceptDelivery = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const orderDoc = await ordersCollection.doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const orderData = orderDoc.data() as Order;

    // Check if order is still available
    if (orderData.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Order is no longer available for delivery" });
    }

    // Check that user is not trying to deliver their own order
    // if (orderData.customerId === req.user.uid) {
    //   return res
    //     .status(400)
    //     .json({ error: "You cannot deliver your own order" });
    // }

    // Update order with deliverer info
    await ordersCollection.doc(id).update({
      delivererId: req.user.uid,
      status: "accepted",
      updatedAt: new Date(),
    });

    return res.status(200).json({
      message: "Delivery accepted successfully",
      data: { success: true },
    });
  } catch (error) {
    console.error("Error accepting delivery:", error);
    return res.status(500).json({ error: "Failed to accept delivery" });
  }
};

export const getUserDeliveries = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current user's active deliveries
    const ordersSnapshot = await ordersCollection
      .where("delivererId", "==", req.user.uid)
      .where("status", "in", ["accepted", "picked_up"])
      .orderBy("timestamp", "desc")
      .get();

    if (ordersSnapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const deliveries: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      deliveries.push({ id: doc.id, ...doc.data() } as Order);
    });

    return res.status(200).json({ data: deliveries });
  } catch (error) {
    console.error("Error fetching user deliveries:", error);
    return res.status(500).json({ error: "Failed to fetch deliveries" });
  }
};
