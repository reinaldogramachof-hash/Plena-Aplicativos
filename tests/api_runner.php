<?php
/**
 * API RUNNER FOR CLI INTEGRATION TESTING
 * Permite chamar api_licenca.php via linha de comando simulando REQUEST_METHOD e $_GET
 * 
 * Uso: echo '{"json":"payload"}' | php tests/api_runner.php "action=get_notifications&secret=123"
 */

// 1. Simula ambiente HTTP
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_X_ADMIN_SECRET'] = 'TEST_SECRET';

// 2. Parse Argv para $_GET
// O primeiro argumento deve ser a query string: "action=foo&bar=baz"
if (isset($argv[1])) {
    parse_str($argv[1], $_GET);
}

// 3. Define diretório de execução para a raiz do projeto (onde está api_licenca.php)
// api_licenca.php espera estar no root ou usa __DIR__ corretamente?
// Ele usa __DIR__ . '/', então ok. Mas requires podem falhar se o PWD estiver errado.
// Vamos mudar o CWD para o pai de 'tests'
chdir(__DIR__ . '/../');

// 4. Executa a API
// Bufferizaremos a saída para garantir que pegamos apenas o JSON limpo
ob_start();
require 'api_licenca.php';
$output = ob_get_clean();

// 5. Output Final
echo $output;
