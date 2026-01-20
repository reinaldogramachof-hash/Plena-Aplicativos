<?php
/**
 * PLENA LICENSE SERVER V5.0 - NEXUS CRM INTEGRATED
 * Sistema completo de gestão de licenças, CRM, financeiro, produtos e equipe.
 */

// ==================================================================
// 1. CONFIGURAÇÃO INICIAL E SEGURANÇA
// ==================================================================

// Headers de segurança e CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Secret, Authorization');

// Headers anti-cache para dados sensíveis
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

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

$DATA_DIR = __DIR__ . '/data/';

// Garante que o diretório data existe
if (!file_exists($DATA_DIR)) {
    mkdir($DATA_DIR, 0755, true);
}

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
        file_put_contents($file, json_encode($default, JSON_PRETTY_PRINT));
    }
}

// ==================================================================
// 3. CATÁLOGO DE PRODUTOS (MASTER)
// ==================================================================

$CATALOG_MASTER = [
    'Plena Aluguéis' => [
        'price' => 97.00,
        'category' => 'aluguel',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Artesanato' => [
        'price' => 97.00,
        'category' => 'outros',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Assistência' => [
        'price' => 97.00,
        'category' => 'servicos',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Barbearia' => [
        'price' => 97.00,
        'category' => 'beleza',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Beleza' => [
        'price' => 97.00,
        'category' => 'beleza',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Card' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Checklist' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Controle' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Delivery' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Distribuidora' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Driver' => [
        'price' => 57.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Entregas' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Estoque' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Feirante' => [
        'price' => 97.00,
        'category' => 'vendas',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Finanças' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Fit' => [
        'price' => 97.00,
        'category' => 'saude',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Frota' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Hamburgueria' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Marmita' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Motoboy' => [
        'price' => 57.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Motorista' => [
        'price' => 57.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Nutri' => [
        'price' => 97.00,
        'category' => 'saude',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Obras' => [
        'price' => 97.00,
        'category' => 'servicos',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Odonto' => [
        'price' => 127.00,
        'category' => 'saude',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Orçamentos' => [
        'price' => 97.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena PDV' => [
        'price' => 147.00,
        'category' => 'gestao',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Pizzaria' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Sorveteria' => [
        'price' => 97.00,
        'category' => 'delivery',
        'trial_days' => 7,
        'status' => 'active'
    ],
    'Plena Terapia' => [
        'price' => 97.00,
        'category' => 'saude',
        'trial_days' => 7,
        'status' => 'active'
    ]
];

// ==================================================================
// 4. FUNÇÕES UTILITÁRIAS
// ==================================================================

/**
 * Verifica autenticação do admin
 */
function checkAuth($data, $get, $server) {
    global $ADMIN_SECRET;
    
    $auth = $server['HTTP_X_ADMIN_SECRET'] ?? 
            $data['secret'] ?? 
            $get['secret'] ?? '';
    
    return $auth === $ADMIN_SECRET;
}

/**
 * Log do sistema
 */
function systemLog($message, $type = 'info') {
    global $LOGS_FILE;
    
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => $type,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $logs = json_decode(file_get_contents($LOGS_FILE), true) ?? [];
    $logs[] = $logEntry;
    
    // Mantém apenas os últimos 1000 logs
    if (count($logs) > 1000) {
        $logs = array_slice($logs, -1000);
    }
    
    file_put_contents($LOGS_FILE, json_encode($logs, JSON_PRETTY_PRINT));
}

/**
 * Retorna resposta JSON padronizada
 */
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Valida email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Gera ID único
 */
function generateId($prefix = '') {
    return uniqid($prefix) . '_' . substr(md5(microtime()), 0, 6);
}

// ==================================================================
// 5. PROCESSAMENTO DA REQUEST
// ==================================================================

// Captura input
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true) ?? [];
$server = $_SERVER;

// Log da requisição
systemLog("[$method] $action - IP: " . ($server['REMOTE_ADDR'] ?? 'unknown'), 'info');

// ==================================================================
// 6. ACTIONS DO ADMINISTRADOR
// ==================================================================

// 1. LISTAR LICENÇAS
if ($action === 'list') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $licenses = [];
    
    foreach ($db as $key => $license) {
        $license['key'] = $key;
        $license['created_at'] = $license['created_at'] ?? date('Y-m-d H:i:s');
        $license['expires_at'] = $license['expires_at'] ?? null;
        $license['last_access'] = $license['last_access'] ?? null;
        $license['status'] = $license['status'] ?? 'active';
        $license['license_type'] = $license['license_type'] ?? 'monthly';
        
        $licenses[] = $license;
    }
    
    // Ordena por data (mais recentes primeiro)
    usort($licenses, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    jsonResponse($licenses);
}

// 2. DASHBOARD STATS (Completo com MRR, Churn, etc.)
if ($action === 'dashboard_stats') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?? [];
    
    // Métricas básicas
    $total_revenue = 0;
    $clients_map = [];
    $product_counts = [];
    $sales_by_date = [];
    $subscriptions = [];
    $monthly_revenue = 0;
    $last_month_revenue = 0;
    $expiring_count = 0;
    
    $today = date('Y-m-d');
    $current_month = date('Y-m');
    $last_month = date('Y-m', strtotime('first day of last month'));
    
    foreach ($db as $license) {
        $created = substr($license['created_at'] ?? date('Y-m-d H:i:s'), 0, 10);
        $created_month = substr($license['created_at'] ?? date('Y-m-d H:i:s'), 0, 7);
        $product = $license['product'] ?? 'Desconhecido';
        $price = $license['price'] ?? 0;
        $type = $license['license_type'] ?? 'monthly';
        $status = $license['status'] ?? 'active';
        $expires_at = $license['expires_at'] ?? null;
        
        // Revenue calculations
        $total_revenue += $price;
        
        if ($created_month === $current_month) {
            $monthly_revenue += $price;
        }
        
        if ($created_month === $last_month) {
            $last_month_revenue += $price;
        }
        
        // MRR calculation (Apenas licenças ativas)
        if ($status === 'active') {
            if ($type === 'monthly') {
                $subscriptions[] = $price;
            } elseif ($type === 'yearly') {
                $subscriptions[] = $price / 12;
            } elseif ($type === 'lifetime') {
                $subscriptions[] = $price / 120; // 10 years lifetime value
            }
        }
        
        // Contagem de licenças expirando em breve (7 dias)
        if ($status === 'active' && !empty($expires_at)) {
            $expiry_timestamp = strtotime($expires_at);
            $seven_days_from_now = strtotime('+7 days');
            $now = time();
            
            if ($expiry_timestamp > $now && $expiry_timestamp <= $seven_days_from_now) {
                $expiring_count++;
            }
        }
        
        // Client tracking
        $email = strtolower($license['client'] ?? 'unknown');
        $clients_map[$email] = ($clients_map[$email] ?? 0) + 1;
        
        // Product tracking
        $product_counts[$product] = ($product_counts[$product] ?? 0) + 1;
        
        // Sales by date
        $sales_by_date[$created] = ($sales_by_date[$created] ?? 0) + 1;
    }
    
    // MRR (Monthly Recurring Revenue)
    $mrr = array_sum($subscriptions);
    
    // Cálculo de crescimento da receita
    $revenue_growth = 0;
    if ($last_month_revenue > 0) {
        $revenue_growth = (($monthly_revenue - $last_month_revenue) / $last_month_revenue) * 100;
    } elseif ($monthly_revenue > 0) {
        $revenue_growth = 100; // Crescimento de 100% (ou infinito) se não houve receita mês passado
    }
    
    // Churn Rate simulation (based on expired licenses)
    $active_licenses = array_filter($db, function($license) {
        return ($license['status'] ?? 'active') === 'active';
    });
    $expired_licenses = array_filter($db, function($license) {
        return ($license['status'] ?? 'active') === 'expired';
    });
    $churn_rate = count($active_licenses) > 0 ? 
        (count($expired_licenses) / count($active_licenses) * 100) : 0;
    
    // LTV (Lifetime Value) - average
    $avg_ltv = count($clients_map) > 0 ? $total_revenue / count($clients_map) : 0;
    
    // New clients this month
    $new_clients_this_month = 0;
    $first_purchases = [];
    foreach ($db as $license) {
        $email = strtolower($license['client'] ?? '');
        $created_month = substr($license['created_at'] ?? '', 0, 7);
        
        if ($created_month === $current_month && !isset($first_purchases[$email])) {
            $first_purchases[$email] = true;
            $new_clients_this_month++;
        }
    }
    
    // Top products
    arsort($product_counts);
    $top_products = array_slice($product_counts, 0, 10, true);
    
    // Chart data (last 30 days)
    $chart_labels = [];
    $chart_data = [];
    
    for ($i = 29; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $chart_labels[] = date('d/m', strtotime($date));
        $chart_data[] = $sales_by_date[$date] ?? 0;
    }
    
    // Leads conversion
    $converted_leads = 0;
    foreach ($leads as $lead) {
        $email = strtolower($lead['email'] ?? '');
        if (isset($clients_map[$email])) {
            $converted_leads++;
        }
    }
    $conversion_rate = count($leads) > 0 ? ($converted_leads / count($leads) * 100) : 0;
    
    jsonResponse([
        'total_revenue' => round($total_revenue, 2),
        'monthly_revenue' => round($monthly_revenue, 2),
        'mrr' => round($mrr, 2),
        'total_clients' => count($clients_map),
        'new_clients_this_month' => $new_clients_this_month,
        'active_subscriptions' => count($subscriptions),
        'churn_rate' => round($churn_rate, 2),
        'churned_clients' => count($expired_licenses),
        'avg_ltv' => round($avg_ltv, 2),
        'conversion_rate' => round($conversion_rate, 2),
        'converted_leads' => $converted_leads,
        'total_leads' => count($leads),
        'active_licenses' => count($active_licenses),
        'expiring_soon' => $expiring_count,
        'top_products' => $top_products,
        'max_prod' => !empty($top_products) ? max($top_products) : 1,
        'total_products' => count($product_counts),
        'revenue_growth' => round($revenue_growth, 1),
        'chart' => [
            'labels' => $chart_labels,
            'data' => $chart_data
        ]
    ]);
}

// 3. GET LEADS (CRM)
if ($action === 'get_leads') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?? [];
    
    // Converte array associativo para indexado se necessário
    if (!empty($leads) && array_keys($leads) !== range(0, count($leads) - 1)) {
        $leads = array_values($leads);
    }
    
    // Adiciona ID único se não existir
    foreach ($leads as &$lead) {
        if (!isset($lead['unique_id'])) {
            $lead['unique_id'] = generateId('lead_');
        }
        if (!isset($lead['created_at'])) {
            $lead['created_at'] = date('Y-m-d H:i:s');
        }
    }
    
    // Ordena por data
    usort($leads, function($a, $b) {
        return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
    });
    
    jsonResponse($leads);
}

// 4. SALVAR LEAD (CRM)
if ($action === 'save_lead') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $lead = $data['lead'] ?? [];
    $is_edit = $data['is_edit'] ?? false;
    
    if (empty($lead['email']) || empty($lead['name'])) {
        jsonResponse(['error' => 'Nome e email são obrigatórios'], 400);
    }
    
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?? [];
    
    if ($is_edit && isset($lead['unique_id'])) {
        // Editar lead existente
        foreach ($leads as &$existingLead) {
            if ($existingLead['unique_id'] === $lead['unique_id']) {
                $existingLead = array_merge($existingLead, $lead);
                $existingLead['updated_at'] = date('Y-m-d H:i:s');
                break;
            }
        }
    } else {
        // Novo lead
        $lead['unique_id'] = generateId('lead_');
        $lead['created_at'] = date('Y-m-d H:i:s');
        $lead['status'] = 'pending';
        $lead['contacted'] = false;
        $leads[] = $lead;
    }
    
    file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT));
    systemLog("Lead salvo: {$lead['email']}", 'info');
    
    jsonResponse(['success' => true, 'lead_id' => $lead['unique_id']]);
}

