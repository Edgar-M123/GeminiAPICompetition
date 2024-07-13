import { Camera, useMicrophonePermission, CameraDevice } from "react-native-vision-camera";
import { Audio } from 'expo-av'


export const getCamPerms = async (device: CameraDevice | undefined) => {

    let cameraPermission = Camera.getCameraPermissionStatus();

    if (cameraPermission == 'not-determined'|| cameraPermission == 'denied') { 
        cameraPermission = await Camera.requestCameraPermission()
    };

    if (device == null) {
        return console.log("no camera")
    };
}
  
export const getMicPerms = (device: CameraDevice | undefined) => {
    
    const { hasPermission, requestPermission } = useMicrophonePermission();
    
    if (!hasPermission) { 
      return requestPermission();
    };
    
    if (device == null) {
      return console.log("no microphone")
    };
}

export const getAudioPerms = async() => {
    
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  try {
    if (permissionResponse?.status !== 'granted') {
      console.log('Requesting permission..');
      await requestPermission();
    }
  } catch (err) {
    console.error('Failed to start recording', err);
  }

}
