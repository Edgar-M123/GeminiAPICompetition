import React from "react";
import { FlatList, Pressable, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsListItem } from "@/components/SettingsComponents";
import { useRouter } from "expo-router";
import { ConnectionContext } from "@/components/ConnectionContext";
import auth from '@react-native-firebase/auth'


export default function Settings() {

    const settingsList = [
        {title: "Edit Profile", subtitle: "Email, name, birthday & more", href: '/profile_settings'},
        {title: "Parents", subtitle: "Configure parental settings", href: '/parents_settings'}, 
        {title: "Therapist", subtitle: "Configure therapist settings", href: "/therapist_settings"}
    ]

    const router = useRouter()
    const contextValues = React.useContext(ConnectionContext)

    function getSummary() {

        const event = {
            type: "GENERATE_SUMMARY",
            user_id: auth().currentUser?.uid
        }

        contextValues.socket.send(JSON.stringify(event))
    }


    return (
        <View style = {{flex: 1}}>
            <View style = {{flex: 1, padding: 10, }}>
                <Pressable 
                    style = {{
                        backgroundColor: "gold", 
                        flex: 1, 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        borderRadius: 10
                    }}
                    onPress={() => {getSummary()}}
                    android_ripple={{color: "black", foreground: true}}
                >
                    <Text>
                        Generate Session Summary
                    </Text>
                </Pressable>
            </View>
            <View style = {{flex: 10}}>
                <FlatList
                    data={settingsList}
                    renderItem={({item}) => <SettingsListItem title={item.title} subtitle={item.subtitle} router={router} href={item.href}/>}
                />
            </View>
            {contextValues.socketMessage.type == "generate_summary_response" && <View style = {{position: "absolute", bottom: 10, left: 0, right: 0, elevation: 5, zIndex: 2, height: 400, borderRadius: 10, backgroundColor: "white", margin: 10}}>
                <Text>
                    {}
                </Text>
            </View>}
            
        </View>
    )

}