// 5. MARCAR LEAD COMO CONTACTADO
if ($action === 'mark_contacted') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $lead_id = $data['lead_id'] ?? '';
    
    if (empty($lead_id)) {
        jsonResponse(['error' => 'ID do lead é obrigatório'], 400);
    }
    
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?? [];
    $found = false;
    
    foreach ($leads as &$lead) {
        if ($lead['unique_id'] === $lead_id) {
            $lead['contacted'] = true;
            $lead['contacted_at'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT));
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Lead não encontrado'], 404);
    }
}

// 6. CRIAR LICENÇA MANUAL
if ($action === 'create') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $client = $data['client_name'] ?? '';
    $product = $data['product'] ?? 'Plena Aluguéis';
    $license_type = $data['license_type'] ?? 'monthly';
    $duration = $data['duration'] ?? 30;
    
    if (empty($client)) {
        jsonResponse(['error' => 'Email do cliente é obrigatório'], 400);
    }
    
    if (!isValidEmail($client)) {
        jsonResponse(['error' => 'Email inválido'], 400);
    }
    
    // Valida produto
    if (!isset($CATALOG_MASTER[$product])) {
        jsonResponse(['error' => 'Produto não encontrado'], 400);
    }
    
    // Gera chave única
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 8) . "-" . substr(md5(time()), 0, 4));
    
    // Determina preço baseado no tipo
    $base_price = $CATALOG_MASTER[$product]['price'];
    $price = $base_price;
    
    switch ($license_type) {
        case 'trial':
            $price = 0;
            $duration = $duration ?: 7;
            break;
        case 'yearly':
            $price = $base_price * 10; // 10 meses por ano
            break;
        case 'lifetime':
            $price = $base_price * 60; // 5 anos vitalício
            break;
    }
    
    // Calcula data de expiração
    $expires_at = null;
    if ($license_type !== 'lifetime' && $duration > 0) {
        $expires_at = date('Y-m-d H:i:s', strtotime("+$duration days"));
    }
    
    // Cria objeto da licença
    $newLicense = [
        "client" => $client,
        "product" => $product,
        "price" => $price,
        "license_type" => $license_type,
        "duration" => $duration,
        "device_id" => null,
        "status" => $license_type === 'trial' ? 'trial' : 'active',
        "created_at" => date('Y-m-d H:i:s'),
        "expires_at" => $expires_at,
        "payment_id" => "MANUAL_" . date('YmdHis'),
        "app_link" => "https://www.plenaaplicativos.com.br/apps/" . strtolower(str_replace(' ', '_', $product)) . ".html",
        "last_access" => null,
        "access_count" => 0
    ];
    
    // Salva no banco de dados
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $db[$key] = $newLicense;
    file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    
    systemLog("Licença criada manualmente: $key para $client ($product)", 'info');
    
    jsonResponse([
        "success" => true, 
        "license_key" => $key,
        "license" => $newLicense
    ]);
}

