<?php
// functions.php - Fichier de fonctions pour CinéScope

/**
 * Vérifie si l'utilisateur est connecté
 * @return bool
 */
/*function isLoggedIn() {
    return isset($_SESSION['user_id']);
}*/

/**
 * Vérifie si l'utilisateur est administrateur
 * @return bool
 */
/*function isAdmin() {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
}*/

/**
 * Vérifie si l'utilisateur est modérateur
 * @return bool
 */
/*function isModerator() {
    return isset($_SESSION['user_role']) && ($_SESSION['user_role'] === 'moderator' || $_SESSION['user_role'] === 'admin');
}*/

/**
 * Retourne une instance PDO connectée à la base de données
 * @return PDO
 */
function getPDO() {
    global $dsn, $user, $pass, $options;
    static $pdo = null;

    if ($pdo === null) {
        require __DIR__.'/../config/db.php';
        $pdo = new PDO($dsn, $user, $pass, $options);
    }

    return $pdo;
}

/**
 * Récupère un utilisateur par son ID
 * @param PDO $db
 * @param int $userId
 * @return array|null
 */
function getUserById($db, $userId) {
    $stmt = $db->prepare("SELECT * FROM Utilisateurs WHERE id = ?");
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

/**
 * Récupère un utilisateur par son email
 * @param PDO $db
 * @param string $email
 * @return array|null
 */
function getUserByEmail($db, $email) {
    $stmt = $db->prepare("SELECT * FROM Utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

/**
 * Affiche des messages de succès ou d'erreur
 * @param array|string $messages
 * @param string $type success|error|warning
 */
function displayMessages($messages, $type = 'success') {
    if (empty($messages)) {
        return;
    }

    if (!is_array($messages)) {
        $messages = [$messages];
    }

    $class = 'alert-success';
    if ($type === 'error') {
        $class = 'alert-danger';
    } elseif ($type === 'warning') {
        $class = 'alert-warning';
    }

    echo '<div class="alert '.$class.'"><ul>';
    foreach ($messages as $message) {
        echo '<li>'.htmlspecialchars($message).'</li>';
    }
    echo '</ul></div>';
}

/**
 * Hash un mot de passe
 * @param string $password
 * @return string
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

/**
 * Vérifie un mot de passe
 * @param string $password
 * @param string $hash
 * @return bool
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Récupère un film par son ID
 * @param PDO $db
 * @param int $filmId
 * @return array|null
 */
function getFilmById($db, $filmId) {
    $stmt = $db->prepare("
        SELECT f.*, 
               GROUP_CONCAT(g.id) AS genre_ids,
               GROUP_CONCAT(g.nom SEPARATOR ', ') AS genres
        FROM Films f
        LEFT JOIN Films_Genres fg ON f.id = fg.film_id
        LEFT JOIN Genres g ON fg.genre_id = g.id
        WHERE f.id = ?
        GROUP BY f.id
    ");
    $stmt->execute([$filmId]);
    $film = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($film && $film['genre_ids']) {
        $film['genre_ids'] = explode(',', $film['genre_ids']);
    } else {
        $film['genre_ids'] = [];
    }

    return $film ?: null;
}

/**
 * Ajoute un nouveau film
 * @param PDO $db
 * @param array $data
 * @param array|null $genreIds
 * @return int ID du film ajouté
 */
function addFilm($db, $data, $genreIds = null) {
    $db->beginTransaction();

    try {
        // Insertion du film
        $stmt = $db->prepare("
            INSERT INTO Films (titre, realisateur, annee, poster_path, description, date_sortie, duree)
            VALUES (:titre, :realisateur, :annee, :poster_path, :description, :date_sortie, :duree)
        ");

        $stmt->execute([
            ':titre' => $data['titre'],
            ':realisateur' => isset($data['realisateur']) ? $data['realisateur'] : null,
            ':annee' => isset($data['annee']) ? $data['annee'] : null,
            ':poster_path' => isset($data['poster_path']) ? $data['poster_path'] : null,
            ':description' => isset($data['description']) ? $data['description'] : null,
            ':date_sortie' => isset($data['date_sortie']) ? $data['date_sortie'] : null,
            ':duree' => isset($data['duree']) ? $data['duree'] : null
        ]);

        $filmId = $db->lastInsertId();

        // Ajout des genres associés
        if (!empty($genreIds)) {
            $stmt = $db->prepare("INSERT INTO Films_Genres (film_id, genre_id) VALUES (?, ?)");

            foreach ($genreIds as $genreId) {
                $stmt->execute([$filmId, (int)$genreId]);
            }
        }

        $db->commit();
        return $filmId;

    } catch (PDOException $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Met à jour un film existant
 * @param PDO $db
 * @param int $filmId
 * @param array $data
 * @param array|null $genreIds
 * @return bool
 */
function updateFilm($db, $filmId, $data, $genreIds = null) {
    $db->beginTransaction();

    try {
        // Mise à jour du film
        $fields = [];
        $params = [':id' => $filmId];

        $allowedFields = ['titre', 'realisateur', 'annee', 'poster_path', 'description', 'date_sortie', 'duree'];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) {
            throw new InvalidArgumentException("Aucune donnée à mettre à jour");
        }

        $sql = "UPDATE Films SET ".implode(', ', $fields)." WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Mise à jour des genres
        if ($genreIds !== null) {
            // Supprimer les anciennes associations
            $db->prepare("DELETE FROM Films_Genres WHERE film_id = ?")->execute([$filmId]);

            // Ajouter les nouvelles associations
            if (!empty($genreIds)) {
                $stmt = $db->prepare("INSERT INTO Films_Genres (film_id, genre_id) VALUES (?, ?)");

                foreach ($genreIds as $genreId) {
                    $stmt->execute([$filmId, (int)$genreId]);
                }
            }
        }

        $db->commit();
        return true;

    } catch (PDOException $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Supprime un film
 * @param PDO $db
 * @param int $filmId
 * @return bool
 */
function deleteFilm($db, $filmId) {
    $db->beginTransaction();

    try {
        // Suppression des associations de genres
        $db->prepare("DELETE FROM Films_Genres WHERE film_id = ?")->execute([$filmId]);

        // Suppression du film
        $stmt = $db->prepare("DELETE FROM Films WHERE id = ?");
        $stmt->execute([$filmId]);

        $db->commit();
        return $stmt->rowCount() > 0;

    } catch (PDOException $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Récupère tous les films
 * @param PDO $db
 * @param int $limit
 * @param int $offset
 * @return array
 */
function getAllFilms($db, $limit = 100, $offset = 0) {
    $stmt = $db->prepare("
        SELECT f.*, 
               GROUP_CONCAT(g.nom SEPARATOR ', ') AS genres
        FROM Films f
        LEFT JOIN Films_Genres fg ON f.id = fg.film_id
        LEFT JOIN Genres g ON fg.genre_id = g.id
        GROUP BY f.id
        ORDER BY f.titre
        LIMIT :limit OFFSET :offset
    ");

    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère tous les genres
 * @param PDO $db
 * @return array
 */
function getAllGenres($db) {
    return $db->query("SELECT * FROM Genres ORDER BY nom")->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère les genres d'un film
 * @param PDO $db
 * @param int $filmId
 * @return array
 */
function getFilmGenres($db, $filmId) {
    $stmt = $db->prepare("
        SELECT g.* 
        FROM Films_Genres fg
        JOIN Genres g ON fg.genre_id = g.id
        WHERE fg.film_id = ?
    ");
    $stmt->execute([$filmId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Met à jour le rôle d'un utilisateur
 * @param PDO $db
 * @param int $userId
 * @param string $role
 * @return bool
 */
function updateUserRole($db, $userId, $role) {
    $allowedRoles = ['user', 'moderator', 'admin'];

    if (!in_array($role, $allowedRoles)) {
        throw new InvalidArgumentException("Rôle invalide");
    }

    $stmt = $db->prepare("UPDATE Utilisateurs SET role = ? WHERE id = ?");
    $stmt->execute([$role, $userId]);
    return $stmt->rowCount() > 0;
}

/**
 * Récupère tous les utilisateurs
 * @param PDO $db
 * @return array
 */
function getAllUsers($db) {
    return $db->query("SELECT id, pseudo, email, role FROM Utilisateurs ORDER BY pseudo")->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Vérifie si un film existe dans la base de données
 * @param PDO $db
 * @param int $filmId
 * @return bool
 */
function filmExists($db, $filmId) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM Films WHERE id = ?");
    $stmt->execute([$filmId]);
    return $stmt->fetchColumn() > 0;
}

/**
 * Redirige vers une URL
 * @param string $url
 * @param int $statusCode
 */
function redirect($url, $statusCode = 303) {
    header('Location: ' . $url, true, $statusCode);
    exit;
}

/**
 * Génère un token CSRF
 * @return string
 */
function generateCsrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Vérifie un token CSRF
 * @param string $token
 * @return bool
 */
function verifyCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Formate une durée en minutes en heures et minutes
 * @param int $minutes
 * @return string
 */
function formatDuration($minutes) {
    if ($minutes < 60) {
        return $minutes . ' min';
    }

    $hours = floor($minutes / 60);
    $remainingMinutes = $minutes % 60;

    return $hours . 'h' . ($remainingMinutes < 10 ? '0' : '') . $remainingMinutes;
}

/**
 * Nettoie une chaîne de caractères pour l'affichage HTML
 * @param string|null $value
 * @return string
 */
function escape($value) {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Tronque un texte avec des points de suspension si nécessaire
 * @param string $text
 * @param int $length
 * @return string
 */
function truncate($text, $length = 100) {
    if (mb_strlen($text) <= $length) {
        return $text;
    }
    return mb_substr($text, 0, $length) . '...';
}

/**
 * Valide et nettoie un fichier uploadé
 * @param array $file
 * @param string $targetDir
 * @param int $maxSize
 * @param array $allowedTypes
 * @return string Chemin relatif du fichier
 */
function handleUploadedFile($file, $targetDir, $maxSize = 5242880, $allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) {
    // Vérifier les erreurs d'upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Erreur lors de l'upload du fichier: " . $file['error']);
    }

    // Vérifier la taille du fichier
    if ($file['size'] > $maxSize) {
        throw new Exception("Le fichier est trop volumineux. Taille maximale: " . formatBytes($maxSize));
    }

    // Vérifier le type MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception("Type de fichier non autorisé. Types acceptés: " . implode(', ', $allowedTypes));
    }

    // Créer le répertoire cible si nécessaire
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    // Générer un nom de fichier unique
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('upload_') . '.' . $extension;
    $targetPath = rtrim($targetDir, '/') . '/' . $filename;

    // Déplacer le fichier uploadé
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception("Impossible de déplacer le fichier uploadé");
    }

    return $filename;
}

/**
 * Formate une taille en octets en unités lisible
 * @param int $bytes
 * @param int $precision
 * @return string
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['o', 'Ko', 'Mo', 'Go', 'To'];

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1024, $pow);

    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Récupère les statistiques globales
 * @param PDO $db
 * @return array
 */
function getStats($db) {
    return [
        'films' => $db->query("SELECT COUNT(*) FROM Films")->fetchColumn(),
        'users' => $db->query("SELECT COUNT(*) FROM Utilisateurs")->fetchColumn(),
        'admins' => $db->query("SELECT COUNT(*) FROM Utilisateurs WHERE role = 'admin'")->fetchColumn(),
        'genres' => $db->query("SELECT COUNT(*) FROM Genres")->fetchColumn(),
        'recent_films' => $db->query("
            SELECT titre, date_ajout 
            FROM Films 
            ORDER BY date_ajout DESC 
            LIMIT 5
        ")->fetchAll(PDO::FETCH_ASSOC)
    ];
}