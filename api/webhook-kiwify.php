<?php
// api/webhook-kiwify.php

// 1. Configurações do Firebase
$projectId = "plena-system"; // Seu Project ID
$apiKey = "AIzaSyDuYEnG0xwn9_m3I6YKQdz89NJTJpnSPHY"; // Sua API Key
$collection = "sales";

// 2. Receber o JSON da Kiwify
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Log para debug (opcional, cria um arquivo log.txt)
// file_put_contents('log.txt', print_r($data, true), FILE_APPEND);

// Verifica se chegou dado válido
if (!$data) {
    http_response_code(400);
    die("No data received");
}

// 3. Extrair dados importantes da Venda (Mapeamento Kiwify -> Seu Sistema)
// Ajuste os campos abaixo conforme o payload real da Kiwify se mudar
$orderId = $data['order_id'] ?? uniqid();
$productName = $data['Product']['name'] ?? 'Produto Desconhecido';
$status = $data['order_status'] ?? 'pending';
$customerName = $data['Customer']['full_name'] ?? 'Cliente';
$customerEmail = $data['Customer']['email'] ?? 'email@nao.informado';
$amount = isset($data['commission']) ? $data['commission'] / 100 : 0; // Kiwify envia em centavos? Ajuste se necessário

// 4. Montar o Payload para o Firestore REST API
// O Firestore exige que tipemos cada campo (stringValue, doubleValue, etc)
$firestoreData = [
    "fields" => [
        "order_id" => ["stringValue" => (string)$orderId],
        "product_name" => ["stringValue" => (string)$productName],
        "status" => ["stringValue" => (string)$status],
        "customer_name" => ["stringValue" => (string)$customerName],
        "customer_email" => ["stringValue" => (string)$customerEmail],
        "amount" => ["doubleValue" => (float)$amount],
        "platform" => ["stringValue" => "Kiwify"],
        "created_at" => ["timestampValue" => date("Y-m-d\TH:i:s\Z")]
    ]
];

// 5. Enviar para o Firestore via cURL
$url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection?key=$apiKey";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($firestoreData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 6. Resposta para a Kiwify
if ($httpCode >= 200 && $httpCode < 300) {
    http_response_code(200);
    echo json_encode(["status" => "success", "firestore_id" => json_decode($response)->name ?? 'unknown']);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Firestore Error: " . $response]);
}
?>