// 7. ATUALIZAR STATUS DA LICENÇA
if ($action === 'update_status') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $key = $data['key'] ?? '';
    $status = $data['status'] ?? '';
    
    if (empty($key)) {
        jsonResponse(['error' => 'Chave da licença é obrigatória'], 400);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    
    if (!isset($db[$key])) {
        jsonResponse(['error' => 'Licença não encontrada'], 404);
    }
    
    if ($status === 'reset_device') {
        $db[$key]['device_id'] = null;
        $db[$key]['last_reset'] = date('Y-m-d H:i:s');
        systemLog("Dispositivo resetado para licença: $key", 'info');
    } else {
        $db[$key]['status'] = $status;
        $db[$key]['status_updated_at'] = date('Y-m-d H:i:s');
        systemLog("Status da licença $key alterado para: $status", 'info');
    }
    
    file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
    
    jsonResponse(['success' => true]);
}

// 8. REENVIAR EMAIL
if ($action === 'resend_email') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    // Garante que o mailer está carregado
    if (!function_exists('sendLicenseEmail')) {
        if (file_exists('api_mailer.php')) {
            require_once 'api_mailer.php';
        } else {
            jsonResponse(['error' => 'Módulo de email não encontrado'], 500);
        }
    }
    
    $key = $data['key'] ?? '';
    
    if (empty($key)) {
        jsonResponse(['error' => 'Chave da licença é obrigatória'], 400);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    
    if (!isset($db[$key])) {
        jsonResponse(['error' => 'Licença não encontrada'], 404);
    }
    
    $license = $db[$key];
    $email = $license['client'] ?? '';
    $product_name = $license['product'] ?? 'Produto Plena';
    $app_link = $license['app_link'] ?? '#';
    
    if (empty($email)) {
        jsonResponse(['error' => 'Email do cliente não encontrado na licença'], 400);
    }
    
    // Envia o email
    $email_sent = sendLicenseEmail($email, $product_name, $key, $app_link);
    
    if ($email_sent) {
        $db[$key]['last_email_sent'] = date('Y-m-d H:i:s');
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        
        systemLog("Email reenviado para licença: $key ($email)", 'info');
        jsonResponse(['success' => true, 'message' => 'Email reenviado com sucesso']);
    } else {
        systemLog("Falha ao reenviar email para: $key ($email)", 'error');
        jsonResponse(['error' => 'Falha ao enviar email. Verifique os logs de email.'], 500);
    }
}

