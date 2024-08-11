import React from 'react'
import { Stack } from 'expo-router'
import { Colors } from '@/constants/Colors'

export default function SettingsRoot() {

    return (
        <Stack
        screenOptions={{
             headerStyle: {
                backgroundColor: "white"
            },
            headerTintColor: Colors.dark.tint,
        }}
        >
            <Stack.Screen name='settings' options={{title: "Settings"}} />
            <Stack.Screen name='profile_settings' options={{title: "Profile"}} />
        </Stack>
    )

}