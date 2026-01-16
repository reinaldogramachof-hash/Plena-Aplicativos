<?php
// api_mailer.php - V1.0 - Centralized Email Engine

// Evita redefinição se incluído múltiplas vezes
if (!function_exists('plena_log_mail')) {
    function plena_log_mail($msg) {
        $logFile = 'debug_log.txt';
        $entry = date('Y-m-d H:i:s') . " - [MAILER] " . $msg . PHP_EOL;
        file_put_contents($logFile, $entry, FILE_APPEND);
    }
}

/**
 * Envia o e-mail de licença com template PREMIUM.
 * @param string $to Email do destinatário
 * @param string $productName Nome do Produto
 * @param string $key Chave de Licença
 * @param string $link Link de Acesso
 * @return bool Sucesso ou Falha
 */
function sendLicenseEmail($to, $productName, $key, $link) {
    // 1. Validação Básica
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        plena_log_mail("ERRO: Email inválido ($to)");
        return false;
    }

    // 2. Configurações de Remetente (ESTRATÉGIA CROSS-DOMAIN)
    // O 'From' DEVE ser do mesmo domínio onde o site está hospedado (plenaaplicativos)
    // O 'Reply-To' é para onde a resposta vai (plenainformatica)
    $senderEmail = 'noreply@plenaaplicativos.com.br'; 
    $senderName = 'Plena Tecnologia';
    $replyTo = 'tecnologia@plenainformatica.com.br';

    // 3. Assunto com Emoji para destaque
    $subject = "✅ Seu Acesso Liberado: $productName";

    // 4. Template HTML Premium
    $htmlContent = "
    <!DOCTYPE html>
    <html lang='pt-BR'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Seu Acesso Plena</title>
        <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; color: #334155; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; margin-bottom: 20px; color: #1e293b; }
            .message { line-height: 1.6; margin-bottom: 30px; }
            .card { background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px; }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 8px; display: block; }
            .key-box { background: #ffffff; padding: 12px 20px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #1e293b; display: inline-block; margin-bottom: 20px; letter-spacing: 1px; }
            .btn { display: inline-block; background-color: #2563EB; color: #ffffff !important; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: background-color 0.2s; }
            .btn:hover { background-color: #1d4ed8; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .footer a { color: #64748b; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Plena Compropay</h1>
            </div>
            <div class='content'>
                <p class='greeting'>Olá!</p>
                <p class='message'>
                    Tudo certo com o seu pagamento! 🚀<br>
                    Abaixo estão os dados para ativar e acessar o seu <strong>$productName</strong> agora mesmo.
                </p>
                
                <div class='card'>
                    <span class='label'>Sua Chave de Licença</span>
                    <div class='key-box'>$key</div>
                    <br>
                    <a href='$link' class='btn' target='_blank'>ACESSAR SISTEMA AGORA</a>
                    <p style='margin-top: 15px; font-size: 13px; color: #64748b;'>
                        Ou acesse: <a href='$link' style='color:#2563eb;'>$link</a>
                    </p>
                </div>

                <p class='message' style='font-size: 14px; color: #64748b;'>
                    <strong>Importante:</strong> Ao acessar, o sistema pedirá essa chave de licença. Ela é única e intransferível.
                </p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " Plena Soluções Digitais.<br>Todos os direitos reservados.</p>
                <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    ";

    // 5. Headers Otimizados para HostGator (Exim/cPanel)
    $headers  = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
    $headers .= "From: $senderName <$senderEmail>" . "\r\n";
    $headers .= "Reply-To: $replyTo" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    // Return-Path é definido via paramentro -f abaixo, não no header string, para evitar conflitos.

    // 6. Envio com flag -f (CRUCIAL PARA HOSTGATOR)
    // O parametro "-f" força o envelope-sender, autenticando o envio no servidor.
    $params = "-f$senderEmail";

    $sent = mail($to, $subject, $htmlContent, $headers, $params);

    if($sent) {
        plena_log_mail("SUCESSO: E-mail de '$productName' enviado para $to");
    } else {
        plena_log_mail("FALHA CRÍTICA: Função mail() falhou para $to");
    }

    return $sent;
}
?>
