FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && apt-get clean

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-m", "tg_bot.cli"]
