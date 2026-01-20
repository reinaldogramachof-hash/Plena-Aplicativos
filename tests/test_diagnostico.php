<?php
// test_diagnostico.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<h1>📡 Plena - Diagnóstico de E-mail</h1>";
echo "<p>Testando envio direto do servidor...</p>";

// 1. Definições
$to = $_GET['email'] ?? 'suporte@plenaaplicativos.com.br'; // Se não passar ?email=... usa esse
$subject = "Teste Diagnóstico - " . date('H:i:s');
$sender = 'tecnologia@plenaaplicativos.com.br';

echo "<ul>";
echo "<li><strong>De:</strong> $sender</li>";
echo "<li><strong>Para:</strong> $to <a href='?email=SEU_EMAIL_AQUI'>[Mudar]</a></li>";
echo "</ul>";

// 2. Import do Mailer
if (file_exists('api_mailer.php')) {
    echo "<li>Arquivo <code>api_mailer.php</code> encontrado.</li>";
    require_once 'api_mailer.php';
    
    // Tenta enviar usando a função do sistema
    echo "<li>Tentando enviar usando <code>sendLicenseEmail()</code>...</li>";
    
    $bool = sendLicenseEmail($to, "Produto de Teste", "TEST-KEY-1234", "https://plena.com");
    
    if ($bool) {
        echo "<h2 style='color:green'>✅ Função Retornou TRUE</h2>";
        echo "<p>O PHP diz que aceitou o e-mail para entrega.</p>";
        echo "<p><strong>Verifique:</strong></p>";
        echo "<ol><li>Caixa de Spam/Lixo Eletrônico.</li><li>Se o e-mail <code>$sender</code> realmente existe no cPanel.</li></ol>";
    } else {
        echo "<h2 style='color:red'>❌ Função Retornou FALSE</h2>";
        echo "<p>O servidor recusou o envio imediatamente.</p>";
    }
    
} else {
    echo "<li style='color:red'>ERRO: <code>api_mailer.php</code> não encontrado!</li>";
}

// 3. Info do Servidor
echo "<hr><h3>Informações Técnicas</h3>";
echo "<pre>";
echo "PHP Version: " . phpversion() . "\n";
echo "Sendmail Path: " . ini_get('sendmail_path') . "\n";
echo "SMTP: " . ini_get('SMTP') . "\n";
echo "SMTP Port: " . ini_get('smtp_port') . "\n";
echo "</pre>";

// 4. Log
if (file_exists('debug_log.txt')) {
    echo "<hr><h3>Últimas 5 linhas do Log</h3>";
    $lines = file('debug_log.txt');
    $last = array_slice($lines, -5);
    echo "<pre>" . implode("", $last) . "</pre>";
}
?>
