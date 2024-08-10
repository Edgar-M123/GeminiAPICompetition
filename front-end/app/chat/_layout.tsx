import { Stack } from "expo-router";
import { ConnectionContextProvider } from "@/components/ConnectionContext";
import { Colors } from "@/constants/Colors";
import { AuthContextProvider } from "@/components/AuthContext";

export default function ChatLayout() {

  // TODO: Add settings context

  return (
    <AuthContextProvider>
      <ConnectionContextProvider>
        <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "white"
          },
          headerTintColor: Colors.dark.tint,
        }}
        >
          <Stack.Screen name="index" options={{headerShown: false}} />
          <Stack.Screen name="camera" options={{title: "Camera Page", headerShown: false}}/>
          <Stack.Screen name="settings" options={{title: "Settings"}}/>
        </Stack>
      </ConnectionContextProvider>
    </AuthContextProvider>
  );
}
