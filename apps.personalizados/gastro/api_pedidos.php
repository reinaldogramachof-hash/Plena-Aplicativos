<?php
/**
 * API Pedidos - PlenaGastro Kit
 * Backend minimalista Local-First para troca de arquivos JSON.
 * 
 * Funcionalidades:
 * - Create: Salva novo pedido em /orders/new/
 * - Poll: Lista pedidos em /orders/new/
 * - Update: Move pedido de /orders/new/ para /orders/processing/ ou /orders/history/
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Diretórios de Armazenamento
$baseDir = __DIR__ . '/server_data';
$dirs = [
    'new' => $baseDir . '/orders/new',
    'processing' => $baseDir . '/orders/processing',
    'history' => $baseDir . '/orders/history'
];

// Garantir que diretórios existem
foreach ($dirs as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // RECEBER NOVO PEDIDO DO CARDÁPIO
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST')
                throw new Exception('Método inválido');

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!$data || !isset($data['id']))
                throw new Exception('Dados inválidos');

            $filename = $dirs['new'] . '/' . $data['id'] . '.json';

            // Adicionar timestamp de recebimento se não tiver
            $data['server_received_at'] = date('c');

            if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT))) {
                echo json_encode(['success' => true, 'message' => 'Pedido recebido com sucesso', 'id' => $data['id']]);
            } else {
                throw new Exception('Falha ao salvar arquivo');
            }
            break;

        // DELIVERY CONSULTA NOVOS PEDIDOS (POLLING)
        case 'poll':
            $files = glob($dirs['new'] . '/*.json');
            $orders = [];

            foreach ($files as $file) {
                $content = file_get_contents($file);
                $orders[] = json_decode($content, true);
            }

            // Ordenar por data (mais recente primeiro)
            usort($orders, function ($a, $b) {
                return $b['id'] <=> $a['id'];
            });

            echo json_encode(['success' => true, 'count' => count($orders), 'orders' => $orders]);
            break;

        // ATUALIZAR STATUS (MOVER ARQUIVO)
        case 'update_status':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST')
                throw new Exception('Método inválido');

            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
            $newStatus = $input['status'] ?? ''; // 'processing' or 'history'

            if (!$id || !$newStatus)
                throw new Exception('ID ou Status hiante');

            // Procurar onde o arquivo está atualmente
            $currentPath = '';
            if (file_exists($dirs['new'] . '/' . $id . '.json'))
                $currentPath = $dirs['new'] . '/' . $id . '.json';
            elseif (file_exists($dirs['processing'] . '/' . $id . '.json'))
                $currentPath = $dirs['processing'] . '/' . $id . '.json';

            if (!$currentPath)
                throw new Exception('Pedido não encontrado');

            // Definir destino
            $targetDir = isset($dirs[$newStatus]) ? $dirs[$newStatus] : $dirs['history'];
            $targetPath = $targetDir . '/' . $id . '.json';

            // Ler, atualizar status no JSON, e Mover
            $orderData = json_decode(file_get_contents($currentPath), true);
            $orderData['status'] = $newStatus;
            $orderData['updated_at'] = date('c');

            // Salvar no novo local e apagar do antigo
            file_put_contents($targetPath, json_encode($orderData, JSON_PRETTY_PRINT));
            unlink($currentPath);

            echo json_encode(['success' => true, 'message' => "Pedido movido para $newStatus"]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'API PlenaGastro Online']);
            break;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
