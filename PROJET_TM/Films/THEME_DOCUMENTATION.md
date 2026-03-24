# 📱 Documentation - Thème Sombre/Clair MyCiné

## ✅ Vue d'ensemble

L'application MyCiné dispose maintenant d'un **système de thème sombre/clair cohérent** appliqué à toutes les pages incluant:
- 🎬 **movie-details.html** - Détails des films
- 👤 **actor-details.html** - Détails des acteurs et filmographie
- 🎞️ **Pages de collection** et autres pages

---

## 🎨 Variables CSS Principales

### Thème Sombre (par défaut)
```css
--bg-primary: #0f172a      /* Fond principal très sombre */
--bg-secondary: #1e293b    /* Fond secondaire gris-bleu */
--bg-card: #1e293b         /* Fond des cartes */
--bg-glass: rgba(30, 41, 59, 0.8)  /* Effet glass-morphism */

--text-primary: #ffffff     /* Texte principal blanc */
--text-secondary: #d1d5db   /* Texte secondaire gris clair */
--text-muted: #9ca3af       /* Texte estompé gris */

--border: #334155           /* Bordures */
--primary: #f59e0b          /* Couleur primaire (orange/ambre) */
--secondary: #06b6d4        /* Couleur secondaire (cyan) */
```

### Thème Clair
```css
[data-theme="light"] {
  --bg-primary: #f9fafb     /* Fond principal blanc cassé */
  --bg-secondary: #ffffff   /* Fond secondaire blanc */
  --bg-card: #ffffff        /* Fond des cartes blanc */
  
  --text-primary: #1f2937    /* Texte principal gris foncé */
  --text-secondary: #4b5563  /* Texte secondaire gris */
  --text-muted: #6b7280      /* Texte estompé gris clair */
  
  --border: #e5e7eb          /* Bordures grises claires */
}
```

---

## 🔄 Fonctionnement du Changement de Thème

### Fichier: `sombre_clair.js`
- Gère le **basculement thème/clair** automatiquement
- Stocke la préférence dans **localStorage**
- Respecte les préférences système avec `prefers-color-scheme`
- Applique des **animations fluides** lors du changement

### Détection et Application
1. Vérifie `localStorage.getItem('theme')`
2. Utilise la préférence système si non trouvée
3. Applique le thème via l'attribut `data-theme` du `<html>`
4. Les variables CSS s'adaptent automatiquement

---

## 📝 Fichiers Modifiés

### 1. **actor-details.css** ✅
- Refactorisation complète avec variables CSS
- Support des deux thèmes (sombre/clair)
- Styles pour:
  - Cards de films/séries
  - Navigation
  - Footer
  - Onglets (nav-tabs)
  - Animations

### 2. **actor-details.js** ✅
- Génération des cartes avec meilleur layout
- Grille responsive (`.films-grid`)
- Structure HTML améliorée avec flexbox

### 3. **actor-details.html** ✅
- Ajout des fonts Google (Inter & Playfair Display)
- Attribution `data-theme="dark"` sur le `<html>`
- Chargement du script `sombre_clair.js`

### 4. **movie-details.js** ✅
- Cartes de collection avec variables CSS
- Remplacement des classes Bootstrap statiques

### 5. **navbarAuth.js** ✅
- Cartes de favoris avec variables CSS
- Carrousel de tendances stylisé

---

## 🎯 Composants Stylisés

### Cards (`.card`)
```css
- Background: var(--bg-card)
- Border: 1px solid var(--border)
- Hover: translateY(-5px) + border-color: var(--primary)
- Shadow: var(--shadow)
```

### Navbar (`.navbar`)
```css
- Background: var(--bg-glass)
- Backdrop filter blur(20px)
- Border-bottom: 1px solid var(--border)
```

### Bouton Theme Toggle (`.theme-toggle`)
```css
- Largeur/hauteur: 44px
- Forme: Circulaire
- Hover: Rotation 180° + background: var(--primary)
- Animation fluide
```

### Onglets (`.nav-tabs`)
```css
- Border-bottom: 2px solid var(--border)
- Active: Couleur var(--primary) avec underline
- Hover: Background var(--glass-bg)
```

---

## 🔧 Utilisation dans le Code

### En HTML
```html
<html lang="fr" data-theme="dark">
  <!-- Le thème s'adapte automatiquement selon data-theme -->
</html>
```

### En CSS
```css
.my-element {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.my-element:hover {
  border-color: var(--primary);
}
```

### Thème clair uniquement
```css
[data-theme="light"] .special-style {
  /* Style spécifique mode clair */
  color: var(--text-primary);
}
```

---

## 📱 Responsive Design

### Breakpoints
- **Tablette** (≤992px): Padding réduit
- **Mobile** (≤768px): Grille 4 colonnes → 3 colonnes
- **Petit mobile** (≤576px): Grille 2 colonnes

### Grille Films
```css
.films-grid {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1.5rem;
}

/* Mobile */
@media (max-width: 768px) {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

@media (max-width: 576px) {
  grid-template-columns: repeat(2, 1fr);
}
```

---

## 🎬 Animation et Transitions

### Transition Globale
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Animations
- **Fade-in**: 0.6s ease-out
- **Hover cards**: translateY(-5px)
- **Hover buttons**: rotate(180deg) + scale
- **Thème toggle**: Fondu + rotation

---

## 🔌 Dépendances

- ✅ Bootstrap 5.3.0
- ✅ Phosphor Icons
- ✅ Google Fonts (Inter, Playfair Display)
- ✅ sombre_clair.js (gestion du thème)

---

## 📊 Compatibilité

- ✅ Chrome/Edge (moderne)
- ✅ Firefox (moderne)
- ✅ Safari (iOS/macOS moderne)
- ✅ Stockage localStorage
- ✅ Media queries prefers-color-scheme

---

## 🚀 Prochaines Améliorations Possibles

1. **Thème Personnalisé**: Permettre aux utilisateurs de choisir des couleurs custom
2. **Transitions**: Ajouter des animations de fade lors du changement de thème
3. **Persistance API**: Sauvegarder la préférence thème par utilisateur en BD
4. **Thèmes Multiples**: Ajouter d'autres thèmes (bleu, vert, etc.)
5. **Contraste**: Améliorer l'accessibilité avec des niveaux de contraste WCAG AAA

---

## 📞 Support

Pour toute question sur le système de thème, consultez:
- `sombre_clair.js` - Logique du changement de thème
- `actor-details.css` - Variables CSS
- `movie-details.css` - Implémentation de référence

