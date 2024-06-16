import { Link } from "expo-router";
import { Text, View, TextInput, Pressable } from "react-native";
import React from "react";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { firebase } from "@react-native-firebase/functions";

import { getAudioPerms, getCamPerms, getMicPerms } from '@/utils/permissionReqs';
import { _arrayBufferToBase64 } from '@/utils/arrayBufferToB64'
import { _jpgFrameProcessor, _nullFrameProcessor } from "@/utils/frameProcessors";
import { clearFiles } from "@/utils/geminiFunctions";


interface firebaseFnResult {
  data: {
    text: string
  }
};



const jpgQueue: Array<string> = [];

clearFiles()
    

const recordVideo = async (ref: React.RefObject<Camera>, state: string, updateState: React.Dispatch<React.SetStateAction<string>>) => {
  
  if (state == 'none') {
    await ref.current?.startRecording({
      onRecordingFinished: (video) => console.log(video),
      onRecordingError: (error) => console.error(error),
      fileType: 'mp4'
      });
    console.log('Recording started...')

    setTimeout(async () => {
      await ref.current?.stopRecording();
      console.log('Recording timed out.')
      updateState('none');
    }, 5000)
    

    updateState('recording');
  };

  if (state == 'recording') {
    console.log('Awaiting recording stoppage...')
    await ref.current?.stopRecording()
    console.log('Recording stopped.')
    
    updateState('none')
  }
}



export default function CameraScreen() {
  
  const camera_ref = React.useRef<Camera>(null);
  const [msgText, updateText] = React.useState("");
  const [fnReturnText, updateFnReturn] = React.useState("placeholder");
  const [videoState, updateVideoState] = React.useState("none");
  
  const nullFrameProcessor = _nullFrameProcessor();
  const jpgFrameProcessor = _jpgFrameProcessor(jpgQueue);
  const [curFrameProcessor, setFrameProcessor] = React.useState(nullFrameProcessor);

  
  
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
        onPress={() => recordVideo(camera_ref, videoState, updateVideoState)}
        >
          <Text>rec</Text>
        </Pressable>
        <Pressable
        style = {{padding: 10, alignItems: 'center', borderWidth: 1}}
        onPress={() => setFrameProcessor(jpgFrameProcessor)}
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