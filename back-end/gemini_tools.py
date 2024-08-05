import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1 import CollectionReference, DocumentReference, DocumentSnapshot

from datetime import date

from websocket_types import Person
from pydantic_core import ValidationError

app = firebase_admin.initialize_app()
db = firestore.client()



def add_person(first_name, last_Name, visual_description, likes, dislikes, dob, profile_id = "V2Wcje0VW0BMKCX7tM8K"):
    """
    Add a new person to this account's list of family & friends that have appeared on camera.

    Args:
        first_name: string of the person's first name (required)
        last_name: string of the person's last name (if available)
        visual_description: String describing what the person looks like (unique features, glasses, hairstyle, sex, etc.) in 1 or 2 sentences (required)
        likes: The person's preferences and likes (if available)
        dislikes: Things the person does not like (if available)
        dob: Date of birth of the person as a string, formatted "YYYY-MM-DD" (if available)
    """
    # convert datetime to proper type
    try:
        dob_date = date.fromisoformat(dob)
    except Exception as exc:
        print("Error during new persons dob conversion. Returning None for date: ", exc)
        dob_date = None
    else:
        print("New person dob converted to date successfully.")


    try:
        person = Person(
            first_name=first_name,
            last_name=last_Name,
            visual_description=visual_description,
            likes=likes,
            dislikes=dislikes,
            dob=dob_date
        )
    except ValidationError as exc:
        print("Error during new person data validation: ", exc)
        print("Trying to add person with only required fields.")
        
        try:
            person = Person(
                first_name=first_name,
                visual_description=visual_description,
            )
        except ValidationError as exc:
            print("Error on creating new person from required fields only:", exc)
            return False
        else:
            print("New person was created with required fields only")
    else:
        print("New person was created successfully.")
    
    db.collection(f"profiles/{profile_id}/persons").add(person.model_dump())
    
    return True


def get_persons(profile_id: str = "V2Wcje0VW0BMKCX7tM8K"):
    """
    When there is an individual on camera, get the profile information of all individuals associated with this account.
    """

    print("Searching document collection")

    persons_ref = db.collection(f"profiles/{profile_id}/persons")
    print("Searching persons.")
    
    persons: list[dict] = [doc.get().to_dict() for doc in persons_ref.list_documents()]
    print(persons)

    return persons


gemini_tools = [add_person]


get_persons("Edgar")