<?php
/**
 * Plena Nexus CRM API
 * Gerencia Leads e Clientes via JSON flat-file.
 * Segurança: Validação básica, sem autenticação complexa por ser ferramenta interna controlada via acesso pasta.
 */

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$dataFile = 'leads_crm.json';

// Ensure file exists
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

// Handle Request
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit(0);
}

// Load Data
$jsonData = file_get_contents($dataFile);
$leads = json_decode($jsonData, true) ?: [];

if ($method === 'GET') {
    // List all
    echo json_encode(['success' => true, 'data' => $leads]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Create or Update
    if ($action === 'save') {
        if (empty($input['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nome obrigatório']);
            exit;
        }

        $id = $input['id'] ?? uniqid('lead_');
        $isNew = true;

        // Check if updating
        foreach ($leads as &$lead) {
            if (isset($lead['id']) && $lead['id'] === $id) {
                $lead = array_merge($lead, $input); // Merge updates
                $lead['updated_at'] = date('Y-m-d H:i:s');
                $isNew = false;
                break;
            }
        }

        if ($isNew) {
            $newLead = [
                'id' => $id,
                'name' => $input['name'],
                'email' => $input['email'] ?? '',
                'phone' => $input['phone'] ?? '',
                'source' => $input['source'] ?? 'Manual',
                'status' => $input['status'] ?? 'Novo',
                'notes' => $input['notes'] ?? '',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            array_unshift($leads, $newLead); // Add to top
        }

        file_put_contents($dataFile, json_encode($leads, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Lead salvo com sucesso', 'lead' => $isNew ? $newLead : $input]);
        exit;
    }
}

if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
    $id = $_GET['id'] ?? null;
    if (!$id && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }

    if ($id) {
        $leads = array_filter($leads, function ($l) use ($id) {
            return $l['id'] !== $id;
        });

        // Re-index array
        $leads = array_values($leads);

        file_put_contents($dataFile, json_encode($leads, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Lead removido']);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Ação inválida']);
?>