<?php

class JWT
{
    /**
     * Génération du JWT
     * @param array $header Header du token
     * @param array $payload Payload du token
     * @param string $secret Clé secrète
     * @param int $validity Durée de validité (en secondes)
     * @return string Token
     */
    public function generate(array $header, array $payload, string $secret, int $validity = 86400): string
    {
        if ($validity > 0) {
            $now = time();
            $payload['iat'] = $now;            // Date de création
            $payload['exp'] = $now + $validity; // Expiration
        }

        // Encodage en base64url
        $base64Header = $this->base64UrlEncode(json_encode($header));
        $base64Payload = $this->base64UrlEncode(json_encode($payload));

        // Génération de la signature HMAC-SHA256
        $secretEncoded = base64_encode($secret);
        $signature = hash_hmac('sha256', "$base64Header.$base64Payload", $secretEncoded, true);
        $base64Signature = $this->base64UrlEncode($signature);

        // Assemblage du JWT
        return "$base64Header.$base64Payload.$base64Signature";
    }

    /**
     * Vérification du JWT (structure, signature et expiration)
     * @param string $token Token JWT à vérifier
     * @param string $secret Clé secrète
     * @return bool True si valide, False sinon
     */
    public function check(string $token, string $secret): bool
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$base64Header, $base64Payload, $base64Signature] = $parts;

        // Regénération de la signature pour comparaison sécurisée (timing attack safe)
        $secretEncoded = base64_encode($secret);
        $expectedSignature = hash_hmac('sha256', "$base64Header.$base64Payload", $secretEncoded, true);
        $base64ExpectedSignature = $this->base64UrlEncode($expectedSignature);

        if (!hash_equals($base64ExpectedSignature, $base64Signature)) {
            return false;
        }

        // Vérification de la date d'expiration
        $payload = $this->getPayload($token);
        if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) {
            return false;
        }

        return true;
    }

    /**
     * Récupération du payload du JWT
     * @param string $token Token JWT
     * @return array|null Payload sous forme de tableau associatif
     */
    public function getPayload(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        $jsonPayload = $this->base64UrlDecode($parts[1]);
        return json_decode($jsonPayload, true);
    }

    /**
     * Encodage Base64Url
     */
    private function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Décodage Base64Url
     */
    private function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
