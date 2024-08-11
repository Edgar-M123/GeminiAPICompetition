import React, { useContext } from "react";
import { Text, View, TextInput, Pressable, ScrollView, SafeAreaView, Image } from "react-native";
import Voice, { SpeechEndEvent, SpeechErrorEvent, SpeechRecognizedEvent, SpeechResultsEvent, SpeechStartEvent, SpeechVolumeChangeEvent } from '@react-native-voice/voice'
import { Frame, Camera, useCameraDevice, useCameraFormat, ReadonlyFrameProcessor, useFrameProcessor, runAtTargetFps } from "react-native-vision-camera";
import * as FileSystem from 'expo-file-system'
import { crop } from "vision-camera-cropper";
import { Audio, AVPlaybackStatus, AVPlaybackStatusError, AVPlaybackStatusSuccess, } from 'expo-av'
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { uploadFiles } from "@/utils/geminiFunctions";


import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";
import Conversation from "@/types/Conversation";
import { Colors } from "@/constants/Colors";
import { useSharedValue } from "react-native-worklets-core";

const meteringThreshold = -45;

const recordingOptions: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.mp3',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000
  },
  ios: {
    extension: '.mp3',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};


export default function CameraScreen() {
  
  const contextValues: ConnectionContextValues = useContext(ConnectionContext) // WebSocket values
  const router = useRouter()
  
  const camera_ref = React.useRef<Camera>(null);
  const button_ref = React.useRef<View>(null);
  
  const device = useCameraDevice('front');
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();
  
  let b64queue = useSharedValue<string[]>([])
  const jpgFrameProcessor =  useFrameProcessor((frame: Frame) => { // frameprocesser that grabs 1 frame-per-second and converts to b64string, then adds to b64Queue
    'worklet'
    runAtTargetFps(1, () => {
      'worklet'
      const result_frame = crop(frame, {includeImageBase64:true,saveAsFile:false})
      const result_b64 = result_frame.base64
      if (result_b64 != undefined) {
        console.log("\nFRAME_PROCESSOR| pushing array...")
        b64queue.value.push(result_b64)
      } 
      
      })
  }, [b64queue])
  
  const [curFrameProcessor, setCurFrameProcessor] = React.useState<ReadonlyFrameProcessor | undefined>(undefined)
  const [audioRecording, setAudioRecording] = React.useState<Audio.Recording | undefined>()
  let audioTimeout: NodeJS.Timeout | undefined;
  let uploadInterval: NodeJS.Timeout | undefined;

  async function playTTS(b64_string: string) {
    
    console.log("Creating mp3 from b64_string")
    await FileSystem.writeAsStringAsync((FileSystem.cacheDirectory + "tts_audio.mp3"), b64_string, { encoding: FileSystem.EncodingType.Base64 });

    console.log("Creating sound from mp3")
    const sound = await Audio.Sound.createAsync(
      { uri: (FileSystem.cacheDirectory + "tts_audio.mp3") }, 
      {}, 
      (status: AVPlaybackStatus) => {
        console.log("AVPlabackStatus isLoaded: ", status.isLoaded);
        status.isLoaded == true ? console.log("AVPlabackStatus isPlaying: ", status.isPlaying) : null;
      }
    );
    await sound.sound.setProgressUpdateIntervalAsync(100)

    console.log("Playing sound from mp3")
    await sound.sound.playAsync()

  }

  async function startAudioRecording() {
      
    try {
        console.log("AUDIO RECORDING: Getting permissions...");
        getAudioPerms();
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
        });
        console.log("AUDIO RECORDING: Permissions good.");
        
        console.log("AUDIO RECORDING: Starting recording audio...");
        const { recording } = await Audio.Recording.createAsync(recordingOptions);
        setAudioRecording(recording);
        console.log("AUDIO RECORDING: Audio recorded started successfully.");
    } catch (err) {
        console.error('AUDIO RECORDING: Failed to start recording audio', err);
        return {result: "failed", err: err};
    };

    return null;
};

