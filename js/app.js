// Configuration
const CONFIG = {
  GOOGLE_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbwlQQghiEWwnjTVHcri4N5RkluqKfywwjc9GLamlMMMUlPTtYR74YbiK4wPQ9T_iV1kYg/exec",
};

// ============================================
// Russian Name Declension Utilities
// ============================================

// Female names ending in "ь" (3rd declension) - decline differently from male names
const FEMALE_NAMES_SOFT_SIGN = [
  "Любовь",
  "Нинель",
  "Рахиль",
  "Руфь",
  "Юдифь",
  "Эсфирь",
];

/**
 * Check if name is a female name ending in soft sign (3rd declension)
 */
function isFemaleNameWithSoftSign(name) {
  return FEMALE_NAMES_SOFT_SIGN.includes(name);
}

/**
 * Check if name is likely female (ends in а/я or soft sign for 3rd decl.)
 * @param {string} name - Russian name
 * @returns {boolean}
 */
function isFemaleName(name) {
  if (!name) return false;
  const lastChar = name.slice(-1).toLowerCase();
  // Female names typically end in -а, -я
  if (lastChar === "а" || lastChar === "я") return true;
  // Or soft sign for 3rd declension female names
  if (lastChar === "ь" && isFemaleNameWithSoftSign(name)) return true;
  return false;
}

/**
 * Convert name to instrumental case (с кем?)
 * @param {string} name - Russian name
 * @returns {string} Name in instrumental case
 */
function toInstrumental(name) {
  if (!name) return name;
  const lastChar = name.slice(-1);
  const lastTwoChars = name.slice(-2);

  // Names ending in "ий" -> "ием" (Дмитрий -> Дмитрием)
  if (lastTwoChars === "ий") return name.slice(0, -2) + "ием";
  // Names ending in "ья" -> "ьёй" (Илья -> Ильёй)
  if (lastTwoChars === "ья") return name.slice(0, -1) + "ёй";
  // Names ending in "й" -> "ем" (Андрей -> Андреем)
  if (lastChar === "й") return name.slice(0, -1) + "ем";
  // Female names ending in "ь" (3rd decl.) -> "ью" (Любовь -> Любовью)
  if (lastChar === "ь" && isFemaleNameWithSoftSign(name)) {
    return name + "ю";
  }
  // Male names ending in "ь" -> "ем" (Игорь -> Игорем)
  if (lastChar === "ь") return name.slice(0, -1) + "ем";
  // Names ending in "а" -> "ой" (Анна -> Анной)
  if (lastChar === "а") return name.slice(0, -1) + "ой";
  // Names ending in "я" -> "ей" (Мария -> Марией)
  if (lastChar === "я") return name.slice(0, -1) + "ей";
  // Consonant endings (male) -> add "ом" (Владимир -> Владимиром)
  if (/[бвгджзклмнпрстфхцчшщ]/.test(lastChar)) {
    return name + "ом";
  }
  return name;
}

/**
 * Convert name to genitive case (кого?)
 * @param {string} name - Russian name
 * @returns {string} Name in genitive case
 */
function toGenitive(name) {
  if (!name) return name;
  const lastChar = name.slice(-1);
  const lastTwoChars = name.slice(-2);

  // Names ending in "ий" -> "ия" (Дмитрий -> Дмитрия)
  if (lastTwoChars === "ий") return name.slice(0, -2) + "ия";
  // Names ending in "ья" -> "ьи" (Илья -> Ильи)
  if (lastTwoChars === "ья") return name.slice(0, -1) + "и";
  // Names ending in "й" -> "я" (Андрей -> Андрея)
  if (lastChar === "й") return name.slice(0, -1) + "я";
  // Female names ending in "ь" (3rd decl.) -> "и" (Любовь -> Любови)
  if (lastChar === "ь" && isFemaleNameWithSoftSign(name)) {
    return name.slice(0, -1) + "и";
  }
  // Male names ending in "ь" -> "я" (Игорь -> Игоря)
  if (lastChar === "ь") return name.slice(0, -1) + "я";
  // Names ending in "а" after к,г,х,ж,ш,щ,ч -> "и"
  if (lastChar === "а" && /[кгхжшщч]/.test(name.slice(-2, -1))) {
    return name.slice(0, -1) + "и";
  }
  // Names ending in "а" -> "ы" (Анна -> Анны)
  if (lastChar === "а") return name.slice(0, -1) + "ы";
  // Names ending in "я" -> "и" (Мария -> Марии)
  if (lastChar === "я") return name.slice(0, -1) + "и";
  // Consonant endings (male) -> add "а" (Владимир -> Владимира)
  if (/[бвгджзклмнпрстфхцчшщ]/.test(lastChar)) {
    return name + "а";
  }
  return name;
}

