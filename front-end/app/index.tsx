import { Link, Redirect, useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  
  const router = useRouter()
  
  return (
    <View>
      <Redirect href={"/camera"}/>
    </View>
  );
}
