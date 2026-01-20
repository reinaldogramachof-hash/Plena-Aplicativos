<?php
/**
 * PLENA LICENSE SERVER V5.0 - NEXUS CRM INTEGRATED
 * Sistema completo de gestão de licenças, CRM, financeiro, produtos e equipe.
 */

// ==================================================================
// 0. CONFIGURAÇÃO DE AMBIENTE E CORS
// ==================================================================

// Inicia buffer de saída
ob_start();

// Desativa exibição de erros (para não quebrar JSON)
error_reporting(0);
ini_set('display_errors', 0);

// Define Timezone
date_default_timezone_set('America/Sao_Paulo');

// Headers de segurança e CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Secret");
header("Content-Type: application/json; charset=UTF-8");

// Tratamento de Preflight (CORS) - Retorno imediato
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Headers anti-cache
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// ==================================================================
// 1. CARREGAMENTO DE DEPENDÊNCIAS
// ==================================================================

// Carrega secrets se existir
if (file_exists('secrets.php')) {
    require_once 'secrets.php';
}

// Configurações padrão
if (!isset($ADMIN_SECRET) || empty($ADMIN_SECRET)) {
    $ADMIN_SECRET = 'PLENA_MASTER_KEY_2026';
}

// Constantes do sistema
define('SYSTEM_VERSION', '5.0.0');
define('SYSTEM_NAME', 'Plena Nexus CRM');

// ==================================================================
// 2. ARQUIVOS DE DADOS
// ==================================================================

$DATA_DIR = __DIR__ . '/';

// Diretório raiz é usado para dados
// if (!file_exists($DATA_DIR)) {
//     @mkdir($DATA_DIR, 0755, true);
// }

// Arquivos principais
$DB_FILE = $DATA_DIR . 'database_licenses_secure.json';
$LEADS_FILE = $DATA_DIR . 'leads_crm.json';
$PRODUCTS_FILE = $DATA_DIR . 'products_catalog.json';
$FINANCE_FILE = $DATA_DIR . 'finance_transactions.json';
$TEAM_FILE = $DATA_DIR . 'team_members.json';
$REPORTS_FILE = $DATA_DIR . 'reports_history.json';
$LOGS_FILE = $DATA_DIR . 'system_logs.json';

// Garante que os arquivos existam com estrutura inicial
$init_files = [
    $DB_FILE => [],
    $LEADS_FILE => [],
    $PRODUCTS_FILE => [],
    $FINANCE_FILE => [],
    $TEAM_FILE => [],
    $REPORTS_FILE => [],
    $LOGS_FILE => []
];

foreach ($init_files as $file => $default) {
    if (!file_exists($file)) {
        @file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
    }
}

// ==================================================================
// 3. CATÁLOGO DE PRODUTOS (MASTER)
// ==================================================================

