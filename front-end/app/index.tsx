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
    <View style ={{height: 100, backgroundColor: 'gold', padding: 10, borderRadius: 10, width: 300, justifyContent: 'center'}}>
      <Pressable
      style = {{flex: 1, alignItems: 'center', justifyContent: 'center'}}
        onPress={() => onGoogleButtonPress().then(() => console.log('Signed in with Google!'))}
      >
        <Text>Sign in with GOOGLE</Text>
      </Pressable>
    </View>
  )
}


export default function Index() {

  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState<FirebaseAuthTypes.User | null>();
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
      <View style={{flex: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{color: "black", margin:10, fontSize: 30}}>Login</Text>
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
