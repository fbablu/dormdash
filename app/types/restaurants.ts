export type Location =
  | "HILLSBORO VILLAGE"
  | "MIDTOWN"
  | "WEST END AVENUE"
  | "ELLISTON PLACE"
  | "ON-CAMPUS"
  | "KOSHER/OUT OF CAMPUS RADIUS";

export type Cuisine =
  | "Vietnamese"
  | "Asian"
  | "Coffee"
  | "Cafe"
  | "American"
  | "Breakfast"
  | "BBQ"
  | "Healthy"
  | "Bowls"
  | "Smoothies"
  | "Sandwiches"
  | "Burgers"
  | "Ice Cream"
  | "Desserts"
  | "Noodles"
  | "Chinese"
  | "Japanese"
  | "Sushi"
  | "Mexican"
  | "Tacos"
  | "Juice"
  | "Tex-Mex"
  | "Pizza"
  | "Italian"
  | "Southern"
  | "Chicken"
  | "Hawaiian"
  | "Poke"
  | "Indian"
  | "Fast Food"
  | "Asian Fusion"
  | "Diner"
  | "Pasta"
  | "Thai"
  | "Bubble Tea"
  | "Beverages"
  | "Kosher"
  | "Vegetarian";

export interface Restaurant {
  name: string;
  location: Location;
  address: string;
  website: string;
  cuisine: Cuisine[];
  acceptsCommodoreCash: boolean;
}

type Restaurants = Restaurant[];
export default Restaurants;
