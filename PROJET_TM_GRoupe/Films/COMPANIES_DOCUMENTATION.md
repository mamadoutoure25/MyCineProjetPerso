# 📋 Documentation - Page Sociétés (Companies)

## 🎯 Vue d'ensemble

Une nouvelle fonctionnalité a été ajoutée pour explorer et consulter les détails des sociétés de production (studios, compagnies) qui créent les films.

### Pages créées:
1. **company-details.html** - Page détails d'une société
2. **companies-browse.html** - Page de navigation des sociétés
3. **company-details.js** - JavaScript pour les détails
4. **companies-browse.js** - JavaScript pour la navigation

---

## 📍 Emplacement et Navigation

### Accès à la page:
- **Menu principal** > Explorer > Sociétés
- **URL directe**: `/PROJET_TM_GRoupe/Films/companies-browse.html`
- **Détails**: `/PROJET_TM_GRoupe/Films/company-details.html?id=1`

### Menu déroulant Sociétés (index.html):
- Simple clic: Filtrer les films par cette société
- Ctrl+Clic (ou Cmd+Clic): Ouvrir la page détails dans un nouvel onglet
- Ou utiliser la page de navigation pour voir toutes les sociétés

---

## 🔗 API TMDB Utilisée

### Endpoint: Détails de la Société
```
GET https://api.themoviedb.org/3/company/{company_id}
```

**Paramètres:**
- `api_key` : Clé API TMDB
- `language` : fr-FR (français)

**Réponse:**
```json
{
  "description": "Description de la société",
  "headquarters": "San Francisco, California",
  "homepage": "https://www.lucasfilm.com",
  "id": 1,
  "logo_path": "/o86DbpburjxrqAzEDhXZcyE8pDb.png",
  "name": "Lucasfilm Ltd.",
  "origin_country": "US",
  "parent_company": null
}
```

### Endpoint: Films d'une Société
```
GET https://api.themoviedb.org/3/discover/movie?with_companies={company_id}
```

---

## 📄 Pages Créées

### 1. company-details.html
**Structure:**
```
├── Navigation (identique à index.html)
├── Hero Section
│  ├── Logo de la société
│  └── Infos:
│     ├── Nom
│     ├── Description
│     ├── Pays d'origine
│     ├── Siège social
│     ├── Site web
│     └── Société mère
├── Section Films Produits
│  └── Grille de films (jusqu'à 24)
├── Section Sociétés Associées (si applicable)
└── Footer
```

**Données affichées:**
- 🏢 **Logo** : Image professionnelle
- 📝 **Description** : Texte sur la société
- 🌍 **Pays** : Drapeau et code pays traduit
- 📍 **Siège** : Localisation de la société
- 🔗 **Site web** : Lien vers le site officiel
- 👨‍👩‍👧 **Société mère** : Si elle existe
- 🎬 **Films** : Liste des films produits

### 2. companies-browse.html
**Structure:**
```
├── Navigation
├── Header
│  ├── Titre
│  └── Description
├── Statistiques
│  ├── Nombre de sociétés
│  ├── Nombre de pays
│  └── Total de films produits
├── Barre de recherche
├── Grille de sociétés (19 sociétés principales)
│  └── Chaque carte:
│     ├── Logo
│     ├── Nom
│     ├── Pays
│     ├── Siège social
│     ├── Nombre de films
│     └── Boutons (Voir / Filtrer)
└── Footer
```

---

## 🎨 Composants et Styles

### company-details.html

#### Hero Section
```css
.company-hero-section {
    padding-top: 120px;
    min-height: 100vh;
}

.company-logo-container {
    background: var(--card-bg);
    border: 1px solid var(--border);
    min-height: 350px;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

#### Stats Cards
```css
.company-stat {
    display: flex;
    align-items: center;
    background: var(--glass-bg);
    border-left: 4px solid var(--primary);
    padding: 15px;
    border-radius: 8px;
}
```

#### Films Grid
```css
.films-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
}
```

### companies-browse.html

#### Company Cards
```css
.company-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
}

.company-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary);
}

.companies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
}
```

---

## 🖥️ Responsive Design

| Écran | Largeur | Colonnes | Comportement |
|-------|---------|----------|---|
| Mobile | < 576px | 1-2 | Stack vertical |
| Tablette | 576-992px | 2-3 | Grille 2x |
| Desktop | > 992px | 3-4+ | Grille 3+ |

---

## ⚙️ Fonctionnalités JavaScript

### company-details.js

#### Fonctions principales:
```javascript
chargerDetailsCompagnie(companyId)
// Charge tous les détails de la société

afficherDetailsCompagnie(company)
// Affiche les infos de la société

chargerFilmsCompagnie(companyId)
// Charge les films produits

afficherFilmsCompagnie(films)
// Affiche les films en grille

chargerSocieteMere(parentCompanyId)
// Charge la société mère si elle existe

obtenirNomPays(countryCode)
// Convertit les codes pays en noms
```

#### Traduction des pays:
- `US` → États-Unis
- `GB` → Royaume-Uni
- `JP` → Japon
- `FR` → France
- `DE` → Allemagne
- etc.

### companies-browse.js

#### Fonctions principales:
```javascript
chargerSocietes()
// Charge les 19 sociétés principales

afficherSocietes(companies)
// Affiche les sociétés en grille

configurerRecherche()
// Configure la barre de recherche

