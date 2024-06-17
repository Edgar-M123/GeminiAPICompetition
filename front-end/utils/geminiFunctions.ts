
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


export async function uploadFile(filename: string): Promise<GeminiFile> {
    'worklet'
    const data = {
        [filename]: {
            "displayName": filename,
            "mimeType": "image/jpeg"
        }
    };
    
    console.log("\nGEMINI_UPLOADFILE| Sending post request...");
    const response = fetch(upload_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "image/jpeg"
        },
        body: JSON.stringify(data)
    }).then((data) => data.json());
    
    
    return response.then((data) => {console.log(JSON.stringify(data)); return data})
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


export async function generateText(model: string, text_prompt: string, images_uris_list: Array<String>): Promise<GeminiContentResponse> {
    const endpoint: string = generate_endpoint_fn(model);
    console.log("\nGENERATE_TEXT| endpoint:\n", endpoint)

    const auth_key = process.env.EXPO_PUBLIC_GCLOUD_AUTH_KEY as string

    const parts: object[] = []
    parts.push({"text": text_prompt})
    images_uris_list.forEach((uri) => parts.push({"fileData": {"mimeType": "image/jpeg", "fileUri": uri}}))
    console.log("\nGENERATE_TEXT| parts sent to gemini:\n", JSON.stringify(parts))
    
    const body_content = JSON.stringify({
        contents: [
            {
                parts: parts
            }
        ]
    })

    const response = await fetch(
        endpoint,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // "Authorization": auth_key
            },
            body: body_content
        }
    )
    console.log("\nGENERATE_TEXT| response:\n", response)
    const responseJson = await response.json()
    console.log("\nGENERATE_TEXT| response:\n", JSON.stringify(responseJson))

    return responseJson
}