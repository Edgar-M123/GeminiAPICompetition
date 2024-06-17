import { useFrameProcessor, runAtTargetFps, Frame } from "react-native-vision-camera";
import { ISharedValue, useRunOnJS, useSharedValue, useWorklet } from "react-native-worklets-core";
import { CropResult, crop } from "vision-camera-cropper";
import { GeminiFile, uploadFile } from "./geminiFunctions";
import { runOnJS } from "react-native-reanimated";


export function _jpgFrameProcessor(jpgQueue_pm: ISharedValue<string[]>, uriQueue: ISharedValue<string[]>) {
    

    const response_shared = useSharedValue<GeminiFile[]>([]);

    const uploadFile_fp = useRunOnJS((filename) => {
        uploadFile(filename).then((data) => {response_shared.value[0] = data; return data});
    }, [response_shared])
    
    return (
        useFrameProcessor((frame: Frame) => {
            'worklet'
            runAtTargetFps(1, () => {
                'worklet'
                const result: CropResult = crop(frame,{saveAsFile:true});
                console.log("\nFRAME_PROCESSOR| image path:\n", result.path);
                console.log("\nFRAME_PROCESSOR| initial jpgQueue:\n", JSON.stringify(jpgQueue_pm.value))
                if (result.path == undefined) {
                    return null
                }
                const name: string = result.path
                jpgQueue_pm.value.push(name)
                uploadFile_fp(name)
                const response: Array<{"file": GeminiFile}> | undefined = JSON.parse(JSON.stringify(response_shared.value))
                console.log("\nFRAME_PROCESSOR| response:\n", response, typeof response)
                if (response == undefined) {
                    return
                }
                const responseJson = response[0]
                console.log("\nFRAME_PROCESSOR| responseJson:\n", responseJson, typeof responseJson)


                console.log("\nFRAME_PROCESSOR| Pushing " + responseJson.file.uri + " to uriQueue...")
                uriQueue.value.push(responseJson.file.uri)
                console.log("\nFRAME_PROCESSOR| uriQueue after push: ", JSON.stringify(uriQueue.value))
                 
            })
        }, [uploadFile_fp, jpgQueue_pm, uriQueue, response_shared])
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