// 9. GET LOGS DO SISTEMA
if ($action === 'get_logs') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $logs = json_decode(file_get_contents($LOGS_FILE), true) ?? [];
    
    // Filtra logs por tipo se especificado
    $type = $data['type'] ?? $_GET['type'] ?? 'all';
    if ($type !== 'all') {
        $logs = array_filter($logs, function($log) use ($type) {
            return $log['type'] === $type;
        });
    }
    
    // Ordena por data (mais recentes primeiro)
    usort($logs, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Formata para o frontend
    $formatted_logs = [];
    foreach ($logs as $log) {
        $formatted_logs[] = "[{$log['timestamp']}] {$log['message']}";
    }
    
    jsonResponse(['logs' => $formatted_logs]);
}

// 10. LIMPAR LOGS
if ($action === 'clear_logs') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    file_put_contents($LOGS_FILE, json_encode([], JSON_PRETTY_PRINT));
    systemLog("Logs do sistema limpos manualmente", 'warning');
    
    jsonResponse(['success' => true]);
}

// 11. CHECK HEALTH DO SISTEMA
if ($action === 'system_health') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
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
    
    // Verifica configurações SMTP
    global $SMTP_HOST, $SMTP_USER, $SMTP_PASS;
    if (!empty($SMTP_HOST) && !empty($SMTP_USER) && !empty($SMTP_PASS) && $SMTP_PASS !== 'SUA_SENHA_DO_EMAIL_AQUI') {
        $health['smtp'] = true;
    }
    
    // Verifica token Mercado Pago
    global $ACCESS_TOKEN;
    if (!empty($ACCESS_TOKEN) && strpos($ACCESS_TOKEN, 'APP_USR') === 0) {
        $health['mp_token'] = true;
    }
    
    // Verifica permissões de escrita
    $files_to_check = [$DB_FILE, $LEADS_FILE, $LOGS_FILE];
    $all_writable = true;
    
    foreach ($files_to_check as $file) {
        if (!is_writable($file)) {
            $all_writable = false;
            break;
        }
    }
    
    $health['db_writable'] = $all_writable;
    $health['logs_writable'] = is_writable($LOGS_FILE);
    
    // Verifica se há jobs cron recentes (simulação)
    $cron_file = $DATA_DIR . 'last_cron.txt';
    if (file_exists($cron_file)) {
        $last_cron = file_get_contents($cron_file);
        $minutes_since = (time() - strtotime($last_cron)) / 60;
        $health['cron'] = $minutes_since < 60; // Cron rodou na última hora
    }
    
    // Status geral
    $health['ok'] = $health['db_writable'] && $health['logs_writable'];
    
    jsonResponse($health);
}

// 12. GET SALES HISTORY
if ($action === 'get_sales_history') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $sales = [];
    
    foreach ($db as $key => $license) {
        $product = $license['product'] ?? 'Desconhecido';
        $price = $license['price'] ?? 0;
        $status = $license['status'] ?? 'active';
        
        $sales[] = [
            'id' => $license['payment_id'] ?? 'N/A',
            'date' => $license['created_at'] ?? date('Y-m-d H:i:s'),
            'client' => $license['client'] ?? 'Cliente não identificado',
            'email' => $license['client'] ?? '',
            'product' => $product,
            'amount' => $price,
            'status' => $status === 'active' ? 'paid' : ($status === 'expired' ? 'expired' : 'cancelled'),
            'payment_method' => strpos($license['payment_id'] ?? '', 'MANUAL') === 0 ? 'manual' : 'mercadopago',
            'license_key' => $key
        ];
    }
    
    // Ordena por data
    usort($sales, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    jsonResponse($sales);
}

