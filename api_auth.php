<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

session_start();

// Carrega segredos
require_once 'secrets.php';

// Garante que existe a senha mestra
if (!isset($ADMIN_SECRET) || empty($ADMIN_SECRET)) {
    $ADMIN_SECRET = 'PLENA_MASTER_KEY_2026';
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

// 1. LOGIN
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pass = $input['password'] ?? '';
    
    if ($pass === $ADMIN_SECRET) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_ip'] = $_SERVER['REMOTE_ADDR'];
        echo json_encode(['auth' => true, 'token' => session_id()]);
    } else {
        http_response_code(401);
        echo json_encode(['auth' => false, 'error' => 'Senha incorreta']);
    }
    exit;
}

// 2. CHECK SESSION (Para persistência ao recarregar)
if ($action === 'check') {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        echo json_encode(['auth' => true]);
    } else {
        echo json_encode(['auth' => false]);
    }
    exit;
}

// 3. LOGOUT
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['auth' => false]);
    exit;
}
?>
