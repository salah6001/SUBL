FROM python:3.12-slim

WORKDIR /agent

# gcc + headers needed to build python-evdev (C extension)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    linux-libc-dev \
    kbd \
    && rm -rf /var/lib/apt/lists/*

# Install headless deps only — pynput (evdev backend) + requests.
# PySide6/Qt is GUI-only and not needed in --headless mode.
RUN pip install --no-cache-dir pynput evdev requests

COPY . .

CMD ["python", "__main__.py", "--headless"]
