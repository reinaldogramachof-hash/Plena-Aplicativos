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
            $email_cliente = $payment['payer']['email'];
            $produto_nome = $payment['description'];
            
            // 1. GERAÇÃO CHAVE
            $key = "PLENA-" . strtoupper(substr(md5(uniqid()), 0, 4) . "-" . substr(md5(time()), 0, 4));
            
            // 2. GRAVAÇÃO DB
            $db_file = 'database_licenses_secure.json';
            $db = file_exists($db_file) ? json_decode(file_get_contents($db_file), true) : [];
            $db[$key] = [
                "client" => $email_cliente,
                "product" => $produto_nome,
                "device_id" => null,
                "status" => "active",
                "created_at" => date('Y-m-d H:i:s'),
                "payment_id" => $id
            ];
            file_put_contents($db_file, json_encode($db), LOCK_EX);

            // 3. ENVIO DE EMAIL HTML PROFISSIONAL
            $to = $email_cliente;
            $subject = "✅ Seu Acesso Liberado: $produto_nome";
            
            // Template HTML Moderno
            $htmlContent = "
            <html>
            <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
                <div style='max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <h1 style='color: #2563EB;'>Plena Aplicativos</h1>
                    </div>
                    <p>Olá,</p>
                    <p>Obrigado pela sua compra! Seu acesso ao sistema <strong>$produto_nome</strong> foi liberado.</p>
                    
                    <div style='background-color: #eff6ff; border: 1px dashed #2563EB; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;'>
                        <p style='margin: 0; color: #64748b; font-size: 14px;'>SUA CHAVE DE ACESSO</p>
                        <h2 style='margin: 10px 0; font-family: monospace; letter-spacing: 2px; color: #1e293b;'>$key</h2>
                    </div>

                    <p><strong>Como ativar:</strong></p>
                    <ol>
                        <li>Acesse o sistema que você comprou.</li>
                        <li>Na tela de bloqueio, cole a chave acima.</li>
                        <li>Clique em 'Liberar Acesso'.</li>
                    </ol>

                    <p style='margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;'>
                        Precisa de ajuda? Responda este e-mail.<br>
                        Plena Soluções Digitais
                    </p>
                </div>
            </body>
            </html>
            ";

            $domain = 'plenaaplicativos.com.br';
            $headers = "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
            $headers .= "From: Plena Apps <no-reply@$domain>" . "\r\n";
            $headers .= "Reply-To: suporte@$domain" . "\r\n";

            mail($to, $subject, $htmlContent, $headers);
            
            logMsg("Venda Aprovada (V3). Email enviado para $to. Key: $key");
        }
    }
    
    http_response_code(200); echo "OK"; exit;
}

echo json_encode(['status' => 'online', 'msg' => 'API Plena V3 (Checkout Optimized)']);
?>