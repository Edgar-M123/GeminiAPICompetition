import { ReadonlyFrameProcessor, useFrameProcessor, Frame, runAtTargetFps } from "react-native-vision-camera";
import { crop } from "vision-camera-cropper";
import { useSharedValue, ISharedValue } from "react-native-worklets-core";
import { Audio } from 'expo-av'
import { getCamPerms, getAudioPerms } from "@/utils/permissionReqs";
import { uploadFiles } from "@/utils/geminiFunctions";
import React, { ImgHTMLAttributes, SetStateAction, useState } from "react";

import { ConnectionContextValues } from "@/components/ConnectionContext";

 
const meteringThreshold = -45;

class Conversation {
    recordingOptions: Audio.RecordingOptions = {
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
    

    checkSpeechEnd(status: Audio.RecordingStatus, b64queue: ISharedValue<string[]>) {
        // console.log("Recording metering level", status.metering)
        
        if (status.metering && status.metering < meteringThreshold) {
            console.log("Metering below ", meteringThreshold);
            if (this.audioTimeout == undefined) {
                console.log("No audioTimeout. Starting end sequence");
                this.audioTimeout = setTimeout(() => {
                    this.startConversation()
                }, 2000);
        
            };
        
        } else {
            console.log("Metering not below ", meteringThreshold);
            if (this.audioTimeout != undefined) {
                console.log("Clearing audioTimeout");
                clearTimeout(this.audioTimeout);
                this.audioTimeout = undefined
            };
        
        };
    };
    
    async startAudioRecording(b64queue: ISharedValue<string[]>) {
      
        try {
            console.log("AUDIO RECORDING: Getting permissions...");
            getAudioPerms();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            console.log("AUDIO RECORDING: Permissions good.");
            
            console.log("AUDIO RECORDING: Starting recording audio...");
            const { recording } = await Audio.Recording.createAsync(this.recordingOptions, (status) => {this.checkSpeechEnd(status, b64queue)}, 100);
            this.audioRecording = recording;
            console.log("AUDIO RECORDING: Audio recorded started successfully.");
        } catch (err) {
            console.error('AUDIO RECORDING: Failed to start recording audio', err);
            return {result: "failed", err: err};
        };
    
        return null;
    };

    async stopAudioRecording(): Promise<Blob | undefined> {
        console.log('Stopping recording..');
        
        await this.audioRecording?.stopAndUnloadAsync();
        await Audio.setAudioModeAsync(
          {
            allowsRecordingIOS: false,
          }
        );
      
        console.log("AUDIO RECORDING: Getting audio recording URI")
        const uri = this.audioRecording?.getURI();
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

    sendAudioBlob(audioBlob: Blob) { // function to send audio and generate text request
    const reader = new FileReader()
    reader.addEventListener("load", () => {
        console.log("AUDIO RECORDING: blob filereader result: ", reader.result?.slice(0, 25));
        console.log("AUDIO RECORDING: Sending blob to ws...")
        this.contextValues.socket.send(JSON.stringify({type: "AUDIO_UPLOAD", b64_string: reader.result}))
        console.log("AUDIO RECORDING: Blob sent to ws.")
        console.log("Sending generate text request...")
        this.contextValues.socket.send(JSON.stringify({type: "GENERATE_TEXT"}));
        console.log("Sent generate text request")
    })
    console.log("AUDIO RECORDING: reading audio blob")
    reader.readAsDataURL(audioBlob)
    
    }
    

    async startConversation() {
      // start convo
      if (this.curFrameProcessor == undefined) {
        
        let b64queue = useSharedValue<string[]>([])
        const jpgFrameProcessor =  useFrameProcessor((frame: Frame) => { // frameprocesser that grabs 1 frame-per-second and converts to b64string, then adds to b64Queue
          'worklet'
          runAtTargetFps(1, () => {
            'worklet'
            const result_frame = crop(frame, {includeImageBase64:true,saveAsFile:false})
            const result_b64 = result_frame.base64
            if (result_b64 != undefined) {
              console.log("\nFRAME_PROCESSOR| pushing array...")
              b64queue.value.push(result_b64)
            } 
            
            })
        }, [b64queue])

          console.log("Starting Conversation")
          this.changeFrameProcessor(jpgFrameProcessor) // set frame processor to start saving frames
          this.contextValues.socket.send(JSON.stringify({type: "message",  data: "REC_STARTED"})); // send message to ws
          const result = await this.startAudioRecording(b64queue) // try to start audio recording.
          
          if (result != null) {
            console.log(result.err)
            this.changeFrameProcessor(undefined)
            return;
          } else {
            this.uploadInterval = setInterval(() => {uploadFiles(this.contextValues.socket, b64queue)}, 1000)
            return;
          }
        }

        
        // end convo
        if (this.curFrameProcessor != undefined) {
          console.log("Ending Conversation")
        
          this.changeFrameProcessor(undefined);
          console.log("Clear IntervalID", this.uploadInterval)
          clearInterval(this.uploadInterval)
          clearInterval(this.checkSpeechInterval)
    
          const audioBlob = await this.stopAudioRecording()
          if (audioBlob != undefined) {
            console.log("Awaiting audioblob")
            this.sendAudioBlob(audioBlob)
            return;
          } else {
            console.log("Audio blob failed.")
            return;
          }
        }
      }

    
    
}


export default Conversation