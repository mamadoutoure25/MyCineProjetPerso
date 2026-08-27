<?php
// Configuration centralisée de la base de données et du JWT
$customConfigFile = __DIR__ . '/config.local.php';
$customConfig = file_exists($customConfigFile) ? require $customConfigFile : [];

return [
    'db' => [
        'host'     => getenv('DB_HOST') ?: ($customConfig['db']['host'] ?? 'mycinen620.mysql.db'),
        'dbname'   => getenv('DB_NAME') ?: ($customConfig['db']['dbname'] ?? 'mycinen620'),
        'username' => getenv('DB_USER') ?: ($customConfig['db']['username'] ?? 'mycinen620'),
        'password' => getenv('DB_PASS') ?: ($customConfig['db']['password'] ?? 'j6phlphi1UdROheq'),
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