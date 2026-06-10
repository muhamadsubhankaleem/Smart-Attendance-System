from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db.mongodb import get_db
from app.services.face_service import register_face, recognize_and_mark
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/face", tags=["Face Recognition"])


class RegisterFaceRequest(BaseModel):
    student_id: str
    image_base64: str  # base64-encoded JPEG/PNG


class RecognizeRequest(BaseModel):
    image_base64: str
    course_id: str
    session_date: str  # YYYY-MM-DD


@router.get("/status", summary="Check if face recognition module is installed")
async def status(_=Depends(get_current_user)):
    try:
        import face_recognition  # noqa
        import cv2  # noqa
        return {"available": True, "message": "Face recognition is ready"}
    except ImportError:
        return {
            "available": False,
            "message": "Install face-recognition: pip install face-recognition opencv-python",
        }


@router.post("/register", summary="Register student face (admin)")
async def register(data: RegisterFaceRequest, db=Depends(get_db), _=Depends(require_admin)):
    return await register_face(db, data.student_id, data.image_base64)


@router.post("/recognize", summary="Recognize face and auto-mark attendance (admin)")
async def recognize(data: RecognizeRequest, db=Depends(get_db), _=Depends(require_admin)):
    return await recognize_and_mark(db, data.image_base64, data.course_id, data.session_date)
