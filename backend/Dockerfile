FROM python:3.12-slim

# កំណត់អថេរសម្រាប់ Hugging Face (Port 7860 ជាស្តង់ដាររបស់វា)
ENV PORT=7860

WORKDIR /app

# ដំឡើង dependencies និងបង្កើត user ថ្មី (Hugging Face មិនឱ្យរត់ក្នុងនាម root ទេ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    poppler-utils \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 user

# ប្តូរទៅប្រើ user ធម្មតា
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# ចម្លង requirements និងដំឡើង
COPY --chown=user requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ចម្លងកូដកម្មវិធី
COPY --chown=user app $HOME/app/app
COPY --chown=user .env.example $HOME/app/.env.example

# បង្កើត folder សម្រាប់ទាញយកឯកសារ
RUN mkdir -p $HOME/app/downloads

# បើក Port 7860
EXPOSE 7860

# កំណត់បញ្ជាឱ្យរត់លើ Port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
