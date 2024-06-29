import asyncio
import websockets
import os
import re
import string, random, base64
import json
import time


import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

genai.configure(api_key=GEMINI_API_KEY) # configure library with your API key

model = genai.GenerativeModel('gemini-1.5-flash') # initialize flash model


SET_FILE_IDS = set()
SET_UPLOADED_FILES = set()
LIST_TASKS = []

def parse_b64(b64_string: str, set_ids: set, extension: str = "jpg"):

    def rand_str(set_ids: set):
        chars=string.digits + string.ascii_letters
        img_id = ''.join(random.sample(chars, 8))

        if img_id in set_ids:
            rand_str(set_ids)
            return
        
        set_ids.add(img_id)

        return img_id

    print("decoding...")
    decoded = base64.b64decode(b64_string)
    
    print("generating string...")
    img_id = rand_str(set_ids)

    filename = f"{extension}-{img_id}.{extension}"

    print("saving file...")
    with open(filename, "wb") as f:
        f.write(decoded)

    return filename

async def img_upload_handler(message):
    print("Invoking IMG UPLOAD function")
    t1 = time.perf_counter()
            
    b64string = message["data"]
    filename = parse_b64(b64string, SET_FILE_IDS)
    
    print("uploading image file...")
    response = genai.upload_file(filename, mime_type="image/jpeg")
    t2 = time.perf_counter()
    
    SET_UPLOADED_FILES.add(response)
    print(f"GEMINI IMAGE UPLOAD RESPONSE FILE NAME: {response.name}")
    print(f"GEMINI AUDIO UPLOAD RESPONSE TIME: {t2-t1}")
    
    event = {
        "type": "upload_response",
        "data": response.uri
    }

async def audio_upload_handler(message):
    print("Invoking AUDIO UPLOAD function")
    t1 = time.perf_counter()
                
    b64_raw = message['data']
    if re.match("data:audio/mpeg;base64,", b64_raw):
        b64 = re.sub("data:audio/mpeg;base64,", "", b64_raw)

    filename = parse_b64(b64, SET_FILE_IDS, ".mp3")
    print("Audio filename: ", filename)
    
    print("uploading audio file...")
    response = genai.upload_file(filename, mime_type="audio/mp3")
    t2 = time.perf_counter()


    SET_UPLOADED_FILES.add(response)
    print(f"GEMINI AUDIO UPLOAD RESPONSE FILE NAME: {response.name}")
    print(f"GEMINI AUDIO UPLOAD RESPONSE TIME: {t2-t1}")
    
    event = {
        "type": "upload_response",
        "data": response.uri
    }


async def handler(websocket):
        print("Connection started")
        async for message in websocket:
            # print("raw message", message)
            message = json.loads(message)
            print("Received message of type: ", message['type'])

            if message['type'] == "IMG_UPLOAD":
                LIST_TASKS.append(asyncio.create_task(img_upload_handler(message)))
                
                continue

                # await websocket.send(json.dumps(event))

            if message['type'] == "AUDIO_UPLOAD":
                LIST_TASKS.append(asyncio.create_task(audio_upload_handler(message)))

                continue



            if message['type'] == "GENERATE_TEXT":
                print("Invoking GENERATE TEXT function")
                t1 = time.perf_counter()

                print("awaiting tasks")
                await asyncio.gather(*LIST_TASKS)
                print("tasks awaited")
                

                prompt_text = message["data"]
                print("PROMPT TEXT: ", prompt_text)

                contents = [*SET_UPLOADED_FILES, prompt_text]
                print(contents)

                print("Sent response...")
                response = model.generate_content(contents=contents)
                print("GEMINI GENERATE TEXT RESPONSE: ", response.text)
                t2 = time.perf_counter()

                print(f"Time to generate text: {t2-t1}")

                event = {
                    "type": "generate_text_response",
                    "data": response.text
                }

                print("Sending data back to client...")
                await websocket.send(json.dumps(event))
                print("Data sent")

                for file in SET_UPLOADED_FILES:
                    genai.delete_file(file)

                SET_UPLOADED_FILES.clear()

                continue

                # await websocket.send(json.dumps(event))

            if message["type"] == "message":
                print("Invoke MESSAGE function")

                print(message)
                continue
                

async def main():
    async with websockets.serve(handler, "", 8001):
        print("Server started.")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())