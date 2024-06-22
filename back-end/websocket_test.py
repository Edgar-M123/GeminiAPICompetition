import asyncio
import websockets
import os
import re
import string, random, base64
import json


import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

genai.configure(api_key=GEMINI_API_KEY) # configure library with your API key

model = genai.GenerativeModel('gemini-1.5-flash') # initialize flash model


SET_IMG_IDS = set()
SET_UPLOADED_IMGS = set()

def parse_b64(b64_string: str, set_ids: set, extension: str = ".jpg"):

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

    filename = f"img-{img_id}{extension}"

    print("saving file...")
    with open(filename, "wb") as f:
        f.write(decoded)

    return filename

def parse_intarray(int_array: list[int], set_ids):

    def rand_str(set_ids: set):
        chars=string.digits + string.ascii_letters
        img_id = ''.join(random.sample(chars, 8))

        if img_id in set_ids:
            rand_str(set_ids)
            return
        
        set_ids.add(img_id)

        return img_id

    print("decoding...")
    decoded = bytes(int_array)
    
    print("generating string...")
    img_id = rand_str(set_ids)

    filename = f"img-{img_id}.jpg"

    print("saving file...")
    with open(filename, "wb") as f:
        f.write(decoded)

    return filename




async def handler(websocket):
        print("Connection started")
        async for message in websocket:
            # print("raw message", message)
            message = json.loads(message)

            if message['type'] == "IMG_UPLOAD":
                print("Invoking IMG UPLOAD function")
            
                b64string = message["data"]
                filename = parse_b64(b64string, SET_IMG_IDS)
                
                print("uploading image file...")
                response = genai.upload_file(filename, mime_type="image/jpeg")
                
                SET_UPLOADED_IMGS.add(response)
                print(f"GEMINI UPLOAD RESPONSE FILE NAME: {response.name}")
                
                event = {
                    "type": "upload_response",
                    "data": response.uri
                }

                continue

                # await websocket.send(json.dumps(event))

            if message['type'] == "AUDIO_UPLOAD":
                print("Invoking AUDIO UPLOAD function")
                
                b64_raw = message['data']
                if re.match("data:audio/mpeg;base64,", b64_raw):
                    b64 = re.sub("data:audio/mpeg;base64,", "", b64_raw)

                filename = parse_b64(b64, SET_IMG_IDS, ".mp3")
                print("Audio filename: ", filename)
                
                print("uploading audio file...")
                response = genai.upload_file(filename, mime_type="audio/mp3")

                print(f"GEMINI UPLOAD RESPONSE FILE NAME: {response.name}")
                
                event = {
                    "type": "upload_response",
                    "data": response.uri
                }

                continue



            if message['type'] == "GENERATE_TEXT":
                print("Invoking GENERATE TEXT function")

                prompt_text = message["data"]
                print("PROMPT TEXT: ", prompt_text)

                contents = [*SET_UPLOADED_IMGS, prompt_text]
                print(contents)

                print("Sent response...")
                response = model.generate_content(contents=contents)
                print("GEMINI GENERATE TEXT RESPONSE: ", response.text)

                event = {
                    "type": "generate_text_response",
                    "data": response.text
                }

                for file in SET_UPLOADED_IMGS:
                    genai.delete_file(file)

                SET_UPLOADED_IMGS.clear()

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