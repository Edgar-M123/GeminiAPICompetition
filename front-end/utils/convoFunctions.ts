import { Audio } from 'expo-av'
import { getAudioPerms } from './permissionReqs';
import React, { SetStateAction } from 'react';

const recordingOptions = {
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


export async function startAudioRecording(
  audioRecordingState: Audio.Recording | undefined, 
  setAudioRecordingState: React.Dispatch<SetStateAction<Audio.Recording | undefined>>,
  startConversation: () => Promise<void>, 
) {

	try {
      console.log("AUDIO RECORDING: Getting permissions...")
      getAudioPerms()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("AUDIO RECORDING: Permissions good.")
      
      console.log("AUDIO RECORDING: Starting recording audio...");
      let audioTimeout: NodeJS.Timeout;
      const { recording } = await Audio.Recording.createAsync(recordingOptions, (status) => {checkSpeechEnd(status, startConversation, audioTimeout)}, 100);
      setAudioRecordingState(recording)
      console.log("AUDIO RECORDING: Audio recorded started successfully.")
  } catch (err) {
    console.error('AUDIO RECORDING: Failed to start recording audio', err);
    return {result: "failed", err: err}
  }
  
  return null
  


}

export async function stopAudioRecording(audioRecordingState: Audio.Recording | undefined, setAudioRecordingState: React.Dispatch<SetStateAction<Audio.Recording | undefined>>): Promise<Blob | undefined> {
  console.log('Stopping recording..');
  
  setAudioRecordingState(undefined);
  await audioRecordingState?.stopAndUnloadAsync();
  await Audio.setAudioModeAsync(
    {
      allowsRecordingIOS: false,
    }
  );

  console.log("AUDIO RECORDING: Getting audio recording URI")
  const uri = audioRecordingState?.getURI();
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


export function checkSpeechEnd(
  status: Audio.RecordingStatus, 
  startConversation: () => Promise<void>, 
  audioTimeout: NodeJS.Timeout | undefined
  ) {

  console.log("Recording metering level", status.metering)

  if (status.metering && status.metering < -100) {
    console.log("Metering below -100")

    if (audioTimeout == undefined || audioTimeout == null) {
      console.log("No audioTimeout. Starting end sequence")

      audioTimeout = setTimeout(() => {
        startConversation()
      }, 2000)

    }

  } else {
    console.log("Metering not below 100")
    
    if (audioTimeout != undefined && audioTimeout != null) {
      console.log("Clearing audioTimeout")
      clearTimeout(audioTimeout)
    }
  
  }


}