import { Stack } from "expo-router";
import { ConnectionContextProvider } from "@/components/ConnectionContext";

export default function RootLayout() {
  return (
    <ConnectionContextProvider>
      <Stack
      screenOptions={{
        headerShown: false
      }}
      >
        <Stack.Screen name="camera" options={{title: "Camera Page"}}/>
      </Stack>
    </ConnectionContextProvider>
  );
}
