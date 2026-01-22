<?php
// Script de Diagnóstico de Secrets
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== DIAGNÓSTICO DE SECRETS ===\n";

$secrets_file = __DIR__ . '/secrets.php';
echo "Verificando arquivo: $secrets_file\n";

if (file_exists($secrets_file)) {
    echo "[OK] Arquivo existe.\n";
    
    // Tenta incluir
    require_once $secrets_file;
    
    if (isset($ADMIN_SECRET)) {
        echo "[OK] \$ADMIN_SECRET carregada: $ADMIN_SECRET\n";
    } else {
        echo "[ERRO] \$ADMIN_SECRET não definida após require.\n";
    }
    
    if (isset($ACCESS_TOKEN)) {
        echo "[OK] \$ACCESS_TOKEN carregada: " . substr($ACCESS_TOKEN, 0, 10) . "...\n";
    } else {
        echo "[ERRO] \$ACCESS_TOKEN não definida após require.\n";
    }
    
} else {
    echo "[ERRO FATAL] Arquivo secrets.php NÃO ENCONTRADO.\n";
}

echo "==============================\n";
?>
