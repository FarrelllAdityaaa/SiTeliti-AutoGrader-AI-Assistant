from pydantic import BaseModel


# Model untuk hasil grading yang akan dikembalikan ke API
class GradingResult(BaseModel):
    nama_mahasiswa: str
    nim: str
    nilai: int
    feedback: str
    status: str