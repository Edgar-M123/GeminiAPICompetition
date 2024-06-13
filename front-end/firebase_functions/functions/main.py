# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn, options
from firebase_admin import initialize_app

initialize_app()


@https_fn.on_call()
def on_call_example(req: https_fn.CallableRequest) -> dict:
    
    final_str = "Hello World" + req.data['text']

    return {'text': final_str}



@https_fn.on_call()
def upload_video(req: https_fn.CallableRequest) -> any:

    


    return