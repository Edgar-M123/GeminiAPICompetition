import React from "react";
import { Animated, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useRouter } from "expo-router";

export default function ChatStart() {

    const router = useRouter()


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