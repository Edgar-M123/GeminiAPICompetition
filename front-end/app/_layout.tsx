import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{title: "Landing Page"}} />
      <Stack.Screen name="camera" options={{title: "Camera Page"}}/>
    </Stack>
  );
}
