import { Text, View, TextInput, Pressable, ScrollView } from "react-native";
import React, { useContext } from "react";
import { useFrameProcessor, runAtTargetFps, Frame, Camera, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { ISharedValue, useSharedValue } from "react-native-worklets-core";
import { crop } from "vision-camera-cropper";
import { Audio } from 'expo-av'
import { firebase } from "@react-native-firebase/functions";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { SERVER_URL } from "@/constants/WebSocketURLs";
import { uploadFiles } from "@/utils/geminiFunctions";
import { startAudioRecording, stopAudioRecording } from "@/utils/convoFunctions";
import prompts from "@/constants/Prompts";
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";


interface firebaseFnResult {
  data: {
    text: string
  }
};

interface SocketMessage {
  type: string
  data: any
}


export default function CameraScreen() {
  
  const contextValues: ConnectionContextValues = useContext(ConnectionContext)

  var start: DOMHighResTimeStamp;
  var end: DOMHighResTimeStamp;

  const b64Queue = useSharedValue<string[]>([]);

  const camera_ref = React.useRef<Camera>(null);
  const [msgText, updateText] = React.useState("");
  
  
  const nullFrameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet'
  }, []);
  
  const jpgFrameProcessor =  useFrameProcessor((frame: Frame) => {
    'worklet'
    runAtTargetFps(1, () => {
      'worklet'
      const result_frame = crop(frame, {includeImageBase64:true,saveAsFile:false})
      const result_b64 = result_frame.base64
      if (result_b64 != undefined) {
        console.log("\nFRAME_PROCESSOR| pushing array...")
        b64Queue.value.push(result_b64)
      } 
      
    })
    }, [b64Queue])
    
  const [curFrameProcessor, setFrameProcessor] = React.useState(nullFrameProcessor);
  
  
  const [loopUpload, setLoopUpload] = React.useState<NodeJS.Timeout>();
  const [audioRecordingState, setAudioRecordingState] = React.useState<Audio.Recording>();

  const sendAudioBlob = (audioBlob: Blob) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      console.log("AUDIO RECORDING: blob filereader result: ", reader.result?.slice(0, 25));
      console.log("AUDIO RECORDING: Sending blob to ws...")
      contextValues.socket.send(JSON.stringify({type: "AUDIO_UPLOAD", b64_string: reader.result}))
      console.log("AUDIO RECORDING: Blob sent to ws.")
      console.log("Sending generate text request...")
      contextValues.socket.send(JSON.stringify({type: "GENERATE_TEXT"}));
      console.log("Sent generate text request")
    })
    console.log("AUDIO RECORDING: reading audio blob")
    reader.readAsDataURL(audioBlob)
    
  }

  const startConversation = async () => {
    // start convo
    if (curFrameProcessor == nullFrameProcessor) {
      setFrameProcessor(jpgFrameProcessor) // set frame processor to start saving frames
      contextValues.socket.send(JSON.stringify({type: "message",  data: "REC_STARTED"})); // send message to ws
      const result = await startAudioRecording(audioRecordingState, setAudioRecordingState) // try to start audio recording.

      if (result != null) {
        console.log(result.err)
        setFrameProcessor(nullFrameProcessor)
      } else {
        setLoopUpload(setInterval(() => {uploadFiles(contextValues.socket, b64Queue)}, 1000))      }
    }
    
    // end convo
    if (curFrameProcessor != nullFrameProcessor) {
    
      start = performance.now()
      console.log("Time start:", start)

      setFrameProcessor(nullFrameProcessor);
      console.log("Clear IntervalID", loopUpload)
      clearInterval(loopUpload)

      const audioBlob = await stopAudioRecording(audioRecordingState, setAudioRecordingState)
      if (audioBlob != undefined) {
        console.log("Awaiting audioblob")
        sendAudioBlob(audioBlob)
      } else {
        console.log("Audio blob failed.")
      }

     
    }
  }
  

  
  const device = useCameraDevice('front');
  
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();

  return (
    <View style = {{flex: 1}}>
      <View style = {{flex:0, zIndex: 2, position: "absolute", bottom: 150, maxHeight: 100, alignSelf: 'center', backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 10, margin: 10}}>
        {contextValues.socketMessage && contextValues.socketMessage.type == "generate_text_response" && (
          <ScrollView style = {{padding: 10}}>
            <Text>
            {contextValues.socketMessage.data}
            </Text>
          </ScrollView>
          )
        }
      </View>
      <View style = {{flex:0, zIndex: 2, position: "absolute", bottom: 20, alignSelf: 'center', backgroundColor: 'transparent', borderRadius: 40, width: 80, height: 80, overflow: "hidden"}}>
        <Pressable
          style = {{padding: 10, paddingTop: 2, alignItems: 'center', borderRadius: 40, width: 80, height: 80, backgroundColor: "yellow", justifyContent: 'center'}}
          onPress={async () => startConversation()}
          android_ripple={{color: "black", foreground: true}}
        >
          {curFrameProcessor == jpgFrameProcessor && (
            <Text style={{fontSize: 40}}>{"\u25A0"}</Text>
          )}
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
    </View>
  )
}