// ============================================
// Alpine.js Store: Guest Data
// ============================================

document.addEventListener("alpine:init", () => {
  // Guest data store
  Alpine.store("guest", {
    data: null,
    loading: false,

    // Computed: display name for greeting
    get displayName() {
      if (!this.data?.name) return "";
      if (this.data.invitation_type === "couple" && this.data.partner_name) {
        return `${this.data.name} и ${this.data.partner_name}`;
      }
      return this.data.name;
    },

    // Computed: greeting text
    get greeting() {
      if (!this.data?.name) return "";
      const displayName = this.displayName;

      if (this.data.group === "family") {
        // For couples — plural form
        if (this.data.invitation_type === "couple" && this.data.partner_name) {
          return `Дорогие ${displayName}!`;
        }
        // For single guest — determine gender by name
        const salutation = isFemaleName(this.data.name) ? "Дорогая" : "Дорогой";
        return `${salutation} ${displayName}!`;
      }

      return `${displayName}, привет!`;
    },

    // Computed: invitation type label
    get invitationTypeLabel() {
      if (!this.data) return "";
      if (this.data.invitation_type === "couple") {
        return "Приглашение для двоих";
      }
      if (this.data.invitation_type === "single") {
        return "Персональное приглашение";
      }
      return "";
    },

    // Computed: guest section title (for couples)
    get guestSectionTitle() {
      if (!this.data?.name) return "Ваши предпочтения";
      return `Предпочтения для ${toGenitive(this.data.name)}`;
    },

    // Computed: partner section title
    get partnerSectionTitle() {
      if (!this.data?.partner_name) return "Предпочтения партнёра";
      return `Предпочтения для ${toGenitive(this.data.partner_name)}`;
    },

    // Check if guest is a couple
    get isCouple() {
      return this.data?.invitation_type === "couple" && this.data?.partner_name;
    },

    // Check if should show accommodation field
    get showAccommodation() {
      return this.data?.show_accommodation !== false;
    },

    // Check if should show alcohol preferences
    get showAlcohol() {
      return this.data?.show_alcohol !== false;
    },

    // Check if already responded
    get hasResponded() {
      return this.data?.rsvp_status === "responded";
    },

    // Fetch guest data from API
    async fetch() {
      const params = new URLSearchParams(window.location.search);
      const guestId = params.get("guest");

      if (!guestId) {
        this.loading = false;
        return;
      }

      this.loading = true;

      try {
        const response = await fetch(
          `${CONFIG.GOOGLE_SCRIPT_URL}?guest=${encodeURIComponent(guestId)}`,
        );
        const data = await response.json();

        if (data.success && data.guest) {
          this.data = data.guest;
        }
      } catch (error) {
        console.error("Error fetching guest data:", error);
      } finally {
        this.loading = false;
      }
    },
  });

  // ============================================
  // Alpine.js Component: RSVP Form
  // ============================================

  Alpine.data("rsvpForm", () => ({
    // Form state
    submitting: false,
    submitted: false,
    showForm: true,

    // Form data
    attendance: "",
    dietary: "",
    accommodation: "",
    drinks: {
      no_alcohol: false,
      wine_white_dry: false,
      wine_white_sweet: false,
      wine_red_sweet: false,
      wine_red_dry: false,
      champagne_brut: false,
      champagne_sweet: false,
      cocktails_aperol: false,
      cognac: false,
      whiskey: false,
      vodka: false,
      cocktails_cola: false,
    },

    // Partner form data
    partnerDietary: "",
    partnerDrinks: {
      no_alcohol: false,
      wine_white_dry: false,
      wine_white_sweet: false,
      wine_red_sweet: false,
      wine_red_dry: false,
      champagne_brut: false,
      champagne_sweet: false,
      cocktails_aperol: false,
      cognac: false,
      whiskey: false,
      vodka: false,
      cocktails_cola: false,
    },

    // Initialize component
    init() {
      // Watch for already responded status
      this.$watch("$store.guest.hasResponded", (value) => {
        if (value) {
          this.showForm = false;
        }
      });
    },

    // Computed: show partner section
    get showPartnerSection() {
      return (
        this.$store.guest.isCouple && this.attendance === "Приду с партнёром"
      );
    },

    // Computed: show guest section title (only for couples when partner option selected)
    get showGuestSectionTitle() {
      return (
        this.$store.guest.isCouple && this.attendance === "Приду с партнёром"
      );
    },

    // Computed: guest is attending (not declined)
    get canAttend() {
      return this.attendance !== "" && this.attendance !== "Не смогу";
    },

    // Computed: attendance options (dynamic based on couple status)
    get attendanceOptions() {
      const options = [
        { value: "", label: "Выберите ответ" },
        { value: "Приду", label: "С радостью приду" },
      ];
      if (this.$store.guest.isCouple) {
        options.push({ value: "Приду с партнёром", label: "Будем оба" });
      }
      options.push({ value: "Не смогу", label: "К сожалению, не смогу" });
      return options;
    },

    // Handle "no alcohol" toggle for main guest
    toggleNoAlcohol() {
      if (this.drinks.no_alcohol) {
        // Uncheck and disable all other drink options
        Object.keys(this.drinks).forEach((key) => {
          if (key !== "no_alcohol") {
            this.drinks[key] = false;
          }
        });
      }
    },

    // Handle "no alcohol" toggle for partner
    togglePartnerNoAlcohol() {
      if (this.partnerDrinks.no_alcohol) {
        Object.keys(this.partnerDrinks).forEach((key) => {
          if (key !== "no_alcohol") {
            this.partnerDrinks[key] = false;
          }
        });
      }
    },

    // Check if a drink checkbox should be disabled (main guest)
    isDrinkDisabled(key) {
      return key !== "no_alcohol" && this.drinks.no_alcohol;
    },

    // Check if a drink checkbox should be disabled (partner)
    isPartnerDrinkDisabled(key) {
      return key !== "no_alcohol" && this.partnerDrinks.no_alcohol;
    },

    // Allow user to edit response
    changeResponse() {
      this.showForm = true;
      this.submitted = false;
    },

    // Submit form
    async submit() {
      const guest = this.$store.guest.data;

      const formData = {
        name: guest?.full_name || "",
        attendance: this.attendance,
        dietary: this.dietary || "—",
        accommodation: this.accommodation || "",
        drinks: this.drinks,
        partner_name: guest?.partner_full_name || "",
        partner_dietary: this.partnerDietary || "—",
        partner_drinks: this.partnerDrinks,
        guest_id: guest?.guest_id || null,
      };

      this.submitting = true;

      try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        this.submitted = true;
        this.showForm = false;
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Произошла ошибка. Попробуйте ещё раз.");
      } finally {
        this.submitting = false;
      }
    },
  }));
});

// ============================================
// Scroll Reveal Animation
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  // Observe all sections for scroll reveal
  document
    .querySelectorAll("section:not(.hero), .rocky-section, .organizer")
    .forEach((el) => {
      el.classList.add("scroll-reveal");
      observer.observe(el);
    });
});

// ============================================
// Parallax Effect for Candle Glows
// ============================================

function updateParallax(event) {
  const glows = document.querySelectorAll(".candle-glow");
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;

  glows.forEach((glow, index) => {
    const speed = (index + 1) * 10;
    glow.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
}

// Expose to window for Alpine
window.updateParallax = updateParallax;
