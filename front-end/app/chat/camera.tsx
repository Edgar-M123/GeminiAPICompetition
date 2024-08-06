import React, { useContext } from "react";
import { Text, View, TextInput, Pressable, ScrollView, SafeAreaView } from "react-native";
import Voice from '@react-native-voice/voice'
import { useFrameProcessor, runAtTargetFps, Frame, Camera, useCameraDevice, useCameraFormat, ReadonlyFrameProcessor } from "react-native-vision-camera";
import { crop } from "vision-camera-cropper";
import { useSharedValue } from "react-native-worklets-core";
import * as FileSystem from 'expo-file-system'
import { Audio } from 'expo-av'
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { uploadFiles } from "@/utils/geminiFunctions";
import { checkSpeechEnd, startAudioRecording, stopAudioRecording } from "@/utils/convoFunctions";
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";
import Conversation from "@/types/Conversation";
import { Colors } from "@/constants/Colors";


export default function CameraScreen() {
  
  const contextValues: ConnectionContextValues = useContext(ConnectionContext) // WebSocket values

  const camera_ref = React.useRef<Camera>(null);
  const button_ref = React.useRef<View>(null);
  
  const [curFrameProcessor, setCurFrameProcessor] = React.useState<ReadonlyFrameProcessor | undefined>(undefined)
  let conversation = new Conversation(contextValues, setCurFrameProcessor)
  

  async function playTTS(b64_string: string) {
    
    console.log("Creating mp3 from b64_string")
    await FileSystem.writeAsStringAsync((FileSystem.cacheDirectory + "tts_audio.mp3"), b64_string, { encoding: FileSystem.EncodingType.Base64 });

    console.log("Creating sound from mp3")
    const sound = await Audio.Sound.createAsync({ uri: (FileSystem.cacheDirectory + "tts_audio.mp3") });

    console.log("Playing sound from mp3")
    await sound.sound.playAsync()

  }

  // TODO: Add generic responses to fill in gap between speech end and response creation
    // download mp3 files of tts saying generic phrases
    // on GENERATE TEXT call, choose random file and play audio


  // TODO: Add Speech
    // Press button to start session. (DONE)
    // Every 0.1 seconds, check recording status (recording.getStatusAsync()) (DONE)
    // if metering in status is below certain volume threshold, then start countdown to stop recording (1-2s) (DONE)
    // Keep checking through the countdown, in case it was just a pause. (DONE)
      // if below threshold and countdown still in effect, do nothing (DONE)
    // outside of active conversation use react native voice to detect speech
    // upon speech detection, start new conversation
    
  const device = useCameraDevice('front');
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();

  const router = useRouter()

  React.useEffect(() => {
    
    console.log("effect run")
    if (contextValues.socketMessage != undefined && contextValues.socketMessage.type == "generate_text_response") {
      const data = JSON.parse(contextValues.socketMessage.data)
      console.log('Playing tts')
      playTTS(data.b64_audio).then(() => console.log("tts done"))
    }


  }, [contextValues.socketMessage])

  React.useEffect(() => {
    console.log("conversation.curFrameProcessor updated. Setting state")
    setCurFrameProcessor(conversation.curFrameProcessor)
    console.log("curFrameProcessor has been set")

  }, [conversation.curFrameProcessor])


  return (

    <SafeAreaView style = {{flex: 1}}>

      {/* settings button */}
      <Pressable 
        style = {{flex: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2, position: "absolute", top: 20, right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.dark.background}}
        onPress={() => {router.push("/chat/settings")}}
      >
        <Text style={{color: 'white'}}>set</Text>
      </Pressable>

      {/* signout button */}
      <Pressable 
        style = {{flex: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2, position: "absolute", top: 20, right: 70, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.dark.background}}
        onPress={() => {auth().signOut().then(() => {console.log('User signed out!'); router.replace("/");})}}
      >
        <Text style={{color: 'white'}}>out</Text>
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
          frameProcessor={conversation.curFrameProcessor}
          />
        )}
      </View>

      {/* text box - shows up only when there is text */}
      {/* TODO: Add speech-to-text */}
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
          onPress={async () => {await conversation.startConversation();}}
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