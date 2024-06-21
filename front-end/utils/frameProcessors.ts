import { useFrameProcessor, runAtTargetFps, Frame } from "react-native-vision-camera";
import { ISharedValue, useRunOnJS, useSharedValue, useWorklet } from "react-native-worklets-core";
import { CropResult, crop } from "vision-camera-cropper";
import { GeminiFile, uploadFile } from "./geminiFunctions";


export function _jpgFrameProcessor(jpgQueue_pm: ISharedValue<string[]>, arrayQueue: ISharedValue<String[]>) {
       

    return (
        useFrameProcessor((frame: Frame) => {
            'worklet'
            runAtTargetFps(1, () => {
                'worklet'
                const result_frame = crop(frame)
                console.log("\nFRAME_PROCESSOR| result_frame: ", result_frame)
                console.log("\nFRAME_PROCESSOR| old arrayQueue: ", arrayQueue.value)
                const result_b64 = result_frame.base64
                if (result_b64) {
                    console.log("\nFRAME_PROCESSOR| pushing to array...")
                    arrayQueue.value.push(result_b64)
                } 
                // arrayQueue.value.push(result)
                console.log("\nFRAME_PROCESSOR| new arrayQueue: ", arrayQueue.value)
                 
            })
        }, [jpgQueue_pm, arrayQueue])
    )
}


export function _nullFrameProcessor() {
    
    return (
        useFrameProcessor((frame: Frame) => {
            'worklet'
            runAtTargetFps(1, () => {
                console.log("nothing")
            })
        }, [])
    )
}