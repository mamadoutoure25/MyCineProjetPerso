<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

class JwtHandler {
    private string $secret;
    private string $algorithm;
    private int $expiration;
    private string $issuer;

    public function __construct(array $jwtConfig) {
        $this->secret = $jwtConfig['secret'] ?? 'MyCine_JWT_Super_Secret_Key_2026_TM_Security_32Bytes!';
        $this->algorithm = $jwtConfig['algorithm'] ?? 'HS256';
        $this->expiration = $jwtConfig['expiration'] ?? 3600;
        $this->issuer = $jwtConfig['issuer'] ?? 'mycine_app';
    }

    /**
     * Génère un token JWT signé avec les informations de l'utilisateur
     */
    public function generateToken(array $userData): string {
        $issuedAt = time();
        $expireAt = $issuedAt + $this->expiration;

        $payload = [
            'iss' => $this->issuer,
            'iat' => $issuedAt,
            'nbf' => $issuedAt,
            'exp' => $expireAt,
            'data' => [
                'id' => $userData['id'],
                'pseudo' => $userData['pseudo'],
                'role' => $userData['role'] ?? 'user'
            ]
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    /**
     * Valide et décode un token JWT
     */
    public function decodeToken(string $token): ?object {
        try {
            return JWT::decode($token, new Key($this->secret, $this->algorithm));
        } catch (ExpiredException $e) {
            error_log('JwtHandler: Token expiré: ' . $e->getMessage());
            return null;
        } catch (SignatureInvalidException $e) {
            error_log('JwtHandler: Signature JWT invalide: ' . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            error_log('JwtHandler: Token JWT invalide: ' . $e->getMessage());
            return null;
        }
    }
}
