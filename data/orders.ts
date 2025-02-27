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
        total: "$8.99",
        restaurant: "McDonald's",
        items: [
          { name: "Burger", quantity: 1, price: 5.99 },
          { name: "Fries", quantity: 1, price: 2.00 },
          { name: "Coke", quantity: 1, price: 1.00 },
        ],
      },
      {
        id: "1235",
        date: "2/10/25",
        total: "$11.99",
        restaurant: "Subway",
        items: [
          { name: "Footlong Sub", quantity: 1, price: 8.99 },
          { name: "Chips", quantity: 1, price: 1.00 },
          { name: "Drink", quantity: 1, price: 2.00 },
        ],
      },
      {
        id: "1236",
        date: "2/11/25",
        total: "$12.99",
        restaurant: "Taco Bell",
        items: [
          { name: "Chalupa Supreme", quantity: 1, price: 4.99 },
          { name: "Mexican Pizza", quantity: 1, price: 5.00 },
          { name: "5-Layer Burrito", quantity: 1, price: 3.00 },
        ],
      },
      {
        id: "1237",
        date: "2/12/25",
        total: "$14.50",
        restaurant: "Chick-fil-A",
        items: [
          { name: "Chicken Sandwich", quantity: 1, price: 6.50 },
          { name: "Waffle Fries", quantity: 1, price: 3.00 },
          { name: "Lemonade", quantity: 1, price: 2.50 },
          { name: "Chick-fil-A Sauce", quantity: 2, price: 1.50 },
        ],
      },
      {
        id: "1238",
        date: "2/13/25",
        total: "$9.75",
        restaurant: "Wendy's",
        items: [
          { name: "Baconator", quantity: 1, price: 7.50 },
          { name: "Fries", quantity: 1, price: 2.25 },
        ],
      },
      {
        id: "1239",
        date: "2/14/25",
        total: "$15.99",
        restaurant: "Panda Express",
        items: [
          { name: "Orange Chicken", quantity: 1, price: 6.99 },
          { name: "Beijing Beef", quantity: 1, price: 5.00 },
          { name: "Chow Mein", quantity: 1, price: 4.00 },
        ],
      },
      {
        id: "1240",
        date: "2/15/25",
        total: "$18.50",
        restaurant: "Chipotle",
        items: [
          { name: "Chicken Bowl", quantity: 1, price: 9.00 },
          { name: "Chips & Guac", quantity: 1, price: 4.00 },
          { name: "Large Soda", quantity: 1, price: 3.50 },
        ],
      },
      {
        id: "1241",
        date: "2/16/25",
        total: "$10.99",
        restaurant: "Domino's Pizza",
        items: [
          { name: "Medium Pepperoni Pizza", quantity: 1, price: 10.99 },
        ],
      },
      {
        id: "1242",
        date: "2/17/25",
        total: "$13.25",
        restaurant: "Five Guys",
        items: [
          { name: "Cheeseburger", quantity: 1, price: 8.75 },
          { name: "Cajun Fries", quantity: 1, price: 4.50 },
        ],
      },
      {
        id: "1243",
        date: "2/18/25",
        total: "$20.99",
        restaurant: "Buffalo Wild Wings",
        items: [
          { name: "Boneless Wings (10pc)", quantity: 1, price: 12.99 },
          { name: "Mozzarella Sticks", quantity: 1, price: 8.00 },
        ],
      },
    ];
};

  