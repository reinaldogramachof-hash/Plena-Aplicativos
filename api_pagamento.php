<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

require_once 'secrets.php';

$json_input = file_get_contents('php://input');
$data = json_decode($json_input, true);
$action = $_GET['action'] ?? '';

// LOGGERS
function logMsg($msg) {
    file_put_contents('debug_log.txt', date('H:i:s') . " - $msg" . PHP_EOL, FILE_APPEND);
}

// HELPER: Envio de E-mail Reutilizável com Logs Detalhados
function sendLicenseEmail($to, $productName, $key, $link) {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        logMsg("ERRO EMAIL: Endereço inválido ($to)");
        return false;
    }

    $subject = "✅ Seu Acesso Liberado: $productName";
    
    // Template Melhorado
    $htmlContent = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Acesso Liberado</title>
    </head>
    <body style='font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; margin: 0;'>
        <div style='max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;'>
            <div style='text-align: center; margin-bottom: 30px;'>
                <h1 style='color: #2563EB; margin: 0; font-size: 24px;'>Plena Aplicativos</h1>
                <p style='color: #64748b; margin-top: 5px;'>Tecnologia para o seu negócio</p>
            </div>
            
            <p style='color: #334155; font-size: 16px; line-height: 1.5;'>Olá,</p>
            <p style='color: #334155; font-size: 16px; line-height: 1.5;'>Pagamento confirmado! 🚀<br>Aqui está o seu acesso oficial ao <strong>$productName</strong>.</p>
            
            <div style='background-color: #eff6ff; border: 1px dashed #2563EB; padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px;'>
                <p style='margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;'>SUA CHAVE DE LICENÇA</p>
                <h2 style='margin: 10px 0 20px 0; font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #1e293b; background: white; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block;'>$key</h2>
                <br>
                <a href='$link' style='display: inline-block; background-color: #2563EB; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.4);'>👉 ACESSAR SISTEMA AGORA</a>
            </div>

            <div style='background-color: #f1f5f9; padding: 20px; border-radius: 8px;'>
                <p style='margin: 0 0 10px 0; font-weight: bold; color: #475569;'>📖 Como ativar:</p>
                <ol style='margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;'>
                    <li>Clique no botão azul acima.</li>
                    <li>Quando o sistema abrir, cole a chave que está no quadro.</li>
                    <li>Clique em 'Liberar Acesso'.</li>
                </ol>
            </div>

            <p style='margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;'>
                Precisa de ajuda? Responda este e-mail.<br>
                &copy; " . date('Y') . " Plena Soluções Digitais
            </p>
        </div>
    </body>
    </html>
    ";

    // Headers Robustas para Entregabilidade (SPF/DKIM friendly)
    $headers = array(
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Plena Tecnologia <tecnologia@plenainformatica.com.br>',
        'Reply-To: suporte@plenainformatica.com.br',
        'X-Mailer: PHP/' . phpversion(),
        'X-Priority: 1 (Highest)',
        'X-MSMail-Priority: High',
        'Importance: High'
    );

    // Tenta enviar e loga o resultado booleano
    $sent = mail($to, $subject, $htmlContent, implode("\r\n", $headers));

    if ($sent) {
        logMsg("SUCESSO EMAIL: Enviado para $to via mail() nativo.");
        return true;
    } else {
        logMsg("FALHA EMAIL: A função mail() retornou FALSE para $to. Verifique logs do servidor/SMTP.");
        return false;
    }
}

// HELPER: Processa Pagamento Aprovado (Gera Licença + Email)
function processApprovedPayment($payment) {
    global $ACCESS_TOKEN;
    
    $id = $payment['id'];
    $email_cliente = $payment['payer']['email'];
    $produto_nome = $payment['description'];
    
    // 1. VERIFICA SE JÁ EXISTE (Idempotência)
    $db_file = 'database_licenses_secure.json';
    $db = file_exists($db_file) ? json_decode(file_get_contents($db_file), true) : [];
    
    foreach ($db as $k => $v) {
        if (isset($v['payment_id']) && $v['payment_id'] == $id) {
            logMsg("Pagamento $id já processado anteriormente. Chave: $k");
            return $k;
        }
    }

    logMsg("Gerando nova licença para pagamento $id ($email_cliente)");

    // 2. GERAÇÃO CHAVE
    $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
    
    // 3. Link do App
    $app_link = $payment['metadata']['app_link'] ?? 'apps.plus/plena_alugueis.html';
    if (strpos($app_link, 'http') === 0) {
        $full_link = $app_link;
    } else {
        $full_link = "https://plenaaplicativos.com.br/" . ltrim($app_link, '/');
    }

    // 4. GRAVAÇÃO DB
    $db[$key] = [
        "client" => $email_cliente,
        "product" => $produto_nome,
        "device_id" => null,
        "status" => "active",
        "created_at" => date('Y-m-d H:i:s'),
        "payment_id" => $id,
        "app_link" => $full_link
    ];
    file_put_contents($db_file, json_encode($db), LOCK_EX);

    // 5. ENVIO DE EMAIL (Usando Helper)
    sendLicenseEmail($email_cliente, $produto_nome, $key, $full_link);

    // Retorna chave
    return $key;
}

