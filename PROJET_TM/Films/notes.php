<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Configuration de la base de données
$host = 'localhost';
$dbname = 'mycinen620';
$username = 'root';
$password = '';

/*$host = 'localhost';
$dbname = 'mycinen620';
$username = 'root';
$password = '';*/

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données']);
    exit;
}

// Validation des entrées
function validerEntrees(array $data, array $clesRequises) {
    foreach ($clesRequises as $cle) {
        if (!isset($data[$cle]) || $data[$cle] === '' || $data[$cle] === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Champ '$cle' requis"]);
            exit;
        }
    }
}

function normaliserIdPositif($valeur) {
    $id = filter_var($valeur, FILTER_VALIDATE_INT);
    return ($id !== false && $id > 0) ? $id : false;
}

function resoudreFilmInterne(PDO $db, int $filmIdOuTmdb) {
    $stmt = $db->prepare('SELECT id, tmdb_id FROM Films WHERE tmdb_id = ? LIMIT 1');
    $stmt->execute([$filmIdOuTmdb]);
    $film = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($film) {
        return ['id' => (int)$film['id'], 'tmdb_id' => (int)$film['tmdb_id']];
    }

    $stmt = $db->prepare('SELECT id, tmdb_id FROM Films WHERE id = ? LIMIT 1');
    $stmt->execute([$filmIdOuTmdb]);
    $film = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($film) {
        return ['id' => (int)$film['id'], 'tmdb_id' => (int)$film['tmdb_id']];
    }

    return null;
}

function creerFilmPlaceholderSiAbsent(PDO $db, int $tmdbId) {
    $film = resoudreFilmInterne($db, $tmdbId);
    if ($film) {
        return $film;
    }

    try {
        // Cree un film minimal pour permettre la note locale immediatement.
        $stmt = $db->prepare('INSERT INTO Films (tmdb_id, titre, note_moyenne) VALUES (?, ?, ?)');
        $stmt->execute([$tmdbId, 'Film #' . $tmdbId, 0]);
    } catch (PDOException $e) {
        // Fallback si la colonne note_moyenne n'existe pas sur ce schema.
        try {
            $stmt = $db->prepare('INSERT INTO Films (tmdb_id, titre) VALUES (?, ?)');
            $stmt->execute([$tmdbId, 'Film #' . $tmdbId]);
        } catch (PDOException $ignored) {
            // Ignore les doublons potentiels en concurrence, puis relit le film.
        }
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
        // La note utilisateur est deja enregistree; ne pas bloquer pour la moyenne.
        error_log('notes.php: echec recalcul moyenne: ' . $e->getMessage());
    }
}

function journaliserActivite(PDO $db, $userId, $filmInterneId, $details) {
    try {
        $stmt = $db->prepare('INSERT INTO Historique_Activite (utilisateur_id, type_activite, film_id, details) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, 'film_rate', $filmInterneId, $details]);
    } catch (Exception $e) {
        // Ne bloque pas la note si le journal d'activite echoue.
        error_log('notes.php: echec journalisation activite: ' . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: [];

$user_id = $input['user_id'] ?? ($_GET['user_id'] ?? null);
$film_id = $input['film_id'] ?? ($_GET['film_id'] ?? null); // Peut etre TMDB ID
$note = $input['note'] ?? null;

try {
    if ($method === 'GET') {
        validerEntrees(['user_id' => $user_id], ['user_id']);
        $userId = normaliserIdPositif($user_id);

        if ($userId === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id invalide']);
            exit;
        }

        // GET notes.php?user_id=...&film_id=... => note d'un film
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
            $noteUtilisateur = $result ? (int)$result['note'] : 0;

            echo json_encode(['success' => true, 'note' => $noteUtilisateur, 'tmdb_id' => $film['tmdb_id']]);
            exit;
        }

        // GET notes.php?user_id=... => toutes les notes utilisateur (pour profil)
        $stmt = $db->prepare(
            'SELECT n.film_id, n.note, n.date_creation, f.tmdb_id
             FROM Notes n
             JOIN Films f ON f.id = n.film_id
             WHERE n.utilisateur_id = ?'
        );
        $stmt->execute([$userId]);
        $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'notes' => $notes]);
        exit;
    }

    if ($method === 'POST') {
        validerEntrees(['user_id' => $user_id, 'film_id' => $film_id, 'note' => $note], ['user_id', 'film_id', 'note']);

        $userId = normaliserIdPositif($user_id);
        $filmIdOuTmdb = normaliserIdPositif($film_id);
        $noteInt = filter_var($note, FILTER_VALIDATE_INT);

        if ($userId === false || $filmIdOuTmdb === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id ou film_id invalide']);
            exit;
        }

        if ($noteInt === false || $noteInt < 1 || $noteInt > 10) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Note invalide (doit etre entre 1 et 10)']);
            exit;
        }

        $film = resoudreFilmInterne($db, $filmIdOuTmdb);
        if (!$film) {
            $film = creerFilmPlaceholderSiAbsent($db, $filmIdOuTmdb);
        }
        if (!$film) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Film introuvable en base locale']);
            exit;
        }

        $stmt = $db->prepare(
            'INSERT INTO Notes (utilisateur_id, film_id, note) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE note = VALUES(note)'
        );
        $stmt->execute([$userId, $film['id'], $noteInt]);

        recalculerMoyenneFilm($db, $film['id']);

        journaliserActivite($db, $userId, $film['id'], "Note attribuee : $noteInt etoiles");

        echo json_encode(['success' => true, 'message' => 'Note locale enregistree', 'note' => $noteInt, 'tmdb_id' => $film['tmdb_id']]);
        exit;
    }

    if ($method === 'DELETE') {
        validerEntrees(['user_id' => $user_id, 'film_id' => $film_id], ['user_id', 'film_id']);

        $userId = normaliserIdPositif($user_id);
        $filmIdOuTmdb = normaliserIdPositif($film_id);

        if ($userId === false || $filmIdOuTmdb === false) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'user_id ou film_id invalide']);
            exit;
        }

        $film = resoudreFilmInterne($db, $filmIdOuTmdb);
        if (!$film) {
            echo json_encode(['success' => true, 'message' => 'Aucune note a supprimer']);
            exit;
        }

        $stmt = $db->prepare('DELETE FROM Notes WHERE utilisateur_id = ? AND film_id = ?');
        $stmt->execute([$userId, $film['id']]);

        recalculerMoyenneFilm($db, $film['id']);

        journaliserActivite($db, $userId, $film['id'], 'Note supprimee');

        echo json_encode(['success' => true, 'message' => 'Note supprimee']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode HTTP non autorisee']);
} catch (Exception $e) {
    error_log('notes.php: erreur serveur: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>