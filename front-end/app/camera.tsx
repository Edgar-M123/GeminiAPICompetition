import { Link } from "expo-router";
import { Text, View, TextInput, Pressable } from "react-native";
import React from "react";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { firebase } from "@react-native-firebase/functions";
import { ISharedValue, useSharedValue } from "react-native-worklets-core";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { _arrayBufferToBase64 } from '@/utils/arrayBufferToB64'
import { _jpgFrameProcessor, _nullFrameProcessor } from "@/utils/frameProcessors";
import { GeminiFile, clearFiles, generateText } from "@/utils/geminiFunctions";
import prompts from "@/constants/Prompts";


interface firebaseFnResult {
  data: {
    text: string
  }
};
const geminiModel: string = "gemini-1.5-pro"

clearFiles()



export default function CameraScreen() {
  
  const jpgQueue = useSharedValue<string[]>([]);
  const uriQueue = useSharedValue<string[]>([]);

  const camera_ref = React.useRef<Camera>(null);
  const [msgText, updateText] = React.useState("");
  const [fnReturnText, updateFnReturn] = React.useState("placeholder");

  
  const nullFrameProcessor = _nullFrameProcessor();
  const jpgFrameProcessor = _jpgFrameProcessor(jpgQueue, uriQueue);
  const [curFrameProcessor, setFrameProcessor] = React.useState(nullFrameProcessor);
  
  
  const startConversation = async () => {
    // start convo
    if (curFrameProcessor == nullFrameProcessor) {
      setFrameProcessor(jpgFrameProcessor)
      return
    }
    
    // end convo
    if (curFrameProcessor != nullFrameProcessor) {
      setFrameProcessor(nullFrameProcessor)
      console.log("\nGLOBAL| jpgQueue:\n", JSON.stringify(jpgQueue));
      console.log("\nGLOBAL| uriQueue:\n", JSON.stringify(uriQueue));
      const response = await generateText(geminiModel, prompts.describePicture, uriQueue.value)
      console.log("gemini response:", JSON.stringify(response));
      console.log(response.candidates[0].content.parts[0].text);
      clearFiles()
      return
    }
  }
  
  
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

  
  const device = useCameraDevice('back');
  
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();

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
      <View style = {{flex:0, zIndex: 2, position: "absolute", bottom: 10, alignSelf: 'center', backgroundColor: 'white'}}>
        <Pressable
        style = {{padding: 10, alignItems: 'center', borderWidth: 1}}
        onPress={async () => startConversation()}
        >
          <Text>start conversation</Text>
        </Pressable>
      </View>
      <View style = {{flex: 1}}>
        {device != null && (
        <Camera
          ref={camera_ref}
          style={{flex: 1}}
          device={device}
          isActive={true}
          video = {true}
          audio = {true}
          frameProcessor={curFrameProcessor}
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