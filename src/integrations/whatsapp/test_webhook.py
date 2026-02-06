import requests
import json
import time

def test_webhook():
    """
    Simula uma requisição POST da Evolution API para o nosso webhook local.
    """
    url = "http://localhost:8000/webhook"
    
    # Payload simulado da Evolution API (evento messages.upsert)
    payload = {
        "event": "messages.upsert",
        "instance": "instancia-teste",
        "data": {
            "key": {
                "remoteJid": "5511999998888@s.whatsapp.net",
                "fromMe": False,
                "id": "MSG-TEST-123"
            },
            "pushName": "Cliente Teste",
            "message": {
                "conversation": "Olá, gostaria de saber o status do meu pedido."
            },
            "messageType": "conversation"
        },
        "sender": "5511999998888@s.whatsapp.net"
    }

    print(f"Enviando payload para {url}...")
    try:
        # Nota: Isso vai falhar se o servidor não estiver rodando.
        # Este script é para ser rodado APÓS 'uvicorn ...'
        response = requests.post(url, json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print("Resposta:")
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("ERRO: Não foi possível conectar em localhost:8000.")
        print("Certifique-se de que o servidor está rodando: 'uvicorn src.integrations.whatsapp.router:app --reload'")

if __name__ == "__main__":
    test_webhook()
