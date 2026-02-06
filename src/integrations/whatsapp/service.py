import json
import logging
import os
import httpx
from typing import Optional, Dict
from google.cloud import discoveryengine_v1 as discoveryengine
from google.api_core.client_options import ClientOptions
from .config import get_settings

# Configuração de Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()
SESSIONS_FILE = "src/integrations/whatsapp/sessions.json"

class VertexAgentService:
    """
    Serviço Híbrido de IA:
    - Tenta usar Gemini Direct API (REST) se GOOGLE_API_KEY estiver configurada.
    - Caso contrário, usa Vertex AI Agent Builder (Discovery Engine).
    """

    def __init__(self):
        self.settings = get_settings()
        self.sessions: Dict[str, Dict] = self._load_sessions()
        self.vertex_client = None

        # Inicializa Cliente Vertex AI (apenas se não formos usar Direct API ou como fallback)
        # Se NÃO tiver API Key, assume-se que deve usar Credentials padrão do Google
        if not self.settings.GOOGLE_API_KEY:
            self._init_vertex_client()
        else:
            logger.info("Modo Gemini Direct API ativado (GOOGLE_API_KEY detectada).")

    def _init_vertex_client(self):
        try:
            client_options = (
                ClientOptions(api_endpoint=f"{self.settings.VERTEX_LOCATION}-discoveryengine.googleapis.com")
                if self.settings.VERTEX_LOCATION != "global"
                else None
            )
            self.vertex_client = discoveryengine.ConversationalSearchServiceAsyncClient(client_options=client_options)
            logger.info("Vertex AI Async Client (Agent Builder) inicializado.")
        except Exception as e:
            logger.warning(f"Não foi possível inicializar Vertex AI Client: {e}. Certifique-se de ter credenciais se não estiver usando API KEY.")

    def _load_sessions(self) -> Dict[str, Dict]:
        """Carrega histórico/sessões. Agora armazenamos mais que apenas o ID."""
        if os.path.exists(SESSIONS_FILE):
            try:
                with open(SESSIONS_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_sessions(self):
        try:
            with open(SESSIONS_FILE, 'w') as f:
                json.dump(self.sessions, f)
        except Exception as e:
            logger.error(f"Erro ao salvar sessão: {e}")

    async def process_message(self, user_identifier: str, text: str) -> str:
        """
        Roteia o processamento da mensagem para o backend adequado.
        """
        # 1. Tenta Gemini Direct API
        if self.settings.GOOGLE_API_KEY:
            return await self._process_gemini_direct(user_identifier, text)
        
        # 2. Tenta Vertex Agent Builder
        if self.vertex_client:
            return await self._process_vertex_agent(user_identifier, text)
            
        return "Erro de Configuração: Nenhuma IA (Key ou Agent) configurada corretamente."

    async def _process_gemini_direct(self, user_id: str, text: str) -> str:
        """
        Consome a API do Gemini via HTTP REST (sem libs pesadas).
        Mantém histórico simples no JSON de sessões.
        """
        # Recupera histórico local (Limitado a ultimas 10 msgs para não estourar contexto)
        session_data = self.sessions.get(user_id, {"history": []})
        history = session_data.get("history", [])
        
        # Monta prompt com histórico
        # Estrutura do Gemini: contents: [{role: "user"|"model", parts: [{text: "..."}]}]
        contents = history[-10:] + [{"role": "user", "parts": [{"text": text}]}]
        
        # Instrução de Sistema (Opcional, mas bom para dar personalidade)
        system_instruction = {
            "parts": [{"text": "Você é o assistente virtual da Plena Aplicativos. Seja cordial, direto e use o manifesto da empresa como base. Responda em PT-BR."}]
        }

        url = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{self.settings.GEMINI_MODEL_NAME}:generateContent"
        
        # Se a chave não começar com AIza, assumimos que é um endpoint/token diferente ou usamos conforme o curl do usuario
        # O usuario mandou: aiplatform...streamGenerateContent?key=X
        # Vamos usar generateContent padrão.
        
        params = {"key": self.settings.GOOGLE_API_KEY}
        payload = {
            "contents": contents,
            "systemInstruction": system_instruction,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, params=params, json=payload, timeout=30.0)
                
                if resp.status_code != 200:
                    logger.error(f"Erro Gemini API: {resp.status_code} - {resp.text}")
                    return "Desculpe, estou em manutenção momentânea."
                
                response_json = resp.json()
                
                # Extração da resposta
                try:
                    ai_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
                except KeyError:
                    return "Não entendi."

                # Atualiza histórico
                history.append({"role": "user", "parts": [{"text": text}]})
                history.append({"role": "model", "parts": [{"text": ai_text}]})
                
                self.sessions[user_id] = {"history": history}
                self._save_sessions()
                
                return ai_text

        except Exception as e:
            logger.error(f"Exceção Gemini Direct: {e}")
            return "Erro técnico ao contatar a IA."

    async def _process_vertex_agent(self, user_id: str, text: str) -> str:
        """Legado: Lógica original do Vertex Agent Builder."""
        # Recupera conversation ID
        session_data = self.sessions.get(user_id, {})
        conversation_name = session_data.get("conversation_name")
        
        try:
             # Se não temos um conversation_name mapeado, criamos um novo
            if not conversation_name:
                parent = self.vertex_client.data_store_path(
                    project=self.settings.VERTEX_PROJECT_ID,
                    location=self.settings.VERTEX_LOCATION,
                    data_store=self.settings.VERTEX_DATA_STORE_ID or self.settings.VERTEX_AGENT_ID,
                )
                conversation = await self.vertex_client.create_conversation(
                    parent=parent,
                    conversation=discoveryengine.Conversation(user_pseudo_id=user_id),
                )
                conversation_name = conversation.name
                self.sessions[user_id] = {"conversation_name": conversation_name}
                self._save_sessions()

            serving_config = self.vertex_client.serving_config_path(
                project=self.settings.VERTEX_PROJECT_ID,
                location=self.settings.VERTEX_LOCATION,
                data_store=self.settings.VERTEX_DATA_STORE_ID or self.settings.VERTEX_AGENT_ID,
                serving_config="default_serving_config",
            )
            
            request = discoveryengine.ConverseConversationRequest(
                name=conversation_name,
                query=discoveryengine.TextInput(input=text),
                serving_config=serving_config,
            )
            
            response = await self.vertex_client.converse_conversation(request=request)
            
            if response.reply:
                return response.reply.reply
            elif response.search_results:
                return "Encontrei: " + response.search_results[0].document.derived_struct_data.get('snippet', '')
            return "Sem resposta."
            
        except Exception as e:
             logger.error(f"Erro Vertex Agent: {e}")
             return "Erro no Agente Vertex."
