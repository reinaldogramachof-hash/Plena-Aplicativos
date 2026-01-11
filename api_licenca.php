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

echo json_encode(["status" => "Online"]);
?>
