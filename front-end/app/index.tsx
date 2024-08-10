import { Redirect, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import React from "react";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'


GoogleSignin.configure({webClientId: "675224874175-i59v9khkc8qi0u37rfuv04e6a24llck6.apps.googleusercontent.com"})

async function onGoogleButtonPress() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Get the users ID token
  const { idToken } = await GoogleSignin.signIn();

  // Create a Google credential with the token
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // Sign-in the user with the credential
  return auth().signInWithCredential(googleCredential);
}

function GoogleSignIn() {
  return (
    <Pressable
      onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
    >
      <Text>Google Sign-In</Text>
    </Pressable>
  )
}


export default function Index() {

  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter()
  
  
  // Handle user state changes
  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
      setUser(user);
      if (initializing) setInitializing(false);
  }
  
  React.useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return (<View><Text>Initializing</Text></View>);

  if (user == null) {
    return (
      <View style={{flex: 1, borderWidth: 1}}>
        <Text>Login</Text>
        <GoogleSignIn />
      </View>
    );
  }
  
  return (
    <View>
      <Redirect href={"/chat"}/>
    </View>
  );
}
