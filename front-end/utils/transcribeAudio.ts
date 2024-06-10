const recorder = require('node-record-lpcm16')

// Imports the Google Cloud client library
import { SpeechClient, } from '@google-cloud/speech';
import { google } from '@google-cloud/speech/build/protos/protos';

// Creates a client
const client = new SpeechClient();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

const transcribeAudio = () => {
    
    const request: google.cloud.speech.v1.IStreamingRecognitionConfig = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
      },
      interimResults: false, // If you want interim results, set this to true
    };
    
    // Create a recognize stream
    const recognizeStream = client
      .streamingRecognize(request)
      .on('error', console.error)
      .on('data', data =>
        process.stdout.write(
          data.results[0] && data.results[0].alternatives[0]
            ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
            : '\n\nReached transcription time limit, press Ctrl+C\n'
        )
      );
    
    // Start recording and send the microphone input to the Speech API.
    // Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
    recorder
        .record({
            sampleRateHertz: sampleRateHertz,
            threshold: 0,
            // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
            verbose: false,
            recordProgram: 'rec', // Try also "arecord" or "sox"
            silence: '10.0',
            })
        .stream()
        .on('error', console.error)
        .pipe(recognizeStream);
    
    console.log('Listening, press Ctrl+C to stop.');
}

export default transcribeAudio;
