const SERIES_IMAGES = {
  // Netflix Originals
  "stranger-things": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
  "breaking-bad": "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
  "house-of-cards": "https://image.tmdb.org/t/p/w500/hKWxWjFwnMvkWQawbhvC0Y7ygQ8.jpg",
  "orange-is-the-new-black": "https://image.tmdb.org/t/p/w500/Lv6NxaP4kl8cOvtpBYy9NpbMpk.jpg",
  narcos: "https://image.tmdb.org/t/p/w500/rTmal9fDbwh5F0waol2hq35U4ah.jpg",

  // HBO Max
  "game-of-thrones": "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
  westworld: "https://image.tmdb.org/t/p/w500/8MfgyFHf7XEboZJPZXCIDqqiz6e.jpg",
  succession: "https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg",
  "the-sopranos": "https://image.tmdb.org/t/p/w500/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg",
  "true-detective": "https://image.tmdb.org/t/p/w500/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg",

  // Disney+
  "the-mandalorian": "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
  wandavision: "https://image.tmdb.org/t/p/w500/glKDfE6btIRcVB5zrjspRIs4r52.jpg",
  loki: "https://image.tmdb.org/t/p/w500/kEl2t3OhXc3Zb9FBh1AuYzRTgZp.jpg",
  "the-falcon-and-winter-soldier": "https://image.tmdb.org/t/p/w500/6kbAMLteGO8yyewYau6bJ683sw7.jpg",

  // Amazon Prime Video
  "the-boys": "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
  "marvelous-mrs-maisel": "https://image.tmdb.org/t/p/w500/zS7fQiOZiKCVH2vlYSiIsFWW8hh.jpg",
  "jack-ryan": "https://image.tmdb.org/t/p/w500/XuBqdeHJ3yg7D6kZHl853r9Wbq.jpg",
  "the-expanse": "https://image.tmdb.org/t/p/w500/71IqFW4HIjXaQYOHqii4wLXJayE.jpg",

  // Classiques
  friends: "https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
  "the-office": "https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg",
  sherlock: "https://image.tmdb.org/t/p/w500/7WTsnHkbA0FaG6R9twfFde0I9hl.jpg",
  "black-mirror": "https://image.tmdb.org/t/p/w500/5UaYsGZOFhjFDwQh6GuLjjA5WSpO.jpg",
  "the-crown": "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg",
  "peaky-blinders": "https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
}

// Fonction pour obtenir une image aléatoire de série
function getRandomSeriesImage() {
  const images = Object.values(SERIES_IMAGES)
  return images[Math.floor(Math.random() * images.length)]
}

// Fonction pour obtenir l'image d'une série spécifique
function getSeriesImage(seriesName) {
  const key = seriesName.toLowerCase().replace(/\s+/g, "-")
  return SERIES_IMAGES[key] || getRandomSeriesImage()
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SERIES_IMAGES, getRandomSeriesImage, getSeriesImage }
}
