(() => {
  const toggle = document.querySelector("[data-navigation-toggle]");
  const navigation = document.querySelector("[data-navigation]");
  const backdrop = document.querySelector("[data-navigation-backdrop]");
  const header = document.querySelector(".site-header");

  if (!toggle || !navigation) return;

  const desktopQuery = window.matchMedia("(min-width: 60rem)");

  let scrollPosition = 0;
  let scrollLocked = false;

  const lockPageScroll = () => {
    if (scrollLocked) return;

    scrollPosition = window.scrollY;

    /*
      When the menu opens, the sticky header becomes fixed and leaves
      the document flow. Compensate for its height so the page content
      remains in exactly the same visual position.
    */
    const headerHeight = header?.getBoundingClientRect().height ?? 0;

    document.documentElement.classList.add("navigation-open");
    document.body.classList.add("navigation-open");

    document.body.style.position = "fixed";
    document.body.style.top = `${headerHeight - scrollPosition}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    scrollLocked = true;
  };

  const unlockPageScroll = () => {
    if (!scrollLocked) return;

    document.documentElement.classList.remove("navigation-open");
    document.body.classList.remove("navigation-open");

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    scrollLocked = false;

    window.scrollTo(0, scrollPosition);
  };

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    navigation.dataset.open = String(open);

    if (backdrop) {
      backdrop.hidden = !open;
    }

    if (open) {
      lockPageScroll();
    } else {
      unlockPageScroll();
    }
  };

  const closeMenu = () => {
    setOpen(false);
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeMenu();
      toggle.focus();
    });
  }
 
  document.addEventListener("keydown", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    if (event.key === "Escape" && isOpen) {
      closeMenu();
      toggle.focus();
    }
  });

  desktopQuery.addEventListener("change", (event) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    if (event.matches && isOpen) {
      closeMenu();
    }
  });
})();