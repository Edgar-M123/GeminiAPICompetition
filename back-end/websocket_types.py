from pydantic import BaseModel, Field, computed_field, GetCoreSchemaHandler, ConfigDict
from pydantic_core import CoreSchema, core_schema
from typing_extensions import TypedDict
from datetime import datetime
from uuid import uuid4

from google.ai.generativelanguage_v1beta import types as genai_types

from google.cloud.firestore import Client, DocumentReference, DocumentSnapshot, CollectionReference
from websockets.server import WebSocketServerProtocol

import asyncio
import json
from asyncio import Task
import re

from functools import cached_property


def pydantic_to_schema(pydantic_dict: dict) -> genai_types.Schema:
    
    type_conversions = {"string": genai_types.Type.STRING,
                        "array": genai_types.Type.ARRAY,
                        "object": genai_types.Type.OBJECT,
                        "integer": genai_types.Type.INTEGER,
                        "number": genai_types.Type.NUMBER,
                        "boolean": genai_types.Type.BOOLEAN,
                        }
    
    def clean_schema(pydantic_dict: dict) -> dict:
        if isinstance(pydantic_dict, dict):
            for key in list(pydantic_dict.keys()):
                if key not in ["type_", "format_", "description", "nullable", "enum", "items", "properties", "required"]:
                    del pydantic_dict[key]
                elif key == "type":
                    pydantic_dict[key] = type_conversions[pydantic_dict[key]]
                    pydantic_dict["type_"] = pydantic_dict[key]
                    del pydantic_dict[key]
                else:
                    clean_schema(pydantic_dict[key])
        return pydantic_dict
    
    clean_dict = clean_schema(pydantic_dict=pydantic_dict)
    new_schema = genai_types.Schema(mapping=clean_dict)

    return new_schema

class FileUpload(BaseModel):
    type: str
    b64_string: str

class AudioUpload(BaseModel):
    type: str
    b64_string: str = Field(pattern=r"^data:audio/mpeg;base64,")

    @computed_field
    @cached_property
    def b64_string_clean(self) -> str:
        return re.sub("data:audio/mpeg;base64,", "", self.b64_string)

class PromptRequest(BaseModel):
    type: str
    prompt: str

class GeminiResponse(BaseModel):
    transcript: str = Field(description="The transcript of the audio received in the prompt")
    conversational_response: str = Field(description="Response to the what was said in the video recording.")
    likes: list[str] = Field(default = None, description="OPTIONAL: Possible individual likes that the individual expressed in the video. If nothing was mentioned, return 'None'")
    dislikes: list[str] = Field(default = None, description="OPTIONAL: Possible individual dislikes that the individual expressed in the video. If nothing was mentioned, return 'None'")
    behaviours: dict[str,int] = Field(default = [], description= "OPTIONAL: Negative repetitive behaviors exhibited by the child such as hitting or ticking. Provide a set with the name of the behavior and the number of frames the behavior occurred for. Ex: ('hitting self', 5)") # array of behaviour occurences and the number of frames it ocurred for


class GeminiSession(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user_id: str
    session_id: str = str(uuid4())
    session_datetime: datetime = datetime.now()
    ws_client: WebSocketServerProtocol = Field(exclude=True)
    set_file_ids: set = Field(exclude=True)
    set_uploaded_files: set = Field(exclude=True)
    audio_recording_task: Task = Field(default = None, exclude=True)
    chat_history: list[tuple[str, str]] = []
    behaviours: dict[str, list[int]] = {} # array of behaviour occurences and the number of frames it ocurred for

    def update_user_session(self, db: Client):
        """
        If session not already added in collection, then create session.
        If session exists, update
        """

        user_doc_ref: DocumentReference = db.collection(f"profiles").document(self.user_id)
        user_collections: list[CollectionReference] = [x for x in user_doc_ref.collections()]

        if "sessions" not in [x.id for x in user_collections]:
            user_sessions_collection = user_doc_ref.collection("sessions")
        else:
            user_sessions_collection: CollectionReference = db.collection(f"/profiles/{self.user_id}/sessions/")

        print("Updating user sessions on firebase")

        print(f"creating/updating session {self.session_id}")
        session_doc_ref: DocumentReference = user_sessions_collection.document(self.session_id)
        session_doc_ref.set({
            "session_id": self.session_id,
            "session_date": self.session_datetime,

            })
        print("Done updating session")

    async def end_session(self):
        """
        End session & update database
        """

        self.update_user_session()

        event = {
            "type": "end_session"
        }

        await self.ws_client.send(json.dumps(event))

    

class Person(BaseModel):

    first_name: str
    last_name: str = None
    dob: datetime = None
    likes: list[str] = None
    dislikes: list[str] = None
    visual_description: str
