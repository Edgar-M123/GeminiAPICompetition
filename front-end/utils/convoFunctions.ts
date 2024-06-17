import { Audio } from 'expo-av'
import React from 'react'
import { ReadonlyFrameProcessor } from 'react-native-vision-camera';
import { uploadFile } from './geminiFunctions';

const startRecording = async (
    permissionResponse: Audio.PermissionResponse, 
    setFrameProcessor: React.Dispatch<React.SetStateAction<ReadonlyFrameProcessor>>,
    requestPermission: () => Promise<Audio.PermissionResponse>,
    frameProcessor: ReadonlyFrameProcessor) => {
	
    try {
      if (permissionResponse.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

	console.log("Starting recording");
	setFrameProcessor(frameProcessor);
	const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
	console.log("Recording started");
	} catch (err) {
      console.error('Failed to start recording', err);
    }

}

export async function get_uris(jpg_array: string[], uri_array: string[]) {
  return
}