$CATALOG_MASTER = [
    'Plena Aluguéis' => ['price' => 97.00, 'category' => 'aluguel', 'trial_days' => 7, 'status' => 'active'],
    'Plena Artesanato' => ['price' => 97.00, 'category' => 'outros', 'trial_days' => 7, 'status' => 'active'],
    'Plena Assistência' => ['price' => 97.00, 'category' => 'servicos', 'trial_days' => 7, 'status' => 'active'],
    'Plena Barbearia' => ['price' => 97.00, 'category' => 'beleza', 'trial_days' => 7, 'status' => 'active'],
    'Plena Beleza' => ['price' => 97.00, 'category' => 'beleza', 'trial_days' => 7, 'status' => 'active'],
    'Plena Card' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Checklist' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Controle' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Delivery' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Distribuidora' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Driver' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Entregas' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Estoque' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Feirante' => ['price' => 97.00, 'category' => 'vendas', 'trial_days' => 7, 'status' => 'active'],
    'Plena Finanças' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Fit' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Frota' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Hamburgueria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Marmita' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Motoboy' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Motorista' => ['price' => 57.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Nutri' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Obras' => ['price' => 97.00, 'category' => 'servicos', 'trial_days' => 7, 'status' => 'active'],
    'Plena Odonto' => ['price' => 127.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active'],
    'Plena Orçamentos' => ['price' => 97.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena PDV' => ['price' => 147.00, 'category' => 'gestao', 'trial_days' => 7, 'status' => 'active'],
    'Plena Pizzaria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Sorveteria' => ['price' => 97.00, 'category' => 'delivery', 'trial_days' => 7, 'status' => 'active'],
    'Plena Terapia' => ['price' => 97.00, 'category' => 'saude', 'trial_days' => 7, 'status' => 'active']
];

// ==================================================================
// 4. FUNÇÕES UTILITÁRIAS
// ==================================================================

function checkAuth($data, $get, $server) {
    global $ADMIN_SECRET;
    $auth = $server['HTTP_X_ADMIN_SECRET'] ?? $data['secret'] ?? $get['secret'] ?? '';
    return $auth === $ADMIN_SECRET;
}

function systemLog($message, $type = 'info') {
    global $LOGS_FILE;
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $content = @file_get_contents($LOGS_FILE);
    $logs = $content ? json_decode($content, true) : [];
    if (!is_array($logs)) $logs = [];
    
    $logs[] = $logEntry;
    
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    @file_put_contents($LOGS_FILE, json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function jsonResponse($data, $status = 200) {
    // Limpa qualquer lixo (espaços, warnings) antes do JSON
    ob_clean();
    
    http_response_code($status);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    if ($json === false) {
        // Fallback em caso de erro de encoding
        echo json_encode(['error' => 'JSON Encoding Error: ' . json_last_error_msg()]);
    } else {
        echo $json;
    }
    exit;
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generateId($prefix = '') {
    return uniqid($prefix) . '_' . substr(md5(microtime()), 0, 6);
}

// ==================================================================
// 5. PROCESSAMENTO DA REQUEST
// ==================================================================

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true) ?? [];
$server = $_SERVER;

// ==================================================================
// 6. ACTIONS PÚBLICAS (VALIDAÇÃO DE LICENÇA)
// ==================================================================

if ($action === 'validate' || $action === 'validate_access') {
    $key = $data['license_key'] ?? '';
    $device = $data['device_fingerprint'] ?? '';
    
    if (empty($key)) {
        jsonResponse(["valid" => false, "message" => "Chave de licença é obrigatória"], 400);
    }
    
    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];
    if (!is_array($db)) $db = [];
    
    // Procura chave (Case Insensitive force)
    if (!isset($db[$key])) {
        // Tenta achar independente do case
        $found = false;
        foreach($db as $k => $v) {
            if(strtoupper($k) === strtoupper($key)) {
                $key = $k;
                $found = true;
                break;
            }
        }
        if (!$found) {
            jsonResponse(["valid" => false, "message" => "Licença não encontrada"], 404);
        }
    }
    
    $license = $db[$key];
    
    // Verifica status
    if (($license['status'] ?? 'active') !== 'active') {
        jsonResponse(["valid" => false, "message" => "Licença inativa ou bloqueada"], 403);
    }
    
    // Verifica expiração
    if (!empty($license['expires_at']) && strtotime($license['expires_at']) < time()) {
        $db[$key]['status'] = 'expired';
        @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        jsonResponse(["valid" => false, "message" => "Licença expirada"], 403);
    }
    
    // Lógica de dispositivo
    $currentDevice = $license['device_id'] ?? null;
    
    if (empty($currentDevice)) {
        // Primeiro uso
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        $db[$key]['last_access'] = date('Y-m-d H:i:s');
        $db[$key]['access_count'] = ($license['access_count'] ?? 0) + 1;
        @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        systemLog("Licença $key ativada no dispositivo: $device", 'info');
        jsonResponse([
            "valid" => true, 
            "message" => "Licença ativada com sucesso!",
            "app_link" => $license['app_link'] ?? '#'
        ]);
    } elseif ($currentDevice === $device) {
        // Mesmo dispositivo
        $db[$key]['last_access'] = date('Y-m-d H:i:s');
        $db[$key]['access_count'] = ($license['access_count'] ?? 0) + 1;
        @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        jsonResponse([
            "valid" => true, 
            "message" => "Acesso permitido",
            "app_link" => $license['app_link'] ?? '#'
        ]);
    } else {
        jsonResponse(["valid" => false, "message" => "Licença já está em uso em outro dispositivo"], 403);
    }
}

// ==================================================================
// 7. ACTIONS DO ADMINISTRADOR
// ==================================================================

// LIST
if ($action === 'list') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    
    $content = @file_get_contents($DB_FILE);
    $db = $content ? json_decode($content, true) : [];
    if (!is_array($db)) $db = [];
    
    $licenses = [];
    foreach ($db as $k => $l) {
        $l['key'] = $k;
        $licenses[] = $l;
    }
    usort($licenses, function($a, $b) {
        return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
    });
    jsonResponse($licenses);
}

// DASHBOARD
if ($action === 'dashboard_stats') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];
    
    $total_revenue = 0;
    $clients_map = [];
    $product_counts = [];
    $subscriptions = [];
    $monthly_revenue = 0;
    $last_month_revenue = 0;
    $expiring_count = 0;
    $sales_by_date = [];
    
    $current_month = date('Y-m');
    $last_month = date('Y-m', strtotime('first day of last month'));
    
    foreach ($db as $license) {
        $price = $license['price'] ?? 0;
        $created = substr($license['created_at'] ?? '', 0, 10);
        $created_month = substr($license['created_at'] ?? '', 0, 7);
        $status = $license['status'] ?? 'active';
        $expires = $license['expires_at'] ?? null;
        
        $total_revenue += $price;
        if($created_month === $current_month) $monthly_revenue += $price;
        if($created_month === $last_month) $last_month_revenue += $price;
        
        if($status === 'active') $subscriptions[] = $price;
        
        if ($status === 'active' && $expires && strtotime($expires) > time() && strtotime($expires) < strtotime('+7 days')) {
            $expiring_count++;
        }
        
        $email = $license['client'] ?? 'unknown';
        $clients_map[$email] = 1;
        
        $prod = $license['product'] ?? 'N/A';
        $product_counts[$prod] = ($product_counts[$prod] ?? 0) + 1;
        
        $sales_by_date[$created] = ($sales_by_date[$created] ?? 0) + 1;
    }
    
    // Dados para gráfico
    $chart_labels = [];
    $chart_data = [];
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $chart_labels[] = date('d/m', strtotime($date));
        $chart_data[] = $sales_by_date[$date] ?? 0;
    }

    $revenue_growth = 0;
    if ($last_month_revenue > 0) $revenue_growth = (($monthly_revenue - $last_month_revenue) / $last_month_revenue) * 100;
    elseif ($monthly_revenue > 0) $revenue_growth = 100;

    arsort($product_counts);
    $top_products = array_slice($product_counts, 0, 10, true);
    
    jsonResponse([
        'total_revenue' => $total_revenue,
        'monthly_revenue' => $monthly_revenue,
        'mrr' => array_sum($subscriptions),
        'total_clients' => count($clients_map),
        'active_subscriptions' => count($subscriptions),
        'expiring_soon' => $expiring_count,
        'revenue_growth' => round($revenue_growth, 1),
        'top_products' => $top_products,
        'chart' => [
            'labels' => $chart_labels,
            'data' => $chart_data
        ]
    ]);
}

