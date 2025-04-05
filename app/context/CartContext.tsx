//@Rushi Patel

import React, { createContext, useState, useContext, ReactNode } from "react";

interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addItemsToCart: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addItemsToCart = (items: CartItem[]) => {
    setCartItems(items);
  };

  return (
    <CartContext.Provider value={{ cartItems, addItemsToCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;
