@echo off
echo Iniciando Servidor Vertex AI (WhatsApp Webhook)...
echo Certifique-se de que o arquivo .env esta configurado corretamente.
python -m uvicorn src.integrations.whatsapp.router:app --reload --port 8000
pause
