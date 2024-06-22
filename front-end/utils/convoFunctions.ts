import { Audio } from 'expo-av'
import { getAudioPerms } from './permissionReqs';
import { SetStateAction } from 'react';

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


export async function startAudioRecording(audioRecordingState: Audio.Recording | undefined, setAudioRecordingState: React.Dispatch<SetStateAction<Audio.Recording | undefined>>) {
	try {
      console.log("AUDIO RECORDING: Getting permissions...")
      getAudioPerms()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("AUDIO RECORDING: Permissions good.")
      
      
	console.log("AUDIO RECORDING: Starting recording audio...");
	const { recording } = await Audio.Recording.createAsync(recordingOptions);
  setAudioRecordingState(recording)
  console.log("AUDIO RECORDING: Audio recorded started successfully.")
	} catch (err) {
      console.error('AUDIO RECORDING: Failed to start recording audio', err);
    }

}

export async function stopAudioRecording(audioRecordingState: Audio.Recording | undefined, setAudioRecordingState: React.Dispatch<SetStateAction<Audio.Recording | undefined>>): Promise<Blob | void> {
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
  if (uri) {
    console.log('AUDIO RECORDING: Recording stopped and stored at', uri);
    console.log('AUDIO RECORDING: Getting audio blob...');
    const audioFile = await fetch(uri)
    const audioBlob = audioFile.blob()
    console.log("AUDIO RECORDING: audioBlob received.")
    return audioBlob
  }

}