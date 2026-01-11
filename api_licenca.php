<?php
/**
 * PLENA LICENSE MANAGER (Gatekeeper)
 * Sistema de validação e travamento de dispositivo
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'secrets.php';
// $ADMIN_SECRET é carregado do arquivo secrets.php

// Arquivo que guarda as licenças (Oculto)
$DB_FILE = 'database_licenses_secure.json';

// Inicializa o banco se não existir
if (!file_exists($DB_FILE)) {
    file_put_contents($DB_FILE, json_encode([]));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

// =============================================================
// AÇÃO 1: CRIAR LICENÇA (Admin)
// Chamada: POST ?action=create
// Body: { "secret": "...", "client_name": "João", "product": "Barbearia" }
// =============================================================
if ($action === 'create') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit;
    }

    $db = json_decode(file_get_contents($DB_FILE), true);
    
    // Gera chave única
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    $db[$key] = [
        "client" => $data['client_name'],
        "product" => $data['product'],
        "device_id" => null, // Ainda não ativado
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s')
    ];
    
    file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true, "license_key" => $key]);
    exit;
}

// =============================================================
// AÇÃO 2: VALIDAR / ATIVAR (App do Cliente)
// Chamada: POST ?action=validate
// Body: { "license_key": "...", "device_fingerprint": "..." }
// =============================================================
if ($action === 'validate') {
    $key = $data['license_key'] ?? '';
    $device = $data['device_fingerprint'] ?? '';
    
    $db = json_decode(file_get_contents($DB_FILE), true);
    
    // 1. Licença existe?
    if (!isset($db[$key])) {
        echo json_encode(["valid" => false, "message" => "Licença inválida."]);
        exit;
    }
    
    $license = $db[$key];
    
    // 2. Está ativa?
    if ($license['status'] !== 'active') {
        echo json_encode(["valid" => false, "message" => "Licença suspensa."]);
        exit;
    }
    
    // 3. Verificação de Dispositivo (A TRAVA)
    if ($license['device_id'] === null) {
        // Primeira vez: VINCULAR DISPOSITIVO
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        
        echo json_encode(["valid" => true, "message" => "Licença ativada com sucesso neste dispositivo!"]);
    } elseif ($license['device_id'] === $device) {
        // Dispositivo correto
        echo json_encode(["valid" => true, "message" => "Acesso permitido."]);
    } else {
        // Dispositivo pirata (tentativa de uso em outro local)
        echo json_encode(["valid" => false, "message" => "Licença já em uso em outro aparelho. Contate o suporte."]);
    }
    exit;
}

// =============================================================
// AÇÃO 3: RESETAR DISPOSITIVO (Suporte)
// Útil se o cliente trocou de celular
// =============================================================
if ($action === 'reset') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); exit;
    }
    $key = $data['license_key'];
    $db = json_decode(file_get_contents($DB_FILE), true);
    
    if (isset($db[$key])) {
        $db[$key]['device_id'] = null; // Libera para ativar em novo device
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        echo json_encode(["success" => true]);
    }
    exit;
}

echo json_encode(["status" => "License Server Online"]);
?>
