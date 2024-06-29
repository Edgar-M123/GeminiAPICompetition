import { Text, View, TextInput, Pressable, ScrollView } from "react-native";
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

interface SocketMessage {
  type: string
  data: any
}


var ws: WebSocket = new WebSocket(serverURL)
ws.addEventListener("error", (ev) => {console.log("error event: ", ev)})
ws.addEventListener("open", (ev) => {
    console.log("open event: ", ev); 
    ws.send(JSON.stringify({type: "message", data: "Accessing server from ASD Support App."}));
  }
)
ws.addEventListener("close", (ev) => {
    console.log("close event: ", ev); 
    ws.send(JSON.stringify({type: "message", data: "Server connection has closed."}));
  }
)

export default function CameraScreen() {
  
  const [serverMessage, setServerMessage] = React.useState<SocketMessage>()

  React.useEffect(() => {
    ws.addEventListener("message", (ev) => {
        console.log("ON_MESSAGE: message received"); 
        const message: SocketMessage = JSON.parse(ev.data);
        setServerMessage(message);
        console.log("ON_MESSAGE: message type: ", message.type);
      }
    )
  }, [])

  const b64Queue = useSharedValue<string[]>([]);

  const camera_ref = React.useRef<Camera>(null);
  const [msgText, updateText] = React.useState("");
  
  
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
    }, [b64Queue])
    
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
  

  
  const device = useCameraDevice('front');
  
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();

  return (
    <View style = {{flex: 1}}>
      <View style = {{flex:0, zIndex: 2, position: "absolute", bottom: 150, maxHeight: 100, alignSelf: 'center', backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 10, margin: 10}}>
        {serverMessage && serverMessage.type == "generate_text_response" && (
          <ScrollView style = {{padding: 10}}>
            <Text>
            {serverMessage.data}
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