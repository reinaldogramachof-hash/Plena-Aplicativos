<?php
/**
 * PLENA LICENSE SERVER V2 (Com Listagem Admin)
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'secrets.php';
// Override ou Fallback de segurança
if (!isset($ADMIN_SECRET) || empty($ADMIN_SECRET)) {
    $ADMIN_SECRET = 'PLENA_MASTER_KEY_2026';
}

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
    $product = $data['product'];
    $client = $data['client_name']; // Pode ser email ou nome
    
    // Define Link baseado no produto
    $linkMap = [
        'Plena Aluguéis' => 'apps.plus/plena_alugueis.html',
        'Plena System' => 'apps.plus/plena_system.html', // Exemplo
        'Plena Odonto' => 'apps.plus/plena_odonto.html'
    ];
    $appPath = $linkMap[$product] ?? 'apps.plus/plena_alugueis.html';
    $fullLink = "https://plenaaplicativos.com.br/" . $appPath;

    $db[$key] = [
        "client" => $client,
        "product" => $product,
        "device_id" => null,
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s'),
        "app_link" => $fullLink
    ];
    
    file_put_contents($DB_FILE, json_encode($db));

    // ENVIO DE EMAIL AUTOMÁTICO
    // Só envia se parecer um email
    if (filter_var($client, FILTER_VALIDATE_EMAIL)) {
        $to = $client;
        $subject = "✅ Seu Acesso Liberado: $product";
        
        $htmlContent = "
        <html>
        <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
            <div style='max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'>
                <div style='text-align: center; margin-bottom: 30px;'>
                    <h1 style='color: #2563EB;'>Plena Aplicativos</h1>
                </div>
                <p>Olá,</p>
                <p>Seu acesso ao sistema <strong>$product</strong> foi gerado manualmente pela nossa equipe.</p>
                
                <div style='background-color: #eff6ff; border: 1px dashed #2563EB; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;'>
                    <p style='margin: 0; color: #64748b; font-size: 14px;'>SUA CHAVE DE ACESSO</p>
                    <h2 style='margin: 10px 0; font-family: monospace; letter-spacing: 2px; color: #1e293b;'>$key</h2>
                    <br>
                    <a href='$fullLink' style='display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;'>ACESSAR SISTEMA AGORA</a>
                </div>

                <p><strong>Como ativar:</strong></p>
                <ol>
                    <li>Clique no botão acima.</li>
                    <li>Na tela de bloqueio, cole a chave.</li>
                    <li>Clique em 'Liberar Acesso'.</li>
                </ol>

                <p style='margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;'>
                    Plena Soluções Digitais
                </p>
            </div>
        </body>
        </html>
        ";

        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Plena Tecnologia <tecnologia@plenainformatica.com.br>" . "\r\n";
        $headers .= "Reply-To: suporte@plenaaplicativos.com.br" . "\r\n";

        mail($to, $subject, $htmlContent, $headers);
    }

    echo json_encode(["success" => true, "license_key" => $key]);
    exit;
}

// 3. VALIDAR (Para os Apps)
if ($action === 'validate' || $action === 'validate_access') {
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

// ------------------------------------------------------------------
// 4. DASHBOARD STATS (ANALYTICS)
// ------------------------------------------------------------------
if ($action === 'dashboard_stats') {
    // Verifica Auth
    if (($data['secret'] ?? $_GET['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit;
    }

    $db_file = 'database_licenses_secure.json';
    if (!file_exists($db_file)) {
        echo json_encode([
            'total_revenue' => 0, 'sales_today' => 0, 'sales_month' => 0,
            'total_clients' => 0, 'active_licenses' => 0,
            'recent_sales' => [], 'chart' => ['labels'=>[],'data'=>[]],
            'top_products' => [], 'crm_clients' => []
        ]);
        exit;
    }

    $db = json_decode(file_get_contents($db_file), true);
    
    // Config de Precos
    $prices = [
        'Plena Aluguéis' => 97.00,
        'Plena System' => 147.00,
        'Plena Odonto' => 127.00,
        'default' => 97.00
    ];

    $total_revenue = 0; $sales_today = 0; $sales_month = 0;
    $clients_map = []; $product_counts = []; $sales_by_date = [];

    $today_str = date('Y-m-d');
    $month_str = date('Y-m');

    $list = [];
    foreach ($db as $key => $lic) {
        $lic['key'] = $key;
        $list[] = $lic;
    }
    // Ordena por data decrescente
    usort($list, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    foreach ($list as $lic) {
        $created = substr($lic['created_at'], 0, 10);
        $created_month = substr($lic['created_at'], 0, 7);

        $val = $prices[$lic['product']] ?? $prices['default'];
        $total_revenue += $val;

        if ($created === $today_str) $sales_today++;
        if ($created_month === $month_str) $sales_month++;

        $email = strtolower($lic['client']);
        if (!isset($clients_map[$email])) $clients_map[$email] = 0;
        $clients_map[$email]++;

        $prod = $lic['product'];
        if (!isset($product_counts[$prod])) $product_counts[$prod] = 0;
        $product_counts[$prod]++;

        if (!isset($sales_by_date[$created])) $sales_by_date[$created] = 0;
        $sales_by_date[$created]++;
    }

    // Top Products
    arsort($product_counts);
    $top_products = array_slice($product_counts, 0, 5, true);

    // Recent Sales
    $recent_sales = array_slice($list, 0, 10);

    // Chart Data (30 dias)
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
        'sales_month' => $sales_month,
        'total_clients' => count($clients_map),
        'active_licenses' => count($list),
        'recent_sales' => $recent_sales,
        'chart' => [ 'labels' => $chart_labels, 'data' => $chart_data ],
        'top_products' => $top_products,
        'crm_clients' => array_keys($clients_map)
    ]);
    exit;
}

// 5. MANAGE STATUS
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

// ==================================================================
// 6. UTILS E HELPER DE EMAIL (Mesma lógica do api_pagamento.php)
// ==================================================================
function sendLicenseEmail($to, $productName, $key, $link) {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;

    $subject = "✅ Seu Acesso Liberado: $productName";
    
    // HTML Template (Compacto para o Admin)
    $htmlContent = "
    <!DOCTYPE html>
    <html>
    <body style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;'>
        <div style='max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;'>
            <h1 style='color: #2563EB;'>Plena Aplicativos</h1>
            <p>Olá,</p>
            <p>Aqui está o reenvio da sua licença para <strong>$productName</strong>.</p>
            <div style='background-color: #eff6ff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;'>
                <h2 style='color: #1e293b; background: white; padding: 10px; display: inline-block;'>$key</h2>
                <br><br>
                <a href='$link' style='background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>ACESSAR AGORA</a>
            </div>
            <p style='font-size: 12px; color: #94a3b8;'>Reenviado manualmente pelo Suporte.</p>
        </div>
    </body>
    </html>
    ";

    $headers = array(
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Plena Tecnologia <tecnologia@plenainformatica.com.br>',
        'Reply-To: suporte@plenainformatica.com.br',
        'X-Mailer: PHP/' . phpversion()
    );

    return mail($to, $subject, $htmlContent, implode("\r\n", $headers));
}

// ------------------------------------------------------------------
// 7. GET LOGS (Leitura Segura)
// ------------------------------------------------------------------
if ($action === 'get_logs') {
    if (($data['secret'] ?? $_GET['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit;
    }

    $logFile = 'debug_log.txt';
    if (!file_exists($logFile)) {
        echo json_encode(['logs' => ["Sistema de Logs Iniciado."]]);
        exit;
    }

    // Lê as últimas 100 linhas para não travar
    $lines = file($logFile);
    $lastLines = array_slice($lines, -200); 
    
    // Limpa espaços
    $cleanedLogs = array_map('trim', $lastLines);
    
    echo json_encode(['logs' => array_values($cleanedLogs)]);
    exit;
}

// ------------------------------------------------------------------
// 8. RESEND EMAIL
// ------------------------------------------------------------------
if ($action === 'resend_email') {
    if (($data['secret'] ?? '') !== $ADMIN_SECRET) {
        http_response_code(403); echo json_encode(['error' => 'Acesso negado']); exit;
    }

    $key = $data['key'] ?? '';
    if (!$key) { echo json_encode(['error' => 'Chave não informada']); exit; }

    $db = json_decode(file_get_contents($DB_FILE), true);
    if (!isset($db[$key])) { echo json_encode(['error' => 'Licença não encontrada']); exit; }

    $lic = $db[$key];
    
    // Tenta Reenviar
    $sent = sendLicenseEmail($lic['client'], $lic['product'], $key, $lic['app_link']);

    echo json_encode([
        'success' => $sent, 
        'message' => $sent ? 'Email reenviado com sucesso' : 'Falha ao reenviar email (check logs)'
    ]);
    exit;
}

echo json_encode(["status" => "Online"]);
?>
