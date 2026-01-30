<?php
/**
 * API Upload - PlenaGastro Pro
 * Permite que a Gestão envie o cardapio.json para o servidor.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$targetFile = __DIR__ . '/cardapio.json';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método inválido.');
    }

    // Recebe o JSON cru do corpo da requisição
    $json = file_get_contents('php://input');

    // Valida se é um JSON válido
    $data = json_decode($json);
    if ($data === null) {
        throw new Exception('JSON inválido.');
    }

    // Salva o arquivo (sobrescreve o existente)
    if (file_put_contents($targetFile, json_encode($data, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'message' => 'Cardápio atualizado com sucesso!']);
    } else {
        throw new Exception('Falha ao salvar o arquivo no servidor.');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