// 13. GET FINANCE DATA
if ($action === 'get_finance') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $finance_db = json_decode(file_get_contents($FINANCE_FILE), true) ?? [];
    
    // Calcula métricas do mês atual
    $current_month = date('Y-m');
    $incomes = 0;
    $expenses = 0;
    $income_count = 0;
    $expense_count = 0;
    
    $transactions = [];
    
    // Adiciona vendas como transações de entrada
    foreach ($db as $key => $license) {
        $created_month = substr($license['created_at'] ?? '', 0, 7);
        if ($created_month === $current_month && $license['price'] > 0) {
            $incomes += $license['price'];
            $income_count++;
            
            $transactions[] = [
                'id' => generateId('tx_'),
                'date' => $license['created_at'] ?? date('Y-m-d H:i:s'),
                'type' => 'income',
                'description' => 'Venda: ' . ($license['product'] ?? 'Produto'),
                'amount' => $license['price'],
                'category' => 'venda',
                'payment_method' => 'mercadopago',
                'status' => 'paid',
                'client' => $license['client'] ?? ''
            ];
        }
    }
    
    // Adiciona transações do arquivo financeiro
    foreach ($finance_db as $transaction) {
        $transaction_month = substr($transaction['date'] ?? '', 0, 7);
        if ($transaction_month === $current_month) {
            if ($transaction['type'] === 'income') {
                $incomes += $transaction['amount'];
                $income_count++;
            } else {
                $expenses += $transaction['amount'];
                $expense_count++;
            }
            $transactions[] = $transaction;
        }
    }
    
    // Ordena transações
    usort($transactions, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    // Gráfico financeiro (últimos 6 meses)
    $chart_labels = [];
    $chart_incomes = [];
    $chart_expenses = [];
    
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $chart_labels[] = date('M/y', strtotime($month . '-01'));
        
        $month_income = 0;
        $month_expense = 0;
        
        // Vendas do mês
        foreach ($db as $license) {
            $created_month = substr($license['created_at'] ?? '', 0, 7);
            if ($created_month === $month) {
                $month_income += $license['price'] ?? 0;
            }
        }
        
        // Transações do mês
        foreach ($finance_db as $transaction) {
            $transaction_month = substr($transaction['date'] ?? '', 0, 7);
            if ($transaction_month === $month) {
                if ($transaction['type'] === 'income') {
                    $month_income += $transaction['amount'];
                } else {
                    $month_expense += $transaction['amount'];
                }
            }
        }
        
        $chart_incomes[] = $month_income;
        $chart_expenses[] = $month_expense;
    }
    
    jsonResponse([
        'incomes' => round($incomes, 2),
        'expenses' => round($expenses, 2),
        'balance' => round($incomes - $expenses, 2),
        'income_count' => $income_count,
        'expense_count' => $expense_count,
        'transactions' => array_slice($transactions, 0, 100), // Limita a 100 transações
        'chart' => [
            'labels' => $chart_labels,
            'incomes' => $chart_incomes,
            'expenses' => $chart_expenses
        ]
    ]);
}

// 14. SALVAR TRANSAÇÃO FINANCEIRA
if ($action === 'save_transaction') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $transaction = $data['transaction'] ?? [];
    
    if (empty($transaction['description']) || empty($transaction['amount']) || empty($transaction['type'])) {
        jsonResponse(['error' => 'Descrição, valor e tipo são obrigatórios'], 400);
    }
    
    // Adiciona campos padrão
    $transaction['id'] = generateId('tx_');
    $transaction['created_at'] = date('Y-m-d H:i:s');
    if (!isset($transaction['status'])) {
        $transaction['status'] = 'pending';
    }
    
    // Salva no arquivo
    $finance_db = json_decode(file_get_contents($FINANCE_FILE), true) ?? [];
    $finance_db[] = $transaction;
    
    file_put_contents($FINANCE_FILE, json_encode($finance_db, JSON_PRETTY_PRINT));
    
    systemLog("Transação financeira salva: {$transaction['description']} - R$ {$transaction['amount']}", 'info');
    
    jsonResponse(['success' => true, 'transaction_id' => $transaction['id']]);
}

// 15. GET PRODUCTS CATALOG
if ($action === 'get_products') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    $products_catalog = json_decode(file_get_contents($PRODUCTS_FILE), true) ?? [];
    
    // Se não houver produtos no arquivo, usa o catálogo master
    if (empty($products_catalog)) {
        $products_catalog = [];
        foreach ($CATALOG_MASTER as $name => $details) {
            $products_catalog[] = [
                'id' => generateId('prod_'),
                'name' => $name,
                'category' => $details['category'],
                'price_monthly' => $details['price'],
                'price_yearly' => $details['price'] * 10,
                'price_lifetime' => $details['price'] * 60,
                'trial_days' => $details['trial_days'],
                'status' => $details['status'],
                'client_count' => 0,
                'created_at' => date('Y-m-d H:i:s')
            ];
        }
    }
    
    // Calcula clientes por produto
    $client_counts = [];
    foreach ($db as $license) {
        $product = $license['product'] ?? '';
        if ($product) {
            $client_counts[$product] = ($client_counts[$product] ?? 0) + 1;
        }
    }
    
    // Calcula MRR por produto
    $product_mrr = [];
    foreach ($db as $license) {
        $product = $license['product'] ?? '';
        $price = $license['price'] ?? 0;
        $type = $license['license_type'] ?? 'monthly';
        
        if ($product) {
            if (!isset($product_mrr[$product])) {
                $product_mrr[$product] = 0;
            }
            
            // Converte para MRR
            if ($type === 'monthly') {
                $product_mrr[$product] += $price;
            } elseif ($type === 'yearly') {
                $product_mrr[$product] += $price / 12;
            } elseif ($type === 'lifetime') {
                $product_mrr[$product] += $price / 120;
            }
        }
    }
    
    // Atualiza produtos com métricas
    foreach ($products_catalog as &$product) {
        $product_name = $product['name'];
        $product['client_count'] = $client_counts[$product_name] ?? 0;
        $product['mrr'] = round($product_mrr[$product_name] ?? 0, 2);
        $product['revenue'] = round(($client_counts[$product_name] ?? 0) * ($product['price_monthly'] ?? 0), 2);
    }
    
    jsonResponse($products_catalog);
}

// 16. SALVAR PRODUTO
if ($action === 'save_product') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $product_data = $data['product'] ?? [];
    $is_edit = $data['is_edit'] ?? false;
    
    if (empty($product_data['name'])) {
        jsonResponse(['error' => 'Nome do produto é obrigatório'], 400);
    }
    
    $products_catalog = json_decode(file_get_contents($PRODUCTS_FILE), true) ?? [];
    
    if ($is_edit && isset($product_data['id'])) {
        // Editar produto existente
        foreach ($products_catalog as &$product) {
            if ($product['id'] === $product_data['id']) {
                $product = array_merge($product, $product_data);
                $product['updated_at'] = date('Y-m-d H:i:s');
                break;
            }
        }
    } else {
        // Novo produto
        $product_data['id'] = generateId('prod_');
        $product_data['created_at'] = date('Y-m-d H:i:s');
        $product_data['client_count'] = 0;
        $product_data['mrr'] = 0;
        $product_data['revenue'] = 0;
        $products_catalog[] = $product_data;
    }
    
    file_put_contents($PRODUCTS_FILE, json_encode($products_catalog, JSON_PRETTY_PRINT));
    
    systemLog("Produto salvo: {$product_data['name']}", 'info');
    
    jsonResponse(['success' => true, 'product_id' => $product_data['id']]);
}

