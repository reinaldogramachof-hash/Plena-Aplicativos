<?php
/**
 * PLENA LICENSE SERVER V2 (Com Listagem Admin)
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'secrets.php';
// $ADMIN_SECRET vem do secrets.php

$DB_FILE = 'database_licenses_secure.json';

if (!file_exists($DB_FILE)) file_put_contents($DB_FILE, json_encode([]));

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);

// 1. LISTAR LICENÇAS (Novo: Para o Admin.html)
if ($action === 'list') {
    // Verifica senha enviada via Header ou GET para segurança básica
    $auth = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? $_GET['secret'] ?? '';
    if ($auth !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true);
    // Transforma objeto em array para o Vue
    $list = [];
    foreach ($db as $key => $val) {
        $val['key'] = $key; // Inclui a chave no objeto
        $list[] = $val;
    }
    // Ordena por data (mais recentes primeiro)
    usort($list, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    echo json_encode($list);
    exit;
}

// 2. CRIAR LICENÇA
if ($action === 'create') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Senha incorreta']); exit;
    }
    $db = json_decode(file_get_contents($DB_FILE), true);
    
    // Gera chave legível: PLENA-XXXX-YYYY
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    $db[$key] = [
        "client" => $data['client_name'],
        "product" => $data['product'],
        "device_id" => null,
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s')
    ];
    
    file_put_contents($DB_FILE, json_encode($db));
    echo json_encode(["success" => true, "license_key" => $key]);
    exit;
}

// 3. VALIDAR (Para os Apps)
if ($action === 'validate') {
    $key = $data['license_key'] ?? '';
    $device = $data['device_fingerprint'] ?? '';
    $db = json_decode(file_get_contents($DB_FILE), true);
    
    if (!isset($db[$key])) { echo json_encode(["valid" => false, "message" => "Chave Inválida"]); exit; }
    
    $lic = $db[$key];
    if ($lic['status'] !== 'active') { echo json_encode(["valid" => false, "message" => "Licença Suspensa"]); exit; }
    
    if ($lic['device_id'] === null) {
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        file_put_contents($DB_FILE, json_encode($db));
        echo json_encode(["valid" => true, "message" => "Ativado com Sucesso!"]);
    } elseif ($lic['device_id'] === $device) {
        echo json_encode(["valid" => true, "message" => "Acesso Permitido"]);
    } else {
        echo json_encode(["valid" => false, "message" => "Chave já usada em outro dispositivo."]);
    }
    exit;
}

// 4. RESETAR/BANIR (Novo: Ações Admin Extras)
if ($action === 'update_status') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) { http_response_code(403); exit; }
    
    $key = $data['key'];
    $newStatus = $data['status']; // 'active', 'banned', 'reset_device'
    
    $db = json_decode(file_get_contents($DB_FILE), true);
    if(isset($db[$key])) {
        if ($newStatus === 'reset_device') {
            $db[$key]['device_id'] = null;
        } else {
            $db[$key]['status'] = $newStatus;
        }
        file_put_contents($DB_FILE, json_encode($db));
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Chave não encontrada"]);
    }
    exit;
}

echo json_encode(["status" => "Online"]);
?>
