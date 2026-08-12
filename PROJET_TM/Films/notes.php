<?php
/**
 * Notes utilisateur — API sécurisée
 * Fix: IDOR supprimé (user_id extrait du JWT), CORS restreint, getMessage() supprimé
 */
require_once __DIR__ . '/../connexion/auth_guard.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . cors_allowed_origin());
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Authentification JWT — user_id extrait du token (protection anti-IDOR)
$authUser = require_auth();
$userId   = (int) ($authUser['id'] ?? 0);

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non identifié']);
    exit;
}

$config = require __DIR__ . '/../connexion/config.php';
try {
    $db = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );
} catch (PDOException $e) {
    error_log('notes.php: Erreur BDD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}

function normaliserIdPositif($valeur) {
    $id = filter_var($valeur, FILTER_VALIDATE_INT);
    return ($id !== false && $id > 0) ? $id : false;
}

function resoudreFilmInterne(PDO $db, int $filmIdOuTmdb) {
    $stmt = $db->prepare('SELECT id, tmdb_id FROM Films WHERE tmdb_id = ? LIMIT 1');
    $stmt->execute([$filmIdOuTmdb]);
    $film = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($film) return ['id' => (int)$film['id'], 'tmdb_id' => (int)$film['tmdb_id']];

    $stmt = $db->prepare('SELECT id, tmdb_id FROM Films WHERE id = ? LIMIT 1');
    $stmt->execute([$filmIdOuTmdb]);
    $film = $stmt->fetch(PDO::FETCH_ASSOC);
    return $film ? ['id' => (int)$film['id'], 'tmdb_id' => (int)$film['tmdb_id']] : null;
}

function creerFilmPlaceholderSiAbsent(PDO $db, int $tmdbId) {
    $film = resoudreFilmInterne($db, $tmdbId);
    if ($film) return $film;
    try {
        $stmt = $db->prepare('INSERT INTO Films (tmdb_id, titre, note_moyenne) VALUES (?, ?, ?)');
        $stmt->execute([$tmdbId, 'Film #' . $tmdbId, 0]);
    } catch (PDOException $e) {
        try {
            $stmt = $db->prepare('INSERT INTO Films (tmdb_id, titre) VALUES (?, ?)');
            $stmt->execute([$tmdbId, 'Film #' . $tmdbId]);
        } catch (PDOException $ignored) {}
    }
    return resoudreFilmInterne($db, $tmdbId);
}

function recalculerMoyenneFilm(PDO $db, int $filmInterneId) {
    try {
        $stmt = $db->prepare('SELECT AVG(note) as moyenne FROM Notes WHERE film_id = ?');
        $stmt->execute([$filmInterneId]);
        $moyenne = $stmt->fetch(PDO::FETCH_ASSOC)['moyenne'] ?? 0;
        $stmt = $db->prepare('UPDATE Films SET note_moyenne = ? WHERE id = ?');
        $stmt->execute([$moyenne, $filmInterneId]);
    } catch (Exception $e) {
        error_log('notes.php: echec recalcul moyenne: ' . $e->getMessage());
    }
}

function journaliserActivite(PDO $db, $userId, $filmInterneId, $details) {
    try {
        $stmt = $db->prepare('INSERT INTO Historique_Activite (utilisateur_id, type_activite, film_id, details) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, 'film_rate', $filmInterneId, $details]);
    } catch (Exception $e) {
        error_log('notes.php: echec journalisation activite: ' . $e->getMessage());
    }
}

$method   = $_SERVER['REQUEST_METHOD'];
$input    = json_decode(file_get_contents('php://input'), true) ?: [];
$film_id  = $input['film_id'] ?? ($_GET['film_id'] ?? null);
$note     = $input['note'] ?? null;

try {
    if ($method === 'GET') {
        if ($film_id !== null) {
            $filmIdOuTmdb = normaliserIdPositif($film_id);
            if ($filmIdOuTmdb === false) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'film_id invalide']);
                exit;
            }
            $film = resoudreFilmInterne($db, $filmIdOuTmdb);
            if (!$film) {
                echo json_encode(['success' => true, 'note' => 0]);
                exit;
            }
            $stmt = $db->prepare('SELECT note FROM Notes WHERE utilisateur_id = ? AND film_id = ?');
            $stmt->execute([$userId, $film['id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'note' => $result ? (int)$result['note'] : 0, 'tmdb_id' => $film['tmdb_id']]);
            exit;
        }

        $stmt = $db->prepare(
            'SELECT n.film_id, n.note, n.date_creation, f.tmdb_id
             FROM Notes n
             JOIN Films f ON f.id = n.film_id
             WHERE n.utilisateur_id = ?'
        );
        $stmt->execute([$userId]);
        echo json_encode(['success' => true, 'notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    if ($method === 'POST') {
        $filmIdOuTmdb = normaliserIdPositif($film_id);
        $noteInt      = filter_var($note, FILTER_VALIDATE_INT);

        if (!$filmIdOuTmdb || $filmIdOuTmdb === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'film_id invalide']);
            exit;
        }
        if ($noteInt === false || $noteInt < 1 || $noteInt > 10) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Note invalide (doit être entre 1 et 10)']);
            exit;
        }
        $film = resoudreFilmInterne($db, $filmIdOuTmdb) ?? creerFilmPlaceholderSiAbsent($db, $filmIdOuTmdb);
        if (!$film) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Film introuvable']);
            exit;
        }
        $stmt = $db->prepare(
            'INSERT INTO Notes (utilisateur_id, film_id, note) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note)'
        );
        $stmt->execute([$userId, $film['id'], $noteInt]);
        recalculerMoyenneFilm($db, $film['id']);
        journaliserActivite($db, $userId, $film['id'], "Note attribuée : $noteInt étoiles");
        echo json_encode(['success' => true, 'message' => 'Note enregistrée', 'note' => $noteInt, 'tmdb_id' => $film['tmdb_id']]);
        exit;
    }

    if ($method === 'DELETE') {
        $filmIdOuTmdb = normaliserIdPositif($film_id);
        if (!$filmIdOuTmdb) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'film_id invalide']);
            exit;
        }
        $film = resoudreFilmInterne($db, $filmIdOuTmdb);
        if (!$film) {
            echo json_encode(['success' => true, 'message' => 'Aucune note à supprimer']);
            exit;
        }
        $stmt = $db->prepare('DELETE FROM Notes WHERE utilisateur_id = ? AND film_id = ?');
        $stmt->execute([$userId, $film['id']]);
        recalculerMoyenneFilm($db, $film['id']);
        journaliserActivite($db, $userId, $film['id'], 'Note supprimée');
        echo json_encode(['success' => true, 'message' => 'Note supprimée']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode HTTP non autorisée']);

} catch (Exception $e) {
    error_log('notes.php: erreur serveur: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}