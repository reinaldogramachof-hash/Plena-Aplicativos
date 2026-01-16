<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

// Carrega segredos (Token MP e Senha Admin)
if(file_exists('secrets.php')) require_once 'secrets.php';

$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);
$action = $_GET['action'] ?? '';

// --- LOGGING ---
function logMsg($msg) {
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - $msg" . PHP_EOL, FILE_APPEND);
}

// --- EMAIL SENDER (Robust) ---
function sendLicenseEmail($to, $productName, $key, $link) {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        logMsg("ERRO EMAIL: Destinatário inválido ($to)");
        return false;
    }

    $subject = "✅ Seu Acesso Liberado: $productName";
    
    $htmlContent = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='UTF-8'></head>
    <body style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;'>
        <div style='max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; border: 1px solid #e2e8f0;'>
            <h1 style='color: #2563EB; text-align: center;'>Plena Aplicativos</h1>
            <p style='color: #334155; font-size: 16px;'>Olá,</p>
            <p style='color: #334155;'>Pagamento confirmado! 🚀<br>Aqui está seu acesso ao <strong>$productName</strong>.</p>
            
            <div style='background-color: #eff6ff; border: 1px dashed #2563EB; padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px;'>
                <p style='margin: 0; color: #64748b; font-size: 12px; font-weight: bold;'>SUA CHAVE DE LICENÇA</p>
                <h2 style='margin: 10px 0; font-family: monospace; font-size: 20px; color: #1e293b; background: white; padding: 10px; border: 1px solid #cbd5e1; display: inline-block;'>$key</h2>
                <br><br>
                <a href='$link' style='display: inline-block; background-color: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;'>👉 ACESSAR SISTEMA</a>
            </div>

            <p style='font-size: 12px; color: #94a3b8; text-align: center;'>Plena Soluções Digitais</p>
        </div>
    </body>
    </html>";

    $headers = array(
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Plena Tecnologia <tecnologia@plenainformatica.com.br>',
        'Reply-To: suporte@plenainformatica.com.br',
        'X-Mailer: PHP/' . phpversion()
    );

    $sent = mail($to, $subject, $htmlContent, implode("\r\n", $headers));
    if($sent) logMsg("SUCESSO EMAIL: Enviado para $to");
    else logMsg("FALHA EMAIL: Função mail() retornou FALSE para $to");
    
    return $sent;
}

