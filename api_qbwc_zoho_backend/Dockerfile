FROM python:3.12

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# --- Python deps ---
COPY requirements.txt /app/

RUN mkdir -p /var/log/supervisor

RUN pip install --upgrade pip \
 && pip install gunicorn \
 && pip install -r requirements.txt
 
RUN apt-get update \
 && apt-get install -y --no-install-recommends wget ca-certificates gnupg supervisor postgresql-client \
 && rm -rf /var/lib/apt/lists/*
 
COPY . /app/

COPY _deploy/supervisord.conf /etc/supervisor/supervisord.conf
COPY _deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:8000/api_qbwc_zoho/health_check/ || exit 1

CMD ["/entrypoint.sh"]
