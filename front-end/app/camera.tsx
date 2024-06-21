import { Link } from "expo-router";
import { Text, View, TextInput, Pressable } from "react-native";
import React from "react";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { firebase } from "@react-native-firebase/functions";
import { ISharedValue, useSharedValue } from "react-native-worklets-core";
import { useFrameProcessor, runAtTargetFps, Frame } from "react-native-vision-camera";
import { crop } from "vision-camera-cropper";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { serverURL } from "@/constants/WebSocketURLs";
import { uploadFiles } from "@/utils/geminiFunctions";


interface firebaseFnResult {
  data: {
    text: string
  }
};


export default function CameraScreen() {


  var ws = new WebSocket(serverURL)
  console.log(ws)


  const jpgQueue = useSharedValue<string[]>([]);
  const b64Queue = useSharedValue<string[]>([]);

  const camera_ref = React.useRef<Camera>(null);
  const [msgText, updateText] = React.useState("");
  const [fnReturnText, updateFnReturn] = React.useState("placeholder");

  
  const nullFrameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet'
    runAtTargetFps(1, () => {
      "worklet"
      console.log("nothing")
    })
  }, []);

  const jpgFrameProcessor =  useFrameProcessor((frame: Frame) => {
    'worklet'
    runAtTargetFps(1, () => {
      'worklet'
      const result_frame = crop(frame, {includeImageBase64:true,saveAsFile:false})
      // console.log("\nFRAME_PROCESSOR| result_frame: ", result_frame)
      // console.log("\nFRAME_PROCESSOR| old b64Queue: ", b64Queue.value)
      const result_b64 = result_frame.base64
      if (result_b64) {
          console.log("\nFRAME_PROCESSOR| pushing array...")
          b64Queue.value.push(result_b64)
      } 
      // console.log("\nFRAME_PROCESSOR| new b64Queue: ", b64Queue.value)
      
    })
    }, [jpgQueue, b64Queue])
    
  const [curFrameProcessor, setFrameProcessor] = React.useState(nullFrameProcessor);


  const [loopUpload, setLoopUpload] = React.useState<NodeJS.Timeout>();

  const startConversation = () => {
    // start convo
    if (curFrameProcessor == nullFrameProcessor) {
      setFrameProcessor(jpgFrameProcessor)
      ws.send("REC_STARTED");
      const interval = setInterval(() => {uploadFiles(ws, b64Queue); console.log("intervalID: ", interval)}, 2000);
      setLoopUpload(interval)
    }
    
    // end convo
    if (curFrameProcessor != nullFrameProcessor) {
      setFrameProcessor(nullFrameProcessor);
      console.log("Clear IntervalID", loopUpload)
      clearInterval(loopUpload)
      console.log("\nGLOBAL| jpgQueue:\n", jpgQueue.value.length);
      console.log("\nGLOBAL| b64Queue:\n", b64Queue.value.length);
      // const response = await generateText(ws, prompts.describePicture, b64Queue.value)
      // console.log("gemini response:", JSON.stringify(response));
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