// --- HELPER: LEADS STATUS UPDATE (CRM) ---
function updateLeadStatus($email, $newStatus) {
    if(!$email) return;
    $file = 'leads_abandono.json';
    if(!file_exists($file)) return;

    $fp = fopen($file, 'c+'); // Read/Write, Create if missing (though we checked exists)
    if (flock($fp, LOCK_EX)) {
        $filesize = filesize($file);
        $content = $filesize > 0 ? fread($fp, $filesize) : '[]';
        $leads = json_decode($content, true) ?? [];
        
        $changed = false;
        // Se for array indexado (novo formato)
        if (array_keys($leads) === range(0, count($leads) - 1) && !empty($leads)) {
            foreach($leads as &$l) {
                if(strtolower($l['email']) === strtolower($email)) {
                    $l['status'] = $newStatus;
                    $changed = true;
                }
            }
        } else {
            // Formato map antigo (fallback)
            if(isset($leads[$email])) {
                $leads[$email]['status'] = $newStatus;
                $changed = true;
            }
        }

        if($changed) {
            ftruncate($fp, 0);       // Truncate file
            rewind($fp);             // Rewind to start
            fwrite($fp, json_encode($leads, JSON_PRETTY_PRINT));
        }
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// --- HELPER: PROCESS APPROVED ---
function processApprovedPayment($payment) {
    global $ACCESS_TOKEN;
    
    $id = $payment['id'];
    $email = $payment['payer']['email'];
    $prod = $payment['description'];
    
    // 1. Check Idempotency (File Lock)
    $db_file = 'database_licenses_secure.json';
    
    $fp = fopen($db_file, 'c+');
    if (!$fp) { logMsg("ERRO FATAL: Não foi possível abrir DB licenses."); return false; }
    
    if (flock($fp, LOCK_EX)) {
        $fsize = filesize($db_file);
        $content = $fsize > 0 ? fread($fp, $fsize) : '{}';
        $db = json_decode($content, true) ?? [];
        
        // Verifica se já existe esse payment_id
        foreach ($db as $k => $v) {
            if (isset($v['payment_id']) && $v['payment_id'] == $id) {
                logMsg("Pagamento $id duplicado (ignorado).");
                flock($fp, LOCK_UN);
                fclose($fp);
                return $k;
            }
        }
        
        // 2. Generate Key
        $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
        
        // 3. Prepare Data
        $app_link = $payment['metadata']['app_link'] ?? 'apps.plus/plena_alugueis.html';
        $full_link = (strpos($app_link, 'http') === 0) ? $app_link : "https://plenaaplicativos.com.br/" . ltrim($app_link, '/');
        
        $db[$key] = [
            "client" => $email,
            "product" => $prod,
            "device_id" => null,
            "status" => "active",
            "created_at" => date('Y-m-d H:i:s'),
            "payment_id" => $id,
            "app_link" => $full_link
        ];
        
        // 4. Write
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($db));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        
        logMsg("Licença GERADA: $key ($email) - Pagamento $id");
        
        // 5. CRM Update & Email
        updateLeadStatus($email, 'converted');
        sendLicenseEmail($email, $prod, $key, $full_link);
        
        return $key;
        
    } else {
        fclose($fp);
        logMsg("ERRO LOCK: Falha ao obter lock do DB licenses.");
        return false;
    }
}

// ==================================================================
// ACTIONS
// ==================================================================

// 0. CAPTURA DE LEAD (ABANDONO) - COM LOCK
if ($action === 'save_lead') {
    if (!$data || empty($data['email'])) { echo json_encode(['status'=>'ignored']); exit; }

    $file = 'leads_abandono.json';
    $leadData = [
        'date' => date('Y-m-d H:i:s'),
        'name' => $data['name'] ?? 'Visitante',
        'email' => $data['email'],
        'phone' => $data['phone'] ?? '',
        'product' => $data['product'] ?? 'Checkout',
        'status' => 'pending' // Default pending
    ];

    $fp = fopen($file, 'c+');
    if (flock($fp, LOCK_EX)) {
        $size = filesize($file);
        $content = $size > 0 ? fread($fp, $size) : '[]';
        $leads = json_decode($content, true) ?? [];
        
        // Converte para array indexado se não for (Legacy fix)
        // Se for map, vamos converter para lista, mas mantendo histórico é complicado.
        // Vamos assumir formato lista de objetos para o novo padrão.
        if (!is_array($leads)) $leads = [];
        $is_assoc = array_keys($leads) !== range(0, count($leads) - 1) && !empty($leads);
        if($is_assoc) $leads = array_values($leads); // Flatten legacy map
        
        // Check exist
        $exists = false;
        foreach ($leads as &$l) {
            if (isset($l['email']) && strtolower($l['email']) === strtolower($data['email'])) {
                // Upsert: Update date & product ONLY, keep status unless it was converted (optional decision)
                // Se já comprou (converted), não voltamos para pending por enquanto.
                $l['date'] = $leadData['date'];
                $l['product'] = $leadData['product'];
                if(isset($data['name'])) $l['name'] = $data['name'];
                if(isset($data['phone'])) $l['phone'] = $data['phone'];
                $exists = true;
                break;
            }
        }
        
        if (!$exists) {
            $leads[] = $leadData;
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($leads, JSON_PRETTY_PRINT));
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    
    echo json_encode(['status' => 'saved']);
    exit;
}

// 1. PROCESSAR PAGAMENTO (Cria preferência MP)
if ($action === 'process_payment') {
    if (!$data) { http_response_code(400); echo json_encode(['error' => 'No Data']); exit; }
    
    logMsg("Iniciando pgto: " . ($data['payer']['email'] ?? 'NoEmail'));

    // Sanitização CPF/CNPJ
    $docNumber = preg_replace('/\D/', '', $data['payer']['identification']['number'] ?? '');
    
    $payload = [
        "transaction_amount" => (float)$data['transaction_amount'],
        "token" => $data['token'] ?? null,
        "description" => $data['description'] ?? 'Produto Digital',
        "metadata" => $data['metadata'] ?? [],
        "installments" => (int)($data['installments'] ?? 1),
        "payment_method_id" => $data['payment_method_id'],
        "issuer_id" => $data['issuer_id'] ?? null,
        "payer" => [
            "email" => filter_var($data['payer']['email'], FILTER_SANITIZE_EMAIL),
            "identification" => [
                "type" => $data['payer']['identification']['type'] ?? "CPF",
                "number" => $docNumber
            ]
        ],
        "notification_url" => (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']) . "/api_pagamento.php?action=webhook"
    ];

    if ($data['payment_method_id'] === 'pix') {
        $parts = explode(' ', $data['payer']['first_name'] ?? 'Cliente');
        $payload['payer']['first_name'] = $parts[0];
        $payload['payer']['last_name'] = $parts[1] ?? 'App';
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "https://api.mercadopago.com/v1/payments",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . ($ACCESS_TOKEN ?? ''),
            "X-Idempotency-Key: " . uniqid()
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) {
        // Log detalhado de erro do MP
        logMsg("ERRO MP ($httpCode): $response");
    }
    
    echo $response;
    exit;
}

// 2. CHECK STATUS (Pooling)
if ($action === 'check_status') {
    $id = $_GET['id'] ?? '';
    if(!$id) { echo json_encode(['status'=>'error']); exit; }

    // Check na API MP
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "https://api.mercadopago.com/v1/payments/$id",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer " . ($ACCESS_TOKEN ?? '')]
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    
    $json = json_decode($resp, true);
    $status = $json['status'] ?? 'pending';
    
    $key = null;
    if ($status === 'approved') {
        // Tenta recuperar do DB (via webhook anterior)
        $db = json_decode(file_get_contents('database_licenses_secure.json'), true) ?? [];
        foreach($db as $k => $v) {
            if(($v['payment_id'] ?? '') == $id) { $key = $k; break; }
        }
        
        // Se aprovado mas sem chave, força geração agora (Fallback)
        if (!$key) {
            logMsg("FALLBACK: Pagamento $id aprovado no check, mas sem licença. Gerando...");
            $key = processApprovedPayment($json);
        }
    }
    
    echo json_encode(['status'=>$status, 'license_key'=>$key]);
    exit;
}

// 3. WEBHOOK
if ($action === 'webhook') {
    $id = $_GET['id'] ?? $_GET['data_id'] ?? '';
    if (!$id) {
        $body = json_decode(file_get_contents('php://input'), true);
        $id = $body['data']['id'] ?? $body['id'] ?? '';
    }
    
    if ($id) {
        // Valida status real no MP
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => "https://api.mercadopago.com/v1/payments/$id",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer " . ($ACCESS_TOKEN ?? '')]
        ]);
        $resp = curl_exec($ch);
        curl_close($ch);
        
        $payment = json_decode($resp, true);
        if (($payment['status'] ?? '') === 'approved') {
            processApprovedPayment($payment);
        }
    }
    http_response_code(200); echo "OK";
    exit;
}

// 4. TEST EMAIL
if ($action === 'test_email') {
    $email = $_GET['email'] ?? '';
    $res = sendLicenseEmail($email, "Teste Admin", "TEST-KEY", "http://plena.com");
    echo json_encode(['success'=>$res, 'msg'=>$res?'OK':'Fail']);
    exit;
}

echo json_encode(['status'=>'online', 'v'=>'4.0']);
?>