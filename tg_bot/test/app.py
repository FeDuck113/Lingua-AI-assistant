import shutil
from pathlib import Path

import uvicorn
from fastapi import FastAPI, UploadFile, File, Form

api = FastAPI()

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


@api.post("/api/v1/audio")
async def get_voice(user_id: str = Form(...), file: UploadFile = File(...), language: str = Form(...),
                    session: str = Form(...)):
    file_path = TEMP_DIR / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(file.filename, user_id, language)
    return {"status": "ok", "filename": file.filename, 'uuid': session}


@api.post("/text")
async def get_text(message: str = Form(...), user_id: str = Form(...), language: str = Form(...),
                   session: str = Form(...)):
    print(message, user_id, language)
    return {"status": "ok", 'session': session}


@api.post("/api/v1/clear")
async def get_text(user_id: str = Form(...), old_session: str = Form(...), new_session: str = Form(...)):
    print({"status": "ok", 'old_session': old_session, 'new_session': new_session})
    return {"status": "ok", 'old_session': old_session, 'new_session': new_session}


if __name__ == '__main__':
    uvicorn.run(api, host='localhost', port=5050)
