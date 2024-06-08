
import google.generativeai as genai
import pathlib
import typing_extensions as typing
import time
import os
import cv2
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]


genai.configure(api_key=GEMINI_API_KEY) # configure library with your API key

text_pro_model = genai.GenerativeModel('gemini-1.5-flash') # initialize flash model

def extractImages(pathIn, imageArray):
    count = 0
    vidcap = cv2.VideoCapture(pathIn)
    success,image = vidcap.read()
    success = True
    while success:
        vidcap.set(cv2.CAP_PROP_POS_MSEC,(count*1000))    # added this line 
        success,image = vidcap.read()
        if success == False:
           break
        print ('Read a new frame: ', success)
        success, encoded_image = cv2.imencode('.png', image)
        image_llm = {
            "mime_type": "image/png",
            "data": encoded_image.tobytes()
        }
        imageArray.append(image_llm)
        count = count + 1

# Providing multiple images + audio

print("\nCall with multiple images + audio")
t1 = time.perf_counter()
audio_filename = "Recording.mp3"

print(f"Uploading file...")
audio_file = genai.upload_file(path=audio_filename)
print(f"Completed upload: {audio_file.uri}")


while audio_file.state.name == "PROCESSING":
    print('.', end='')
    time.sleep(5)
    audio_file = genai.get_file(audio_file.name)

if audio_file.state.name == "FAILED":
  raise ValueError(audio_file.state.name)


imageArray = []
extractImages("gemini-video2.mp4", imageArray)

text = "The following images are frames from a video. The audio is sourced coming from the same video. Answer the following questions about the video: 1. Is there a person? If so, what are they wearing? 2. Where is the video taking place? 3. Describe the audio of the video."

contents = imageArray + [audio_file] + [text]
response = text_pro_model.generate_content(contents=contents) # text + png input
print(response.text) # text output
t2 = time.perf_counter()
print(f"Time taken: {t2-t1}")
print(text_pro_model.count_tokens(contents=contents)) # count tokens used

genai.delete_file(audio_file.name)
print(f'Deleted file {audio_file.uri}')
##




# Providing single image
print("\nCall with only 1 image")
t1 = time.perf_counter()
image = {
    "mime_type": "image/png",
    "data": pathlib.Path("C:/My Pictures/trudeau.png").read_bytes()
}

text = "What is going in the following picture? Respond with 10 words or less."

response = text_pro_model.generate_content(contents=[text, image]) # text + png input
print(response.text) # text output
t2 = time.perf_counter()
print(f"Time taken: {t2-t1}")
print(text_pro_model.count_tokens(contents=[text, image])) # count tokens used
##

# Providing multiple images
print("\nCall with multiple images")
t1 = time.perf_counter()


imageArray = []
extractImages("gemini-video2.mp4", imageArray)

text = "The following images are frames from a video. How many frames are here? Respond with 10 words or less."
contents = imageArray + [text]

response = text_pro_model.generate_content(contents=contents) # text + png input
print(response.text) # text output
t2 = time.perf_counter()
print(f"Time taken: {t2-t1}")
print(text_pro_model.count_tokens(contents=contents)) # count tokens used
##


# providing video
print("\nCall where video is uploaded then provided to prompt")
t1 = time.perf_counter()

video_filename = "gemini-video2.mp4"

print(f"Uploading file...")
video_file = genai.upload_file(path=video_filename)
print(f"Completed upload: {video_file.uri}")


while video_file.state.name == "PROCESSING":
    print('.', end='')
    time.sleep(5)
    video_file = genai.get_file(video_file.name)

if video_file.state.name == "FAILED":
  raise ValueError(video_file.state.name)
t2 = time.perf_counter()
print(f"Video upload time taken: {t2-t1}")


text = "Is the person in this video looking at the screen? Respond with 10 words or less."

t1 = time.perf_counter()
response = text_pro_model.generate_content(contents=[text, video_file], request_options={"timeout": 600}) # text + png input
print(response.text) # text output
t2 = time.perf_counter()
print(f"Response time taken: {t2-t1}")
print(text_pro_model.count_tokens(contents=[text, video_file])) # count tokens used

genai.delete_file(video_file.name)
print(f'Deleted file {video_file.uri}')
##

# providing audio
print("\nCall where audio is uploaded then provided to prompt")
t1 = time.perf_counter()

video_filename = "Recording.mp3"

print(f"Uploading file...")
video_file = genai.upload_file(path=video_filename)
print(f"Completed upload: {video_file.uri}")


while video_file.state.name == "PROCESSING":
    print('.', end='')
    time.sleep(5)
    video_file = genai.get_file(video_file.name)

if video_file.state.name == "FAILED":
  raise ValueError(video_file.state.name)

text = "What is happening in this audio? Respond with 10 words or less."

response = text_pro_model.generate_content(contents=[text, video_file], request_options={"timeout": 600}) # text + png input
print(response.text) # text output
t2 = time.perf_counter()
print(f"Time taken: {t2-t1}")
print(text_pro_model.count_tokens(contents=[text, video_file])) # count tokens used

genai.delete_file(video_file.name)
print(f'Deleted file {video_file.uri}')
##

