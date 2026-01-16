<?php
/**
 * PLENA LICENSE SERVER V3 (CRM Enhanced)
 * Backend centralizado para gestão de licenças, leads e analytics.
 */

// 1. HEADERS DE SEGURANÇA E CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret');

// Headers anti-cache para dados sensíveis
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// Fallback para secrets
if (file_exists('secrets.php')) {
    require_once 'secrets.php';
}
if (!isset($ADMIN_SECRET) || empty($ADMIN_SECRET)) {
    $ADMIN_SECRET = 'PLENA_MASTER_KEY_2026';
}

// 2. AUTO-REPAIR E BANCO DE DADOS
$DB_FILE = 'database_licenses_secure.json';
$LEADS_FILE = 'leads_abandono.json';

// Garante que os arquivos existam com array vazio para evitar erros
if (!file_exists($DB_FILE)) {
    file_put_contents($DB_FILE, json_encode([]));
}
if (!file_exists($LEADS_FILE)) {
    file_put_contents($LEADS_FILE, json_encode([]));
}

// 3. CAPTURA DE INPUT
$action = $_GET['action'] ?? '';
$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);

// Se o JSON estiver quebrado, $data será null. Tratamos isso.
if (json_last_error() !== JSON_ERROR_NONE && !empty($json_input)) {
    // Input inválido, mas se action for get (sem body), ok.
}

// ==================================================================
// ACTIONS DO ADMIN
// ==================================================================

// 1. LISTAR LICENÇAS (Otimizado para CRM)
if ($action === 'list') {
    // Auth Check
    $auth = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? $data['secret'] ?? $_GET['secret'] ?? '';
    if ($auth !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $list = [];
    
    foreach ($db as $key => $val) {
        // Normalização de dados para o Frontend
        $val['key'] = $key;
        $val['payment_id'] = $val['payment_id'] ?? 'MANUAL';
        $val['created_at'] = $val['created_at'] ?? '2024-01-01 00:00:00';
        $val['client'] = $val['client'] ?? 'sem_email@plena.com';
        
        $list[] = $val;
    }
    
    // Ordena por data (mais recentes primeiro)
    usort($list, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    echo json_encode($list);
    exit;
}

// 2. DASHBOARD STATS (Com Charts 0-filled)
if ($action === 'dashboard_stats') {
    $auth = $data['secret'] ?? $_GET['secret'] ?? '';
    if ($auth !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }

    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    
    // Config de Preços Estimados
    $prices = [
        'Plena Aluguéis' => 97.00,
        'Plena System' => 147.00,
        'Plena Odonto' => 127.00,
        'Plena Finanças' => 79.90,
        'default' => 97.00
    ];

    $total_revenue = 0;
    $sales_today = 0;
    $sales_month = 0;
    $clients_map = [];
    $product_counts = [];
    $sales_by_date = []; // '2025-01-01' => 5

    $today_str = date('Y-m-d');
    $month_str = date('Y-m');

    foreach ($db as $lic) {
        $created_raw = $lic['created_at'] ?? date('Y-m-d H:i:s');
        $created = substr($created_raw, 0, 10);
        $created_month = substr($created_raw, 0, 7);
        $prod = $lic['product'] ?? 'Desconhecido';
        
        // Revenue
        $val = $prices[$prod] ?? $prices['default'];
        $total_revenue += $val;

        // Counters
        if ($created === $today_str) $sales_today++;
        if ($created_month === $month_str) $sales_month++;

        // Clients Unique
        $email = strtolower($lic['client'] ?? 'unknown');
        if (!isset($clients_map[$email])) $clients_map[$email] = 0;
        $clients_map[$email]++;

        // Products
        if (!isset($product_counts[$prod])) $product_counts[$prod] = 0;
        $product_counts[$prod]++;

        // By Date (for Chart)
        if (!isset($sales_by_date[$created])) $sales_by_date[$created] = 0;
        $sales_by_date[$created]++;
    }

    // Top Products
    arsort($product_counts);
    $top_products = array_slice($product_counts, 0, 5, true);

    // Chart Data (Last 30 days complete)
    $chart_labels = [];
    $chart_data = [];
    
    for ($i = 29; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-$i days"));
        $chart_labels[] = date('d/m', strtotime($d));
        $chart_data[] = $sales_by_date[$d] ?? 0;
    }

    echo json_encode([
        'total_revenue' => $total_revenue,
        'sales_today' => $sales_today,
        'total_clients' => count($clients_map),
        'top_products' => $top_products,
        'chart' => [
            'labels' => $chart_labels,
            'data' => $chart_data
        ]
    ]);
    exit;
}

// 3. GET LEADS (CRM)
if ($action === 'get_leads') {
    $auth = $data['secret'] ?? $_GET['secret'] ?? '';
    if ($auth !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }

    if (file_exists($LEADS_FILE)) {
        $leads = json_decode(file_get_contents($LEADS_FILE), true);
        if (!is_array($leads)) $leads = [];
        
        // Converte objeto (email => data) para array de objetos se necessário
        // O api_pagamento grava como map: "email": {data...}
        // Mas o frontend espera um array listavel.
        
        // Verifica se é array associativo (mapa) ou indexado
        $is_assoc = array_keys($leads) !== range(0, count($leads) - 1);
        
        if (!empty($leads) && $is_assoc) {
            $leads = array_values($leads);
        }

        // Ordenar
        usort($leads, function($a, $b) {
            return strtotime($b['date'] ?? 0) - strtotime($a['date'] ?? 0);
        });

        echo json_encode($leads);
    } else {
        echo json_encode([]);
    }
    exit;
}

// 4. CRIAR LICENÇA MANUAL
if ($action === 'create') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    
    $client = $data['client_name'] ?? 'Manual User';
    $product = $data['product'] ?? 'Produto Manual';
    
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    // Mapeamento de links simples
    $path = 'apps.plus/plena_alugueis.html';
    if(strpos($product, 'Odonto') !== false) $path = 'apps.plus/plena_odonto.html';
    if(strpos($product, 'System') !== false) $path = 'apps.plus/plena_pdv.html'; // Exemplo
    
    $fullLink = "https://plenaaplicativos.com.br/" . $path;
    
    $newLic = [
        "client" => $client,
        "product" => $product,
        "device_id" => null,
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s'), // ISO 8601
        "payment_id" => "MANUAL_" . date('Hm'),
        "app_link" => $fullLink
    ];

    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $db[$key] = $newLic;
    file_put_contents($DB_FILE, json_encode($db));

    // Enviar Email Opcional
    sendLicenseEmail($client, $product, $key, $fullLink);

    echo json_encode(["success" => true, "license_key" => $key]);
    exit;
}

// 5. UPDATE STATUS (BAN / RESET)
if ($action === 'update_status') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    
    $key = $data['key'] ?? '';
    $status = $data['status'] ?? '';

    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    
    if (isset($db[$key])) {
        if ($status === 'reset_device') {
            $db[$key]['device_id'] = null;
        } else {
            $db[$key]['status'] = $status;
        }
        file_put_contents($DB_FILE, json_encode($db));
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Chave não encontrada"]);
    }
    exit;
}

