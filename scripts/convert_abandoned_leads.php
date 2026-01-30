<?php
/**
 * Script para Converter Leads de Abandono para CRM
 * Uso: php scripts/convert_abandoned_leads.php
 */

$abandonFile = __DIR__ . '/../leads_abandono.json';
$crmFile = __DIR__ . '/../leads_crm.json';

if (!file_exists($abandonFile)) {
    die("Arquivo de abandono não encontrado.\n");
}

$abandonoData = json_decode(file_get_contents($abandonFile), true);
$crmData = file_exists($crmFile) ? json_decode(file_get_contents($crmFile), true) : [];

if (empty($abandonoData)) {
    die("Nenhum lead de abandono encontrado.\n");
}

$count = 0;
foreach ($abandonoData as $email => $leadInfo) {
    // Check if exists in CRM
    $exists = false;
    foreach ($crmData as $crmLead) {
        if (isset($crmLead['email']) && $crmLead['email'] === $email) {
            $exists = true;
            break;
        }
    }

    if (!$exists) {
        $newLead = [
            'id' => uniqid('lead_auto_'),
            'name' => $leadInfo['name'] ?? 'Cliente (Checkout)',
            'email' => $email,
            'phone' => $leadInfo['phone'] ?? '',
            'source' => 'Checkout (Abandono)',
            'status' => 'Novo',
            'notes' => 'Convertido automaticamente de abandono de carrinho em ' . date('d/m/Y'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        array_unshift($crmData, $newLead);
        $count++;
    }
}

if ($count > 0) {
    file_put_contents($crmFile, json_encode($crmData, JSON_PRETTY_PRINT));
    echo "Sucesso: $count leads convertidos para o CRM.\n";
} else {
    echo "Nenhum novo lead para converter.\n";
}
?>