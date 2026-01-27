<?php
$file = 'database_licenses_secure.json';
$db = json_decode(file_get_contents($file), true) ?? [];
$db['VISUAL-TEST-USER'] = [
    'status' => 'active',
    'product' => 'Plena Barbearia',
    'activated_at' => date('Y-m-d H:i:s'),
    'created_at' => date('Y-m-d H:i:s'),
    'app_link' => 'apps.plus/plena_barbearia/index.html'
];
file_put_contents($file, json_encode($db, JSON_PRETTY_PRINT));
echo "License Created.";
?>