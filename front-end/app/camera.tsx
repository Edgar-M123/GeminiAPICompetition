import { Link } from "expo-router";
import { Text, View } from "react-native";
import React from "react";
import "react-native-vision-camera"
import { Camera, useFrameProcessor } from "react-native-vision-camera";

const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    console.log(`You're looking at a guy.`)
  }, [])


export default function CameraScreen() {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Link href= "./" style={{color: 'blue', textDecorationLine: 'underline'}}>Hello</Link>
        <Text>This is the camera screen.</Text>
        <View>
            <Camera frameProcessor={frameProcessor}/>
        </View>
      </View>
    );
  }
  