// ==================================================================
// -1. ACTION TESTE EMAIL (Para Admin Panel)
// ==================================================================
if ($action === 'test_email') {
    $to = $data['email'] ?? $_GET['email'] ?? '';
    if (!$to) { echo json_encode(['success'=>false, 'msg'=>'Email vazio']); exit; }

    logMsg("TESTE EMAIL: Iniciando teste manual para $to");
    $result = sendLicenseEmail($to, "Produto de Teste Admin", "PLENA-TESTE-1234", "https://plenaaplicativos.com.br/admin.html");
    
    echo json_encode([
        'success' => $result, 
        'msg' => $result ? 'Função mail() retornou TRUE' : 'Função mail() retornou FALSE'
    ]);
    exit;
}



// ==================================================================
// 0. CAPTURA DE LEAD (ABANDONO DE CARRINHO)
// ==================================================================
if ($action === 'save_lead') {
    if (!$data || empty($data['email'])) {
        echo json_encode(['status' => 'ignored']); exit;
    }

    $lead = [
        'date' => date('Y-m-d H:i:s'),
        'name' => $data['name'] ?? 'Visitante',
        'email' => $data['email'],
        'phone' => $data['phone'] ?? '',
        'product' => $data['product'] ?? 'Checkout Genérico',
        'status' => 'abandoned' // Inicialmente é abandono, se comprar vira 'converted' (futuro)
    ];

    // Salva em um arquivo JSON simples para CRM
    $file = 'leads_abandono.json';
    $leads = [];
    if (file_exists($file)) {
        $leads = json_decode(file_get_contents($file), true) ?? [];
    }
    
    // Atualiza se já existir (pelo email)
    $leads[$data['email']] = $lead;
    
    file_put_contents($file, json_encode($leads, JSON_PRETTY_PRINT));
    
    echo json_encode(['status' => 'saved']);
    exit;
}

// ------------------------------------------------------------------
// 1. PROCESSAR PAGAMENTO (Cartão e Pix)
// ------------------------------------------------------------------
if ($action === 'process_payment') {
    if (!$data) {
        http_response_code(400); echo json_encode(['error' => 'Nenhum dado recebido.']); exit;
    }

    logMsg("Processando (v3): " . ($data['payer']['email'] ?? 'Sem email'));

    // Sanitização e Preparação Payload MP
    $payment_payload = [
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
                "number" => preg_replace('/\D/', '', $data['payer']['identification']['number'] ?? '')
            ]
        ],
        "notification_url" => (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']) . "/api_pagamento.php?action=webhook"
    ];

    if ($data['payment_method_id'] === 'pix') {
        $name_parts = explode(' ', $data['payer']['first_name'] ?? 'Cliente Plena');
        $payment_payload['payer']['first_name'] = $name_parts[0];
        $payment_payload['payer']['last_name'] = $name_parts[1] ?? 'App';
    }

    // Call Mercado Pago
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.mercadopago.com/v1/payments",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode($payment_payload),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . $ACCESS_TOKEN,
            "X-Idempotency-Key: " . uniqid()
        ],
    ]);

    $response = curl_exec($curl);
    $err = curl_error($curl);
    curl_close($curl);

    if ($err) {
        logMsg("Erro CURL: $err");
        echo json_encode(['status' => 'error', 'message' => 'Erro interno de pagamento.']);
    } else {
        echo $response;
    }
    exit;
}

// ------------------------------------------------------------------
// 2. CHECK STATUS (Pooling)
// ------------------------------------------------------------------
if ($action === 'check_status') {
    $id = $_GET['id'] ?? '';
    if(!$id) { echo json_encode(['status' => 'error']); exit; }

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api.mercadopago.com/v1/payments/$id",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer " . $ACCESS_TOKEN],
    ]);
    $response = curl_exec($curl);
    curl_close($curl);
    
    $payment = json_decode($response, true);
    $status = $payment['status'] ?? 'pending';
    
    // Recupera chave se aprovado
    $license_key = null;
    if ($status === 'approved') {
        $db_file = 'database_licenses_secure.json';
        if (file_exists($db_file)) {
            $db = json_decode(file_get_contents($db_file), true);
            foreach ($db as $key => $val) {
                if (isset($val['payment_id']) && $val['payment_id'] == $id) {
                    $license_key = $key;
                    break;
                }
            }
        }
    }

    // FALLBACK: Se aprovado e sem licença (Webhook falhou ou atrasou), gera agora
    if ($status === 'approved' && !$license_key) {
        logMsg("Check Status: Aprovado mas sem licença. Forçando geração para ID $id");
        $license_key = processApprovedPayment($payment);
    }

    echo json_encode(['status' => $status, 'license_key' => $license_key]);
    exit;
}

// ------------------------------------------------------------------
// 3. WEBHOOK (Callback & Entrega)
// ------------------------------------------------------------------
if ($action === 'webhook') {
    $topic = $_GET['topic'] ?? $_GET['type'] ?? '';
    $id = $_GET['id'] ?? $_GET['data_id'] ?? '';

    if (empty($id)) {
        $body = json_decode(file_get_contents('php://input'), true);
        $id = $body['data']['id'] ?? $body['id'] ?? '';
    }

    if ($id) {
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => "https://api.mercadopago.com/v1/payments/$id",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ["Authorization: Bearer " . $ACCESS_TOKEN],
        ]);
        $response = curl_exec($curl);
        $payment = json_decode($response, true);
        curl_close($curl);

        $status = $payment['status'] ?? 'unknown';

        if ($status === 'approved') {
            processApprovedPayment($payment);
        }
    }
    
    http_response_code(200); echo "OK"; exit;
}

echo json_encode(['status' => 'online', 'msg' => 'API Plena V3 (Checkout Optimized)']);
?>