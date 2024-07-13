import React from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsListItem } from "@/components/SettingsComponents";
import { useRouter } from "expo-router";


export default function Settings() {

    const settingsList = [
        {title: "Edit Profile", subtitle: "Email, name, birthday & more", href: '/profile_settings'},
        {title: "Parents", subtitle: "Configure parental settings", href: '/parents_settings'}, 
        {title: "Therapist", subtitle: "Configure therapist settings", href: "/therapist_settings"}
    ]

    const router = useRouter()

    return (
        <View>
            <FlatList
                data={settingsList}
                renderItem={({item}) => <SettingsListItem title={item.title} subtitle={item.subtitle} router={router} href={item.href}/>}
            />
        </View>
    )

}

