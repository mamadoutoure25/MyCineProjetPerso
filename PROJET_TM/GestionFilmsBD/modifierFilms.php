<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

require_once __DIR__ . '/../connexion/auth_guard.php';
$user = require_auth('admin');

// Désactiver l'affichage des erreurs et activer le journal
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/errors.log');

$config = require __DIR__ . '/../connexion/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['db']['host']};dbname={$config['db']['dbname']};charset={$config['db']['charset']}",
        $config['db']['username'],
        $config['db']['password'],
        $config['db']['options']
    );

    // Gestion des requêtes GET (récupérer les données d'un film)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $film_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$film_id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de film invalide']);
            exit;
        }

        // Récupérer les informations du film
        $stmt = $pdo->prepare("SELECT * FROM Films WHERE id = ?");
        $stmt->execute([$film_id]);
        $film = $stmt->fetch();

        if (!$film) {
            http_response_code(404);
            echo json_encode(['error' => 'Film non trouvé']);
            exit;
        }

        // Récupérer les genres du film
        $stmt = $pdo->prepare("
            SELECT g.tmdb_id, g.nom 
            FROM Films_Genres fg
            JOIN Genres g ON fg.genre_id = g.id
            WHERE fg.film_id = ?
        ");
        $stmt->execute([$film_id]);
        $genres = $stmt->fetchAll();

        // Récupérer les acteurs du film
        $stmt = $pdo->prepare("
            SELECT a.tmdb_id, a.nom 
            FROM Films_Acteurs fa
            JOIN Acteurs a ON fa.acteur_id = a.id
            WHERE fa.film_id = ?
        ");
        $stmt->execute([$film_id]);
        $acteurs = $stmt->fetchAll();

        $film['genres'] = $genres;
        $film['acteurs'] = $acteurs;

        echo json_encode($film);
        exit;
    }

    // Gestion des requêtes POST (modifier un film)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $film_id = filter_input(INPUT_POST, 'film_id', FILTER_VALIDATE_INT);
        if (!$film_id) {
            http_response_code(400);
            echo json_encode(['errors' => ['ID de film invalide']]);
            exit;
        }

        // Validation des champs obligatoires
        $errors = [];
        if (empty($_POST['tmdb_id']) || !filter_var($_POST['tmdb_id'], FILTER_VALIDATE_INT)) {
            $errors[] = "L'ID TMDB est obligatoire et doit être un nombre.";
        }
        if (empty($_POST['titre'])) {
            $errors[] = "Le titre est obligatoire.";
        }

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['errors' => $errors]);
            exit;
        }

        // Préparer les données à mettre à jour
        $data = [
            'tmdb_id' => $_POST['tmdb_id'],
            'titre' => $_POST['titre'],
            'titre_original' => $_POST['titre_original'] ?? null,
            'description' => $_POST['description'] ?? null,
            'synopsis' => $_POST['synopsis'] ?? null,
            'date_sortie' => $_POST['date_sortie'] ?: null,
            'duree' => !empty($_POST['duree']) ? (int)$_POST['duree'] : null,
            'annee' => !empty($_POST['annee']) ? (int)$_POST['annee'] : null,
            'poster_path' => $_POST['poster_path'] ?? null,
            'backdrop_path' => $_POST['backdrop_path'] ?? null,
            'note_moyenne' => !empty($_POST['note_moyenne']) ? (float)$_POST['note_moyenne'] : null,
            'realisateur' => $_POST['realisateur'] ?? null,
            'tagline' => $_POST['tagline'] ?? null,
            'status' => $_POST['status'] ?? 'Released',
            'langue_originale' => $_POST['langue_originale'] ?? null,
            'popularite' => !empty($_POST['popularite']) ? (float)$_POST['popularite'] : null,
            'homepage' => $_POST['homepage'] ?? null,
            'imdb_id' => $_POST['imdb_id'] ?? null,
            'trailer_url' => $_POST['trailer_url'] ?? null,
            'video' => isset($_POST['video']) ? (int)$_POST['video'] : 0,
            'film_id' => $film_id
        ];

        // Mettre à jour le film dans la table Films
        $sql = "
            UPDATE Films 
            SET tmdb_id = :tmdb_id, titre = :titre, titre_original = :titre_original, 
                description = :description, synopsis = :synopsis, date_sortie = :date_sortie, 
                duree = :duree, annee = :annee, poster_path = :poster_path, 
                backdrop_path = :backdrop_path, note_moyenne = :note_moyenne, 
                realisateur = :realisateur, tagline = :tagline, status = :status, 
                langue_originale = :langue_originale, popularite = :popularite, 
                homepage = :homepage, imdb_id = :imdb_id, trailer_url = :trailer_url, 
                video = :video
            WHERE id = :film_id
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);

        // Mettre à jour les genres
        if (isset($_POST['genres']) && is_array($_POST['genres'])) {
            // Supprimer les anciens genres
            $stmt = $pdo->prepare("DELETE FROM Films_Genres WHERE film_id = ?");
            $stmt->execute([$film_id]);

            // Ajouter les nouveaux genres
            $stmt = $pdo->prepare("
                INSERT INTO Films_Genres (film_id, genre_id) 
                SELECT ?, id FROM Genres WHERE tmdb_id = ?
            ");
            foreach ($_POST['genres'] as $genre_id) {
                $stmt->execute([$film_id, $genre_id]);
            }
        }

        // Mettre à jour les acteurs
        if (isset($_POST['acteurs']) && is_array($_POST['acteurs'])) {
            // Supprimer les anciens acteurs
            $stmt = $pdo->prepare("DELETE FROM Films_Acteurs WHERE film_id = ?");
            $stmt->execute([$film_id]);

            // Ajouter les nouveaux acteurs
            $stmt = $pdo->prepare("
                INSERT INTO Films_Acteurs (film_id, acteur_id) 
                SELECT ?, id FROM Acteurs WHERE tmdb_id = ?
            ");
            foreach ($_POST['acteurs'] as $acteur_id) {
                $stmt->execute([$film_id, $acteur_id]);
            }
        }

        echo json_encode(['success' => 'Film modifié avec succès']);
    }
} catch (Exception $e) {
    error_log("Erreur dans modifierFilms.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur interne']);
}
?>