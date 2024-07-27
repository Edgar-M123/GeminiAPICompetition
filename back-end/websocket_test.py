import asyncio
import websockets
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed

from pydantic import ValidationError

import os
import re
import base64
import json
import time
import uuid

from websocket_types import *
from gemini_prompts import *

import google.generativeai as genai
from google.cloud import texttospeech

from dotenv import load_dotenv

load_dotenv() # load env variables from .env
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
genai.configure(api_key=GEMINI_API_KEY) # configure google api with your API key

model = genai.GenerativeModel( # initialize flash model
    model_name='gemini-1.5-flash',
)
tts_client = texttospeech.TextToSpeechClient()
tts_voice = texttospeech.VoiceSelectionParams(language_code = "en-US", name = "en-US-Journey-O")
tts_audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

SET_SESSION_IDS: set[str] = set()
SET_CLIENTS: set[WebSocketServerProtocol] = set()
DICT_CLIENT_SESSIONS: dict[str, GeminiSession] = {}

def get_tts_response(text: str, client = tts_client):

    input = texttospeech.SynthesisInput(text = text)
    response = client.synthesize_speech(input=input, voice=tts_voice, audio_config=tts_audio_config)

    b64_audio = str(base64.b64encode(response.audio_content), encoding='ascii')

    return b64_audio


def parse_b64(b64_string: str, client_session: GeminiSession, extension: str = "jpg"):
    # gets b64 string and decodes it into saved image file. Returns saved image filename


    # generate img_id and add it to set
    img_id = str(uuid.uuid4())
    client_session.set_file_ids.add(img_id)

    print("decoding...")
    decoded = base64.b64decode(b64_string)
    
    filename = f"{extension}-{img_id}.{extension}"

    print("saving file...")
    with open(filename, "wb") as f:
        f.write(decoded)

    return filename


async def img_upload_handler(message, client_session: GeminiSession):
    print("Invoking IMG UPLOAD function")
    t1 = time.perf_counter()

    try:
        img_data = FileUpload(**message)
    except ValidationError as exc:
        print(exc)

    b64string = img_data.b64_string
    filename = parse_b64(b64string, client_session)
    
    print("uploading image file...")
    response = genai.upload_file(filename, mime_type="image/jpeg")
    t2 = time.perf_counter()
    
    client_session.set_uploaded_files.add(response)
    print(f"GEMINI IMAGE UPLOAD RESPONSE FILE NAME: {response.name}")
    print(f"GEMINI IMAGE UPLOAD RESPONSE TIME: {t2-t1}")

    return None


async def audio_upload_handler(message, client_session: GeminiSession):
    print("Invoking AUDIO UPLOAD function")
    t1 = time.perf_counter()

    try:
        audio_data = AudioUpload(**message)
    except ValidationError as exc:
        print(exc)
    except Exception as exc:
        print(exc)
    else:
        filename = parse_b64(audio_data.b64_string_clean, client_session, "mp3")
        print("Audio filename: ", filename)
        
        print("uploading audio file...")
        response = genai.upload_file(filename, mime_type="audio/mp3")
        t2 = time.perf_counter()

        client_session.set_uploaded_files.add(response)
        print(f"GEMINI AUDIO UPLOAD RESPONSE FILE NAME: {response.name}")
        print(f"GEMINI AUDIO UPLOAD RESPONSE TIME: {t2-t1}")
    
    return None
    

async def handler(websocket: WebSocketServerProtocol):
        
        global SET_CLIENTS
        global SET_SESSION_IDS
        global DICT_CLIENT_SESSIONS


        # on client connection...
        client_id = websocket.id
        print(f"Connection started with {client_id}")

        SET_CLIENTS.add(websocket)

        session_id = str(uuid.uuid4())
        
        client_session = GeminiSession( # create client_session
            session_id=session_id,
            set_file_ids=set(),
            set_uploaded_files=set()
        )

        DICT_CLIENT_SESSIONS[session_id] = client_session

        event = {
            "type": "session_created",
            "session_id": client_session.session_id
        }

        await websocket.send(json.dumps(event)) # returning session id to client

        async for message in websocket:
            message = json.loads(message)
            print("Received message of type: ", message['type'])

            if message['type'] == "IMG_UPLOAD":
                asyncio.create_task(img_upload_handler(message, client_session)) # create concurrent task to process & upload image data

            elif message['type'] == "AUDIO_UPLOAD":
                client_session.audio_recording_task = asyncio.create_task(audio_upload_handler(message, client_session)) # create concurrent task but keep it to await

            elif message['type'] == "GENERATE_TEXT":
                print("Invoking GENERATE TEXT function")
                t1 = time.perf_counter()

                print("awaiting audio upload")
                await asyncio.gather(client_session.audio_recording_task) # await audio upload task. We can drop images for speed but not audio.
                print("audio upload completed")
                
                prompt = conversational_prompt.format(chat_history = str(client_session.chat_history))
                print("PROMPT TEXT: ", prompt)

                contents = [*client_session.set_uploaded_files, prompt]
                print(contents)

                print("Sent response...")

                try:
                    response = model.generate_content(
                        contents=contents
                    )

                except Exception as exc:
                    print("EXCEPTION: ", exc)

                else:
                    
                    response_text = response.text

                    if re.match(r"^```json", response_text):
                        response_text = re.sub(r"^```json", "", response_text)
                        response_text = re.sub(r"```$", "", response_text)

                    t2 = time.perf_counter()
                    try:
                        parsed_dict = json.loads(response_text)
                        parsed_response = GeminiResponse(**parsed_dict)
                        response_conversation: str = parsed_response.conversational_response
                    except Exception as exc:
                        print("Error during GeminiResponse creation: ", exc)
                    
                    try:
                        t1_audio = time.perf_counter()
                        response_audio_b64 = get_tts_response(response_conversation)
                        t2_audio = time.perf_counter()
                        print("Time to get tts audio: ", (t2_audio - t1_audio))
                    except Exception as exc:
                        print("Error during tts synthesis: ", exc)


                    print("GEMINI GENERATE TEXT RESPONSE: ", response_text)
                    event = {
                        "type": "generate_text_response",
                        "data": json.dumps({"text": response_text, "b64_audio": response_audio_b64})                    
                    }
                    print("Sending data back to client....")
                    await websocket.send(json.dumps(event))
                    print("Data sent")
                    
                    full_chat = json.loads(response_text)
                    chat_user = ("user", full_chat['transcript'])
                    chat_ai = ("assistant", full_chat['conversational_response'])

                    client_session.chat_history.append(chat_user)
                    client_session.chat_history.append(chat_ai)

                    print(f"Time to generate first chunk: {t2-t1}")


                finally:
                    for file in client_session.set_uploaded_files:
                        genai.delete_file(file)
                    client_session.set_uploaded_files.clear()



            else: 
                print("Invoke MESSAGE function")
                print(message)
                

async def main():
    async with websockets.serve(handler, "", 8001):
        print("Server started.")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())