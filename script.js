// ========= CONFIG =========

// Replace this with your Apps Script Web App URL after deployment
const ORDER_ENDPOINT =
  "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

// Basic client-side rate limit (30 seconds between orders per browser)
const RATE_LIMIT_MS = 30 * 1000;

// ========= PRODUCT DATA =========

const PRODUCTS = [
  {
    id: 1,
    name: "Memories of SPS",
    tagline: "The classic finale hoodie.",
    seasonTag: "Season 20 · Episode 26",
    price: "₹999",
    badge: "New drop",
    image:
      "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg"
    // Replace with your hoodie mockup image URL
  },
  {
    id: 2,
    name: "The Last Episode",
    tagline: "The one where we graduate.",
    seasonTag: "Series: Farewell Arc",
    price: "₹1099",
    badge: "Fan favourite",
    image:
      "https://images.pexels.com/photos/7671162/pexels-photo-7671162.jpeg"
  },
  {
    id: 3,
    name: "Playlist Edition",
    tagline: "Memories of SPS · tracklist hoodie.",
    seasonTag: "Soundtrack to 2025–26",
    price: "₹1049",
    badge: "Limited",
    image:
      "https://images.pexels.com/photos/7671165/pexels-photo-7671165.jpeg"
  },
  {
    id: 4,
    name: "SPS Survivors Club",
    tagline: "For those who survived all the terms.",
    seasonTag: "Membership · Lifetime",
    price: "₹1099",
    badge: "Exclusive",
    image:
      "https://images.pexels.com/photos/6311578/pexels-photo-6311578.jpeg"
  }
];

// ========= DOM HELPERS =========

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

// ========= RENDER PRODUCTS =========

function createProductCard(product) {
  return `
    <article class="product-card">
      <div class="product-image-wrapper">
        <img
          src="${product.image}"
          alt="${product.name}"
          class="product-image"
        />
        <span class="product-badge">${product.badge}</span>
      </div>
      <div class="product-meta">
        <p class="product-season">${product.seasonTag}</p>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-tagline">${product.tagline}</p>
        <div class="product-footer">
          <span class="product-price">${product.price}</span>
          <span class="product-pill">Hoodie</span>
        </div>
        <button
          class="card-order-btn"
          data-product="${product.name}"
        >
          Order
        </button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const row = $("#product-row");
  row.innerHTML = PRODUCTS.map(createProductCard).join("");
}

// ========= MODAL LOGIC =========

let lastOrderTimestamp = 0;

function openModal(productName) {
  $("#product").value = productName || "";
  $("#order-form").reset();

  // Reset message
  const msg = $("#order-message");
  msg.textContent = "";
  msg.style.color = "#f5f5f5";

  $("#quantity").value = 1;

  $("#order-modal-overlay").classList.remove("hidden");
}

function closeModal() {
  $("#order-modal-overlay").classList.add("hidden");
}

// ========= TOAST =========

let toastTimeout;

function showToast(message, type = "info") {
  const toast = $("#toast");
  toast.textContent = message;

  if (type === "error") {
    toast.style.borderColor = "rgba(255, 77, 90, 0.9)";
  } else if (type === "success") {
    toast.style.borderColor = "rgba(46, 204, 113, 0.9)";
  } else {
    toast.style.borderColor = "rgba(255, 255, 255, 0.16)";
  }

  toast.classList.remove("hidden");
  requestAnimationFrame(() => toast.classList.add("show"));

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.classList.add("hidden"), 200);
  }, 2800);
}

// ========= FORM VALIDATION =========

function validateForm() {
  const fullName = $("#fullName").value.trim();
  const phone = $("#phone").value.trim();
  const admission = $("#admission").value.trim();
  const classSection = $("#classSection").value.trim();
  const product = $("#product").value.trim();
  const size = $("#size").value.trim();
  const quantity = $("#quantity").value.trim();

  const errors = [];

  if (!fullName) errors.push("Full Name is required.");
  if (!phone || phone.length < 8) {
    errors.push("Please enter a valid phone number.");
  }
  if (!admission) errors.push("Admission Number is required.");
  if (!classSection) errors.push("Class / Section is required.");
  if (!product) errors.push("Product is missing.");
  if (!size) errors.push("Please select a size.");
  if (!quantity || Number(quantity) <= 0) {
    errors.push("Quantity must be at least 1.");
  }

  return errors;
}

// ========= SUBMIT HANDLER =========

async function handleFormSubmit(event) {
  event.preventDefault();

  const messageEl = $("#order-message");
  messageEl.textContent = "";
  messageEl.style.color = "#f5f5f5";

  // Rate limit
  const now = Date.now();
  if (now - lastOrderTimestamp < RATE_LIMIT_MS) {
    messageEl.textContent =
      "You just placed an order. Wait a bit before sending another.";
    messageEl.style.color = "#ffb3b3";
    return;
  }

  // Honeypot (bots fill this, humans don't)
  const honeypot = $("#website").value.trim();
  if (honeypot !== "") {
    // silently pretend success
    closeModal();
    showToast("Order received.", "success");
    return;
  }

  const errors = validateForm();
  if (errors.length > 0) {
    messageEl.textContent = errors.join(" ");
    messageEl.style.color = "#ffb3b3";
    return;
  }

  if (!ORDER_ENDPOINT || ORDER_ENDPOINT.includes("PASTE_YOUR")) {
    messageEl.textContent =
      "Order system is not configured yet. Ask the team to connect Google Sheets.";
    messageEl.style.color = "#ffb3b3";
    return;
  }

  const payload = {
    fullName: $("#fullName").value.trim(),
    phone: $("#phone").value.trim(),
    admission: $("#admission").value.trim(),
    classSection: $("#classSection").value.trim(),
    product: $("#product").value.trim(),
    size: $("#size").value.trim(),
    quantity: $("#quantity").value.trim(),
    colour: $("#colour").value.trim(),
    notes: $("#notes").value.trim(),
    honeypot
  };

  // Show loading state
  const submitBtn = $("#order-submit-btn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  messageEl.textContent = "Sending order to SPS merch HQ...";
  messageEl.style.color = "#dcdcdc";

  try {
    const response = await fetch(ORDER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // NOTE: If CORS blocks reading the response, this may still succeed silently.
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json().catch(() => ({ status: "success" }));

    if (data.status === "success") {
      lastOrderTimestamp = Date.now();
      messageEl.textContent = "Order placed! You’ll be contacted soon.";
      messageEl.style.color = "#a8e6a1";

      showToast("Order placed. Welcome to the final season.", "success");

      setTimeout(() => {
        closeModal();
      }, 800);
    } else {
      throw new Error(data.message || "Unknown error");
    }
  } catch (error) {
    console.error(error);
    messageEl.textContent =
      "Something went wrong. Check your connection and try again.";
    messageEl.style.color = "#ffb3b3";
    showToast("Order failed. Try again in a moment.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ========= INIT =========

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();

  // Hook up card order buttons
  $all(".card-order-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productName = btn.getAttribute("data-product");
      openModal(productName);
    });
  });

  // Hero button scroll
  $("#shop-hoodies-btn").addEventListener("click", () => {
    $("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Modal close controls
  $("#order-modal-close").addEventListener("click", closeModal);
  $("#order-cancel-btn").addEventListener("click", closeModal);

  $("#order-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "order-modal-overlay") {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Form submit
  $("#order-form").addEventListener("submit", handleFormSubmit);
});
