<?php
// Configuration de la base de données
return [
    'db' => [
        'host' => 'localhost',
        'dbname' => 'mycinen620',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    ],
    'jwt' => [
        'secret' => 'MyCine_JWT_Super_Secret_Key_2026_TM_Security_32Bytes!',
        'algorithm' => 'HS256',
        'expiration' => 3600, // 1 heure en secondes
        'issuer' => 'mycine_app'
    ]
];