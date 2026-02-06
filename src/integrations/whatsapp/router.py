from fastapi import FastAPI, HTTPException, Header, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging
from .config import get_settings
from .service import VertexAgentService
from .evolution_client import EvolutionClient

# Configuração
settings = get_settings()
logger = logging.getLogger("webhook")
app = FastAPI(title="WhatsApp Vertex AI Webhook")

# Instâncias de Serviço
# Tratamento de erro na inicialização para evitar crash total se config estiver errada
try:
    vertex_service = VertexAgentService()
except Exception as e:
    logger.error(f"Falha na inicialização do Vertex Service: {e}")
    vertex_service = None

try:
    evolution_client = EvolutionClient()
except Exception as e:
    logger.error(f"Falha na inicialização do Evolution Client: {e}")
    evolution_client = None


# -----------------------------------------------------------------------------
# Models (Pydantic) para Payload da Evolution API
# -----------------------------------------------------------------------------
class MessageData(BaseModel):
    remoteJid: str # ID do usuário (telefone)
    conversation: Optional[str] = None # Texto da mensagem simples
    extendedTextMessage: Optional[Dict[str, Any]] = None # Texto extendido

    def get_text_content(self) -> str | None:
        if self.conversation:
            return self.conversation
        if self.extendedTextMessage and 'text' in self.extendedTextMessage:
            return self.extendedTextMessage['text']
        return None

class WebhookData(BaseModel):
    key: Dict[str, Any]
    pushName: Optional[str] = None
    message: MessageData
    messageType: str

# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Vertex AI Webhook"}

@app.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Recebe notificação da Evolution API.
    """
    logger.info("Webhook Recebido")
    try:
        body = await request.json()
    except:
        # Evolution as vezes manda health check vazio ou payload estranho
        return {"status": "ignored"}

    # 1. Validação Básica
    event = body.get("event")
    if event != "messages.upsert":
        return {"status": "ignored", "reason": "Not a message.upsert"}
    
    # Validação de Token (Se configurado na Evolution para vir no body ou header)
    # Por hora, logamos e seguimos.
    
    try:
        data = body.get("data", {})
        key = data.get("key", {})
        
        # Ignorar mensagens enviadas por mim
        if key.get("fromMe", False):
            return {"status": "ignored", "reason": "From me"}

        sender_id = key.get("remoteJid")
        message_content = data.get("message", {})
        
        # Extrair texto
        text_body = message_content.get("conversation")
        if not text_body and "extendedTextMessage" in message_content:
            text_body = message_content["extendedTextMessage"].get("text")

        if not text_body:
             logger.info(f"Mensagem sem texto de {sender_id}. Ignorando.")
             return {"status": "ignored", "reason": "No text"}

        logger.info(f"Processando mensagem de {sender_id}: {text_body}")

        # 2. Processamento em Background
        # Usamos BackgroundTasks para responder rápido ao webhook (200 OK)
        # e não travar a Evolution API enquanto o Vertex pensa.
        if vertex_service and evolution_client:
            background_tasks.add_task(handle_conversation, sender_id, text_body)
        else:
            logger.error("Serviços Vertex ou Evolution não inicializados corretamente.")

        return {"status": "queued"}

    except Exception as e:
        logger.error(f"Erro no handler: {e}", exc_info=True)
        return {"status": "error"}

async def handle_conversation(sender_id: str, text: str):
    """
    Lógica 'Pesada': Chama Vertex AI -> Recebe Resposta -> Envia via Evolution
    """
    try:
        # 1. Obter resposta da IA
        ai_response = await vertex_service.process_message(sender_id, text)
        
        # 2. Enviar resposta para o WhatsApp
        if ai_response:
            evolution_client.send_text(sender_id, ai_response)
        
    except Exception as e:
        logger.error(f"Erro durante processamento (handle_conversation): {e}", exc_info=True)
