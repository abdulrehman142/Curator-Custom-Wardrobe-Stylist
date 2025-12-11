FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# System dependencies: OpenCV, PIL, Selenium (Chromium)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgl1 \
      libglib2.0-0 \
      chromium \
      chromium-driver \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements FROM CURRENT DIRECTORY (backend/)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy requirements2 FROM CURRENT DIRECTORY (backend/)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# Copy everything in backend/ → /app
COPY . .

# Create uploads dir inside container
RUN mkdir -p /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]

