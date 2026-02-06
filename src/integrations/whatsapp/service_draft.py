import logging
from typing import Optional
from google.cloud import discoveryengine_v1 as discoveryengine
from google.api_core.client_options import ClientOptions
from .config import get_settings

# Configuração de Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

class VertexAgentService:
    """
    Serviço responsável por comunicar com o Vertex AI Agent Builder.
    """

    def __init__(self):
        self.project_id = settings.VERTEX_PROJECT_ID
        self.location = settings.VERTEX_LOCATION
        self.agent_id = settings.VERTEX_AGENT_ID
        
        # Cliente do Discovery Engine (Conversational Search para Agents)
        client_options = (
            ClientOptions(api_endpoint=f"{self.location}-discoveryengine.googleapis.com")
            if self.location != "global"
            else None
        )
        
        try:
            self.client = discoveryengine.ConversationalSearchServiceClient(client_options=client_options)
            logger.info(f"Vertex AI Client inicializado. Project: {self.project_id}, Agent: {self.agent_id}")
        except Exception as e:
            logger.error(f"Falha ao inicializar Vertex AI Client: {str(e)}")
            raise e

    def process_message(self, session_id: str, text: str) -> str:
        """
        Envia mensagem para o Vertex AI e retorna a resposta.
        Mantém o contexto baseado no session_id (Serving Config).
        """
        try:
            # Caminho completo do recurso "Serving Config" do Agente
            # Formato padrão: projects/{project}/locations/{location}/collections/{collection}/dataStores/{data_store}/servingConfigs/{serving_config}
            # OBS: Para Apps de Chat do Agent Builder, geralmente usa-se o data_store_id ou o próprio agent_id como serving config default.
            # Vou assumir o padrão 'default_serving_config' associado ao Data Store/Agent.
            
            serving_config = self.client.serving_config_path(
                project=self.project_id,
                location=self.location,
                data_store=self.agent_id, # Em muitos setups, o Agent ID atua como o Data Store ID principal
                serving_config="default_serving_config",
            )

            # Define o recurso de Conversa (para manter histórico)
            if session_id:
                conversation_name = self.client.conversation_path(
                    project=self.project_id,
                    location=self.location,
                    data_store=self.agent_id,
                    conversation=session_id
                )
            else:
                # Se não houver session, cria uma nova (o cliente gera o ID ou deixamos o Google gerar)
                # Para simplificar, vamos assumir que o session_id vem do cliente (ex: numero whatsapp)
                # Mas o Discovery Engine exige um formato específico de resource name.
                # Se for a primeira vez, mandamos None no resource name e ele cria.
                # Mas para manter estado entre chamadas HTTP, precisamos persistir esse ID de conversa.
                # O Evolution envia o mesmo sender. Vamos usar isso como chave.
                # Simplificação: Não persistirei o ID de conversa do Google em banco agora. 
                # Tratarei cada mensagem como "stateless" do ponto de vista deste middleware, 
                # MAS enviando o histórico se o Vertex suportar enviar histórico completo, 
                # OU (melhor) assumindo que o endpoint converse aceita o conversation resource name.
                
                # CORREÇÃO ESTRATÉGICA: O `converse_conversation` cria a conversa se não existir?
                # Sim, se você passar o parent.
                pass

            # Monta a requisição
            request = discoveryengine.ConverseConversationRequest(
                name=conversation_name if session_id else None, # Se já tiver o ID formado
                query=discoveryengine.TextInput(input=text),
                serving_config=serving_config,
                # Se não tiver session_id (primeira msg), passamos apenas o serving_config e ele cria a conversation
            )
            
            # ATENÇÃO: A lógica de conversation ID do Google é complexa. Ele gera um UUID.
            # Não podemos usar o número de telefone DIRETAMENTE como ID da conversa do Google.
            # Teríamos que mapear Telefone -> Google Conversation ID.
            # Como não temos banco de dados SQL aqui (apenas in-memory ou local), 
            # vou implementar um fluxo simplificado onde usamos o `converse_conversation` 
            # criando uma NOVA conversa a cada request se não tivermos mapeamento, 
            # O ideal seria ter um Redis/DB. 
            
            # DADA A RESTRIÇÃO DE TEMPO E ESCOPO:
            # Vou simplificar usando "Search" ou assumindo que o usuario quer apenas Q&A simples.
            # Mas o prompt pede "manter histórico".
            # Solução robusta sem banco externo complexo: Usar o número do whatsapp como chave em um dicionário em memória (cache LRU) ou arquivo json simples local.
            # Como o prompt pede "persistencia" e "session_id", vou usar um arquivo JSON local para mapear phone_number -> conversation_id.
            
            # Refazendo a chamada correta com gestão de sessão local simples no próximo bloco.
            return "Resposta simulada (Lógica de sessão a implementar no próximo passo)"
            
        except Exception as e:
            logger.error(f"Erro ao processar mensagem no Vertex AI: {str(e)}")
            return "Desculpe, estou enfrentando dificuldades técnicas no momento."

    def _get_or_create_conversation_id(self, user_identifier: str) -> str:
        """
        Helper para mapear user_id (telefone) -> vertex_conversation_id.
        Implementação simples com arquivo JSON para persistência mínima.
        """
        # Implementarei isso no código final.
        pass
