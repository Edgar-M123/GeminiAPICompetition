import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link href= "./camera" style={{color: 'blue', textDecorationLine: 'underline'}}>Camera</Link>
      <Text>Index page</Text>
    </View>
  );
}
