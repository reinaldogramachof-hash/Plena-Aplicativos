<?php
/**
 * TESTE AUTOMATIZADO: Lógica de Notificações Temporal (INTEGRAÇÃO REAL)
 * Executar via CLI: php tests/verify_notifications_timeline.php
 * 
 * Este teste CRIA arquivos de banco de dados temporários e executa api_licenca.php REAL
 * através do api_runner.php para garantir integridade total.
 */

// 1. Setup Mock Environment
define('DIR_ROOT', __DIR__ . '/../');
$DB_FILE = DIR_ROOT . 'database_licenses_secure.json';
$NOTIF_FILE = DIR_ROOT . 'notifications_system.json';

// Arquivos de backup
$DB_BAK = $DB_FILE . '.bak_test_real';
$NOTIF_BAK = $NOTIF_FILE . '.bak_test_real';

echo "=== INICIANDO TESTE DE INTEGRAÇÃO REAL (DADOS MOCKADOS) ===\n";

// Backup seguro
if (file_exists($DB_FILE))
    copy($DB_FILE, $DB_BAK);
if (file_exists($NOTIF_FILE))
    copy($NOTIF_FILE, $NOTIF_BAK);

try {
    // 2. Criar Cenário de Notificações
    $notifications = [
        [
            'id' => 'notif_ancient',
            'date' => '2020-01-01 12:00:00', // Muito antiga
            'title' => 'Mensagem Ancestral',
            'message' => 'Ninguém deve ver isso, exceto licenças de 2019',
            'target' => 'all',
            'type' => 'info'
        ],
        [
            'id' => 'notif_yesterday',
            'date' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'title' => 'Mensagem de Ontem',
            'message' => 'Quem ativou hoje NÃO deve ver isso.',
            'target' => 'all',
            'type' => 'warning'
        ],
        [
            'id' => 'notif_today',
            'date' => date('Y-m-d H:i:s', strtotime('+1 hour')), // Futuro próximo (simulando "agora")
            'title' => 'Mensagem de Hoje',
            'message' => 'Todos ativos devem ver.',
            'target' => 'all',
            'type' => 'success'
        ],
        [
            'id' => 'notif_expired',
            'date' => date('Y-m-d H:i:s'),
            'expires_at' => '2020-01-01', // Já expirada
            'title' => 'Mensagem Expirada',
            'message' => 'Ninguém deve ver.',
            'target' => 'all',
            'type' => 'error'
        ]
    ];
    file_put_contents($NOTIF_FILE, json_encode($notifications, JSON_PRETTY_PRINT));

    // 3. Teste A: Licença NOVA (Criada HOJE)
    $KEY_NEW = 'TEST-NEW-001';
    $license_new = [
        'status' => 'active',
        'activated_at' => date('Y-m-d H:i:s'), // Agora
        'product' => 'Plena Teste'
    ];
    // Precisa estar no DB real para a API achar
    $db = [$KEY_NEW => $license_new];

    // 4. Teste B: Licença ANTIGA (Ativada em 2019)
    $KEY_OLD = 'TEST-OLD-001';
    $license_old = [
        'status' => 'active',
        'activated_at' => '2019-01-01 00:00:00',
        'product' => 'Plena Teste'
    ];
    $db[$KEY_OLD] = $license_old;

    file_put_contents($DB_FILE, json_encode($db));

    // ==========================================================
    // EXECUÇÃO REAL VIA RUNNER
    // ==========================================================

    function callApiReal($key)
    {
        $payload = json_encode(['license_key' => $key]);
        // Escape json para shell (Windows Powershell pode ser chato com aspas)
        // Usamos temp file para input para evitar problemas de escaping
        $tmpInput = tempnam(sys_get_temp_dir(), 'api_in_');
        file_put_contents($tmpInput, $payload);

        $runnerPath = __DIR__ . '/api_runner.php';

        // Comando: type INPUT | php RUNNER ARGS
        // Windows usa 'type', Linux 'cat'. Vamos detectar ou usar php nativo
        // Melhor: pipe file content via redirect <
        $cmd = "php \"$runnerPath\" \"action=get_notifications\" < \"$tmpInput\"";

        $output = shell_exec($cmd);
        unlink($tmpInput);

        // Remove possíveis headers ou lixo antes do JSON (se houver)
        // A API usa ob_clean mas vamos garantir
        $json = json_decode($output, true);
        if (!$json) {
            throw new Exception("Falha ao decodificar JSON da API. Output: $output");
        }
        return $json;
    }

    echo "[TEST A] Verificando Licença NOVA (Ativada Agora) via API REAL...\n";
    $result = callApiReal($KEY_NEW);
    $seen = array_column($result['notifications'] ?? [], 'id');

    if (in_array('notif_ancient', $seen))
        die("❌ FALHA API: Licença nova viu mensagem ancestral.\n");
    if (in_array('notif_yesterday', $seen))
        die("❌ FALHA API: Licença nova viu mensagem de ontem.\n");
    if (in_array('notif_expired', $seen))
        die("❌ FALHA API: Licença viu mensagem expirada.\n");
    if (!in_array('notif_today', $seen))
        die("❌ FALHA API: Licença nova NÃO viu mensagem de hoje.\n");
    echo "✅ SUCESSO: Licença nova OK.\n";

    echo "[TEST B] Verificando Licença ANTIGA (Ativada 2019) via API REAL...\n";
    $result = callApiReal($KEY_OLD);
    $seen = array_column($result['notifications'] ?? [], 'id');

    if (!in_array('notif_ancient', $seen))
        die("❌ FALHA API: Licença antiga deveria ver mensagem ancestral.\n");
    if (!in_array('notif_yesterday', $seen))
        die("❌ FALHA API: Licença antiga deveria ver mensagem de ontem.\n");
    if (in_array('notif_expired', $seen))
        die("❌ FALHA API: Licença viu mensagem expirada.\n");
    echo "✅ SUCESSO: Licença antiga OK.\n";

} catch (Exception $e) {
    echo "🚨 ERRO CRÍTICO: " . $e->getMessage() . "\n";
} finally {
    // RESTORE ALWAYS
    if (file_exists($DB_BAK)) {
        copy($DB_BAK, $DB_FILE);
        unlink($DB_BAK);
        echo "[RESTORE] Database original restaurado.\n";
    }
    if (file_exists($NOTIF_BAK)) {
        copy($NOTIF_BAK, $NOTIF_FILE);
        unlink($NOTIF_BAK);
        echo "[RESTORE] Notifications original restaurado.\n";
    }
}
