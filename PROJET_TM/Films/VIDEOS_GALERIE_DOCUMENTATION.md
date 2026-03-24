# 📹 Documentation - Sections Vidéos et Galerie

## 1. Section Lecture en Cours (Now Playing)

### Description
Affiche les films actuellement en salle avec l'API TMDB.

### Endpoint API
```
GET https://api.themoviedb.org/3/movie/now_playing
```

### Affichage
- Section avec badge "En lecture" en vert
- Visible avant et après survol
- Logo et texte en blanc
- Responsive : 2-6 colonnes selon l'écran

---

## 2. Section Vidéos

### Description
Affiche les vidéos associées à un film (trailers, clips, etc.)

### Endpoint API
```
GET https://api.themoviedb.org/3/movie/{movie_id}/videos
```

### Réponse Exemple
```json
{
  "id": 550,
  "results": [
    {
      "iso_639_1": "en",
      "iso_3166_1": "US",
      "name": "Fight Club (1999) Trailer",
      "key": "O-b2VyZmbyA",
      "site": "YouTube",
      "size": 720,
      "type": "Trailer",
      "official": false,
      "published_at": "2016-03-05T02:03:14.000Z",
      "id": "639d5326be6d88007f170f44"
    }
  ]
}
```

### HTML Exemple
```html
<section class="videos-section">
    <h3 class="gallery-title">
        <i class="ph ph-video"></i>
        Vidéos
    </h3>
    <div class="video-grid">
        <div class="video-card">
            <div class="video-thumbnail">
                <img src="https://img.youtube.com/vi/KEY/0.jpg" alt="Trailer">
                <button class="video-play-btn">
                    <i class="ph ph-play-fill"></i>
                </button>
            </div>
            <div class="video-info">
                <span class="video-type official">Official</span>
                <div class="video-title">Film Trailer</div>
                <div class="video-date">05/03/2016</div>
            </div>
        </div>
    </div>
</section>
```

### Caractéristiques
- ✅ Grille responsive (auto-fill, minmax 300px)
- ✅ Bouton play centré au survol
- ✅ Badge "Official" si vidéo officielle
- ✅ Affichage de la date
- ✅ Animation de zoom au survol

---

## 3. Section Galerie d'Images

### Description
Affiche les images de films (backdrop, poster, logos)

### Endpoint API
```
GET https://api.themoviedb.org/3/movie/{movie_id}/images
```

### Réponse Exemple
```json
{
  "id": 550,
  "backdrops": [
    {
      "aspect_ratio": 1.778,
      "height": 800,
      "file_path": "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
      "vote_average": 5.622,
      "vote_count": 20,
      "width": 1422
    }
  ],
  "posters": [...],
  "logos": [...]
}
```

### HTML Exemple avec Tabs
```html
<section class="gallery-section">
    <h3 class="gallery-title">
        <i class="ph ph-image"></i>
        Galerie
    </h3>
    
    <!-- Tabs -->
    <div class="gallery-tabs">
        <button class="gallery-tab active" data-tab="backdrops">
            <i class="ph ph-image"></i> Arrière-plans
        </button>
        <button class="gallery-tab" data-tab="posters">
            <i class="ph ph-card-photo"></i> Affiches
        </button>
        <button class="gallery-tab" data-tab="logos">
            <i class="ph ph-trademark"></i> Logos
        </button>
    </div>
    
    <!-- Grille -->
    <div class="gallery-grid" id="gallery-backdrops">
        <div class="gallery-item">
            <img src="https://image.tmdb.org/t/p/w500/hZkgoQYus5vegHoetLkCJzb17zJ.jpg" alt="">
            <div class="gallery-overlay">
                <div class="gallery-icon">
                    <i class="ph ph-magnifying-glass-plus"></i>
                </div>
            </div>
            <div class="gallery-badge">1422x800</div>
        </div>
    </div>
    
    <!-- Pagination -->
    <div class="gallery-pagination">
        <button class="pagination-btn" disabled>&lt;</button>
        <button class="pagination-btn active">1</button>
        <button class="pagination-btn">2</button>
        <button class="pagination-btn">3</button>
        <button class="pagination-btn">&gt;</button>
    </div>
</section>
```

### Caractéristiques
- ✅ Tabs pour changer les types d'images
- ✅ Grille responsive (auto-fill, minmax 250px)
- ✅ Overlay avec loupe au survol
- ✅ Badge avec dimensions
- ✅ Pagination
- ✅ Compteur d'images

---

## 4. Section "Retrouvez ce film en ligne" (Where to Watch)

### Description
Affiche les plateformes où regarder le film

### Endpoint API
```
GET https://api.themoviedb.org/3/movie/{movie_id}/watch/providers
```

