

export const cameraHandler = (event: any) => {

    const wsMsg = JSON.parse(event.data)

    switch (wsMsg.type) {
        case "upload_response":
            console.log("WEBSOCKET| Gemini Upload Response: ", wsMsg.data);
    }


}