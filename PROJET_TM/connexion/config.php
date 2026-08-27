<?php
// Configuration centralisée de la base de données et du JWT
$customConfigFile = __DIR__ . '/config.local.php';
$customConfig = file_exists($customConfigFile) ? require $customConfigFile : [];

// Détection de l'environnement local (WAMP/localhost) vs hébergement distant
$serverHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
$isLocal = (strpos($serverHost, 'localhost') !== false || strpos($serverHost, '127.0.0.1') !== false || php_sapi_name() === 'cli');

$defaultHost = $isLocal ? 'localhost' : 'mycinen620.mysql.db';
$defaultUser = $isLocal ? 'root' : 'mycinen620';
$defaultPass = $isLocal ? '' : 'j6phlphi1UdROheq';

return [
    'db' => [
        'host'     => getenv('DB_HOST') ?: ($customConfig['db']['host'] ?? $defaultHost),
        'dbname'   => getenv('DB_NAME') ?: ($customConfig['db']['dbname'] ?? 'mycinen620'),
        'username' => getenv('DB_USER') ?: ($customConfig['db']['username'] ?? $defaultUser),
        'password' => getenv('DB_PASS') ?: (isset($customConfig['db']['password']) ? $customConfig['db']['password'] : $defaultPass),
        'charset'  => 'utf8mb4',
        'options'  => [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    ],
    'jwt' => [
        'secret'     => getenv('JWT_SECRET') ?: ($customConfig['jwt']['secret'] ?? 'MyCine_JWT_Super_Secret_Key_2026_TM_Security_32Bytes!'),
        'algorithm'  => 'HS256',
        'expiration' => 3600, // 1 heure en secondes
        'issuer'     => 'mycine_app'
    ]
];