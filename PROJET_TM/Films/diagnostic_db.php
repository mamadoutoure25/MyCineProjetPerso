<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'mycinen620';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $results = [];

    $tables = ['favorites', 'watchlist', 'watched'];
    foreach ($tables as $table) {
        // Check columns
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $hasMediaType = false;
        foreach ($columns as $col) {
            if ($col['Field'] === 'media_type') {
                $hasMediaType = true;
                break;
            }
        }

        if (!$hasMediaType) {
            // Add media_type column
            $pdo->exec("ALTER TABLE $table ADD COLUMN media_type ENUM('movie', 'tv') DEFAULT 'movie' AFTER tmdb_id");
            // Update unique constraint
            // First drop existing unique index if it exists. TMDB_ID usually has a unique constraint with user_id.
            // In the provided SQL it was: UNIQUE (user_id, tmdb_id)
            // We need to find the name of the constraint or just drop and recreate.
            try {
                // Try to drop the old unique constraint (often named user_id or tmdb_id or just an index)
                // Since we don't know the name, we might need to find it first.
                $stmt = $pdo->query("SHOW INDEX FROM $table WHERE Non_unique = 0 AND Key_name != 'PRIMARY'");
                $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($indexes as $index) {
                    $keyName = $index['Key_name'];
                    $pdo->exec("ALTER TABLE $table DROP INDEX $keyName");
                }
            } catch (Exception $e) {
                $results[] = "Warning: Could not drop old index for $table: " . $e->getMessage();
            }
            
            // Create new unique constraint
            $pdo->exec("ALTER TABLE $table ADD UNIQUE KEY user_media_tmdb (user_id, media_type, tmdb_id)");
            $results[] = "Table $table updated with media_type column and new unique index.";
        } else {
            $results[] = "Table $table already has media_type column.";
        }
    }

    echo json_encode([
        'success' => true,
        'results' => $results
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>