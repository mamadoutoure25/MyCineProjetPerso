-- Supprimer la base de données existante (attention : cela efface toutes les données)
DROP DATABASE IF EXISTS mycinen620;
CREATE DATABASE mycinen620;
USE mycinen620;
-- Table Utilisateurs
CREATE TABLE Utilisateurs (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              pseudo VARCHAR(200) NOT NULL UNIQUE,
                              email VARCHAR(200) NOT NULL UNIQUE,
                              mot_de_passe VARCHAR(200) NOT NULL,
                              token VARCHAR(255) UNIQUE,
                              role ENUM('user', 'admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Films
CREATE TABLE Films (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       tmdb_id INT NOT NULL UNIQUE,
                       titre VARCHAR(200) NOT NULL,
                       titre_original VARCHAR(200),
                       description TEXT,
                       synopsis TEXT,
                       date_sortie DATE,
                       duree INT,
                       poster_path VARCHAR(200),
                       backdrop_path VARCHAR(200),
                       note_moyenne FLOAT,
                       realisateur VARCHAR(200),
                       annee INT,
                       tagline VARCHAR(200),
                       status VARCHAR(50),
                       langue_originale VARCHAR(10),
                       popularite FLOAT,
                       video TINYINT(1) DEFAULT 0,
                       homepage VARCHAR(200),
                       imdb_id VARCHAR(20),
                       trailer_url VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Genres
CREATE TABLE Genres (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        tmdb_id INT NOT NULL UNIQUE,
                        nom VARCHAR(50) NOT NULL,
                        INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Films_Genres
CREATE TABLE Films_Genres (
                              film_id INT NOT NULL,
                              genre_id INT NOT NULL,
                              PRIMARY KEY (film_id, genre_id),
                              FOREIGN KEY (film_id) REFERENCES Films(id) ON DELETE CASCADE,
                              FOREIGN KEY (genre_id) REFERENCES Genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Acteurs
CREATE TABLE Acteurs (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         tmdb_id INT NOT NULL UNIQUE,
                         nom VARCHAR(100) NOT NULL,
                         INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Films_Acteurs
CREATE TABLE Films_Acteurs (
                               film_id INT NOT NULL,
                               acteur_id INT NOT NULL,
                               PRIMARY KEY (film_id, acteur_id),
                               FOREIGN KEY (film_id) REFERENCES Films(id) ON DELETE CASCADE,
                               FOREIGN KEY (acteur_id) REFERENCES Acteurs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE favorites (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           user_id INT NOT NULL,
                           tmdb_id INT NOT NULL,
                           UNIQUE (user_id, tmdb_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE watchlist (
                           id INT AUTO_INCREMENT PRIMARY KEY,
                           user_id INT NOT NULL,
                           tmdb_id INT NOT NULL,
                           UNIQUE (user_id, tmdb_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE watched (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         user_id INT NOT NULL,
                         tmdb_id INT NOT NULL,
                         UNIQUE (user_id, tmdb_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE favorite_actors (
                                 id INT AUTO_INCREMENT PRIMARY KEY,
                                 user_id INT NOT NULL,
                                 acteur_id INT NOT NULL,
                                 UNIQUE (user_id, acteur_id),
                                 FOREIGN KEY (user_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
                                 FOREIGN KEY (acteur_id) REFERENCES Acteurs(id) ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Table Notes
CREATE TABLE Notes (
                       utilisateur_id INT NOT NULL,
                       film_id INT NOT NULL,
                       note INT NOT NULL CHECK (note >= 1 AND note <= 10),
                       date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       PRIMARY KEY (utilisateur_id, film_id),
                       FOREIGN KEY (utilisateur_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
                       FOREIGN KEY (film_id) REFERENCES Films(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Commentaires
CREATE TABLE Commentaires (
                              id INT AUTO_INCREMENT PRIMARY KEY,
                              utilisateur_id INT NOT NULL,
                              film_id INT NOT NULL,
                              contenu TEXT NOT NULL,
                              date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
                              date_modification DATETIME ON UPDATE CURRENT_TIMESTAMP,
                              is_approved BOOLEAN DEFAULT TRUE,
                              FOREIGN KEY (utilisateur_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
                              FOREIGN KEY (film_id) REFERENCES Films(id) ON DELETE CASCADE,
                              INDEX idx_film (film_id),
                              INDEX idx_utilisateur (utilisateur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Votes_Commentaires
CREATE TABLE Votes_Commentaires (
                                    utilisateur_id INT NOT NULL,
                                    commentaire_id INT NOT NULL,
                                    is_upvote BOOLEAN,
                                    date_vote DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    PRIMARY KEY (utilisateur_id, commentaire_id),
                                    FOREIGN KEY (utilisateur_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
                                    FOREIGN KEY (commentaire_id) REFERENCES Commentaires(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table Historique_Activite
CREATE TABLE Historique_Activite (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     utilisateur_id INT NOT NULL,
                                     type_activite ENUM('login', 'logout', 'film_view', 'film_rate', 'comment', 'favori_add', 'watchlist_add', 'vu_add') NOT NULL,
                                     film_id INT,
                                     commentaire_id INT,
                                     details TEXT,
                                     date_activite DATETIME DEFAULT CURRENT_TIMESTAMP,
                                     FOREIGN KEY (utilisateur_id) REFERENCES Utilisateurs(id) ON DELETE CASCADE,
                                     FOREIGN KEY (film_id) REFERENCES Films(id) ON DELETE SET NULL,
                                     FOREIGN KEY (commentaire_id) REFERENCES Commentaires(id) ON DELETE SET NULL,
                                     INDEX idx_utilisateur_date (utilisateur_id, date_activite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertion des genres TMDB
INSERT INTO Genres (tmdb_id, nom) VALUES
                                      (28, 'Action'),
                                      (12, 'Aventure'),
                                      (16, 'Animation'),
                                      (35, 'Comédie'),
                                      (80, 'Crime'),
                                      (99, 'Documentaire'),
                                      (18, 'Drame'),
                                      (10751, 'Familial'),
                                      (14, 'Fantastique'),
                                      (36, 'Histoire'),
                                      (27, 'Horreur'),
                                      (10402, 'Musique'),
                                      (9648, 'Mystère'),
                                      (10749, 'Romance'),
                                      (878, 'Science-Fiction'),
                                      (10770, 'Téléfilm'),
                                      (53, 'Thriller'),
                                      (10752, 'Guerre'),
                                      (37, 'Western');

-- Insertion d'un admin par défaut
-- Mot de passe: "admin123" (hashé avec bcrypt)
INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, token, role)
VALUES (
           'admin',
           'admin@mycine.com',
           '$2y$10$SaME0/gzWOCrqaoUsPjze.KTYowT.Vg7bHtfyiuvUW2wjf3i49bye',
           NULL,
           'admin'
       );

-- Insertion d'un utilisateur par défaut
-- Mot de passe: "user123" (hashé avec bcrypt)
INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, token, role)
VALUES (
           'user1',
           'user1@mycine.com',
           '$2y$10$4X8z7eK2Qz3tY5mW9vP8.uW6l7sK8jN9pM2rT5xQ0yR3zV6wX7yK2',
           NULL,
           'user'
       );

-- Insérer un film
INSERT INTO Films (tmdb_id, titre, titre_original, description, synopsis, date_sortie, duree, poster_path, backdrop_path, note_moyenne, realisateur, annee, tagline, status, langue_originale, popularite, video, homepage, imdb_id, trailer_url)
VALUES (
           550,
           'Fight Club',
           'Fight Club',
           'Un employé de bureau insomniaque et un vendeur de savon charismatique forment un club de combat clandestin qui évolue en quelque chose de beaucoup plus grand.',
           'Un employé de bureau insomniaque et un vendeur de savon charismatique forment un club de combat clandestin qui évolue en quelque chose de beaucoup plus grand.',
           '1999-10-15',
           139,
           'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
           'https://image.tmdb.org/t/p/w1280/6yoghtyTpznpBAs6jgcWDfn6TO.jpg',
           8.4,
           'David Fincher',
           1999,
           'La première règle du Fight Club est : on ne parle pas du Fight Club.',
           'Released',
           'en',
           100.0,
           0,
           'https://www.fightclub.com',
           'tt0137523',
           'https://www.youtube.com/watch?v=SUXWAEX2jlg'
       );

-- Insérer des genres pour le film
INSERT INTO Films_Genres (film_id, genre_id)
SELECT (SELECT id FROM Films WHERE tmdb_id = 550), id FROM Genres WHERE tmdb_id IN (18, 53);

-- Insérer des acteurs
INSERT INTO Acteurs (tmdb_id, nom)
VALUES
    (287, 'Brad Pitt'),
    (1283, 'Edward Norton');

-- Associer les acteurs au film
INSERT INTO Films_Acteurs (film_id, acteur_id)
SELECT (SELECT id FROM Films WHERE tmdb_id = 550), id FROM Acteurs WHERE tmdb_id IN (287, 1283);