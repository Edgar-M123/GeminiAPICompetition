import { ISharedValue } from "react-native-worklets-core";

export const upload_endpoint: string = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;
export const file_endpoint: string = `https://generativelanguage.googleapis.com/v1beta/files?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}&pageSize=100`;
export const delete_endpoint: string = `https://generativelanguage.googleapis.com/v1beta/`;
export const generate_endpoint_fn = (model: string): string => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;


export interface GeminiFile {
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

interface GeminiContentResponse {
    candidates: [
        {
            content: {
                parts: [
                  {text: string}
                ],
                role: string
              },
            finishReason: string,
            safetyRatings: [
                {
                category: string,
                probability: string,
                blocked: boolean
                }
            ],
            citationMetadata: {},
            tokenCount: number,
            groundingAttributions: [{}],
            index: number
          }
    ],
    promptFeedback: {
        blockReason: string,
        safetyRatings: [
            {
                category: string,
                probability: string,
                blocked: boolean
              }
        ]
      },
    usageMetadata: {
        promptTokenCount: number,
        candidatesTokenCount: number,
        totalTokenCount: number
      }
}


export function uploadFiles(ws: WebSocket, b64Queue: ISharedValue<string[]>): void {

    console.log("\nGEMINI_UPLOADFILE| WebSocket: ", ws)
    console.log("\nGEMINI_UPLOADFILE| WebSocket Typeof: ", typeof ws)

    console.log("\nGEMINI_UPLOADFILE| Sending post request for new file...");

    if (b64Queue.value && b64Queue.value.length) {

        b64Queue.value.forEach((b64) => {
            console.log("push to ws")
            const data = {type: "REC_IN_PROG", data: b64} 
            ws.send(JSON.stringify(data))
        })
        
        b64Queue.value = []
    }
}





export async function requestFileList(): Promise<FileListResult> {
    const fileListResponse = await fetch(file_endpoint, {
      method: "GET"
    });
    console.log("response:\n", fileListResponse)
  
    const fileListJson: Promise<FileListResult> = fileListResponse.json();
    return fileListJson
};

export async function getFile(filename: string): Promise<GeminiFile> {
    return {} as GeminiFile
}
  
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
        console.log("delete response json:\n", await deleteResponseJson)
    })

    clearFiles()
}


export async function generateText(ws: WebSocket, text_prompt: string, images_uris_list: Array<String>): Promise<void> {

    const auth_key = process.env.EXPO_PUBLIC_GCLOUD_AUTH_KEY as string

    const parts: object[] = []
    parts.push({"text": text_prompt})
    images_uris_list.forEach((uri) => parts.push({"fileData": {"fileUri": uri}}))
    console.log("\nGENERATE_TEXT| parts sent to gemini:\n", JSON.stringify(parts))
    
    const body_content = JSON.stringify({
        contents: [
            {
                parts: parts
            }
        ]
    })
    console.log("\nGENERATE_TEXT| body_Content sent to gemini:\n", JSON.stringify(body_content))


    return;
}