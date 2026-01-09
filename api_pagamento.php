<?php
/**
 * PLENA API - GATEWAY DE PAGAMENTO (PHP)
 * Backend para HostGator Shared
 */

// Permite acesso do seu domínio
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// ==================================================================
// 🔑 COLOQUE SUA CHAVE DE PRODUÇÃO AQUI (Começa com APP_USR-...)
$ACCESS_TOKEN = "APP_USR-5973790079521605-010916-8b6b65897e6c7c7adafbffd1dc9b62d7-3124472146"; 
// ==================================================================

$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. CRIAR PREFERÊNCIA
if ($action === 'create_preference') {
    if (!$data) { http_response_code(400); echo json_encode(['error' => 'Sem dados']); exit; }

    $product = $data['product'];
    $payer = $data['payer'];
    
    // Configura URLs de retorno
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = "$protocol://$host"; // Ajuste se estiver em subpasta ex: $baseUrl/app

    // Monta requisição para o Mercado Pago
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
            "email" => $payer['email']
        ],
        "back_urls" => [
            "success" => "$baseUrl/checkout.html",
            "failure" => "$baseUrl/checkout.html",
            "pending" => "$baseUrl/checkout.html"
        ],
        "auto_return" => "approved",
        // "notification_url" => "$baseUrl/api_pagamento.php?action=webhook", // Habilite quando for usar Webhook
        "external_reference" => "PEDIDO_" . time(),
        "statement_descriptor" => "PLENA APPS"
    ];

    // Chamada cURL
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
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro cURL: ' . $err]);
    } else {
        echo $response;
    }
    exit;
}

// Resposta padrão se não achar ação
echo json_encode(['status' => 'API Online']);
?>