import { SERVER_URL } from "@/constants/WebSocketURLs";
import React, { Component, SetStateAction, useRef } from "react";

interface SocketMessage {
    type: string,
    data: any
}


export const ConnectionContext = React.createContext({} as any);


export const ConnectionContextProvider = ({children}: any) => {

    const socket_ref = useRef<WebSocket>();
    const [socket, setSocket] = React.useState<WebSocket>();
    const [socketMessage, setSocketMessage] = React.useState<object>();



    React.useEffect(() => {
        console.log("Attempting to connect to Websocket on ", SERVER_URL)
        socket_ref.current = new WebSocket(SERVER_URL);
        
        socket_ref.current.addEventListener("open", (ev) => {
            console.log("Connected to websocket on ", SERVER_URL, ev);
            socket_ref.current?.send(JSON.stringify({type: "message", data: "Accessing server from ASD Support App."}));
        });
        
        socket_ref.current.addEventListener("close", (ev) => {
            console.log("Websocket connection closed: ", ev)
        });

        socket_ref.current.addEventListener('error', (ev) => {
            console.log("Websocket error occurred: ", ev)
        })

        socket_ref.current.addEventListener("message", (ev) => {
            console.log("Message received.")
            
            const message = JSON.parse(ev.data)
            if (message != undefined && message.type != undefined) {
                console.log("Message type: ", message.type)
            } else {console.log("Message does not have a type.")}

            setSocketMessage(message)
        })

        setSocket(socket_ref.current)
        return () => {
            if (socket != undefined && socket.OPEN) {
                socket.close()
            }
        }

    }, [])
    
    return (
        <ConnectionContext.Provider value={{socket, socketMessage, setSocketMessage}}>
            {children}
        </ConnectionContext.Provider>
    )
};

export interface ConnectionContextValues {
    socket: WebSocket,
    socketMessage: SocketMessage,
    setSocketMessage: React.Dispatch<SetStateAction<SocketMessage>>
}