import asyncio
import websockets
import os
import time

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

genai.configure(api_key=GEMINI_API_KEY) # configure library with your API key

text_pro_model = genai.GenerativeModel('gemini-1.5-flash') # initialize flash model

def multi_image():
  print("\nCall with multiple images")
  t1 = time.perf_counter()


  imageArray = []

  text = "The following images are frames from a video. How many frames are here? Respond with 10 words or less."
  contents = imageArray + [text]

  response = text_pro_model.generate_content(contents=contents) # text + png input
  print(response.text) # text output
  t2 = time.perf_counter()
  print(f"Time taken: {t2-t1}")
  print(text_pro_model.count_tokens(contents=contents)) # count tokens used
  ##





async def handler(websocket):
    while True:
        print("Connection started")
        message = await websocket.recv()
        print(message)

async def main():
    async with websockets.serve(handler, "", 8001):
        print("Server started.")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())