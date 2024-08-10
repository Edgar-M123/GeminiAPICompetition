import { AuthContextProvider } from "@/components/AuthContext"
import { Stack } from "expo-router"

export default function RootLayout() {



    return (

        <AuthContextProvider>
            <Stack>
                <Stack.Screen name = 'index' options={{headerShown: false}} />
            </Stack>
        </AuthContextProvider>


    )
}