obtenirNomPays(countryCode)
// Convertit les codes pays
```

#### Sociétés principales chargées:
1. Lucasfilm Ltd. (ID: 1)
2. Disney (ID: 2)
3. Paramount (ID: 4)
4. Sony Pictures (ID: 5)
5. Lionsgate (ID: 11)
6. New Line Cinema (ID: 12)
7. Columbia Pictures (ID: 14)
8. 20th Century Studios (ID: 25)
9. Universal Pictures (ID: 33)
10. Warner Bros Pictures (ID: 174)
11. Marvel Studios (ID: 420)
12. Legendary Pictures (ID: 923)
13. Sony Pictures Animation (ID: 2251)
14. Warner Bros Animation (ID: 2785)
15. Illumination (ID: 6704)
16. Marvel Entertainment (ID: 7505)
17. Blue Sky Studios (ID: 9383)
18. DC Entertainment (ID: 9993)
19. DC Studios (ID: 184898)

---

## 🔍 Recherche et Filtrage

### companies-browse.html
- **Recherche en temps réel** par:
  - Nom de la société
  - Siège social
  - Pays d'origine

### Index.html (Dropdown)
- **Filtrage des films** par société
- **Navigation directe** vers les détails

---

## 🎯 Cas d'usage

### Utilisateur 1: Explorer les sociétés
1. Accueil > Explorer > Sociétés
2. Voir la page companies-browse.html
3. Cliquer sur "Voir" pour les détails

### Utilisateur 2: Filtrer par société
1. Accueil > Menu déroulant "Sociétés"
2. Cliquer sur une société
3. Films filtrés s'affichent

### Utilisateur 3: Voir les films d'une société
1. company-details.html?id=1
2. Voir tous les films produits
3. Cliquer sur un film pour les détails

---

## 📊 Données Affichées

### Sur company-details.html:
| Élément | Obligatoire | Exemple |
|---------|------------|---------|
| Nom | ✅ | "Lucasfilm Ltd." |
| Logo | ❌ | Image PNG/JPEG |
| Description | ❌ | Texte descriptif |
| Pays | ✅ | "US" → "États-Unis" |
| Siège | ❌ | "San Francisco, California" |
| Site web | ❌ | "https://www.lucasfilm.com" |
| Société mère | ❌ | Nom et ID |
| Films | ✅ | Jusqu'à 24 films |

### Sur companies-browse.html:
| Élément | Affichage |
|---------|-----------|
| Logo | Max 90% de la section |
| Nom | Jusqu'à 3 lignes |
| Pays | Avec icône globe |
| Siège | Avec icône épingle |
| Nombre de films | Compteur |
| Boutons | Voir + Filtrer |

---

## 🎨 Thème Dark/Light

Tous les styles utilisent les variables CSS du thème:
```css
--text : Texte principal
--text-secondary : Texte secondaire
--text-muted : Texte atténué
--card-bg : Fond des cartes
--glass-bg : Fond glass-morphism
--border : Couleur bordures
--primary : Couleur primaire (orange)
--secondary : Couleur secondaire (cyan)
```

Compatible thème sombre et clair automatiquement.

---

## 🚀 Performance

- **Cache local**: Les données sont cachées
- **Lazy loading**: Images chargées à la demande
- **Pagination**: Max 24 films affichés
- **Recherche**: Filtre local en temps réel
- **Délai API**: 100ms entre les requêtes

---

## 🔗 Intégrations

### Avec index.html
- ✅ Nouveau menu "Sociétés" dans Explorer
- ✅ Lien depuis le dropdown Sociétés
- ✅ Ctrl+Clic pour ouvrir les détails

### Avec movie-details.html
- ✅ Clic sur un film de la société
- ✅ Navigation fluide

### Avec sombre_clair.js
- ✅ Support thème sombre/clair
- ✅ Toggle bouton fonctionnel

---

## 📱 Responsive

### Mobile (< 576px)
- Grille 1-2 colonnes
- Cartes compactes
- Logo petit
- Boutons empilés

### Tablette (576-992px)
- Grille 2-3 colonnes
- Cartes moyennes
- Logo moyen

### Desktop (> 992px)
- Grille 3-4+ colonnes
- Cartes grandes
- Logo grand

---

## 🐛 Gestion des erreurs

### company-details.html
- Société non trouvée → Message d'erreur
- Films non chargés → Affiche "Aucun film"
- Logo absent → Placeholder généré

### companies-browse.html
- API indisponible → Grille vide
- Recherche sans résultat → "Aucune société trouvée"

---

## 💾 Fichiers Créés

| Fichier | Type | Lignes | Description |
|---------|------|-------|---|
| company-details.html | HTML | 350+ | Page détails |
| company-details.js | JS | 300+ | Logique détails |
| companies-browse.html | HTML | 300+ | Page navigation |
| companies-browse.js | JS | 250+ | Logique navigation |

---

## 🎓 Exemple d'utilisation

### Voir les détails de Lucasfilm:
```
https://site.com/PROJET_TM_GRoupe/Films/company-details.html?id=1
```

### Voir les films produits par Disney:
```
Accueil > Explorer > Sociétés > Cliquer sur Disney > Films produits
```

### Filtrer les films par Marvel Studios:
```
Accueil > Sociétés (dropdown) > Marvel Studios > Voir les films filtrés
```

---

## 📞 Support

Pour toute question sur la page des sociétés:
1. Vérifier l'API key TMDB
2. Vérifier la connexion Internet
3. Vérifier les logs navigateur (F12)
4. Vérifier l'URL des requêtes API