// 17. ALTERNAR STATUS DO PRODUTO
if ($action === 'toggle_product') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $product_id = $data['product_id'] ?? '';
    $status = $data['status'] ?? '';
    
    if (empty($product_id) || empty($status)) {
        jsonResponse(['error' => 'ID do produto e status são obrigatórios'], 400);
    }
    
    $products_catalog = json_decode(file_get_contents($PRODUCTS_FILE), true) ?? [];
    $found = false;
    
    foreach ($products_catalog as &$product) {
        if ($product['id'] === $product_id) {
            $product['status'] = $status;
            $product['updated_at'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        file_put_contents($PRODUCTS_FILE, json_encode($products_catalog, JSON_PRETTY_PRINT));
        
        systemLog("Status do produto $product_id alterado para: $status", 'info');
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Produto não encontrado'], 404);
    }
}

// 18. GET TEAM MEMBERS
if ($action === 'get_team') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $team_db = json_decode(file_get_contents($TEAM_FILE), true) ?? [];
    
    // Se não houver membros no arquivo, retorna lista padrão
    if (empty($team_db)) {
        $team_db = [
            [
                'id' => 1,
                'name' => 'Admin Master',
                'email' => 'admin@plenaaplicativos.com.br',
                'role' => 'admin',
                'position' => 'CEO',
                'last_login' => date('Y-m-d H:i:s'),
                'created_at' => date('Y-m-d H:i:s'),
                'status' => 'active'
            ],
            [
                'id' => 2,
                'name' => 'Vendas',
                'email' => 'vendas@plenaaplicativos.com.br',
                'role' => 'sales',
                'position' => 'Gerente de Vendas',
                'last_login' => date('Y-m-d H:i:s', strtotime('-1 day')),
                'created_at' => date('Y-m-d H:i:s', strtotime('-30 days')),
                'status' => 'active'
            ],
            [
                'id' => 3,
                'name' => 'Suporte',
                'email' => 'suporte@plenaaplicativos.com.br',
                'role' => 'support',
                'position' => 'Gerente de Suporte',
                'last_login' => date('Y-m-d H:i:s', strtotime('-2 days')),
                'created_at' => date('Y-m-d H:i:s', strtotime('-60 days')),
                'status' => 'active'
            ]
        ];
    }
    
    jsonResponse($team_db);
}

// 19. ADICIONAR MEMBRO DA EQUIPE
if ($action === 'add_team_member') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $member = $data['member'] ?? [];
    
    if (empty($member['name']) || empty($member['email'])) {
        jsonResponse(['error' => 'Nome e email são obrigatórios'], 400);
    }
    
    if (!isValidEmail($member['email'])) {
        jsonResponse(['error' => 'Email inválido'], 400);
    }
    
    $team_db = json_decode(file_get_contents($TEAM_FILE), true) ?? [];
    
    // Verifica se email já existe
    foreach ($team_db as $existing) {
        if ($existing['email'] === $member['email']) {
            jsonResponse(['error' => 'Email já cadastrado na equipe'], 400);
        }
    }
    
    // Adiciona membro
    $member['id'] = count($team_db) + 1;
    $member['created_at'] = date('Y-m-d H:i:s');
    $member['last_login'] = null;
    $member['status'] = 'active';
    
    $team_db[] = $member;
    file_put_contents($TEAM_FILE, json_encode($team_db, JSON_PRETTY_PRINT));
    
    systemLog("Membro adicionado à equipe: {$member['email']}", 'info');
    
    jsonResponse(['success' => true, 'member_id' => $member['id']]);
}

// 20. REMOVER MEMBRO DA EQUIPE
if ($action === 'delete_team_member') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $member_id = $data['member_id'] ?? '';
    
    if (empty($member_id)) {
        jsonResponse(['error' => 'ID do membro é obrigatório'], 400);
    }
    
    $team_db = json_decode(file_get_contents($TEAM_FILE), true) ?? [];
    $new_team = [];
    $found = false;
    
    foreach ($team_db as $member) {
        if ($member['id'] != $member_id) {
            $new_team[] = $member;
        } else {
            $found = true;
        }
    }
    
    if ($found) {
        file_put_contents($TEAM_FILE, json_encode($new_team, JSON_PRETTY_PRINT));
        
        systemLog("Membro removido da equipe: $member_id", 'warning');
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Membro não encontrado'], 404);
    }
}

