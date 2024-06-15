import { useFrameProcessor, useCameraDevice, runAtTargetFps, Frame, ReadonlyFrameProcessor } from "react-native-vision-camera";
import { CropResult, crop } from "vision-camera-cropper"



export const _jpgFrameProcessor = (frame: Frame) => {
    'worklet'
    runAtTargetFps(2, () => {
        'worklet'
        const cropRegion = {
        left:100,
        top:100,
        width:100,
        height:100
        }
        const result: CropResult = crop(frame,{saveAsFile:true});
        console.log(result.path);
    })
}

export const _nullFrameProcessor = (frame: Frame) => {
    'worklet'
    console.log("nothing")
}