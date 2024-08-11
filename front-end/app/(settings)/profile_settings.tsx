import React from "react";
import { FlatList, Pressable, View, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SettingsListItem } from "@/components/SettingsComponents";
import { useRouter } from "expo-router";
import { ConnectionContext } from "@/components/ConnectionContext";
import auth from '@react-native-firebase/auth'


export default function Settings() {

    const router = useRouter()
    const contextValues = React.useContext(ConnectionContext)

    const [name, setName] = React.useState<string>()
    const [email, setEmail] = React.useState<string>()

    function changeSetting(setting: string) {

        const event = {
            type: "change_setting",
            user_id: auth().currentUser?.uid,
            setting: setting
        }

        contextValues.socket.send(JSON.stringify(event))
    }


    return (
        <View style = {{flex: 1, padding: 10}}>
            <View style = {{height: 150, padding: 10, borderRadius: 10, backgroundColor: "white", marginBottom: 10}}>
                <View style={{flex: 2}}>
                    <View style={{flex:1}}>
                        <Text>
                            Change Name
                        </Text>
                    </View>
                    <View style={{flex: 2, padding: 10, justifyContent: 'center', borderWidth: 1, borderColor: "lightgrey", borderRadius: 10}}>
                        <TextInput 
                            style={{backgroundColor: "#fff", padding:1}}
                            placeholder="Name here"
                            placeholderTextColor={"lightgrey"}
                            onChangeText={(text) => {setName(text)}}
                        />
                    </View>
                </View>
                <View style={{flex: 1, marginTop: 10}}>
                    <Pressable 
                        style = {{
                            backgroundColor: "gold", 
                            flex: 1, 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            borderRadius: 10
                        }}
                        onPress={() => {changeSetting("name")}}
                        android_ripple={{color: "black", foreground: true}}
                    >
                        <Text>
                            Save!
                        </Text>
                    </Pressable>
                </View>
            </View>
            <View style = {{height: 150, padding: 10, borderRadius: 10, backgroundColor: "white", marginBottom: 10}}>
                <View style={{flex: 2}}>
                    <View style={{flex:1}}>
                        <Text>
                            Change Email
                        </Text>
                    </View>
                    <View style={{flex: 2, padding: 10, justifyContent: 'center', borderWidth: 1, borderColor: "lightgrey", borderRadius: 10}}>
                        <TextInput 
                            style={{backgroundColor: "#fff", padding:1}}
                            placeholder="Name here"
                            placeholderTextColor={"lightgrey"}
                            onChangeText={(text) => {setEmail(text)}}
                        />
                    </View>
                </View>
                <View style={{flex: 1, marginTop: 10}}>
                    <Pressable 
                        style = {{
                            backgroundColor: "gold", 
                            flex: 1, 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            borderRadius: 10
                        }}
                        onPress={() => {changeSetting("email")}}
                        android_ripple={{color: "black", foreground: true}}
                    >
                        <Text>
                            Save!
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    )

}

