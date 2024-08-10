import React from "react";
import { Animated, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";
import { AuthContext, AuthContextValues } from "@/components/AuthContext";
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";

export default function ChatStart() {

    const {user, setUser}: AuthContextValues = React.useContext(AuthContext)
    const contextValues: ConnectionContextValues = React.useContext(ConnectionContext)
    const router = useRouter()

    React.useEffect(() => {
        
        const event = {
            type: 'START_SESSION',
            user_id: user?.uid
        }
        
        contextValues.socket.send(JSON.stringify(event))
    })


    return (
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

            {/* hand wave */}
            <View style={{flex: 2, alignItems: 'center', justifyContent: 'flex-start', padding: 10}}>
                <Pressable
                    style = {{borderWidth: 1, borderColor: "white"}}
                    onPress={() => {router.push({pathname: '/chat/camera'}); console.log("Pressed")}}
                >
                    <Text
                        style = {{
                            fontSize: 100
                        }}
                    >
                        {String.fromCodePoint(0x1F44B)}
                    </Text>
                </Pressable>
            </View>

        </View>
    )

}