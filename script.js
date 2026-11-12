/**
 * MarsPizza — клиентская логика лендинга
 * Меню, корзина, калькулятор, погода на Марсе, форма, scroll-reveal
 */

(function () {
  "use strict";

  const MENU = [
    {
      id: "pepperoni",
      emoji: "🍕",
      name: "Пепперони без гравитации",
      desc: "Колбаски парят над сыром. Ловить их — часть ритуала.",
      price: 890,
    },
    {
      id: "margarita",
      emoji: "🌿",
      name: "Маргарита 4-й планеты",
      desc: "Томаты с орбитальной фермы и базилик, видевший закат дважды.",
      price: 750,
    },
    {
      id: "hawaii",
      emoji: "🍍",
      name: "Гавайская (запрещена на Земле)",
      desc: "Ананас легален только за пределами атмосферы. Мы проверили.",
      price: 920,
    },
    {
      id: "diavola",
      emoji: "🌶️",
      name: "Диавола с Марса",
      desc: "Острее пылевой бури. Скафандр от перца не спасает.",
      price: 980,
    },
    {
      id: "crater",
      emoji: "🧀",
      name: "Сырный кратер",
      desc: "Четыре сыра и углубление по центру — для соуса или слёз радости.",
      price: 1100,
    },
    {
      id: "bbq",
      emoji: "🔥",
      name: "Космо-барбекю",
      desc: "Копчёный соус с ароматом стартового комплекса. Без ракетного топлива — честно.",
      price: 1050,
    },
  ];

  const RUB_TO_MK = 0.42; // условный курс рубль → марсианский кредит

  // Множители доставки по планете и срочности
  const DELIVERY = {
    earth: { base: 200, days: { 1: 1, 2: 0.5, 3: 0.2 }, mult: { 1: 1, 2: 1.3, 3: 1.8 } },
    moon: { base: 4500, days: { 1: 14, 2: 9, 3: 5 }, mult: { 1: 1, 2: 1.4, 3: 2.1 } },
    mars: { base: 28000, days: { 1: 260, 2: 213, 3: 180 }, mult: { 1: 1, 2: 1.5, 3: 2.4 } },
  };

  const URGENCY_LABELS = { 1: "эконом", 2: "стандарт", 3: "экспресс" };
  const THERMO_PRICE = 900;

  const COMMENTS = {
    earth: {
      1: "Доставка займёт около суток. Пицца приедет тёплой — скучно, но надёжно.",
      2: "Доставка за полдня. Курьер знает ваш подъезд лучше, чем вы.",
      3: "Экспресс по Земле: пицца горячее споров в чате поддержки.",
    },
    moon: {
      1: "Доставка займёт ~14 дней. Пицца прибудет прохладной, но с видом на Землю.",
      2: "Около 9 дней до Луны. Корочка затвердеет — это уже почти сувенир.",
      3: "Лунный экспресс: 5 дней. Пицца холодная, зато быстрее соседней колонии.",
    },
    mars: {
      1: "Доставка займёт 260 дней. Пицца прибудет холодной, но с историей и радиационным загаром.",
      2: "Доставка займёт 213 дней. Пицца прибудет холодной, но с историей.",
      3: "Экспресс на Марс: всего 180 дней. Экономия месяца — бесценна. Пицца всё равно остынет.",
    },
  };

  const WEATHER = [
    {
      temp: "−63°C",
      condition: "Пылевая буря",
      visibility: "2 м",
      verdict: "Доставка задержится на 3 недели. Пицца прибудет с марсианским песком — это бесплатно.",
    },
    {
      temp: "−20°C",
      condition: "Ясно",
      visibility: "15 км",
      verdict: "Отличное окно запуска! Ракета вылетает через 40 минут.",
    },
    {
      temp: "−80°C",
      condition: "Метеоритный дождь",
      visibility: "500 м",
      verdict: "Курьер отказался лететь. Мы его понимаем.",
    },
    {
      temp: "−55°C",
      condition: "Сильный ветер",
      visibility: "5 км",
      verdict: "Пепперони рискует улететь в невесомость. Держитесь крепче.",
    },
    {
      temp: "−42°C",
      condition: "Лёгкая дымка",
      visibility: "8 км",
      verdict: "Нормальный марсианский вторник. Пицца остынет ровно наполовину — как и планировали.",
    },
    {
      temp: "−71°C",
      condition: "Ночной иней",
      visibility: "12 км",
      verdict: "Термобокс работает сверхурочно. Сыр превратится в сувенир, но с душой.",
    },
    {
      temp: "−33°C",
      condition: "Солнечная вспышка рядом",
      visibility: "20 км",
      verdict: "Радиосвязь с кухней прерывается. Заказ принят жестами космонавтов.",
    },
    {
      temp: "−90°C",
      condition: "Полярная ночь",
      visibility: "1 км",
      verdict: "Курьер взял фонарик и веру в лучшее. ETA: «когда-нибудь».",
    },
    {
      temp: "−48°C",
      condition: "Туман из CO₂",
      visibility: "3 км",
      verdict: "Навигация по запаху пепперони. Пока работает лучше GPS.",
    },
    {
      temp: "−25°C",
      condition: "Редкая оттепель",
      visibility: "18 км",
      verdict: "Почти земная погода! Пицца может прибыть тёплой. Не пугайтесь.",
    },
  ];

  /** @type {{ id: string, name: string, price: number, qty: number }[]} */
  const cart = [];
  /** id позиций, которые только что добавились (для анимации появления) */
  const enteringIds = new Set();
  let lastWeatherIndex = -1;
  let flashTimer = null;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isTouchNoHover = window.matchMedia("(hover: none)");

  const els = {
    hero: document.getElementById("hero"),
    menuGrid: document.getElementById("menu-grid"),
    cartCount: document.getElementById("cart-count"),
    cartBadge: document.querySelector(".cart-badge"),
    cartPanel: document.getElementById("cart-panel"),
    cartHint: document.getElementById("cart-hint"),
    orderSubmit: document.getElementById("order-submit"),
    calcPizza: document.getElementById("calc-pizza"),
    calcPlanet: document.getElementById("calc-planet"),
    calcUrgency: document.getElementById("calc-urgency"),
    calcThermo: document.getElementById("calc-thermo"),
    urgencyLabel: document.getElementById("urgency-label"),
    rangeTicks: document.querySelectorAll(".range-ticks span"),
    calcTotal: document.getElementById("calc-total"),
    calcComment: document.getElementById("calc-comment"),
    weatherReport: document.getElementById("weather-report"),
    weatherBtn: document.getElementById("weather-btn"),
    marsScene: document.getElementById("mars-scene"),
    orderForm: document.getElementById("order-form"),
    formSuccess: document.getElementById("form-success"),
    navToggle: document.querySelector(".nav-toggle"),
    siteNav: document.getElementById("site-nav"),
  };

  /* ---------- Утилиты ---------- */

  function formatRub(n) {
    return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";
  }

  function formatMk(rub) {
    const mk = rub * RUB_TO_MK;
    return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(mk) + " МК";
  }

  /* ---------- Меню ---------- */

  function renderMenu() {
    els.menuGrid.innerHTML = MENU.map((item) => {
      return `
        <article class="menu-card" data-id="${item.id}">
          <span class="menu-emoji" aria-hidden="true">${item.emoji}</span>
          <h3>${item.name}</h3>
          <p class="menu-desc">${item.desc}</p>
          <div class="menu-price">
            <span class="price-rub">${formatRub(item.price)}</span>
            <span class="price-mk">${formatMk(item.price)}</span>
          </div>
          <button
            type="button"
            class="btn-cart"
            data-add="${item.id}"
            aria-label="Добавить «${item.name}» в корзину"
          >
            В корзину
          </button>
        </article>
      `;
    }).join("");
  }

  function fillCalcSelect() {
    const prev = els.calcPizza.value;
    els.calcPizza.innerHTML = MENU.map((item) => {
      return `<option value="${item.id}">${item.name} — ${formatRub(item.price)}</option>`;
    }).join("");
    if (prev && MENU.some((m) => m.id === prev)) {
      els.calcPizza.value = prev;
    }
  }

  /* ---------- Корзина ---------- */

  function cartTotalQty() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotalRub() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function bumpCartBadge() {
    const badge = els.cartBadge;
    if (!badge) return;
    badge.classList.remove("is-flash");
    void badge.offsetWidth;
    badge.classList.add("is-flash");
    badge.style.transform = "scale(1.12)";
    setTimeout(() => {
      badge.style.transform = "";
      badge.classList.remove("is-flash");
    }, 300);
  }

  function bumpMenuCard(id) {
    const card = els.menuGrid.querySelector(`.menu-card[data-id="${id}"]`);
    if (!card) return;
    card.classList.remove("is-bumped");
    void card.offsetWidth;
    card.classList.add("is-bumped");
    setTimeout(() => card.classList.remove("is-bumped"), 200);
  }

  function addToCart(id) {
    const menuItem = MENU.find((m) => m.id === id);
    if (!menuItem) return;

    const existing = cart.find((c) => c.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        qty: 1,
      });
      enteringIds.add(id);
    }

    bumpMenuCard(id);
    bumpCartBadge();
    renderCart();
  }

  function changeQty(id, delta) {
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      const idx = cart.findIndex((c) => c.id === id);
      if (idx !== -1) cart.splice(idx, 1);
    }
    renderCart();
  }

  function removeFromCart(id) {
    const idx = cart.findIndex((c) => c.id === id);
    if (idx !== -1) cart.splice(idx, 1);
    renderCart();
  }

  function renderCart() {
    const totalQty = cartTotalQty();
    els.cartCount.textContent = String(totalQty);

    const empty = cart.length === 0;
    els.orderSubmit.disabled = empty;
    els.cartHint.classList.toggle("is-hidden", !empty);

    if (empty) {
      els.cartPanel.innerHTML = `
        <p class="cart-empty">
          Корзина пуста. Добавьте пиццу из меню —
          <a href="#menu">перейти к меню</a>
        </p>
      `;
      return;
    }

    const itemsHtml = cart
      .map((item) => {
        const line = item.price * item.qty;
        const enterClass = enteringIds.has(item.id) ? " is-entering" : "";
        return `
          <li class="cart-item${enterClass}" data-cart-id="${item.id}">
            <div class="cart-item-top">
              <p class="cart-item-name">${item.name}</p>
              <span class="cart-item-price">${formatRub(line)}</span>
            </div>
            <div class="cart-item-controls">
              <div class="cart-qty">
                <button type="button" class="cart-qty-btn" data-qty-minus="${item.id}" aria-label="Уменьшить количество «${item.name}»">−</button>
                <span class="cart-qty-value">${item.qty}</span>
                <button type="button" class="cart-qty-btn" data-qty-plus="${item.id}" aria-label="Увеличить количество «${item.name}»">+</button>
              </div>
              <button type="button" class="cart-remove" data-remove="${item.id}" aria-label="Удалить «${item.name}» из корзины">Удалить</button>
            </div>
          </li>
        `;
      })
      .join("");

    enteringIds.clear();

    const total = cartTotalRub();
    els.cartPanel.innerHTML = `
      <ul class="cart-list">${itemsHtml}</ul>
      <div class="cart-total">
        <p class="cart-total-label">Итого</p>
        <p class="cart-total-value">${formatRub(total)} · ${formatMk(total)}</p>
      </div>
    `;
  }

  els.menuGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    addToCart(btn.getAttribute("data-add"));
  });

  els.cartPanel.addEventListener("click", (e) => {
    const plus = e.target.closest("[data-qty-plus]");
    const minus = e.target.closest("[data-qty-minus]");
    const remove = e.target.closest("[data-remove]");
    if (plus) changeQty(plus.getAttribute("data-qty-plus"), 1);
    if (minus) changeQty(minus.getAttribute("data-qty-minus"), -1);
    if (remove) removeFromCart(remove.getAttribute("data-remove"));
  });

  /* ---------- Калькулятор ---------- */

  function updateUrgencyUi() {
    const v = els.calcUrgency.value;
    const label = URGENCY_LABELS[v];
    els.urgencyLabel.textContent = label;
    els.calcUrgency.setAttribute("aria-valuetext", label);
    els.rangeTicks.forEach((tick, index) => {
      tick.classList.toggle("is-active", String(index + 1) === v);
    });
  }

  function flashCalcTotal() {
    els.calcTotal.classList.remove("is-updated");
    void els.calcTotal.offsetWidth;
    els.calcTotal.classList.add("is-updated");
  }

  function matchDays(days) {
    if (days < 1) return "несколько часов";
    if (days === 1) return "1 день";
    const n = Math.round(days);
    const mod10 = n % 10;
    const mod100 = n % 100;
    let word = "дней";
    if (mod10 === 1 && mod100 !== 11) word = "день";
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "дня";
    return `${n} ${word}`;
  }

  /** Подставляет актуальное число дней в текст комментария */
  function patchCommentDays(planet, urgency) {
    const days = DELIVERY[planet].days[urgency];
    let text = COMMENTS[planet][urgency];
    text = text.replace(/\d[\d\s]*дней|\d[\d\s]*дня|~\d+\s*дней|около\s*\d+\s*дней/i, () => {
      if (days < 1) return "полдня";
      return matchDays(days);
    });
    return text;
  }

  function recalcFull() {
    updateUrgencyUi();
    const pizza = MENU.find((m) => m.id === els.calcPizza.value) || MENU[0];
    const planet = els.calcPlanet.value;
    const urgency = Number(els.calcUrgency.value);
    const thermo = els.calcThermo.checked;

    const pizzaPrice = pizza.price;
    const deliveryCfg = DELIVERY[planet];
    const deliveryCost = Math.round(deliveryCfg.base * deliveryCfg.mult[urgency]);
    const thermoCost = thermo ? THERMO_PRICE : 0;
    const total = pizzaPrice + deliveryCost + thermoCost;

    let comment = patchCommentDays(planet, urgency);
    if (!thermo && planet !== "earth") {
      comment += " Без термобокса корочка станет экспонатом музея.";
    }

    const nextTotal = `${formatRub(total)} · ${formatMk(total)}`;
    const changed = els.calcTotal.textContent !== nextTotal;
    els.calcTotal.textContent = nextTotal;
    els.calcComment.textContent = comment;
    if (changed && els.calcTotal.dataset.ready === "1") flashCalcTotal();
  }

  ["change", "input"].forEach((evt) => {
    els.calcPizza.addEventListener(evt, recalcFull);
    els.calcPlanet.addEventListener(evt, recalcFull);
    els.calcUrgency.addEventListener(evt, recalcFull);
    els.calcThermo.addEventListener(evt, recalcFull);
  });

  /* ---------- Погода на Марсе ---------- */

  function pickWeatherIndex() {
    if (WEATHER.length < 2) return 0;
    let next;
    do {
      next = Math.floor(Math.random() * WEATHER.length);
    } while (next === lastWeatherIndex);
    return next;
  }

  function sceneStateFromCondition(condition) {
    const c = String(condition).toLowerCase();
    if (c.includes("вспышка")) return "is-flash";
    if (
      c.includes("буря") ||
      c.includes("метеорит") ||
      c.includes("ветер") ||
      c.includes("туман") ||
      c.includes("иней")
    ) {
      return "is-storm";
    }
    return "is-calm";
  }

  function applyMarsSceneState(condition) {
    if (!els.marsScene) return;
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }

    els.marsScene.classList.remove("is-calm", "is-storm", "is-flash");
    const state = sceneStateFromCondition(condition);
    // reflow, чтобы transition/анимация вспышки сработали при повторном flash
    void els.marsScene.offsetWidth;
    els.marsScene.classList.add(state);

    if (state === "is-flash") {
      flashTimer = setTimeout(() => {
        els.marsScene.classList.remove("is-flash");
        els.marsScene.classList.add("is-calm");
        flashTimer = null;
      }, 400);
    }
  }

  function showWeather() {
    const index = pickWeatherIndex();
    lastWeatherIndex = index;
    const report = WEATHER[index];

    els.weatherReport.innerHTML = `
      <div class="weather-data" id="weather-data">
        <div class="weather-stats">
          <div class="weather-stat">
            <span class="weather-stat-label">Температура</span>
            <span class="weather-stat-value">${report.temp}</span>
          </div>
          <div class="weather-stat">
            <span class="weather-stat-label">Условие</span>
            <span class="weather-stat-value">${report.condition}</span>
          </div>
          <div class="weather-stat">
            <span class="weather-stat-label">Видимость</span>
            <span class="weather-stat-value">${report.visibility}</span>
          </div>
        </div>
        <p class="weather-verdict">${report.verdict}</p>
      </div>
    `;

    const dataEl = document.getElementById("weather-data");
    void dataEl.offsetWidth;
    dataEl.classList.add("is-shown");
    applyMarsSceneState(report.condition);
  }

  function initMarsParallax() {
    if (!els.marsScene || prefersReducedMotion.matches || isTouchNoHover.matches) return;

    const wrap = els.marsScene.querySelector(".mars-planet-wrap");
    if (!wrap) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function tick() {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      wrap.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }

    function requestTick() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    els.marsScene.addEventListener("mousemove", (e) => {
      const rect = els.marsScene.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = nx * 12; // ±6px
      targetY = ny * 12;
      requestTick();
    });

    els.marsScene.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      requestTick();
    });
  }

  els.weatherBtn.addEventListener("click", showWeather);
  showWeather();
  initMarsParallax();

  /* ---------- Форма заказа ---------- */

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function showError(id, message) {
    const field = document.getElementById(id).closest(".field");
    const err = document.getElementById("error-" + id.replace("order-", ""));
    field.classList.add("is-invalid");
    field.classList.remove("is-shake");
    void field.offsetWidth;
    field.classList.add("is-shake");
    err.textContent = message;
    setTimeout(() => field.classList.remove("is-shake"), 300);
  }

  function clearError(id) {
    const field = document.getElementById(id).closest(".field");
    const err = document.getElementById("error-" + id.replace("order-", ""));
    field.classList.remove("is-invalid");
    err.textContent = "";
  }

  function validateOrder() {
    let ok = true;
    const name = document.getElementById("order-name").value.trim();
    const email = document.getElementById("order-email").value.trim();

    clearError("order-name");
    clearError("order-email");

    if (name.length < 2) {
      showError("order-name", "Укажите имя — хотя бы два символа.");
      ok = false;
    }

    if (!EMAIL_RE.test(email)) {
      showError("order-email", "Нужен настоящий email — даже на Марсе.");
      ok = false;
    }

    return ok;
  }

  els.orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    els.formSuccess.hidden = true;

    if (cart.length === 0) {
      els.cartHint.classList.remove("is-hidden");
      return;
    }

    if (!validateOrder()) return;

    cart.length = 0;
    renderCart();
    els.formSuccess.hidden = false;
    els.orderForm.reset();
    els.formSuccess.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  /* ---------- Мобильная навигация ---------- */

  els.navToggle.addEventListener("click", () => {
    const open = els.siteNav.classList.toggle("is-open");
    els.navToggle.setAttribute("aria-expanded", String(open));
    els.navToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  });

  els.siteNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      els.siteNav.classList.remove("is-open");
      els.navToggle.setAttribute("aria-expanded", "false");
      els.navToggle.setAttribute("aria-label", "Открыть меню");
    }
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */

  const revealNodes = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealNodes.forEach((node) => io.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  /* ---------- Старт ---------- */

  renderMenu();
  fillCalcSelect();
  recalcFull();
  els.calcTotal.dataset.ready = "1";
  renderCart();

  // Каскад появления hero после первого кадра
  requestAnimationFrame(() => {
    if (els.hero) els.hero.classList.add("is-loaded");
  });
})();