// 6. REENVIAR EMAIL
if ($action === 'resend_email') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    
    $key = $data['key'] ?? '';
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];

    if (isset($db[$key])) {
        $lic = $db[$key];
        $sent = sendLicenseEmail($lic['client'], $lic['product'], $key, $lic['app_link'] ?? '#');
        echo json_encode(['success' => $sent, 'message' => $sent ? 'Email reenviado.' : 'Falha no envio.']);
    } else {
        echo json_encode(['error' => 'Chave inválida']);
    }
    exit;
}

// 7. GET LOGS
if ($action === 'get_logs') {
    if (($data['secret'] ?? $_GET['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso Negado']); exit;
    }
    $logFile = 'debug_log.txt';
    if(file_exists($logFile)) {
        $lines = array_slice(file($logFile), -100);
        echo json_encode(['logs' => array_map('trim', $lines)]);
    } else {
        echo json_encode(['logs' => []]);
    }
    exit;
}

// ==================================================================
// ACTIONS PÚBLICAS (VALIDAÇÃO DE LICENÇA PELO APP)
// ==================================================================
if ($action === 'validate' || $action === 'validate_access') {
    $key = $data['license_key'] ?? '';
    $device = $data['device_fingerprint'] ?? '';
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];

    if (!isset($db[$key])) {
        echo json_encode(["valid" => false, "message" => "Chave Inválida"]);
        exit;
    }

    $lic = $db[$key];
    
    if (($lic['status'] ?? 'active') !== 'active') {
        echo json_encode(["valid" => false, "message" => "Licença Bloqueada/Suspensa"]);
        exit;
    }

    // Lógica de Device Lock
    $currentDevice = $lic['device_id'] ?? null;
    
    if (empty($currentDevice)) {
        // Primeiro uso: Vincula
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        file_put_contents($DB_FILE, json_encode($db));
        echo json_encode(["valid" => true, "message" => "Ativado com Sucesso!"]);
    } elseif ($currentDevice === $device) {
        // Mesmo device: OK
        echo json_encode(["valid" => true, "message" => "Acesso Permitido"]);
    } else {
        // Device diferente: Bloqueia
        echo json_encode(["valid" => false, "message" => "Licença já usada em outro dispositivo."]);
    }
    exit;
}


// UTIL: EMAIL SENDER
function sendLicenseEmail($to, $productName, $key, $link) {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    
    $subject = "✅ Seu Acesso: $productName";
    $html = "
    <div style='font-family:sans-serif; padding:20px;'>
        <h2>Acesso Liberado</h2>
        <p>Produto: <strong>$productName</strong></p>
        <div style='background:#f0f9ff; padding:15px; border:1px solid #bae6fd; margin:10px 0;'>
            Chave: <strong style='font-size:1.2em'>$key</strong>
        </div>
        <a href='$link' style='display:inline-block; padding:10px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:5px;'>Acessar Sistema</a>
    </div>";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Plena Tecnologia <tecnologia@plenainformatica.com.br>\r\n";
    
    return mail($to, $subject, $html, $headers);
}

// Default Check
echo json_encode(["status" => "Online", "version" => "3.0"]);
?>
