function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuOpenIcon = document.getElementById("menu-open-icon");
  const menuCloseIcon = document.getElementById("menu-close-icon");

  if (!menuToggle || !mobileMenu || !menuOpenIcon || !menuCloseIcon) return;

  menuToggle.addEventListener("click", () => {
    const isHidden = mobileMenu.classList.contains("hidden");

    mobileMenu.classList.toggle("hidden");
    menuOpenIcon.classList.toggle("hidden");
    menuCloseIcon.classList.toggle("hidden");
    menuToggle.setAttribute("aria-expanded", String(isHidden));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
      menuOpenIcon.classList.remove("hidden");
      menuCloseIcon.classList.add("hidden");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
});