// SYSTEM HEALTH
if ($action === 'system_health') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    
    $health = [
        'smtp' => false,
        'mp_token' => false,
        'db_writable' => false,
        'logs_writable' => false,
        'cron' => false,
        'ok' => false,
        'version' => SYSTEM_VERSION,
        'name' => SYSTEM_NAME,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    global $SMTP_HOST, $ACCESS_TOKEN;
    if (!empty($SMTP_HOST) && $SMTP_HOST !== 'localhost') $health['smtp'] = true;
    if (!empty($ACCESS_TOKEN) && strpos($ACCESS_TOKEN, 'APP_USR') === 0) $health['mp_token'] = true;
    
    if (is_writable($DB_FILE)) $health['db_writable'] = true;
    if (is_writable($LOGS_FILE)) $health['logs_writable'] = true;
    
    if ($health['db_writable'] && $health['logs_writable']) $health['ok'] = true;
    
    jsonResponse($health);
}

// GET LEADS
if ($action === 'get_leads') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];
    if(!empty($leads) && array_keys($leads) !== range(0, count($leads)-1)) $leads = array_values($leads);
    jsonResponse($leads);
}

// SAVE LEAD
if ($action === 'save_lead') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $lead = $data['lead'] ?? [];
    $is_edit = $data['is_edit'] ?? false;
    
    $leads = json_decode(@file_get_contents($LEADS_FILE), true) ?? [];
    if(!empty($leads) && array_keys($leads) !== range(0, count($leads)-1)) $leads = array_values($leads);

    if ($is_edit) {
        foreach($leads as &$l) {
            if($l['unique_id'] === $lead['unique_id']) {
                $l = array_merge($l, $lead);
                break;
            }
        }
    } else {
        $lead['unique_id'] = generateId('lead_');
        $lead['created_at'] = date('Y-m-d H:i:s');
        $lead['status'] = 'pending';
        $leads[] = $lead;
    }
    @file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT));
    jsonResponse(['success'=>true]);
}

// FINANCE
if ($action === 'get_finance') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $finance_db = json_decode(@file_get_contents($FINANCE_FILE), true) ?? [];
    
    $incomes = 0; $expenses = 0;
    
    // Add sales from licenses
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    foreach($db as $l) if(isset($l['price'])) $incomes += $l['price'];
    
    foreach($finance_db as $t) {
        if($t['type'] === 'income') $incomes += $t['amount'];
        else $expenses += $t['amount'];
    }
    
    jsonResponse([
        'incomes' => $incomes,
        'expenses' => $expenses,
        'balance' => $incomes - $expenses,
        'transactions' => $finance_db
    ]);
}

