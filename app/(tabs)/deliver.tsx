// app/deliver.tsx
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";

export default function Page() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.dormdashIcon}
        resizeMode="contain"
        source={require("../../assets/deliver-page/TopBar.png")}
      />
      <Text style={styles.text}>Requests</Text>
      <DoneButton/>
    </View>
  );
}



const DoneButton = ({ ...props }) => (
  <TouchableOpacity style={[styles.button, styles.googleButton]} {...props}>
    <Text style={styles.buttonText}>You are online</Text>
    <Image
        style={styles.visibilityConfig}
        resizeMode="contain"
        source={require("../../assets/deliver-page/VisibilityConfig.png")}
      />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  dormdashIcon: {
    position: "relative",
    marginTop: 10,
    width: 393,
    height: 66,
    bottom: -25,
  },
  visibilityConfig: {
    position: "relative",
    marginTop: -40,
    marginLeft: 300,
  },
  container: {
    flex: 1,
    alignItems: "center",
    // justifyContent: "center",
    backgroundColor:   "#fff",
  },
  text: {
    fontSize: 50,
    marginTop: -45,
    fontWeight: "bold",
  },
  googleButton: {
    backgroundColor: "#D9D9D9",
    width: 375,
    height: 75,
    marginTop: 530,
    borderColor: "#897A7A",
    borderWidth: 5,
  },
  button: {
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: "#0000000",
    fontSize: 45,
    marginTop: -5,
    fontWeight: "bold",
  },
});
