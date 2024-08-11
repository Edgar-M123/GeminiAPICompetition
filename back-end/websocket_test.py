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
from websocket_utils import *
from gemini_prompts import *

import firebase_admin
from firebase_admin import firestore
import google.generativeai as genai
from google.cloud import texttospeech

from dotenv import load_dotenv
load_dotenv() # load env variables from .env

# configure google services
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
genai.configure(api_key=GEMINI_API_KEY) # configure google api with your API key
# model = genai.GenerativeModel(model_name='gemini-1.5-flash')
model = genai.GenerativeModel(
    model_name='gemini-1.5-pro', 
    system_instruction=system_prompt                           
)

tts_client = texttospeech.TextToSpeechClient()
tts_voice = texttospeech.VoiceSelectionParams(language_code = "en-US", name = "en-US-Journey-O")
tts_audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

app = firebase_admin.initialize_app()
db = firestore.client()

def get_tts_response(text: str, client = tts_client):

    input = texttospeech.SynthesisInput(text = text)
    response = client.synthesize_speech(input=input, voice=tts_voice, audio_config=tts_audio_config)

    b64_audio = str(base64.b64encode(response.audio_content), encoding='ascii')

    return b64_audio


SET_SESSION_IDS: set[str] = set()
SET_CLIENTS: set[WebSocketServerProtocol] = set()
DICT_CLIENT_SESSIONS: dict[str, GeminiSession] = {}

async def handler(websocket: WebSocketServerProtocol):
        
        global SET_CLIENTS
        global SET_SESSION_IDS
        global DICT_CLIENT_SESSIONS


        # on client connection...
        client_id = websocket.id
        print(f"Connection started with {client_id}")

        SET_CLIENTS.add(websocket)
        

        async for message in websocket:
            message = json.loads(message)
            print("Received message of type: ", message['type'])

            if message['type'] == "IMG_UPLOAD":
                asyncio.create_task(img_upload_handler(message, client_session)) # create concurrent task to process & upload image data

            elif message['type'] == 'START_SESSION':
                
                user_id = message["user_id"]
                user_fb = get_user(user_id=user_id, db=db)

                if not user_fb:
                    add_user(user_id=user_id, db=db)
                print("Found user in database")
                
                client_session = GeminiSession( # create client_session
                    user_id=user_id,
                    ws_client=websocket,
                    set_file_ids=set(),
                    set_uploaded_files=set()
                )

                DICT_CLIENT_SESSIONS[client_session.session_id] = client_session

                event = {
                    "type": "session_created",
                    "session_id": client_session.session_id
                }

                await websocket.send(json.dumps(event)) # returning session id to client



            elif message['type'] == "AUDIO_UPLOAD":
                client_session.audio_recording_task = asyncio.create_task(audio_upload_handler(message, client_session)) # create concurrent task but keep it to await

            elif message['type'] == "GENERATE_TEXT":
                print("Invoking GENERATE TEXT function")
                t1 = time.perf_counter()

                print("awaiting audio upload")
                await asyncio.gather(client_session.audio_recording_task) # await audio upload task. We can drop images for speed but not audio.
                print("audio upload completed")
                
                prompt = conversational_prompt.format(chat_history = str(json.dumps(client_session.chat_history)))
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
                    t2 = time.perf_counter()

                    if re.match(r"^```json", response_text):
                        response_text = re.sub(r"^```json", "", response_text)
                        response_text = re.sub(r"```$", "", response_text)

                    parsed_dict = json.loads(response_text)
                    try:
                        parsed_response = GeminiResponse(**parsed_dict)
                    except Exception as exc:
                        print("Error during GeminiResponse creation: ", exc)
                    response_conversation: str = parsed_response.conversational_response
                    

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
                    
                    chat_user = ("user", parsed_response.transcript)
                    chat_ai = ("assistant", parsed_response.conversational_response)

                    client_session.chat_history.append(chat_user)
                    client_session.chat_history.append(chat_ai)
                    if parsed_response.behaviours:
                        for key in parsed_response.behaviours.keys():
                            if key not in client_session.behaviours.keys():
                                client_session.behaviours[key] = [parsed_response[key]]
                            else:
                                client_session.behaviours[key].append(parsed_response.behaviours[key])

                    client_session.update_user_session(db=db)

                    print(f"Time to generate text: {t2-t1}")


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