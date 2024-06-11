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
      <Text>Index page</Text>
      <View style={{padding: 10, borderWidth: 1}}>
        <Link href= "./camera" style={{color: 'blue', textDecorationLine: 'underline'}}>Camera</Link>
      </View>
      <View style = {{padding: 10, borderWidth: 1}}>
        <Link href= "./voiceTest" style={{color: 'blue', textDecorationLine: 'underline'}}>voice test</Link>
      </View>
    </View>
  );
}