async function stopAudioRecording(): Promise<Blob | undefined> {
    console.log('Stopping recording..');
    
    setAudioRecording(undefined)
    await audioRecording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
  
    console.log("AUDIO RECORDING: Getting audio recording URI")
    const uri = audioRecording?.getURI();
    if (uri != undefined) {
      console.log('AUDIO RECORDING: Recording stopped and stored at', uri);
      console.log('AUDIO RECORDING: Getting audio blob...');
      const audioFile = await fetch(uri)
      const audioBlob = audioFile.blob()
      console.log("AUDIO RECORDING: audioBlob received.")
      return audioBlob
    }
  
    return undefined
}

function sendAudioBlob(audioBlob: Blob) { // function to send audio and generate text request
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


async function startConversation(uploadInterval: NodeJS.Timeout | undefined) {
  // start convo
  if (curFrameProcessor == undefined) {
    

      console.log("Starting Conversation")
      setCurFrameProcessor(jpgFrameProcessor) // set frame processor to start saving frames
      contextValues.socket.send(JSON.stringify({type: "message",  data: "REC_STARTED"})); // send message to ws
      const result = await startAudioRecording() // try to start audio recording.
      
      if (result != null) {
        console.log(result.err)
        setCurFrameProcessor(undefined)
        return;
      } else {
        uploadInterval = setInterval(() => {uploadFiles(contextValues.socket,  b64queue)}, 1000)
        return;
      }
    }

    
    // end convo
    if (curFrameProcessor != undefined) {
      console.log("Ending Conversation")
    
      setCurFrameProcessor(undefined);
      console.log("Clear IntervalID", uploadInterval)
      clearInterval(uploadInterval)

      const audioBlob = await stopAudioRecording()
      if (audioBlob != undefined) {
        console.log("Awaiting audioblob")
        sendAudioBlob(audioBlob)
        return;
      } else {
        console.log("Audio blob failed.")
        return;
      }
    }
  }


  // TODO: Add generic responses to fill in gap between speech end and response creation
    // download mp3 files of tts saying generic phrases
    // on GENERATE TEXT call, choose random file and play audio


  // play tts effect
  React.useEffect(() => {
    
    console.log("tts effect run")
    if (contextValues.socketMessage != undefined && contextValues.socketMessage.type == "generate_text_response") {
      const data = JSON.parse(contextValues.socketMessage.data);
      console.log("gemini text response: ", contextValues.socketMessage)
      console.log('Playing tts');
      playTTS(data.b64_audio).then(() => console.log("tts done"));
    };

  }, [contextValues.socketMessage]);

  React.useEffect(() => {

    const event = {
      type: "START_SESSION",
      user_id: auth().currentUser?.uid
    }
    
    contextValues.socket.send(JSON.stringify(event))
  }, [])


  return (

    <SafeAreaView style = {{flex: 1}}>

      {/* settings button */}
      <Pressable 
        style = {{flex: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2, position: "absolute", top: 20, right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.dark.background}}
        onPress={() => {router.push("/chat/settings")}}
      >
        <Image source={require("../../assets/images/settings.png")} style={{height: 20, width: 20, tintColor: "white"}}/>
      </Pressable>

      {/* signout button */}
      <Pressable 
        style = {{flex: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2, position: "absolute", top: 20, right: 70, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.dark.background}}
        onPress={() => {auth().signOut().then(() => {console.log('User signed out!'); router.replace("/");})}}
      >
        <Image source={require("../../assets/images/logout.png")} style={{height: 20, width: 20, tintColor: "white"}}/>
      </Pressable>

      {/* camera */}
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

      {/* text box - shows up only when there is text */}
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

      {/* recording button */}
      {/* Add voice recognition for detecting start and end of speech */}
      <View ref = {button_ref} style = {{flex:0, zIndex: 2, position: "absolute", bottom: 20, alignSelf: 'center', backgroundColor: 'transparent', borderRadius: 40, width: 80, height: 80, overflow: "hidden"}}>
        <Pressable
          style = {{padding: 10, paddingTop: 2, alignItems: 'center', borderRadius: 40, width: 80, height: 80, backgroundColor: "yellow", justifyContent: 'center'}}
          onPress={async () => {await startConversation(uploadInterval);}}
          android_ripple={{color: "black", foreground: true}}
        >
          {curFrameProcessor && (
            <Text style={{fontSize: 40}}>{"\u25A0"}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}