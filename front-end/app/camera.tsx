import { Link } from "expo-router";
import { Text, View, TextInput, Pressable } from "react-native";
import React from "react";
import { useFrameProcessor, runAtTargetFps, Frame, Camera, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { ISharedValue, useSharedValue } from "react-native-worklets-core";
import { crop } from "vision-camera-cropper";
import { Audio } from 'expo-av'
import { firebase } from "@react-native-firebase/functions";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { serverURL } from "@/constants/WebSocketURLs";
import { uploadFiles, uploadFiles_intarray } from "@/utils/geminiFunctions";
import { startAudioRecording, stopAudioRecording } from "@/utils/convoFunctions";
import prompts from "@/constants/Prompts";


interface firebaseFnResult {
  data: {
    text: string
  }
};


var ws: WebSocket = new WebSocket(serverURL)
ws.addEventListener("error", (ev) => {console.log("error event: ", ev)})
ws.addEventListener("open", (ev) => {console.log("open event: ", ev); ws.send(JSON.stringify({type: "message", data: "Accessing server from ASD Support App."}))})
ws.addEventListener("close", (ev) => {console.log("close event: ", ev); ws.send(JSON.stringify({type: "message", data: "Server connection has closed."}))})

export default function CameraScreen() {


  const jpgQueue = useSharedValue<string[]>([]);
  const b64Queue = useSharedValue<string[]>([]);
  const intArrayQueue: Uint8Array[] = [];

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
      
      // const result_int = new Uint8Array(frame.toArrayBuffer())
      // if (result_int) {
        //   console.log("\nFRAME_PROCESSOR| pushing array...")
        //   b64Queue_int.value.push(result_int)
        // } 
        
        
        const result_frame = crop(frame, {includeImageBase64:true,saveAsFile:false})
        const result_b64 = result_frame.base64
        if (result_b64) {
          console.log("\nFRAME_PROCESSOR| pushing array...")
          b64Queue.value.push(result_b64)
        } 
      
    })
    }, [jpgQueue, b64Queue])
    
  const [curFrameProcessor, setFrameProcessor] = React.useState(nullFrameProcessor);
  
  
  const [loopUpload, setLoopUpload] = React.useState<NodeJS.Timeout>();
  const [audioRecordingState, setAudioRecordingState] = React.useState<Audio.Recording>();

  const sendAudioBlob = (audioBlob: Blob) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      console.log("AUDIO RECORDING: blob filereader result: ", reader.result?.slice(0, 25));
      console.log("AUDIO RECORDING: Sending blob to ws...")
      ws.send(JSON.stringify({type: "AUDIO_UPLOAD", data: reader.result}))
      console.log("AUDIO RECORDING: Blob sent to ws.")
      console.log("Sending generate text request...")
      ws.send(JSON.stringify({type: "GENERATE_TEXT",  data: prompts.describeAudioPicture}));
      console.log("Sent generate text request")
    })
    console.log("AUDIO RECORDING: reading audio blob")
    reader.readAsDataURL(audioBlob)
    

  }

  const startConversation = async () => {
    // start convo
    if (curFrameProcessor == nullFrameProcessor) {
      setFrameProcessor(jpgFrameProcessor)
      ws.send(JSON.stringify({type: "message",  data: "REC_STARTED"}));
      startAudioRecording(audioRecordingState, setAudioRecordingState)
      const interval = setInterval(() => {uploadFiles(ws, b64Queue); console.log("intervalID: ", interval)}, 2000);
      setLoopUpload(interval)
    }
    
    // end convo
    if (curFrameProcessor != nullFrameProcessor) {
      
      setFrameProcessor(nullFrameProcessor);
      console.log("Clear IntervalID", loopUpload)
      clearInterval(loopUpload)

      const audioBlob = await stopAudioRecording(audioRecordingState, setAudioRecordingState)
      if (audioBlob) {
        console.log("Awaiting audioblob")
        sendAudioBlob(audioBlob)
      }

     
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

  
  const device = useCameraDevice('front');
  
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
          format={useCameraFormat(device, [{
            videoResolution: {width: 640, height: 480}
          }])}
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