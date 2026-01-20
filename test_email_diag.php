<?php
// test_email_diag.php
// Diagnostic Tool for Plena Aplicativos Email System (Advanced Connection Scanner)

header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO AVANÇADO DE CONEXÃO SMTP ===\n";
echo "Data: " . date('Y-m-d H:i:s') . "\n\n";

// Load Secrets manually if needed
if(file_exists('secrets.php')) include 'secrets.php';
$pass = $SMTP_PASS ?? 'N/A';
$user = $SMTP_USER ?? 'N/A';

echo "[1] Configuração Atual (secrets.php):\n";
echo "HOST: " . ($SMTP_HOST ?? 'N/A') . "\n";
echo "PORT: " . ($SMTP_PORT ?? 'N/A') . "\n";
echo "USER: $user\n";
echo "PASS: " . (strlen($pass) > 3 ? substr($pass, 0, 3).'***' : '***') . "\n\n";

echo "[2] Carregando SimpleMailer...\n";
if (!file_exists('SimpleMailer.php')) {
    echo "ERRO CRÍTICO: SimpleMailer.php não encontrado.\n";
    exit;
}
require_once 'SimpleMailer.php';
echo "SimpleMailer carregado.\n\n";

echo "[3] Teste de Conectividade (Port Scan)...\n";
echo "Vamos tentar conectar em vários hosts/portas para ver qual responde.\n";
echo "---------------------------------------------------------------\n";

$candidates = [
    ['host' => 'localhost', 'port' => 587],
    ['host' => 'localhost', 'port' => 25],
    ['host' => '127.0.0.1', 'port' => 587],
    ['host' => '127.0.0.1', 'port' => 25],
    ['host' => 'mail.plenaaplicativos.com.br', 'port' => 587], // Tentar 587 externo
    ['host' => 'mail.plenaaplicativos.com.br', 'port' => 25],  // Tentar 25 externo
];

$workingConfig = null;

foreach ($candidates as $cand) {
    $h = $cand['host'];
    $p = $cand['port'];
    
    echo "Tentando $h:$p ... ";
    
    $protocol = 'tcp://'; // Start with TCP to check reachability
    $ctx = stream_context_create(['ssl' => ['verify_peer'=>false, 'verify_peer_name'=>false]]);
    $sock = stream_socket_client("$protocol$h:$p", $errno, $errstr, 5, STREAM_CLIENT_CONNECT, $ctx);
    
    if ($sock) {
        echo "CONECTADO! ";
        // Read Banner
        $banner = fgets($sock, 512);
        echo "Banner: " . trim($banner) . "\n";
        fclose($sock);
        
        if (strpos($banner, '220') !== false) {
            $workingConfig = $cand;
            break; // Found one!
        }
    } else {
        echo "Falha: $errno - $errstr\n";
    }
}

echo "---------------------------------------------------------------\n\n";

if ($workingConfig) {
    echo "[4] Tentativa de Envio Real usando a configuração funcional: " . $workingConfig['host'] . ":" . $workingConfig['port'] . "\n";
    
    $mailer = new SimpleMailer($workingConfig['host'], $workingConfig['port'], $user, $pass);
    $mailer->setDebug(true); // Enable internal logging
    
    // We hook into logs
    $to = $_GET['email'] ?? 'tecnologia@plenaaplicativos.com.br';
    
    echo "Enviando para: $to\n";
    $sent = $mailer->send($to, "Teste de Conexão DESCOBERTA", "<h1>Funciona!</h1><p>Configuração descoberta: {$workingConfig['host']}:{$workingConfig['port']}</p>", $user, "Plena Diag");
    
    if ($sent) {
        echo "\n✅ SUCESSO TOTAL!\n";
        echo "A configuração correta é:\n";
        echo "HOST: " . $workingConfig['host'] . "\n";
        echo "PORT: " . $workingConfig['port'] . "\n";
        echo "Atualize seu secrets.php com esses dados urgente!\n";
    } else {
        echo "\n❌ Conectou, mas falhou no envio/auth.\n";
        echo "Logs detalhados:\n";
        print_r($mailer->getLogs());
    }
    
} else {
    echo "[4] Nenhuma configuração funcionou.\n";
    echo "Isso indica bloqueio severo de firewall ou erro no nome do servidor.\n";
    die();
}
?>
