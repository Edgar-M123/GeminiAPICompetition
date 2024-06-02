import { Link } from "expo-router";
import { Text, View } from "react-native";
import React from "react";
import { Camera, useFrameProcessor, useCameraDevice, useCameraPermission, CameraRuntimeError } from "react-native-vision-camera";



export default function CameraScreen() {
  
  


  // const device = useCameraDevice('back');
  // const { hasPermission, requestPermission } = useCameraPermission();


  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet'
  //   console.log(`You're looking at a guy.`);
  // }, []);
  
  const device = useCameraDevice('back')
  const { hasPermission } = useCameraPermission()
  
  if (!hasPermission) { 
    return requestPermission();
  };

  if (device == null) {
    return console.log("no camera")
  };


  return (
    <Camera
      androidPreviewViewType="surface-view"
      style={{flex: 1}}
      device={device}
      isActive={true}
    />
  )
}
  // return (
  //     <View
  //       style={{
  //         flex: 2,
  //         justifyContent: "center",
  //         alignItems: "center",
  //       }}
  //     >
  //       <Link href= "./" style={{color: 'blue', textDecorationLine: 'underline'}}>Hello</Link>
  //       <Text>This is the camera screen.</Text>
  //       <View>
  //           <Camera 
  //             isActive = {false}
  //             device={device}
  //             // frameProcessor={frameProcessor}
  //             style = {{flex: 1}}
  //             />
  //       </View>
  //     </View>
  //   );
  // }
  