
import google.generativeai as genai
import pathlib
import typing_extensions as typing
import json
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]


genai.configure(api_key=GEMINI_API_KEY) # configure library with your API key

text_model = genai.GenerativeModel('gemini-1.5-flash') # initialize flash model
json_model = genai.GenerativeModel('gemini-1.5-pro') # initialize pro model


response = text_model.generate_content("How is your day going?") # text input
print(response.text) # text output

# getting png image to provide
image = {
    "mime_type": "image/png",
    "data": pathlib.Path("C:/My Pictures/trudeau.png").read_bytes()
}

text = "Who is in this picture?"

response = text_model.generate_content(contents=[text, image]) # text + png input
print(response.text) # text output
print(text_model.count_tokens(contents=[text, image])) # count tokens used

json_prompt = """
Respond to the following chat history with 3 possible responses. 

## CHAT HISTORY ##
{
    {
        message_type: 'received',
        message_content: 'hey there baby'
    }
    {
        message_type: 'sent',
        message_content: 'hey whats up'
    }
    {
        message_type: 'received',
        message_content: 'wanna come and play dungeons and dragons?'
    }
}

Provide the 3 options in the following JSON format. Do not provide any text other than the JSON response.

{
option1: <text_here>,
option2: <text_here>,
option3: <text_here>,
}
"""

response = json_model.generate_content(
    json_prompt,
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json") # configure to use json output
    )

print("raw: ", response)
print("text: ", response.text)
print("json: ", json.loads(response.text))

