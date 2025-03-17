// app/context/OrderContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import backendApi, { Order, DeliveryRequest } from '../services/backendApi';
import { useAuth } from './AuthContext';

interface OrderContextType {
  // Order state
  orders: Order[];
  isOrdersLoading: boolean;
  
  // Delivery state
  activeDeliveries: Order[];
  availableDeliveryRequests: DeliveryRequest[];
  isDeliveryLoading: boolean;
  isOnlineForDelivery: boolean;
  
  // Functions
  refreshOrders: () => Promise<void>;
  refreshDeliveries: () => Promise<void>;
  placeOrder: (orderData: any) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  acceptDelivery: (orderId: string) => Promise<boolean>;
  updateDeliveryStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  toggleDeliveryMode: (isOnline: boolean) => void;
}

const defaultOrderContext: OrderContextType = {
  orders: [],
  isOrdersLoading: false,
  activeDeliveries: [],
  availableDeliveryRequests: [],
  isDeliveryLoading: false,
  isOnlineForDelivery: false,
  refreshOrders: async () => {},
  refreshDeliveries: async () => {},
  placeOrder: async () => '',
  cancelOrder: async () => false,
  acceptDelivery: async () => false,
  updateDeliveryStatus: async () => false,
  toggleDeliveryMode: () => {}
};

const OrderContext = createContext<OrderContextType>(defaultOrderContext);

export const useOrders = () => useContext(OrderContext);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [availableDeliveryRequests, setAvailableDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);
  const [isOnlineForDelivery, setIsOnlineForDelivery] = useState(false);
  
  // Load initial data when signed in
  useEffect(() => {
    if (isSignedIn) {
      refreshOrders();
    }
  }, [isSignedIn]);
  
  // Refresh delivery requests when online mode changes
  useEffect(() => {
    if (isSignedIn && isOnlineForDelivery) {
      refreshDeliveries();
    }
  }, [isSignedIn, isOnlineForDelivery]);
  
  // Get user orders
  const refreshOrders = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsOrdersLoading(true);
      const { data } = await backendApi.order.getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsOrdersLoading(false);
    }
  };
  
  // Refresh delivery information
  const refreshDeliveries = async () => {
    if (!isSignedIn || !isOnlineForDelivery) return;
    
    try {
      setIsDeliveryLoading(true);
      
      // Get active deliveries for this user
      const { data: userDeliveries } = await backendApi.delivery.getUserDeliveries();
      setActiveDeliveries(userDeliveries);
      
      // Get available delivery requests
      const { data: deliveryRequests } = await backendApi.delivery.getDeliveryRequests();
      
      // Filter out the user's own orders from available requests
      const filteredRequests = deliveryRequests.filter(request => {
        return request.customerId !== user?.id;
      });
      
      setAvailableDeliveryRequests(filteredRequests);
    } catch (error) {
      console.error('Error fetching delivery information:', error);
    } finally {
      setIsDeliveryLoading(false);
    }
  };
  
  // Place a new order
  const placeOrder = async (orderData: any): Promise<string> => {
    if (!isSignedIn) throw new Error('User must be signed in to place an order');
    
    try {
      const { data } = await backendApi.order.createOrder(orderData);
      
      // Refresh the orders list
      refreshOrders();
      
      return data.orderId;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };
  
  // Cancel an order
  const cancelOrder = async (orderId: string): Promise<boolean> => {
    if (!isSignedIn) return false;
    
    try {
      await backendApi.order.updateOrderStatus(orderId, 'cancelled');
      
      // Refresh orders
      refreshOrders();
      
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  };
  
  // Accept a delivery request
  const acceptDelivery = async (orderId: string): Promise<boolean> => {
    if (!isSignedIn || !isOnlineForDelivery) return false;
    
    try {
      await backendApi.delivery.acceptDeliveryRequest(orderId);
      
      // Refresh deliveries
      refreshDeliveries();
      
      return true;
    } catch (error) {
      console.error('Error accepting delivery:', error);
      return false;
    }
  };
  
  // Update delivery status
  const updateDeliveryStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
    if (!isSignedIn) return false;
    
    try {
      await backendApi.order.updateOrderStatus(orderId, status);
      
      // If delivered, it's completed
      if (status === 'delivered') {
        setActiveDeliveries(prev => prev.filter(delivery => delivery.id !== orderId));
      } else {
        // Otherwise update the status
        setActiveDeliveries(prev => 
          prev.map(delivery => 
            delivery.id === orderId ? { ...delivery, status } : delivery
          )
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return false;
    }
  };
  
  // Toggle delivery mode
  const toggleDeliveryMode = (isOnline: boolean) => {
    setIsOnlineForDelivery(isOnline);
    
    if (isOnline) {
      refreshDeliveries();
    } else {
      // Clear delivery data when going offline
      setAvailableDeliveryRequests([]);
    }
  };
  
  return (
    <OrderContext.Provider
      value={{
        orders,
        isOrdersLoading,
        activeDeliveries,
        availableDeliveryRequests,
        isDeliveryLoading,
        isOnlineForDelivery,
        refreshOrders,
        refreshDeliveries,
        placeOrder,
        cancelOrder,
        acceptDelivery,
        updateDeliveryStatus,
        toggleDeliveryMode
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};