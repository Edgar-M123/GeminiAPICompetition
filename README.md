# ASD Support app for Google Gemini API Competition

### Hello!

### Pre-requisites
This app was coded using Windows 10 with the following frameworks and software.
- JDK 17
- Android Studio Jellyfish 2023.3.1
- React Native version 0.74.5
- Expo version 51.0.26

### Start-up Steps
To run this app locally, clone the repo, install the above software, and run the code in expo with the following steps:
1. In a terminal go into the front-end folder (e.g. C:/app_folder_name/front-end/)
2. run `npm install` and `expo install`
3. run `npx expo run:android --device`, and select the device of your choice (can be Android Studio emulator or a phone connected via USB.
4. The app should build and open on your device!

Once you're in the app, press on the login button and log into your Google account.

You're in the app once you see the Welcome! screen.

### Features to test

#### Conversational capabilities
Press the yellow button to start a message! You can talk and show your surroundings. 
1 frame will be uploaded per second to Gemini. 
Once you stop the message (by pressing the stop button), your audio will be uploaded. After a few seconds, Gemini will respond back to your message.
You can continue sending messages and Gemini will remember your conversation.

#### Behavioural Awareness
If you do any abnormal vocal or physical behaviours, Gemini will take note and store in your profile.

#### Generate session summary
On the camera screen, press the settings on the top right.

In the settings screen, you can press the Generate Summary button to get a summary of the topics of conversations and behaviours displayed throughout your various sessions with Gemini.
