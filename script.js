// ----- 1. Data for your stickers -----
const STICKERS = [
  {
    id: 1,
    title: "Term I Trauma",
    category: "Academic",
    description: "SPS 2025–26 skeleton studying.",
    image: "assets/term-trauma.png"
  },
  {
    id: 2,
    title: "The Seniors",
    category: "Lifestyle",
    description: "Season 20, Episode 26.",
    image: "assets/seniors.png"
  },
  {
    id: 3,
    title: "Akshay Sir's Quote",
    category: "Wisdom",
    description: "Mathematical confusion visualized.",
    image: "assets/akshay-quote.png"
  },
  {
    id: 4,
    title: "Survivors Club",
    category: "Membership",
    description: "Official card for the resilient.",
    image: "assets/survivors-club.png"
  },
  {
    id: 5,
    title: "Never Underestimate",
    category: "Graffiti",
    description: "The unstoppable batch spirit.",
    image: "assets/never-underestimate.png"
  }
];

// ----- 2. Render function -----
function createStickerCard(sticker) {
  return `
    <article class="sticker-card">
      <div class="sticker-image-wrapper">
        <img
          src="${sticker.image}"
          alt="${sticker.title}"
          class="sticker-image"
        />
      </div>
      <div class="sticker-meta">
        <div class="sticker-category">${sticker.category}</div>
        <h2 class="sticker-title">${sticker.title}</h2>
        <p class="sticker-description">${sticker.description}</p>
      </div>
    </article>
  `;
}

function renderStickers() {
  const container = document.getElementById("stickers-container");
  container.innerHTML = STICKERS.map(createStickerCard).join("");
}

// ----- 3. Initialize on page load -----
document.addEventListener("DOMContentLoaded", renderStickers);
