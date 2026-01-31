<?php
// API Simulada para Plena Delivery
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Simular latência
sleep(1);

// Verificar token de autenticação (simplificado)
function verifyToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        return $token === 'plena_token_secreto_2024';
    }
    return false;
}

// Ação solicitada
$action = $_GET['action'] ?? '';

// Resposta padrão
$response = [
    'success' => false,
    'message' => 'Ação não reconhecida',
    'timestamp' => date('Y-m-d H:i:s')
];

switch ($action) {
    case 'test':
        $response = [
            'success' => true,
            'message' => 'API funcionando normalmente',
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ];
        break;
        
    case 'poll':
        // Verificar autenticação para modo Pro
        if (!verifyToken()) {
            $response['message'] = 'Token inválido';
            break;
        }
        
        // Simular novos pedidos (em produção, viria do banco de dados)
        $newOrders = [];
        $hasNewOrders = rand(0, 1); // 50% chance de ter novos pedidos
        
        if ($hasNewOrders) {
            $orderCount = rand(1, 3);
            for ($i = 0; $i < $orderCount; $i++) {
                $orderId = 'ON' . date('ymd') . rand(1000, 9999);
                $newOrders[] = [
                    'id' => $orderId,
                    'customer' => [
                        'name' => ['João Silva', 'Maria Santos', 'Pedro Costa'][rand(0, 2)],
                        'phone' => '(11) 9' . rand(1000, 9999) . '-' . rand(1000, 9999),
                        'payment' => ['Dinheiro', 'Cartão', 'PIX'][rand(0, 2)]
                    ],
                    'items' => [
                        [
                            'qty' => rand(1, 3),
                            'name' => 'X-Burger Completo',
                            'price' => 32.90,
                            'total' => 32.90 * rand(1, 3),
                            'addons' => [
                                ['name' => 'Bacon', 'price' => 3.00],
                                ['name' => 'Queijo Extra', 'price' => 2.50]
                            ]
                        ]
                    ],
                    'total' => rand(3000, 8000) / 100,
                    'notes' => rand(0, 1) ? 'Sem cebola por favor' : '',
                    'createdAt' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        $response = [
            'success' => true,
            'orders' => $newOrders,
            'count' => count($newOrders),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        break;
        
    case 'update_status':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!verifyToken()) {
            $response['message'] = 'Token inválido';
            break;
        }
        
        if (!isset($data['id']) || !isset($data['status'])) {
            $response['message'] = 'Dados incompletos';
            break;
        }
        
        // Em produção, atualizaria no banco de dados
        // Por enquanto, apenas simulamos sucesso
        
        $response = [
            'success' => true,
            'message' => 'Status atualizado com sucesso',
            'orderId' => $data['id'],
            'newStatus' => $data['status'],
            'updatedAt' => date('Y-m-d H:i:s')
        ];
        break;
        
    case 'bulk_sync':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!verifyToken()) {
            $response['message'] = 'Token inválido';
            break;
        }
        
        // Simular processamento em lote
        $processed = [];
        if (isset($data['orders']) && is_array($data['orders'])) {
            foreach ($data['orders'] as $order) {
                $processed[] = [
                    'id' => $order['id'] ?? 'unknown',
                    'success' => true,
                    'syncedAt' => date('Y-m-d H:i:s')
                ];
            }
        }
        
        $response = [
            'success' => true,
            'message' => 'Sincronização em lote concluída',
            'processed' => $processed,
            'total' => count($processed),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        break;
        
    default:
        $response['message'] = 'Ação não suportada';
        break;
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>