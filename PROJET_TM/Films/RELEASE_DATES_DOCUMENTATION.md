# Documentation - Dates de sortie et certifications

## Vue d'ensemble

Cette fonctionnalité affiche les dates de sortie et les certifications des films dans la page de détails du film (movie-details.html). Elle utilise l'API TMDB pour récupérer les informations de sortie par pays.

## Fonctionnalités

### 1. Affichage des dates de sortie par pays
- **Organisé par pays** : Les dates sont groupées par pays (code ISO 3166-1)
- **Priorité intelligente** : Les pays pertinents (FR, US, GB, etc.) sont affichés en premier
- **Limitation d'affichage** : Les 12 premiers pays sont affichés, avec indication du nombre de pays restants

### 2. Certifications
- Affichage de la certification (ex: 18, R, PG-13, etc.) pour chaque pays
- Mise en évidence visuelle de la certification avec un badge

### 3. Types de sortie
- Les types de sortie sont identifiés et affichés avec des icônes appropriées :
  - **Type 1** : Première (Première)
  - **Type 2** : Sortie limitée
  - **Type 3** : Sortie cinéma (Popcorn)
  - **Type 4** : VOD (Vidéo à la demande)
  - **Type 5** : Support physique (DVD/Blu-ray)
  - **Type 6** : TV

### 4. Interactions utilisateur
- **Hover effects** : Les cartes se lèvent légèrement et affichent une ombre au survol
- **Animation** : Une animation de brillance traverse les cartes
- **Design responsive** : Adapté aux mobiles et aux écrans de bureau

## API utilisée

L'endpoint utilisé est inclus dans le paramètre `append_to_response` :
```
https://api.themoviedb.org/3/movie/{movie_id}?append_to_response=...release_dates...
```

### Structure des données
```json
{
  "release_dates": {
    "results": [
      {
        "iso_3166_1": "FR",
        "release_dates": [
          {
            "certification": "16",
            "iso_639_1": "",
            "release_date": "1999-11-10T00:00:00.000Z",
            "type": 3,
            "note": ""
          }
        ]
      }
    ]
  }
}
```

## Implémentation technique

### Fonction JavaScript : `afficherDatesEtCertifications(film)`
- **Fichier** : `movie-details.js`
- **Paramètre** : L'objet film complet retourné par l'API TMDB
- **Affichage** : Remplit le conteneur `#movie-release-dates`
- **Gestion d'erreur** : Cache la section si aucune donnée disponible

### Section HTML : `movie-release-dates-section`
- **Fichier** : `movie-details.html`
- **ID de conteneur** : `movie-release-dates`
- **Affichage conditionnel** : La section est cachée par défaut et affichée seulement si des données existent

### Styles CSS : `release-dates-grid` et `release-date-card`
- **Fichier** : `movie-details.css`
- **Grid responsive** : Utilise CSS Grid pour un layout adaptatif
- **Thème** : Supporte les thèmes clair et sombre
- **Animations** : Transitions fluides et effet de brillance

## Utilisation

La fonctionnalité est automatiquement activée quand la page movie-details.html se charge :

1. L'API TMDB est appelée avec `release_dates` inclus
2. La fonction `afficherDatesEtCertifications()` est appelée dans le DOMContentLoaded
3. Les données sont traitées et affichées dans le DOM

## Exemple de sortie

Pour le film "Fight Club" (ID 550) :
- 🇫🇷 France - Sortie ciné - 16 - 10 novembre 1999
- 🇺🇸 États-Unis - Première - R - 21 septembre 1999
- 🇬🇧 Royaume-Uni - Sortie ciné - 18 - 12 novembre 1999
- ... (et plusieurs autres pays)

## Notes de développement

### Format de date
Les dates sont formatées en français avec le format court :
`jour mois année` (ex: "10 novembre 1999")

### Internationalisation
Les noms de pays sont obtenus via `Intl.DisplayNames` pour une meilleure localisation :
```javascript
const countryName = new Intl.DisplayNames(['fr'], { type: 'region' }).of(countryCode);
```

### Tri des pays
Les pays sont triés selon un ordre de priorité défini :
```javascript
const countryOrder = ['FR', 'US', 'GB', 'DE', 'ES', 'IT', 'CA', 'AU'];
```

## Améliorations futures

- [ ] Afficher toutes les sorties d'un pays (pas seulement la principale)
- [ ] Ajouter un modal pour voir le détail des sorties multiples
- [ ] Filtrer par type de sortie (cinéma seulement, VOD seulement, etc.)
- [ ] Ajouter des drapeaux pour les pays
- [ ] Permettre la sélection du pays par l'utilisateur

## Compatibilité

- **Navigateurs** : Tous les navigateurs modernes supportant Intl.DisplayNames
- **Thèmes** : Supporte les thèmes clair et sombre
- **Mobile** : Entièrement responsive