// 21. GET REPORTS HISTORY
if ($action === 'get_reports') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $reports_db = json_decode(file_get_contents($REPORTS_FILE), true) ?? [];
    
    // Exemplo de relatórios gerados recentemente
    if (empty($reports_db)) {
        $reports_db = [
            [
                'id' => generateId('rep_'),
                'name' => 'Relatório de Vendas - Janeiro 2025',
                'type' => 'sales',
                'period' => '2025-01',
                'size' => '1.2 MB',
                'format' => 'pdf',
                'created_at' => date('Y-m-d H:i:s', strtotime('-5 days')),
                'icon' => 'fa-solid fa-file-pdf'
            ],
            [
                'id' => generateId('rep_'),
                'name' => 'Relatório Financeiro - Dezembro 2024',
                'type' => 'finance',
                'period' => '2024-12',
                'size' => '0.8 MB',
                'format' => 'excel',
                'created_at' => date('Y-m-d H:i:s', strtotime('-15 days')),
                'icon' => 'fa-solid fa-file-excel'
            ],
            [
                'id' => generateId('rep_'),
                'name' => 'Análise de Clientes - Q4 2024',
                'type' => 'clients',
                'period' => '2024-Q4',
                'size' => '0.5 MB',
                'format' => 'csv',
                'created_at' => date('Y-m-d H:i:s', strtotime('-30 days')),
                'icon' => 'fa-solid fa-file-csv'
            ]
        ];
    }
    
    // Ordena por data
    usort($reports_db, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    jsonResponse($reports_db);
}

// 22. DELETAR RELATÓRIO
if ($action === 'delete_report') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $report_id = $data['report_id'] ?? '';
    
    if (empty($report_id)) {
        jsonResponse(['error' => 'ID do relatório é obrigatório'], 400);
    }
    
    $reports_db = json_decode(file_get_contents($REPORTS_FILE), true) ?? [];
    $new_reports = [];
    $found = false;
    
    foreach ($reports_db as $report) {
        if ($report['id'] != $report_id) {
            $new_reports[] = $report;
        } else {
            $found = true;
        }
    }
    
    if ($found) {
        file_put_contents($REPORTS_FILE, json_encode($new_reports, JSON_PRETTY_PRINT));
        
        systemLog("Relatório deletado: $report_id", 'warning');
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Relatório não encontrado'], 404);
    }
}

// 23. EXPORTAR DADOS (CSV)
if ($action === 'export_data') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $type = $data['type'] ?? $_GET['type'] ?? 'licenses';
    $format = $data['format'] ?? $_GET['format'] ?? 'csv';
    
    switch ($type) {
        case 'licenses':
            $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
            $filename = "licencas_export_" . date('Ymd_His') . ".csv";
            
            // Cria CSV
            $csv = "Chave;Cliente;Produto;Preço;Tipo;Status;Criado em;Expira em;Último acesso\n";
            foreach ($db as $key => $license) {
                $csv .= "\"{$key}\";";
                $csv .= "\"{$license['client']}\";";
                $csv .= "\"{$license['product']}\";";
                $csv .= "\"{$license['price']}\";";
                $csv .= "\"{$license['license_type']}\";";
                $csv .= "\"{$license['status']}\";";
                $csv .= "\"{$license['created_at']}\";";
                $csv .= "\"{$license['expires_at']}\";";
                $csv .= "\"{$license['last_access']}\"\n";
            }
            break;
            
        case 'leads':
            $leads = json_decode(file_get_contents($LEADS_FILE), true) ?? [];
            $filename = "leads_export_" . date('Ymd_His') . ".csv";
            
            $csv = "ID;Nome;Email;Telefone;Empresa;Origem;Interesse;Status;Criado em;Contactado\n";
            foreach ($leads as $lead) {
                $csv .= "\"{$lead['unique_id']}\";";
                $csv .= "\"{$lead['name']}\";";
                $csv .= "\"{$lead['email']}\";";
                $csv .= "\"{$lead['phone']}\";";
                $csv .= "\"{$lead['company']}\";";
                $csv .= "\"{$lead['source']}\";";
                $csv .= "\"{$lead['interest']}\";";
                $csv .= "\"{$lead['status']}\";";
                $csv .= "\"{$lead['created_at']}\";";
                $csv .= "\"" . ($lead['contacted'] ? 'Sim' : 'Não') . "\"\n";
            }
            break;
            
        case 'sales':
            $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
            $filename = "vendas_export_" . date('Ymd_His') . ".csv";
            
            $csv = "ID;Data;Cliente;Produto;Valor;Status;Método;Chave\n";
            foreach ($db as $key => $license) {
                $csv .= "\"{$license['payment_id']}\";";
                $csv .= "\"{$license['created_at']}\";";
                $csv .= "\"{$license['client']}\";";
                $csv .= "\"{$license['product']}\";";
                $csv .= "\"{$license['price']}\";";
                $csv .= "\"paid\";";
                $csv .= "\"mercadopago\";";
                $csv .= "\"{$key}\"\n";
            }
            break;
            
        default:
            jsonResponse(['error' => 'Tipo de exportação inválido'], 400);
    }
    
    // Cria relatório
    $reports_db = json_decode(file_get_contents($REPORTS_FILE), true) ?? [];
    $reports_db[] = [
        'id' => generateId('rep_'),
        'name' => "Exportação $type - " . date('d/m/Y H:i'),
        'type' => $type,
        'period' => date('Y-m'),
        'size' => round(strlen($csv) / 1024, 2) . ' KB',
        'format' => $format,
        'created_at' => date('Y-m-d H:i:s'),
        'icon' => $format === 'csv' ? 'fa-solid fa-file-csv' : 'fa-solid fa-file-excel'
    ];
    file_put_contents($REPORTS_FILE, json_encode($reports_db, JSON_PRETTY_PRINT));
    
    // Retorna dados CSV para download
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"$filename\"");
    echo $csv;
    exit;
}

// ==================================================================
// 7. ACTIONS PÚBLICAS (VALIDAÇÃO DE LICENÇA)
// ==================================================================

