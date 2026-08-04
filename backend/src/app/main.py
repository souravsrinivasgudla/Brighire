from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {
        "application": "Brighire",
        "version": "0.1.0",
        "status": "running"
    }