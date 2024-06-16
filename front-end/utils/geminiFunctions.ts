
export const upload_endpoint: string = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`
export const file_endpoint: string = `https://generativelanguage.googleapis.com/v1beta/files?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}&pageSize=100`
export const delete_endpoint: string = `https://generativelanguage.googleapis.com/v1beta/`


interface GeminiFile {
    "name": string,
    "displayName": string,
    "mimeType": string,
    "sizeBytes": string,
    "createTime": string,
    "updateTime": string,
    "expirationTime": string,
    "sha256Hash": string,
    "uri": string,
    "state": string,
    "error": object
}
  
interface FileListResult {
"files": Array<GeminiFile>,
"nextPageToken": string
}

export async function uploadFile(filename: string, jpgQueue: Array<string>) {
    console.log("running worklet")
    console.log('Queue: ', JSON.stringify(jpgQueue))
        
    console.log("\nAdding to queue")
    jpgQueue.push(filename);
    
    const data = {
        [filename]: {
            "displayName": filename,
            "mimeType": "image/jpg"
        }
    }
    
    console.log("\nSending post request")
    const response = await fetch(upload_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    
    const responseJson = await response.json()
    console.log("responseJson:\n", responseJson)


    return responseJson
}


export async function requestFileList(): Promise<FileListResult> {
    const fileListResponse = await fetch(file_endpoint, {
      method: "GET"
    });
    console.log("response:\n", fileListResponse)
  
    const fileListJson: Promise<FileListResult> = fileListResponse.json();
    return fileListJson
};
  
export async function clearFiles() {
    const fileList = await requestFileList()
    console.log("fileList:\n", JSON.stringify(fileList));

    if (fileList.files == null) {
        console.log("no files");
        return;
    };

    fileList.files.forEach(async (fileObject: GeminiFile) => { 
        const deleteResponse = await fetch(delete_endpoint+fileObject.name+`/?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`, {
        method: 'DELETE' 
        });

        const deleteResponseJson = await deleteResponse.json()

        console.log("delete response:\n", await deleteResponse)
        console.log("delete response json:\n", await deleteResponseJson.json())
    })
}