<?php
// test_mailer.php
require_once 'api_mailer.php';

echo "Testando envio de e-mail...\n";
$to = "contact@plenaaplicativos.com.br"; // Usar um email do proprio dominio ou seguro
$prod = "Teste de Produto";
$key = "TEST-KEY-1234";
$link = "https://plenaaplicativos.com.br/teste";

if (function_exists('sendLicenseEmail')) {
    echo "Função sendLicenseEmail encontrada.\n";
    $result = sendLicenseEmail($to, $prod, $key, $link);
    if ($result) {
        echo "SUCESSO: E-mail enviado (retorno true).\n";
    } else {
        echo "FALHA: E-mail não enviado (retorno false).\n";
    }
} else {
    echo "ERRO: Função sendLicenseEmail não encontrada.\n";
}
?>
