import { useFrameProcessor, runAtTargetFps, Frame } from "react-native-vision-camera";
import { useRunOnJS } from "react-native-worklets-core";
import { CropResult, crop } from "vision-camera-cropper";
import { uploadFile } from "./geminiFunctions";


export function _jpgFrameProcessor(jpgQueue: Array<string>) {
    
    const uploadFile_fp = useRunOnJS(uploadFile, [])
    
    return (
        useFrameProcessor((frame: Frame) => {
            'worklet'
            runAtTargetFps(2, async () => {
                'worklet'
                const result: CropResult = crop(frame,{saveAsFile:true});
                console.log("\nimage path:\n", result.path);
                if (result.path != null) {
                    const responseData = await uploadFile_fp(result.path, jpgQueue)
                    console.log("response:\n", responseData, JSON.stringify(responseData))
                } 
            })
        }, [uploadFile_fp, jpgQueue])
    )
}

export function _nullFrameProcessor() {
    
    return (
        useFrameProcessor((frame: Frame) => {
            'worklet'
            console.log("nothing")
        }, [])
    )
}