### Réponse Exemple
```json
{
  "id": 550,
  "results": {
    "FR": {
      "link": "https://www.themoviedb.org/movie/550-fight-club/watch?locale=FR",
      "flatrate": [
        {
          "logo_path": "/netflix_logo.png",
          "provider_id": 8,
          "provider_name": "Netflix"
        }
      ],
      "rent": [...],
      "buy": [...]
    }
  }
}
```

### HTML Exemple
```html
<section class="streaming-providers-section">
    <h3 class="gallery-title">
        <i class="ph ph-broadcast"></i>
        Retrouvez ce film en ligne
    </h3>
    
    <div class="providers-grid">
        <div class="provider-category">
            <h4>Inclus dans votre abonnement</h4>
            <div class="providers-list">
                <div class="provider-item" title="Netflix">
                    <img src="path/to/netflix.png" alt="Netflix">
                </div>
            </div>
        </div>
        
        <div class="provider-category">
            <h4>En location</h4>
            <div class="providers-list">
                <div class="provider-item" title="Amazon Prime">
                    <img src="path/to/prime.png" alt="Amazon Prime">
                </div>
            </div>
        </div>
        
        <div class="provider-category">
            <h4>À l'achat</h4>
            <div class="providers-list">
                <div class="provider-item" title="Google Play">
                    <img src="path/to/google_play.png" alt="Google Play">
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## 5. Section Acteurs avec Limite (18 max)

### Description
Affiche les 18 premiers acteurs du film

### Endpoint API
```
GET https://api.themoviedb.org/3/movie/{movie_id}/credits
```

### HTML Exemple
```html
<section class="actors-section">
    <h3 class="gallery-title">
        <i class="ph ph-users"></i>
        Distribution
    </h3>
    
    <div class="actors-limited">
        <!-- Max 18 acteurs -->
        <div class="actor-card">
            <div class="actor-image">
                <img src="https://image.tmdb.org/t/p/w185/actor.jpg" alt="Actor Name">
            </div>
            <div class="actor-name">Brad Pitt</div>
            <div class="actor-role">Tyler Durden</div>
        </div>
        <!-- ... 17 autres acteurs ... -->
    </div>
</section>
```

---

## 6. Styles CSS Appliqués

### Thème Sombre ✅
- Texte blanc avant et après survol
- Logo en blanc avec contraste
- Badges avec dégradés
- Animations fluides

### Thème Clair ✅
- Texte sombre avant et après survol
- Logo visible avec bon contraste
- Badges adapté au thème clair
- Animations fluides

### Responsive ✅
- Mobile : 2 colonnes minimum
- Tablette : 3-4 colonnes
- Desktop : 5-6 colonnes
- Grille auto-responsive

---

## 7. Implémentation JavaScript Complète

### Charger les vidéos
```javascript
async function chargerVideos(movieId) {
    const url = `${API_BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=fr-FR`;
    const data = await fetch(url).then(r => r.json());
    afficherVideos(data.results);
}

function afficherVideos(videos) {
    const html = videos.map(video => `
        <div class="video-card">
            <div class="video-thumbnail">
                <img src="https://img.youtube.com/vi/${video.key}/0.jpg" alt="${video.name}">
                <button class="video-play-btn" onclick="ouvrirVideo('${video.key}')">
                    <i class="ph ph-play-fill"></i>
                </button>
            </div>
            <div class="video-info">
                <span class="video-type ${video.official ? 'official' : ''}">
                    ${video.official ? 'Official' : 'Fan'}
                </span>
                <div class="video-title">${video.name}</div>
                <div class="video-date">${new Date(video.published_at).toLocaleDateString('fr-FR')}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('videos-container').innerHTML = html;
}
```

### Charger la galerie
```javascript
async function chargerGalerie(movieId) {
    const url = `${API_BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`;
    const data = await fetch(url).then(r => r.json());
    afficherGalerie({
        backdrops: data.backdrops,
        posters: data.posters,
        logos: data.logos
    });
}
```

---

## 8. Badges et Éléments Spéciaux

### "En lecture" (Now Playing)
- Couleur : Vert (#10b981)
- Animation : Pulsation du point blanc
- Position : Top-right

### "Official" (Vidéo officielle)
- Couleur : Vert clair
- Bordure : Verte
- Position : Top-left dans la vidéo

### Badges de dimensions (Galerie)
- Couleur : Orange primaire
- Format : "1920x1080"
- Position : Top-right

---

## 9. Accessibilité

- ✅ Contraste suffisant (WCAG AA)
- ✅ Texte alternatif sur les images
- ✅ Navigation au clavier
- ✅ ARIA labels sur les boutons
- ✅ Icônes avec texte descriptif

---

## 10. Performance

- ✅ Images lazy-loaded
- ✅ Grille CSS optimisée
- ✅ Transitions GPU-accelerated
- ✅ Pagination pour limiter le DOM
- ✅ Cache des images TMDB

