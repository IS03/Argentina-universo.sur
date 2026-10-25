// Lista explícita para que CI pueda verificar cada archivo y evitar referencias huérfanas.
export const imagenesHome = [
  "/img/home/1.jpg?v=3",
  "/img/home/2.jpg?v=3",
  "/img/home/3.jpg?v=3",
  "/img/home/4.jpg?v=3",
  "/img/home/5.jpg?v=3",
  "/img/home/6.jpg?v=3",
  "/img/home/7.jpg?v=3",
  "/img/home/8.jpg?v=3",
  "/img/home/9.jpg?v=3",
];

export const altImagenesHome = imagenesHome.map((_, i) =>
  `Paisaje de Argentina - Turismo Universo Sur, imagen ${i + 1}`);

// Cada imagen permanece 5 s, como en el carrusel anterior (el fundido de 1,5 s está en HeroCarousel).
export const HERO_INTERVALO_MS = 5000;
