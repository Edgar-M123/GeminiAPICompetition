import { Link } from "expo-router";
import { Text, View, TextInput, Pressable } from "react-native";
import React from "react";
import { Camera, useFrameProcessor, useCameraDevice, useCameraPermission, CameraRuntimeError } from "react-native-vision-camera";
import { firebase } from "@react-native-firebase/functions";



interface firebaseFnResult {
  data: {
    text: string
  }
}



export default function CameraScreen() {
  
  const [msgText, updateText] = React.useState("");
  const [fnReturnText, updateFnReturn] = React.useState("placeholder");


  const testCloudFunction = async (textData: any) => {
    console.log(textData);
    console.log("Running cloud function");
    const result = await firebase.functions().httpsCallable('on_call_example')(
      {
        text: textData
      }
    ) as  firebaseFnResult;
    updateFnReturn(result.data.text);
    console.log('Cloud function ran');
    console.log("Cloud function result: ", result);
  };


  // const device = useCameraDevice('back');
  // const { hasPermission, requestPermission } = useCameraPermission();


  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    // console.log(`You're looking at a guy.`);
  }, []);
  
  const device = useCameraDevice('back')
  const { hasPermission, requestPermission } = useCameraPermission()
  
  if (!hasPermission) { 
    return requestPermission();
  };

  if (device == null) {
    return console.log("no camera")
  };


  return (
    <View style = {{flex: 1}}>
      <View style = {{flex:0}}>
        <Link href= "./" style={{color: 'blue', textDecorationLine: 'underline'}}>Back to Index</Link>
      </View>
      <View style = {{flex:0}}>
        <TextInput
          placeholder="Test text"
          style = {{padding: 10}}
          onChangeText={(text) => {updateText(text)}}
        />
      </View>
      <View style = {{flex:0, zIndex: 2, position: "absolute", bottom: 50, alignSelf: 'center', backgroundColor: 'white'}}>
        {msgText != "" && (<Text style = {{padding: 10}}>
          {msgText}
        </Text>
        )}
      </View>
      <View style = {{flex: 1}}>
        {device != null && (<Camera
          style={{flex: 1}}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          />
        )}
      </View>
      <View style = {{flex: 1}}>
        <Pressable style = {{padding: 10, borderWidth: 1}}
          onPress={() => testCloudFunction(msgText)}
        
        >
          <Text>{fnReturnText}</Text>
        </Pressable>
      </View>
    </View>
  )
}