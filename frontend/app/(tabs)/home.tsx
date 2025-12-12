import { View, Text, StyleSheet } from "react-native";

export default function HomeTabScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Tab</Text>
      <Text style={styles.subtext}>This is a placeholder for the home tab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 18,
    color: "#1e1e1e",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#7D7D7D",
  },
});