if ($action === 'validate' || $action === 'validate_access') {
    $key = $data['license_key'] ?? '';
    $device = $data['device_fingerprint'] ?? '';
    
    if (empty($key)) {
        jsonResponse(["valid" => false, "message" => "Chave de licença é obrigatória"], 400);
    }
    
    $db = json_decode(file_get_contents($DB_FILE), true) ?? [];
    
    if (!isset($db[$key])) {
        jsonResponse(["valid" => false, "message" => "Licença não encontrada"], 404);
    }
    
    $license = $db[$key];
    
    // Verifica status
    if (($license['status'] ?? 'active') !== 'active') {
        jsonResponse(["valid" => false, "message" => "Licença inativa ou bloqueada"], 403);
    }
    
    // Verifica expiração
    if (!empty($license['expires_at']) && strtotime($license['expires_at']) < time()) {
        // Marca como expirada
        $db[$key]['status'] = 'expired';
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        
        jsonResponse(["valid" => false, "message" => "Licença expirada"], 403);
    }
    
    // Lógica de dispositivo
    $currentDevice = $license['device_id'] ?? null;
    
    if (empty($currentDevice)) {
        // Primeiro uso: vincula dispositivo
        $db[$key]['device_id'] = $device;
        $db[$key]['activated_at'] = date('Y-m-d H:i:s');
        $db[$key]['last_access'] = date('Y-m-d H:i:s');
        $db[$key]['access_count'] = ($license['access_count'] ?? 0) + 1;
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        
        systemLog("Licença $key ativada no dispositivo: $device", 'info');
        jsonResponse([
            "valid" => true, 
            "message" => "Licença ativada com sucesso!",
            "app_link" => $license['app_link'] ?? '#'
        ]);
    } elseif ($currentDevice === $device) {
        // Mesmo dispositivo: atualiza último acesso
        $db[$key]['last_access'] = date('Y-m-d H:i:s');
        $db[$key]['access_count'] = ($license['access_count'] ?? 0) + 1;
        file_put_contents($DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        
        jsonResponse([
            "valid" => true, 
            "message" => "Acesso permitido",
            "app_link" => $license['app_link'] ?? '#'
        ]);
    } else {
        // Dispositivo diferente: bloqueia
        jsonResponse(["valid" => false, "message" => "Licença já está em uso em outro dispositivo"], 403);
    }
}

// ==================================================================
// 8. BACKUP DO SISTEMA
// ==================================================================

if ($action === 'backup_system') {
    if (!checkAuth($data, $_GET, $server)) {
        jsonResponse(['error' => 'Acesso Negado'], 403);
    }
    
    $backup_type = $data['type'] ?? $_GET['type'] ?? 'full';
    $backup_dir = $DATA_DIR . 'backups/';
    
    if (!file_exists($backup_dir)) {
        mkdir($backup_dir, 0755, true);
    }
    
    $timestamp = date('Ymd_His');
    $backup_files = [];
    
    // Lista de arquivos para backup
    $files_to_backup = [
        'licenses' => $DB_FILE,
        'leads' => $LEADS_FILE,
        'products' => $PRODUCTS_FILE,
        'finance' => $FINANCE_FILE,
        'team' => $TEAM_FILE,
        'reports' => $REPORTS_FILE,
        'logs' => $LOGS_FILE
    ];
    
    if ($backup_type === 'full') {
        foreach ($files_to_backup as $name => $file) {
            if (file_exists($file)) {
                $backup_files[$name] = $file;
            }
        }
    } elseif ($backup_type === 'database') {
        $backup_files['licenses'] = $DB_FILE;
        $backup_files['leads'] = $LEADS_FILE;
    } elseif ($backup_type === 'files') {
        $backup_files['products'] = $PRODUCTS_FILE;
        $backup_files['reports'] = $REPORTS_FILE;
    }
    
    // Cria arquivo ZIP
    $zip_file = $backup_dir . "backup_{$backup_type}_{$timestamp}.zip";
    $zip = new ZipArchive();
    
    if ($zip->open($zip_file, ZipArchive::CREATE) === TRUE) {
        foreach ($backup_files as $name => $file) {
            $zip->addFile($file, basename($file));
        }
        $zip->close();
        
        // Adiciona relatório
        $reports_db = json_decode(file_get_contents($REPORTS_FILE), true) ?? [];
        $reports_db[] = [
            'id' => generateId('backup_'),
            'name' => "Backup $backup_type - " . date('d/m/Y H:i'),
            'type' => 'backup',
            'period' => date('Y-m'),
            'size' => round(filesize($zip_file) / 1024, 2) . ' KB',
            'format' => 'zip',
            'created_at' => date('Y-m-d H:i:s'),
            'icon' => 'fa-solid fa-database',
            'file' => basename($zip_file)
        ];
        file_put_contents($REPORTS_FILE, json_encode($reports_db, JSON_PRETTY_PRINT));
        
        systemLog("Backup criado: $zip_file", 'info');
        jsonResponse(['success' => true, 'backup_file' => basename($zip_file), 'size' => filesize($zip_file)]);
    } else {
        jsonResponse(['error' => 'Falha ao criar backup'], 500);
    }
}

// ==================================================================
// 9. ACTION DEFAULT
// ==================================================================

// Se nenhuma action foi correspondida
jsonResponse([
    "status" => "online", 
    "version" => SYSTEM_VERSION,
    "name" => SYSTEM_NAME,
    "timestamp" => date('Y-m-d H:i:s'),
    "endpoints" => [
        "admin" => ["list", "dashboard_stats", "get_leads", "create", "update_status", "resend_email", "get_logs", "system_health", "get_sales_history", "get_finance", "save_transaction", "get_products", "save_product", "toggle_product", "get_team", "add_team_member", "delete_team_member", "get_reports", "delete_report", "export_data", "backup_system"],
        "public" => ["validate", "validate_access"]
    ]
]);