// PRODUCTS
if ($action === 'get_products') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $products = json_decode(@file_get_contents($PRODUCTS_FILE), true) ?? [];
    if (empty($products)) {
        // Fallback to Master Catalog
        global $CATALOG_MASTER;
        $products = [];
        foreach($CATALOG_MASTER as $name => $details) {
            $products[] = array_merge(['id' => generateId('prod_'), 'name' => $name], $details);
        }
    }
    jsonResponse($products);
}

// LOGS
if ($action === 'get_logs') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $logs = json_decode(@file_get_contents($LOGS_FILE), true) ?? [];
    $logs = array_reverse($logs);
    
    // Formata para string array simples pra compatibilidade
    $simple_logs = [];
    foreach($logs as $l) $simple_logs[] = "[{$l['timestamp']}] [{$l['type']}] {$l['message']}";
    
    jsonResponse(['logs' => $simple_logs]);
}

// SALES HISTORY
if ($action === 'get_sales_history') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $sales = [];
    foreach($db as $key => $l) {
        $sales[] = [
            'id' => $l['payment_id'] ?? 'MANUAL',
            'date' => $l['created_at'] ?? '',
            'client' => $l['client'] ?? '',
            'product' => $l['product'] ?? '',
            'amount' => $l['price'] ?? 0,
            'status' => 'paid',
            'payment_method' => 'mercadopago',
            'license_key' => $key
        ];
    }
    jsonResponse($sales);
}

// MANUAL CREATE
if ($action === 'create') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    
    $client = $data['client_name'] ?? '';
    $product = $data['product'] ?? 'Plena Aluguéis';
    $license_type = $data['license_type'] ?? 'monthly';
    $duration = $data['duration'] ?? 30;
    
    if (empty($client)) jsonResponse(['error' => 'Email obrigatório'], 400);
    
    global $CATALOG_MASTER;
    $base_price = $CATALOG_MASTER[$product]['price'] ?? 97.00;
    
    // Formato Padronizado: PLENA-XXXX-XXXX
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    $newLicense = [
        "client" => $client,
        "product" => $product,
        "price" => $base_price,
        "license_type" => $license_type,
        "duration" => $duration,
        "device_id" => null,
        "status" => 'active',
        "created_at" => date('Y-m-d H:i:s'),
        "expires_at" => date('Y-m-d H:i:s', strtotime("+$duration days")),
        "payment_id" => "MANUAL_" . date('YmdHis'),
        "app_link" => "https://www.plenaaplicativos.com.br/apps/" . strtolower(str_replace(' ', '_', $product)) . ".html"
    ];
    
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    $db[$key] = $newLicense;
    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    
    jsonResponse(["success" => true, "license_key" => $key]);
}

// UPDATE STATUS
if ($action === 'update_status') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $key = $data['key'] ?? '';
    $status = $data['status'] ?? '';
    
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    if(!isset($db[$key])) jsonResponse(['error'=>'Licença não encontrada'], 404);
    
    if($status === 'reset_device') {
        $db[$key]['device_id'] = null;
    } else {
        $db[$key]['status'] = $status;
    }
    @file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    jsonResponse(['success'=>true]);
}

// RESEND EMAIL
if ($action === 'resend_email') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    
    if (file_exists('api_mailer.php')) require_once 'api_mailer.php';
    else jsonResponse(['error' => 'Mailer not found'], 500);
    
    $key = $data['key'] ?? '';
    $db = json_decode(@file_get_contents($DB_FILE), true) ?? [];
    
    if(!isset($db[$key])) jsonResponse(['error'=>'Licença não encontrada'], 404);
    
    $l = $db[$key];
    $sent = sendLicenseEmail($l['client'], $l['product'], $key, $l['app_link']);
    
    if($sent) jsonResponse(['success'=>true, 'message'=>'Email reenviado']);
    else jsonResponse(['error'=>'Falha no envio'], 500);
}

// BACKUP
if ($action === 'backup_system') {
    if (!checkAuth($data, $_GET, $server)) jsonResponse(['error' => 'Acesso Negado'], 403);
    $zip = new ZipArchive();
    $zipfile = $DATA_DIR . 'backup_' . date('Ymd_His') . '.zip';
    if ($zip->open($zipfile, ZipArchive::CREATE) === TRUE) {
        if(file_exists($DB_FILE)) $zip->addFile($DB_FILE, 'licenses.json');
        if(file_exists($LEADS_FILE)) $zip->addFile($LEADS_FILE, 'leads.json');
        $zip->close();
        jsonResponse(['success'=>true, 'file'=>basename($zipfile)]);
    } else {
        jsonResponse(['error'=>'Zip failed'], 500);
    }
}

// DEFAULT
jsonResponse([
    "status" => "online", 
    "version" => SYSTEM_VERSION,
    "timestamp" => date('Y-m-d H:i:s')
]);