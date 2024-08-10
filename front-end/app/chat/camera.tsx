import React, { useContext } from "react";
import { Text, View, TextInput, Pressable, ScrollView, SafeAreaView } from "react-native";
import Voice, { SpeechEndEvent, SpeechErrorEvent, SpeechRecognizedEvent, SpeechResultsEvent, SpeechStartEvent, SpeechVolumeChangeEvent } from '@react-native-voice/voice'
import { Camera, useCameraDevice, useCameraFormat, ReadonlyFrameProcessor } from "react-native-vision-camera";
import * as FileSystem from 'expo-file-system'
import { Audio, AVPlaybackStatus, AVPlaybackStatusError, AVPlaybackStatusSuccess } from 'expo-av'
import { useRouter } from "expo-router";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { ConnectionContext, ConnectionContextValues } from "@/components/ConnectionContext";
import Conversation from "@/types/Conversation";
import { Colors } from "@/constants/Colors";


export default function CameraScreen() {
  
  const contextValues: ConnectionContextValues = useContext(ConnectionContext) // WebSocket values

  const camera_ref = React.useRef<Camera>(null);
  const button_ref = React.useRef<View>(null);
  
  const [curFrameProcessor, setCurFrameProcessor] = React.useState<ReadonlyFrameProcessor | undefined>(undefined)
  const [isTTSPlaying, setIsTTSPlaying] = React.useState<boolean>()
  const [isSessionActive, setIsSessionActive] = React.useState<boolean>(true)
  let conversation = new Conversation(contextValues, setCurFrameProcessor)
  

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
        status.isLoaded == true ? setIsTTSPlaying(status.isPlaying) : setIsTTSPlaying(status.isLoaded);
      }
    );
    await sound.sound.setProgressUpdateIntervalAsync(100)

    console.log("Playing sound from mp3")
    await sound.sound.playAsync()

  }

  // TODO: Add generic responses to fill in gap between speech end and response creation
    // download mp3 files of tts saying generic phrases
    // on GENERATE TEXT call, choose random file and play audio

   
  const device = useCameraDevice('front');
  getCamPerms(device);
  getMicPerms(device);
  getAudioPerms();

  const router = useRouter()
  
  // set conversation effect
  React.useEffect(() => {
    console.log("conversation.curFrameProcessor updated. Setting state")
    setCurFrameProcessor(conversation.curFrameProcessor)
    console.log("curFrameProcessor has been set")

  }, [conversation.curFrameProcessor])
  
  // voice recog config effect
  React.useEffect(() => {
    Voice.onSpeechStart = (e: SpeechStartEvent) => {console.log("onSpeechStart: ", e);;};
    Voice.onSpeechRecognized = (e: SpeechRecognizedEvent) => {console.log("onSpeechRecognized: ", e); };
    Voice.onSpeechEnd = (e: SpeechEndEvent) => {console.log("onSpeechEnd: ", e);};
    Voice.onSpeechError = (e: SpeechErrorEvent) => {console.log("onSpeechError: ", e);};
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {console.log("onSpeechResults: ", e);};
    Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {console.log("onSpeechPartialResults: ", e); _destroyRecognizer(); conversation.startConversation().then(); };
    Voice.onSpeechVolumeChanged = (e: SpeechVolumeChangeEvent) => {console.log("onSpeechVolumeChanged: ", e);};
  }, [])

  // voice recog usecase effect
  React.useEffect(() => {
    isSessionActive && !isTTSPlaying && conversation.curFrameProcessor == undefined ? _startRecognizing() : null
  }, [isSessionActive, isTTSPlaying, conversation.curFrameProcessor])

  // play tts effect
  React.useEffect(() => {
    
    console.log("tts effect run")
    if (contextValues.socketMessage != undefined && contextValues.socketMessage.type == "generate_text_response") {
      const data = JSON.parse(contextValues.socketMessage.data);
      console.log('Playing tts');
      playTTS(data.b64_audio).then(() => console.log("tts done"));
    };

  }, [contextValues.socketMessage]);



  // during tts, start recognizing (DOESNT WORK, STARTS RECOGNIZING TTS)
  // after tts, start recognizing
  // when recognized, start conversation and stop recognizing
  // when conversation done, play tts
  // repeat
  const _startRecognizing = async () => {
    try {
      await Voice.start('en-US', {EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 5000});
      console.log('called start');
    } catch (e) {
      console.error(e);
    }
  };

  const _stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const _cancelRecognizing = async () => {
    try {
      await Voice.cancel();
    } catch (e) {
      console.error(e);
    }
  };

  const _destroyRecognizer = async () => {
    try {
      await Voice.destroy();
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    
    const user: FirebaseAuthTypes.User | null = auth().currentUser

    console.log("user: ", user)
    console.log("user_id: ", user?.uid)

    const event = {
        type: 'START_SESSION',
        user_id: user?.uid
    }
    
    contextValues.socket?.send(JSON.stringify(event))
    console.log("sent START_SESSION request")
}, [])


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