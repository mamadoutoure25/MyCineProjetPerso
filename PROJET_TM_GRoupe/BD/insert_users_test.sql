-- ========================================
-- SCRIPT D'INSERTION D'UTILISATEURS DE TEST
-- ========================================

USE cineverse_bd;

-- Insérer des utilisateurs de test
-- Mot de passe hashé pour "password123" avec bcrypt
INSERT INTO Utilisateurs (pseudo, email, mot_de_passe, role) VALUES
('admin', 'admin@mycine.com', '$2y$10$YjJkZjAxNDk1ZDk5ZjAxZjNjMzk0YTU5OTAzYWFjMzU4MWU2Y2FmZQ==', 'admin'),
('user123', 'user@mycine.com', '$2y$10$YjJkZjAxNDk1ZDk5ZjAxZjNjMzk0YTU5OTAzYWFjMzU4MWU2Y2FmZQ==', 'user'),
('test', 'test@mycine.com', '$2y$10$YjJkZjAxNDk1ZDk5ZjAxZjNjMzk0YTU5OTAzYWFjMzU4MWU2Y2FmZQ==', 'user');

-- Vérifier que les utilisateurs ont été insérés
SELECT id, pseudo, role FROM Utilisateurs;

