from pydantic import BaseModel, Field, computed_field, GetCoreSchemaHandler, ConfigDict
from pydantic_core import CoreSchema, core_schema
from typing_extensions import TypedDict
from google.ai.generativelanguage_v1beta import types as genai_types
from datetime import datetime

from asyncio import Task
import re

from functools import cached_property

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
    preferences: list[str] = Field(default = None, description="OPTIONAL: Possible individual likes/dislikes that the individual expressed in the video. If nothing was mentioned, return 'None'")
    likes: list[str] = None
    dislikes: list[str] = None

gemini_response_schema = genai_types.Schema(
    type_ = genai_types.Type.OBJECT,
    properties = {
        "transcript": genai_types.Schema(type_ = genai_types.Type.STRING, description = "The transcript of the audio received in the prompt"),
        "conversational_response": genai_types.Schema(type_ = genai_types.Type.STRING, description = "Response to the what was said in the video recording."),
        "likes": genai_types.Schema(
            type_ = genai_types.Type.ARRAY, 
            items = genai_types.Schema(type_ = genai_types.Type.STRING),
            description="OPTIONAL: Possible individual likes that the individual expressed in the video. If nothing was mentioned, return 'None'"
        ),
        "dislikes": genai_types.Schema(
            type_ = genai_types.Type.ARRAY, 
            items = genai_types.Schema(type_ = genai_types.Type.STRING),
            description="OPTIONAL: Possible individual dislikes that the individual expressed in the video. If nothing was mentioned, return 'None'"
        ),
    },
    required = ['transcript', 'conversational_response']
)

class GeminiSession(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    session_id: str
    set_file_ids: set
    set_uploaded_files: set
    audio_recording_task: Task = None
    chat_history: list[tuple[str, str]] = []

class Person(BaseModel):
    first_name: str
    last_name: str = None
    dob: datetime = None
    likes: list[str] = None
    dislikes: list[str] = None
    visual_description: str
