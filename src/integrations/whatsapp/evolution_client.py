import logging
import requests
from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class EvolutionClient:
    """
    Cliente para interagir com a Evolution API.
    """
    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL.rstrip('/')
        self.token = settings.EVOLUTION_API_TOKEN
        self.instance = settings.EVOLUTION_INSTANCE_NAME
        
        # Headers padrão para autenticação
        self.headers = {
            "apikey": self.token,
            "Content-Type": "application/json"
        }

    def send_text(self, remote_jid: str, text: str) -> bool:
        """
        Envia uma mensagem de texto simples.
        Endpoint: /message/sendText/{instance}
        """
        url = f"{self.base_url}/message/sendText/{self.instance}"
        
        payload = {
            "number": remote_jid, # Pode funcionar com remoteJid direto ou apenas numeros dependendo da versão
            "text": text,
            "delay": 1200, # Delay "digitando" em ms
            "linkPreview": True
        }
        
        # Ajuste fino: Algumas versões da Evolution pedem "number" apenas com números, outras aceitam JID.
        # Geralmente sendText aceita o numero limpo ou JID. 
        # Se remote_jid vier com @s.whatsapp.net, vamos manter, pois a API costuma tratar.
        
        try:
            logger.info(f"Enviando msg para {remote_jid} via Evolution API...")
            response = requests.post(url, json=payload, headers=self.headers, timeout=10)
            
            if response.status_code == 201 or response.status_code == 200:
                logger.info(f"Mensagem enviada com sucesso! Status: {response.status_code}")
                return True
            else:
                logger.error(f"Erro ao enviar mensagem Evolution: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Exceção ao chamar Evolution API: {e}")
            return False
