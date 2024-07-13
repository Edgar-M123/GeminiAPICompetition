import React from "react";
import { ExpoRouter } from "expo-router/types/expo-router";
import { Pressable, View, Text } from "react-native";
import { Colors } from "@/constants/Colors";

export interface SettingsProps {
    router: ExpoRouter.Router,
    title: string,
    subtitle: string,
    href: string,
}

export function SettingsListItem({router, title, subtitle, href}: SettingsProps) {

    
    return (
        <View style={{flex: 1, borderBottomWidth: 1, borderBottomColor: "lightgrey"}}>
            <Pressable
                style={{backgroundColor: Colors.light.background, padding: 10, justifyContent: 'flex-start'}}
                onPress={() => {router.push(href)}}
            >
                <Text style={{color: Colors.light.text, fontSize: 14}}>{title}</Text>
                <Text style={{color: "grey", fontSize: 10}}>{subtitle}</Text>
            </Pressable>
        </View>
    )
}



