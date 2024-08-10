import React, { Component, SetStateAction, useRef } from "react";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

export const AuthContext = React.createContext({} as any);


export const AuthContextProvider = ({children}: any) => {

    const [user, setUser] = React.useState<FirebaseAuthTypes.User | null>()

    return (
        <AuthContext.Provider value={{user, setUser}}>
            {children}
        </AuthContext.Provider>
    )
};

export interface AuthContextValues {
    user: FirebaseAuthTypes.User | null,
    setUser: React.Dispatch<SetStateAction<FirebaseAuthTypes.User | null>>
}