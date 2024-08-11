import React from "react";
import { Animated, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";

export default function ChatStart() {

    const router = useRouter()
    const contextValues: ConnectionContextValues = React.useContext(ConnectionContext)


    return (
        <SafeAreaView style={{flex: 1, backgroundColor: Colors.dark.background}}>
            <View style = {{flex: 1, backgroundColor: Colors.dark.background}}>
                
                {/* title */}
                <View style={{flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 10}}> 
                    <Text
                        style = {{
                            color: Colors.dark.tint,
                            fontSize: 40
                        }}
                    >
                        Welcome!
                    </Text>
                </View>
                
                {contextValues.isConnected == true ?
                    <View style={{flex: 2, alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                        <Pressable
                            style = {{}}
                            onPress={() => {router.push({pathname: '/chat/camera'}); console.log("Pressed")}}
                        >
                            <Text
                                style = {{
                                    fontSize: 100
                                }}
                            >
                                {String.fromCodePoint(0x1F44B)}
                            </Text>
                            <Text style = {{color: 'white', alignSelf: 'center'}}>
                                Tap me!
                            </Text>
                        </Pressable>
                    </View> : 
                    <View style={{flex: 2, alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                        <View style = {{borderRadius: 10, backgroundColor: "gold", padding: 10}}>
                            <Text>
                                Connecting!
                            </Text>
                        </View>
                    </View>
                }
            </View>

        </SafeAreaView>
    )

}