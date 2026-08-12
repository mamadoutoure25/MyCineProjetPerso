<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

require_once __DIR__ . '/../connexion/auth_guard.php';
$user = require_auth('admin');

// Désactiver l'affichage des erreurs
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

// Configuration de la base de données
$DB_HOST = 'mycinen620.mysql.db';
$DB_NAME = 'mycinen620';
$DB_USER = 'mycinen620';
$DB_PASSWORD = 'j6phlphi1UdROheq';



try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Erreur de connexion à la base de données: " . $e->getMessage());
    echo json_encode(['errors' => ['Erreur de connexion à la base de données']]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['errors' => ['Méthode non autorisée']]);
    exit;
}

try {
    $tmdb_id = filter_var($_POST['tmdb_id'] ?? null, FILTER_VALIDATE_INT);
    $titre = trim($_POST['titre'] ?? '');
    $titre_original = trim($_POST['titre_original'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $synopsis = trim($_POST['synopsis'] ?? '');
    $date_sortie = $_POST['date_sortie'] ?? null;
    $duree = filter_var($_POST['duree'] ?? null, FILTER_VALIDATE_INT);
    $poster_path = trim($_POST['poster_path'] ?? '');
    $backdrop_path = trim($_POST['backdrop_path'] ?? '');
    $note_moyenne = filter_var($_POST['note_moyenne'] ?? null, FILTER_VALIDATE_FLOAT);
    $realisateur = trim($_POST['realisateur'] ?? '');
    $annee = filter_var($_POST['annee'] ?? null, FILTER_VALIDATE_INT);
    $tagline = trim($_POST['tagline'] ?? '');
    $status = $_POST['status'] ?? 'Released';
    $langue_originale = trim($_POST['langue_originale'] ?? '');
    $popularite = filter_var($_POST['popularite'] ?? null, FILTER_VALIDATE_FLOAT);
    $video = isset($_POST['video']) ? (int)$_POST['video'] : 0;
    $homepage = trim($_POST['homepage'] ?? '');
    $imdb_id = trim($_POST['imdb_id'] ?? '');
    $trailer_url = trim($_POST['trailer_url'] ?? '');
    $genres = $_POST['genres'] ?? [];
    $acteurs = $_POST['acteurs'] ?? [];

    $errors = [];

    if (empty($titre)) {
        $errors[] = "Le titre est obligatoire";
    }
    if (!$tmdb_id) {
        $errors[] = "L'ID TMDB est obligatoire et doit être un nombre";
    }
    if ($duree !== null && $duree < 0) {
        $errors[] = "La durée doit être positive";
    }
    if ($date_sortie && !strtotime($date_sortie)) {
        $errors[] = "Date de sortie invalide";
    }
    if ($annee !== null && ($annee < 1900 || $annee > 2100)) {
        $errors[] = "L'année doit être entre 1900 et 2100";
    }
    if ($note_moyenne !== null && ($note_moyenne < 0 || $note_moyenne > 10)) {
        $errors[] = "La note moyenne doit être entre 0 et 10";
    }
    if ($popularite !== null && $popularite < 0) {
        $errors[] = "La popularité doit être positive";
    }
    if ($langue_originale && !preg_match('/^[a-z]{2,10}$/i', $langue_originale)) {
        $errors[] = "La langue originale doit être un code valide (ex: en, fr)";
    }
    if ($imdb_id && !preg_match('/^tt\d{7,8}$/', $imdb_id)) {
        $errors[] = "L'ID IMDb est invalide (ex: tt1234567)";
    }
    if (!in_array($status, ['Rumored', 'Planned', 'In Production', 'Post Production', 'Released', 'Canceled'])) {
        $errors[] = "Statut invalide";
    }
    if ($trailer_url && !filter_var($trailer_url, FILTER_VALIDATE_URL)) {
        $errors[] = "L'URL de la bande-annonce est invalide";
    }

    if ($tmdb_id) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM Films WHERE tmdb_id = ?");
        $stmt->execute([$tmdb_id]);
        if ($stmt->fetchColumn() > 0) {
            $errors[] = "Un film avec cet ID TMDB existe déjà";
        }
    }

    if (empty($errors)) {
        // Début de la transaction
        $pdo->beginTransaction();

        // Insérer le film
        $stmt = $pdo->prepare("
            INSERT INTO Films (
                tmdb_id, titre, titre_original, description, synopsis, date_sortie, duree, 
                poster_path, backdrop_path, note_moyenne, realisateur, annee, 
                tagline, status, langue_originale, popularite, video, homepage, imdb_id, trailer_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $tmdb_id, $titre, $titre_original, $description, $synopsis, $date_sortie ?: null,
            $duree ?: null, $poster_path, $backdrop_path, $note_moyenne ?: null,
            $realisateur, $annee ?: null, $tagline, $status,
            $langue_originale, $popularite ?: null, $video, $homepage, $imdb_id, $trailer_url
        ]);

        // Récupérer l'ID du film inséré
        $film_id = $pdo->lastInsertId();

        // Insérer les genres dans Films_Genres
        if (!empty($genres)) {
            $stmt = $pdo->prepare("INSERT INTO Films_Genres (film_id, genre_id) VALUES (?, ?)");
            foreach ($genres as $genre_id) {
                $genreStmt = $pdo->prepare("SELECT id FROM Genres WHERE tmdb_id = ?");
                $genreStmt->execute([$genre_id]);
                $genre = $genreStmt->fetch();
                if ($genre) {
                    $stmt->execute([$film_id, $genre['id']]);
                }
            }
        }

        // Insérer les acteurs dans Films_Acteurs
        if (!empty($acteurs)) {
            $stmt = $pdo->prepare("INSERT INTO Films_Acteurs (film_id, acteur_id) VALUES (?, ?)");
            foreach ($acteurs as $acteur_id) {
                $acteurStmt = $pdo->prepare("SELECT id FROM Acteurs WHERE tmdb_id = ?");
                $acteurStmt->execute([$acteur_id]);
                $acteur = $acteurStmt->fetch();
                if ($acteur) {
                    $stmt->execute([$film_id, $acteur['id']]);
                }
            }
        }

        // Valider la transaction
        $pdo->commit();
        echo json_encode(['success' => 'Film ajouté avec succès !']);
    } else {
        echo json_encode(['errors' => $errors]);
    }
} catch (Exception $e) {
    // Annuler la transaction en cas d'erreur
    $pdo->rollBack();
    error_log("Erreur dans ajouterFilms.php: " . $e->getMessage());
    echo json_encode(['errors' => ['Erreur serveur interne']]);
}
?>