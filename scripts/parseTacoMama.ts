// scripts/parseTacoMamaMenu.ts
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../app/config/firebase';

interface MenuItem {
  name: string;
  description: string;
  price: number;
}

interface MenuCategory {
  name: string;
  items: MenuItem[];
}

// Parse the Taco Mama menu and add it to Firebase
export const uploadTacoMamaMenu = async (restaurantId: string) => {
  try {
    // Burritos
    const burritosCategory: MenuCategory = {
      name: "Burritos",
      items: [
        {
          name: "Yo Mama",
          description: "Ground beef, shredded cheddar, lettuce, tomato, sour cream with side of queso",
          price: 9.99
        },
        {
          name: "The Big Client",
          description: "Barbacoa (braised beef), refried beans, queso, shredded cheddar, tomatoes, mild salsa ranchera",
          price: 10.99
        },
        {
          name: "The Judge",
          description: "Marinated chicken, black beans, cilantro-lime rice, shredded cheddar, lettuce, mild salsa ranchera, creamy cilantro pesto",
          price: 10.49
        },
        {
          name: "Q-Burrito",
          description: "Roasted pulled barbacoa, ancho chile slaw, pickles, homemade chipotle BBQ sauce",
          price: 11.99
        },
        {
          name: "The Fat Boy",
          description: "Grilled steak tenderloin, cilantro-lime rice, grilled onions, refried beans, cilantro, red-chile butter sauce",
          price: 12.99
        },
        {
          name: "The Hippie Fisherman",
          description: "Flounder (grilled or fried) or grilled shrimp with ancho chile slaw, avocado, tomatoes, roasted poblano tartar",
          price: 12.99
        },
        {
          name: "The Tree Hugger",
          description: "Cilantro-lime rice, black beans, roasted corn, grilled onions, lettuce, tomato, avocado, mild salsa ranchera",
          price: 9.99
        }
      ]
    };

    // Tacos
    const tacosCategory: MenuCategory = {
      name: "Tacos",
      items: [
        {
          name: "Classico Beef",
          description: "Ground beef, shredded cheddar, lettuce, tomato, sour cream",
          price: 8.99
        },
        {
          name: "Cheezy Beef",
          description: "Barbacoa (braised beef), tomatoes, onions, cilantro, queso, lettuce, queso fresco, mild salsa ranchera",
          price: 9.49
        },
        {
          name: "The Mayor",
          description: "Marinated chicken, lettuce, tomatoes, creamy-cilantro pesto, queso fresco",
          price: 8.99
        },
        {
          name: "Justice Is Served",
          description: "Flounder (grilled or fried) or grilled shrimp with ancho chile slaw, avocado, tomatoes, roasted poblano tartar",
          price: 10.99
        },
        {
          name: "The Sizzler",
          description: "Grilled steak tenderloin, grilled onions, avocado, lettuce, tomatoes, red chile butter sauce, queso fresco",
          price: 10.99
        },
        {
          name: "Alabama Redneck",
          description: "Roasted pulled barbacoa, ancho chile slaw, pickles, Mama's homemade chipotle BBQ sauce",
          price: 9.99
        },
        {
          name: "Mama's Chorizo",
          description: "Fresh ground chorizo, pico de gallo, lettuce, queso fresco",
          price: 9.49
        },
        {
          name: "Ahi Tuna-Si!!",
          description: "AAA Sushi grade Ahi Tuna, sliced and served raw, sriracha slaw, avocado with chipotle ranch on the side",
          price: 12.99
        }
      ]
    };

    // Sides
    const sidesCategory: MenuCategory = {
      name: "Sides",
      items: [
        {
          name: "Street Corn",
          description: "Grilled corn with chile, lime and queso fresco",
          price: 4.99
        },
        {
          name: "Ancho Chile Slaw",
          description: "Fresh cabbage with ancho chile dressing",
          price: 3.99
        },
        {
          name: "Cilantro-Lime Rice",
          description: "Rice with fresh cilantro and lime",
          price: 3.49
        },
        {
          name: "Mexican Mac & Cheese",
          description: "Macaroni with queso and mild spices",
          price: 4.49
        },
        {
          name: "Black Beans",
          description: "Slow-cooked black beans",
          price: 3.49
        },
        {
          name: "Chorizo Refried Beans",
          description: "Refried beans with chorizo",
          price: 3.99
        }
      ]
    };

    // Drinks
    const drinksCategory: MenuCategory = {
      name: "Drinks",
      items: [
        {
          name: "Mi Casa Margarita",
          description: "House margarita with fresh lime",
          price: 7.99
        },
        {
          name: "Skinny Margarita",
          description: "Low carb margarita",
          price: 8.99
        },
        {
          name: "Pomegranate Margarita",
          description: "Margarita with pomegranate flavor",
          price: 8.99
        },
        {
          name: "Frozen Margarita",
          description: "Frozen house margarita",
          price: 7.99
        },
        {
          name: "Jalapeno Margarita",
          description: "Spicy margarita with fresh jalapeno",
          price: 8.99
        },
        {
          name: "The Guillermo (Ranch Water)",
          description: "Top Shelf Blanco Tequila + Ranch Water with a fresh lime wedge",
          price: 8.99
        },
        {
          name: "Imported Beer",
          description: "Selection of imported beers",
          price: 5.99
        },
        {
          name: "Fountain Drink",
          description: "Assorted sodas",
          price: 2.49
        },
        {
          name: "Bottled Water",
          description: "Purified water",
          price: 1.99
        }
      ]
    };

    // Kids Menu
    const kidsCategory: MenuCategory = {
      name: "Kids Menu",
      items: [
        {
          name: "Cheese Quesadilla",
          description: "Simply cheese in a flour tortilla",
          price: 5.99
        },
        {
          name: "Cheese & Chicken Quesadilla",
          description: "Cheese and chicken in a flour tortilla",
          price: 6.99
        },
        {
          name: "Cheese Nachos",
          description: "Tortilla chips with melted cheese",
          price: 5.49
        },
        {
          name: "Cheese Nachos + Chicken or Ground Beef",
          description: "Tortilla chips with melted cheese and protein",
          price: 6.99
        },
        {
          name: "Bowl of Mac & Cheese",
          description: "Made with four cheeses!",
          price: 4.99
        },
        {
          name: "Chicken & Cheese Taco",
          description: "Simple taco for kids",
          price: 4.49
        },
        {
          name: "Ground Beef & Cheese Taco",
          description: "Simple taco with ground beef",
          price: 4.49
        }
      ]
    };

    // Upload each category to Firebase
    const categories = [burritosCategory, tacosCategory, sidesCategory, drinksCategory, kidsCategory];
    
    for (const category of categories) {
      await addDoc(collection(db, 'restaurants', restaurantId, 'menu'), category);
      console.log(`Added ${category.name} category`);
    }

    console.log('Successfully uploaded Taco Mama menu to Firebase');
    return true;
  } catch (error) {
    console.error('Error uploading Taco Mama menu:', error);
    return false;
  }
};

// Function to add Taco Mama restaurant data to Firebase
export const addTacoMamaRestaurant = async () => {
  try {
    const tacoMamaData = {
      name: "Taco Mama",
      location: "HILLSBORO VILLAGE",
      address: "2119 Belcourt Ave. Nashville, TN 37212",
      website: "https://tacomamaonline.com/",
      image: "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
      cuisines: ["Mexican", "Tacos"],
      acceptsCommodoreCash: true,
      rating: 4.5,
      reviewCount: "200+",
      deliveryTime: "15-25 min",
      deliveryFee: 3.99
    };

    // Check if restaurant already exists
    const restaurantId = 'taco-mama';
    await setDoc(doc(db, 'restaurants', restaurantId), tacoMamaData);
    
    console.log('Added Taco Mama restaurant data');
    
    // Upload menu
    await uploadTacoMamaMenu(restaurantId);
    
    return restaurantId;
  } catch (error) {
    console.error('Error adding Taco Mama restaurant:', error);
    throw error;
  }
};