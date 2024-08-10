from pydantic import ValidationError

import asyncio
import base64
import time
import uuid

from websocket_types import *
from gemini_prompts import *

import google.generativeai as genai

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

def get_user(user_id: str, db: Client):
    user_doc: DocumentSnapshot = db.collection("profiles").document(user_id).get()
    print("user_doc: ", user_doc)

    if user_doc.exists:
        return user_doc
    
    return False

def add_user(user_id: str , db: Client):

    print(f"Adding user {user_id} to Firestore")

    profiles_collection: CollectionReference = db.collection("profiles")

    print("Writing user document to profiles")
    profiles_collection.document(user_id).set({"exists": True, "added_time": datetime.now()})

    print("Creating sessions and persons collections")
    profiles_collection.document(user_id).collection("sessions")
    profiles_collection.document(user_id).collection("persons")

    print("Done adding user ", user_id)


def update_session(session: GeminiSession, db: Client):

    print(f"Updating session {session.session_id} for user {session.user_id}")

    user_collection: CollectionReference = db.collection(f"profiles/{session.user_id}/sessions")
    user_collection.document(session.session_id).set(GeminiSession.model_dump_json())

    print(f"Done updating session {session.session_id} for user {session.user_id}")

