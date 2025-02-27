export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
  }
  
  export interface Order {
    id: string;
    date: string;
    total: string;
    items: OrderItem[];
    restaurant: string;
  }
  
  export const getOrders = (): Order[] => {
    return [
      {
        id: "1234",
        date: "2/09/25",
        total: "$25.99",
        restaurant: "McDonald's",
        items: [
          { name: "Burger", quantity: 1, price: 5.99 },
          { name: "Fries", quantity: 1, price: 2.99 },
          { name: "Coke", quantity: 1, price: 1.99 },
        ],
      },
      {
        id: "1235",
        date: "2/10/25",
        total: "$25.99",
        restaurant: "Subway",
        items: [
          { name: "Footlong Sub", quantity: 1, price: 8.99 },
          { name: "Chips", quantity: 1, price: 1.99 },
          { name: "Drink", quantity: 1, price: 2.99 },
        ],
      },
    ];
  };
  