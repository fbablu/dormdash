//Albert Castrejon - All code, 6 hours spent
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";

export default function Page() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibilityOptions = () => {
    setIsVisible((prev) => !prev);
  };

  const [isOnline, setOnline] = useState(false);

  const toggleOnline = () => {
    setOnline((prev) => !prev);
    setIsVisible(false)
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.dormdashIcon}
        resizeMode="contain"
        source={require("../../assets/deliver-page/TopBar.png")}
      />

      <Text style={styles.text}>Requests</Text>

      {/* Fixed height container for the list to prevent shifting */}
      <View style={styles.listWrapper}>
        {isVisible && (
          <FlatList
            data={DATA}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VisibilityItem title={item.title} toggleOnline={toggleOnline}/>}
          />
        )}
      </View>

      {/* Button is positioned at the bottom */}
      <VisibilityConfigButton toggleVisibility={toggleVisibilityOptions} isVisible={isVisible} isOnline={isOnline}/>
    </View>
  );
}

const DATA = [
  { id: "1", title: "Go Online" },
  { id: "2", title: "Go Offline" },
];

type ItemProps = { title: string };

const VisibilityItem = ({ title, toggleOnline}) => (
  <TouchableOpacity style={styles.item} onPress={toggleOnline}>
    <Text style={styles.visibilityText}>{title}</Text>
  </TouchableOpacity>
);

const VisibilityConfigButton = ({ toggleVisibility, isVisible, isOnline }) => (
  <TouchableOpacity style={styles.VisibilityConfigButton} onPress={toggleVisibility}>
    <Text style={styles.buttonText}>{isOnline? "You are Online" : "You are Offline"}</Text>
    <Image
      style={styles.visibilityConfig}
      resizeMode="contain"
      source={require("../../assets/deliver-page/VisibilityConfig.png")}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dormdashIcon: {
    marginTop: 10,
    width: 393,
    height: 66,
  },
  text: {
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 20,
  },
  listWrapper: {
    marginTop: 300,
    width: "100%",
    height: 180, 
    overflow: "hidden",
  },
  item: {
    backgroundColor: "#D9D9D9",
    padding: 20,
    marginVertical: 10,
    width: "90%",
    alignSelf: "center",
    borderRadius: 8,
  },
  visibilityConfig: {
    position: "relative",
    marginTop: -40,
    marginLeft: 300,
  },
  visibilityText: {
    alignSelf: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  VisibilityConfigButton: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#D9D9D9",
    width: 375,
    height: 75,
    borderColor: "#897A7A",
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
