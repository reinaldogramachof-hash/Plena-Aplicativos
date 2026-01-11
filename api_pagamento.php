<?php
/**
 * PLENA API - GATEWAY DE PAGAMENTO & AUTOMAÇÃO
 * Integração: Mercado Pago -> Licença -> Email
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Carrega segredos (Token MP e Senha Admin)
require_once 'secrets.php'; 
// Certifique-se que secrets.php tem $ACCESS_TOKEN e $ADMIN_SECRET

$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// --- FUNÇÃO AUXILIAR: GERAR LICENÇA INTERNAMENTE ---
function gerarLicencaAutomatica($clientName, $productName) {
    global $ADMIN_SECRET;
    $dbFile = 'database_licenses_secure.json';
    
    if (!file_exists($dbFile)) return false;
    
    $db = json_decode(file_get_contents($dbFile), true);
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    $db[$key] = [
        "client" => $clientName,
        "product" => $productName,
        "device_id" => null,
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s'),
        "origin" => "automatic_sale"
    ];
    
    file_put_contents($dbFile, json_encode($db));
    return $key;
}

// 1. CRIAR PREFERÊNCIA DE PAGAMENTO
if ($action === 'create_preference') {
    if (!$data) { http_response_code(400); echo json_encode(['error' => 'Sem dados']); exit; }

    $product = $data['product'];
    $payer = $data['payer'];
    
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $baseUrl = "$protocol://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']);

    // Limpeza de URL para garantir formato correto
    if (substr($baseUrl, -1) == '/') $baseUrl = substr($baseUrl, 0, -1);

    $preference_data = [
        "items" => [[
            "id" => "plena-" . uniqid(),
            "title" => $product['name'],
            "description" => substr($product['desc'], 0, 200),
            "quantity" => 1,
            "currency_id" => "BRL",
            "unit_price" => (float)$product['price']
        ]],
        "payer" => [
            "name" => $payer['name'],
            "email" => $payer['email'],
            "identification" => [
                "type" => strlen(preg_replace('/\D/', '', $payer['doc'])) > 11 ? "CNPJ" : "CPF",
                "number" => preg_replace('/\D/', '', $payer['doc'])
            ]
        ],
        "back_urls" => [
            "success" => "$baseUrl/checkout.html",
            "failure" => "$baseUrl/checkout.html",
            "pending" => "$baseUrl/checkout.html"
        ],
        "auto_return" => "approved",
        // WEBHOOK ATIVADO AQUI:
        "notification_url" => "$baseUrl/api_pagamento.php?action=webhook",
        "external_reference" => "PEDIDO_" . time(),
        "statement_descriptor" => "PLENA APPS"
    ];

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.mercadopago.com/checkout/preferences",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode($preference_data),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . $ACCESS_TOKEN
        ],
    ]);

    $response = curl_exec($curl);
    curl_close($curl);
    echo $response;
    exit;
}

// 2. WEBHOOK (O MERCADO PAGO BATE AQUI)
if ($action === 'webhook') {
    $topic = $_GET['topic'] ?? $_GET['type'] ?? '';
    $id = $_GET['id'] ?? $_GET['data_id'] ?? '';

    if ($topic === 'payment' && $id) {
        // Consulta status no MP
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => "https://api.mercadopago.com/v1/payments/$id",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer " . $ACCESS_TOKEN],
        ]);
        $payment = json_decode(curl_exec($curl), true);
        curl_close($curl);

        if (($payment['status'] ?? '') === 'approved') {
            $emailCliente = $payment['payer']['email'];
            $nomeProduto = $payment['description'];
            $nomeCliente = $payment['payer']['first_name'] ?? 'Cliente';

            // GERA A LICENÇA AUTOMATICAMENTE
            $novaLicenca = gerarLicencaAutomatica($nomeCliente, $nomeProduto);

            if ($novaLicenca) {
                // ENVIA EMAIL
                $assunto = "Seu Acesso Confirmado: $nomeProduto";
                $msg = "Olá, $nomeCliente!\n\n";
                $msg .= "Seu pagamento foi aprovado com sucesso.\n\n";
                $msg .= "== SEUS DADOS DE ACESSO ==\n";
                $msg .= "Produto: $nomeProduto\n";
                $msg .= "Sua Chave de Licença: $novaLicenca\n\n";
                $msg .= "Acesse agora em: https://plena-aplicativos.web.app/\n\n";
                $msg .= "No primeiro acesso, insira a chave acima para liberar seu dispositivo.\n";
                $msg .= "Obrigado por escolher a Plena Aplicativos!";
                
                $headers = "From: no-reply@plenaaplicativos.com.br" . "\r\n" .
                           "Reply-To: contato@plenaaplicativos.com.br" . "\r\n" .
                           "X-Mailer: PHP/" . phpversion();

                mail($emailCliente, $assunto, $msg, $headers);
                
                // Log de segurança
                file_put_contents('vendas_auto.log', date('Y-m-d H:i:s') . " | $emailCliente | $novaLicenca" . PHP_EOL, FILE_APPEND);
            }
        }
    }
    http_response_code(200); // MP exige 200 OK sempre
    echo "Webhook Recebido";
    exit;
}

echo json_encode(['status' => 'Payment API Online']);
?>