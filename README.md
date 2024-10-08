# ASD Support app for Google Gemini API Competition

### Hello!

### Quick Start

To get into the app quickly, you can install the provided signed APK onto an android device and use it through there. After installation, follow the Walkthrough instructions at the end.

If not using the APK, follow the pre-requisites and start-up steps below to run the code locally.

### Pre-requisites
This app was coded using Windows 10 with the following frameworks and software.
- JDK 17
- Android Studio Jellyfish 2023.3.1
- React Native version 0.74.5
- Expo version 51.0.26

### Start-up Steps
To run this app locally, clone the repo, install the above software, and run the code in expo with the following steps:
1. In a terminal go into the front-end folder (e.g. C:/app_folder_name/front-end/)
2. run `npm install`
3. run `npx expo install`
4. run `npx patch-package`
5. run `npx expo prebuild --clean`
6. run `npx expo run:android --device`, and select the device of your choice (can be Android Studio emulator or a phone connected via USB.
7. The app should build and open on your device!


### Walkthrough
1. Once you're in the app, press on the login button and log into your Google account. That should take you to the Welcome! screen.
2. On the Welcome! screen, you may see a yellow text that says "Connecting!". Wait for this to disappear and for a waving hand to appear. 
3. Once the hand has appeared, tap on it to go to the next screen.
4. On the Camera screen, you will be asked to provide Camera and Microphone permissions. If after providing these permissions, the screen is blank (you dont see the camera), then just go back to the Welcome screen and click the hand again, or restart the app.

#### Conversational capabilities
1. Press the yellow button to start a message! You can talk and show your surroundings. 1 frame will be uploaded per second to Gemini. 
2. When done your message, press the stop button Your audio will be uploaded. Please wait a few seconds, and Gemini will respond back to your message verbally.
You can continue sending messages and Gemini will remember your conversation.

#### Behavioural Awareness
If you do any abnormal vocal or physical behaviours, Gemini will take note and store it in your profile.

#### Generate session summary
1. On the camera screen, press the settings on the top right.
2. In the settings screen, you can press the Generate Summary button.
3. Wait a few seconds, and a summary of the topics of conversations and behaviours displayed throughout your various sessions with Gemini will be displayed on the bottom.
These sessions are stored in Firestore meaning they are carried over between sessions, even if the app is closed.

