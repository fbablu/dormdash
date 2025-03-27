import { render } from "@testing-library/react-native";
import OrdersScreen from "../app/(tabs)/orders";
import { CartProvider } from "../app/context/CartContext";

describe("<OrdersScreen /> basic UI", () => {
  test("renders My Orders title", () => {
    const { getByText } = render(
      <CartProvider>
        <OrdersScreen />
      </CartProvider>
    );

    getByText("My Orders");
  });

  test("snapshot renders correctly", () => {
    const tree = render(
      <CartProvider>
        <OrdersScreen />
      </CartProvider>
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
