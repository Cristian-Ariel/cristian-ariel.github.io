"use strict";


/* ==========================================================================
   Project Galleries and Shared Lightbox
   ========================================================================== */


/*
  Minimum horizontal finger movement required before a gesture is
  considered a swipe.

  The same threshold is used by both the regular gallery and the
  fullscreen lightbox.
*/

const minimumSwipeDistance = 50;


/* ----- Shared Lightbox Elements ---------------------------------------- */

const lightbox = document.querySelector(
  "[data-lightbox]"
);

const lightboxImage = document.querySelector(
  "[data-lightbox-expanded-image]"
);

const lightboxFullResolutionLink = document.querySelector(
  "[data-lightbox-full-resolution]"
);

const lightboxCloseElements = document.querySelectorAll(
  "[data-lightbox-close]"
);

const lightboxCloseButton = document.querySelector(
  ".lightbox__close"
);

const lightboxPreviousButton = document.querySelector(
  "[data-lightbox-previous]"
);

const lightboxNextButton = document.querySelector(
  "[data-lightbox-next]"
);

const lightboxCounter = document.querySelector(
  "[data-lightbox-counter]"
);


/*
  These variables describe whichever image set is currently being viewed
  inside the shared lightbox.
*/

let activeLightboxImages = [];
let activeLightboxIndex = 0;


/*
  Keep track of the element that opened the lightbox.

  When the lightbox closes, keyboard focus returns to this element.
*/

let lightboxOpeningElement = null;


let pageScrollPosition = 0;

let lightboxTouchStartX = 0;
let lightboxTouchStartY = 0;


/* ----- Lightbox Page Scroll Locking ------------------------------------ */

function lockPageScroll() {
  pageScrollPosition = window.scrollY;

  document.body.classList.add(
    "lightbox-open"
  );

  document.body.style.position = "fixed";
  document.body.style.top =
    `-${pageScrollPosition}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}


function unlockPageScroll() {
  document.body.classList.remove(
    "lightbox-open"
  );

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(
    0,
    pageScrollPosition
  );
}


/* ----- Lightbox Image Display ------------------------------------------ */

function showLightboxImage(index) {
  if (
    !lightboxImage ||
    activeLightboxImages.length === 0
  ) {
    return;
  }


  const selectedImage =
    activeLightboxImages[index];


  lightboxImage.src =
    selectedImage.src;

  lightboxImage.alt =
    selectedImage.alt;


  /*
    Keep the Full Resolution link synchronized with whichever image is
    currently displayed.

    This is especially important for galleries because the link must change
    whenever Previous / Next navigation selects a different image.
  */

  if (lightboxFullResolutionLink) {
    lightboxFullResolutionLink.href =
      selectedImage.src;
  }


  activeLightboxIndex = index;


  if (lightboxCounter) {
    lightboxCounter.textContent =
      `${activeLightboxIndex + 1} / ${activeLightboxImages.length}`;
  }
}


/* ----- Lightbox Navigation --------------------------------------------- */

function showPreviousLightboxImage() {
  if (activeLightboxImages.length === 0) {
    return;
  }


  const previousIndex =
    activeLightboxIndex === 0
      ? activeLightboxImages.length - 1
      : activeLightboxIndex - 1;


  showLightboxImage(
    previousIndex
  );
}


function showNextLightboxImage() {
  if (activeLightboxImages.length === 0) {
    return;
  }


  const nextIndex =
    activeLightboxIndex ===
    activeLightboxImages.length - 1
      ? 0
      : activeLightboxIndex + 1;


  showLightboxImage(
    nextIndex
  );
}


/* ----- Lightbox Touch Navigation --------------------------------------- */

function handleLightboxTouchStart(event) {
  const firstTouch =
    event.touches[0];


  lightboxTouchStartX =
    firstTouch.clientX;

  lightboxTouchStartY =
    firstTouch.clientY;
}


function handleLightboxTouchEnd(event) {
  /*
    There is nothing to navigate when the lightbox contains only one image.
  */

  if (activeLightboxImages.length <= 1) {
    return;
  }


  const finalTouch =
    event.changedTouches[0];


  const horizontalDistance =
    finalTouch.clientX -
    lightboxTouchStartX;


  const verticalDistance =
    finalTouch.clientY -
    lightboxTouchStartY;


  /*
    Require the gesture to be primarily horizontal so an accidental
    diagonal movement is not interpreted as gallery navigation.
  */

  const isMostlyHorizontal =
    Math.abs(horizontalDistance) >
    Math.abs(verticalDistance);


  const isLongEnough =
    Math.abs(horizontalDistance) >=
    minimumSwipeDistance;


  if (
    !isMostlyHorizontal ||
    !isLongEnough
  ) {
    return;
  }


  if (horizontalDistance < 0) {
    showNextLightboxImage();
  } else {
    showPreviousLightboxImage();
  }
}


/* ----- Lightbox Focus Management --------------------------------------- */

/*
  Return every currently available interactive control inside the lightbox.

  Hidden Previous / Next buttons are automatically excluded when a
  standalone image is being viewed.
*/

function getLightboxFocusableElements() {
  const focusableElements = [];


  if (
    lightboxFullResolutionLink &&
    !lightboxFullResolutionLink.hidden
  ) {
    focusableElements.push(
      lightboxFullResolutionLink
    );
  }


  if (lightboxCloseButton) {
    focusableElements.push(
      lightboxCloseButton
    );
  }


  if (
    lightboxPreviousButton &&
    !lightboxPreviousButton.hidden
  ) {
    focusableElements.push(
      lightboxPreviousButton
    );
  }


  if (
    lightboxNextButton &&
    !lightboxNextButton.hidden
  ) {
    focusableElements.push(
      lightboxNextButton
    );
  }


  return focusableElements;
}


/*
  Keep Tab and Shift+Tab inside the open dialog.

  This prevents keyboard focus from moving into the page behind the
  fullscreen lightbox.
*/

function trapLightboxFocus(event) {
  if (event.key !== "Tab") {
    return;
  }


  const focusableElements =
    getLightboxFocusableElements();


  if (focusableElements.length === 0) {
    return;
  }


  const firstFocusableElement =
    focusableElements[0];


  const lastFocusableElement =
    focusableElements[
      focusableElements.length - 1
    ];


  /*
    If there is only one available control, keep focus on it.
  */

  if (focusableElements.length === 1) {
    event.preventDefault();

    firstFocusableElement.focus();

    return;
  }


  /*
    Shift + Tab from the first control wraps to the last control.
  */

  if (
    event.shiftKey &&
    document.activeElement ===
      firstFocusableElement
  ) {
    event.preventDefault();

    lastFocusableElement.focus();

    return;
  }


  /*
    Tab from the last control wraps back to the first control.
  */

  if (
    !event.shiftKey &&
    document.activeElement ===
      lastFocusableElement
  ) {
    event.preventDefault();

    firstFocusableElement.focus();
  }
}


/* ----- Lightbox Open / Close ------------------------------------------- */

function openLightbox(
  images,
  selectedImageIndex,
  openingElement
) {
  if (
    !lightbox ||
    !lightboxImage ||
    images.length === 0
  ) {
    return;
  }


  activeLightboxImages = images;

  activeLightboxIndex =
    selectedImageIndex;

  lightboxOpeningElement =
    openingElement;


  showLightboxImage(
    activeLightboxIndex
  );


  /*
    Navigation is only useful when more than one image is available.

    Hero images and standalone figures therefore do not display Previous /
    Next buttons or a 1 / 1 counter.
  */

  const lightboxHasMultipleImages =
    activeLightboxImages.length > 1;


  if (lightboxPreviousButton) {
    lightboxPreviousButton.hidden =
      !lightboxHasMultipleImages;
  }


  if (lightboxNextButton) {
    lightboxNextButton.hidden =
      !lightboxHasMultipleImages;
  }


  if (lightboxCounter) {
    lightboxCounter.hidden =
      !lightboxHasMultipleImages;
  }


  /*
    The Full Resolution control is available for every project image.
  */

  if (lightboxFullResolutionLink) {
    lightboxFullResolutionLink.hidden =
      false;
  }


  lightbox.hidden = false;

  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );


  lockPageScroll();


  /*
    Move focus into the dialog.

    The Close button remains the initial target because closing a modal is
    the most predictable first action for keyboard users.
  */

  if (lightboxCloseButton) {
    lightboxCloseButton.focus();
  }
}


function closeLightbox() {
  if (
    !lightbox ||
    !lightboxImage
  ) {
    return;
  }


  lightbox.hidden = true;

  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );


  lightboxImage.src = "";
  lightboxImage.alt = "";


  if (lightboxFullResolutionLink) {
    lightboxFullResolutionLink.hidden =
      true;

    lightboxFullResolutionLink.href =
      "";
  }


  if (lightboxPreviousButton) {
    lightboxPreviousButton.hidden =
      true;
  }


  if (lightboxNextButton) {
    lightboxNextButton.hidden =
      true;
  }


  if (lightboxCounter) {
    lightboxCounter.hidden = true;
    lightboxCounter.textContent = "";
  }


  activeLightboxImages = [];
  activeLightboxIndex = 0;


  unlockPageScroll();


  /*
    Return focus to the exact project image that opened the lightbox.
  */

  if (lightboxOpeningElement) {
    lightboxOpeningElement.focus();
  }


  lightboxOpeningElement = null;
}


/* ----- Lightbox Keyboard Handling -------------------------------------- */

function handleLightboxKeydown(event) {
  const lightboxIsOpen =
    lightbox &&
    !lightbox.hidden;


  if (!lightboxIsOpen) {
    return;
  }


  if (event.key === "Tab") {
    trapLightboxFocus(event);
    return;
  }


  if (event.key === "Escape") {
    closeLightbox();
    return;
  }


  if (event.key === "ArrowLeft") {
    showPreviousLightboxImage();
    return;
  }


  if (event.key === "ArrowRight") {
    showNextLightboxImage();
  }
}


/* ----- Shared Lightbox Event Listeners --------------------------------- */

lightboxCloseElements.forEach(
  (closeElement) => {
    closeElement.addEventListener(
      "click",
      closeLightbox
    );
  }
);


if (lightboxPreviousButton) {
  lightboxPreviousButton.addEventListener(
    "click",
    showPreviousLightboxImage
  );
}


if (lightboxNextButton) {
  lightboxNextButton.addEventListener(
    "click",
    showNextLightboxImage
  );
}


if (lightbox) {
  lightbox.addEventListener(
    "touchstart",
    handleLightboxTouchStart,
    {
      passive: true
    }
  );


  lightbox.addEventListener(
    "touchend",
    handleLightboxTouchEnd,
    {
      passive: true
    }
  );
}


document.addEventListener(
  "keydown",
  handleLightboxKeydown
);


/* ==========================================================================
   Individual Project Galleries
   ========================================================================== */

const galleries = document.querySelectorAll(
  "[data-gallery]"
);


galleries.forEach((gallery) => {
  const galleryItems = Array.from(
    gallery.querySelectorAll(
      "[data-gallery-item]"
    )
  );


  const galleryControls =
    gallery.querySelector(
      "[data-gallery-controls]"
    );


  const previousButton =
    gallery.querySelector(
      "[data-gallery-previous]"
    );


  const nextButton =
    gallery.querySelector(
      "[data-gallery-next]"
    );


  const galleryCounter =
    gallery.querySelector(
      "[data-gallery-counter]"
    );


  if (galleryItems.length === 0) {
    return;
  }


  /*
    Store the images separately so the shared lightbox receives the complete
    image set when any one of the gallery images is opened.
  */

  const galleryImages = galleryItems
    .map((galleryItem) => {
      return galleryItem.querySelector(
        "[data-lightbox-image]"
      );
    })
    .filter((galleryImage) => {
      return galleryImage !== null;
    });


  let currentIndex = 0;

  let touchStartX = 0;
  let touchStartY = 0;


/* ----- Gallery Image Display ------------------------------------------- */

  function showGalleryItem(index) {
    galleryItems.forEach(
      (galleryItem) => {
        galleryItem.classList.remove(
          "project-gallery__item--active"
        );
      }
    );


    galleryItems[index].classList.add(
      "project-gallery__item--active"
    );


    currentIndex = index;


    if (galleryCounter) {
      galleryCounter.textContent =
        `${currentIndex + 1} / ${galleryItems.length}`;
    }
  }


/* ----- Gallery Navigation ---------------------------------------------- */

  function showPreviousItem() {
    const previousIndex =
      currentIndex === 0
        ? galleryItems.length - 1
        : currentIndex - 1;


    showGalleryItem(
      previousIndex
    );
  }


  function showNextItem() {
    const nextIndex =
      currentIndex ===
      galleryItems.length - 1
        ? 0
        : currentIndex + 1;


    showGalleryItem(
      nextIndex
    );
  }


/* ----- Gallery Touch Navigation ---------------------------------------- */

  function handleTouchStart(event) {
    const firstTouch =
      event.touches[0];


    touchStartX =
      firstTouch.clientX;

    touchStartY =
      firstTouch.clientY;
  }


  function handleTouchEnd(event) {
    const finalTouch =
      event.changedTouches[0];


    const horizontalDistance =
      finalTouch.clientX -
      touchStartX;


    const verticalDistance =
      finalTouch.clientY -
      touchStartY;


    const isMostlyHorizontal =
      Math.abs(horizontalDistance) >
      Math.abs(verticalDistance);


    const isLongEnough =
      Math.abs(horizontalDistance) >=
      minimumSwipeDistance;


    if (
      !isMostlyHorizontal ||
      !isLongEnough
    ) {
      return;
    }


    if (horizontalDistance < 0) {
      showNextItem();
    } else {
      showPreviousItem();
    }
  }


/* ----- Progressive Enhancement ----------------------------------------- */

  gallery.classList.add(
    "project-gallery--enhanced"
  );


  showGalleryItem(
    currentIndex
  );


/* ----- Gallery Image Lightbox Behavior --------------------------------- */

  galleryImages.forEach(
    (galleryImage, imageIndex) => {

      /*
        Make images keyboard-accessible only after JavaScript has loaded
        successfully and the lightbox behavior is available.
      */

      galleryImage.tabIndex = 0;


      galleryImage.setAttribute(
        "role",
        "button"
      );


      galleryImage.setAttribute(
        "aria-label",
        `Open ${galleryImage.alt} in fullscreen view`
      );


      galleryImage.addEventListener(
        "click",
        () => {
          openLightbox(
            galleryImages,
            imageIndex,
            galleryImage
          );
        }
      );


      galleryImage.addEventListener(
        "keydown",
        (event) => {
          const openWithKeyboard =
            event.key === "Enter" ||
            event.key === " ";


          if (!openWithKeyboard) {
            return;
          }


          event.preventDefault();


          openLightbox(
            galleryImages,
            imageIndex,
            galleryImage
          );
        }
      );
    }
  );


/* ----- Enable Gallery Controls ----------------------------------------- */

  if (
    galleryItems.length > 1 &&
    galleryControls &&
    previousButton &&
    nextButton
  ) {
    galleryControls.hidden = false;


    previousButton.addEventListener(
      "click",
      showPreviousItem
    );


    nextButton.addEventListener(
      "click",
      showNextItem
    );


    gallery.addEventListener(
      "touchstart",
      handleTouchStart,
      {
        passive: true
      }
    );


    gallery.addEventListener(
      "touchend",
      handleTouchEnd,
      {
        passive: true
      }
    );
  }
});


/* ==========================================================================
   Standalone Project Images
   ========================================================================== */


/*
  Standalone project images use the same shared lightbox as galleries.

  This includes both the project hero and individual figures.

  Each image is treated as a one-image gallery, so Previous / Next controls
  and the image counter are automatically hidden.
*/

const standaloneLightboxImages =
  document.querySelectorAll(
    "[data-lightbox-standalone]"
  );


standaloneLightboxImages.forEach(
  (standaloneImage) => {

    /*
      Make the image keyboard accessible only after JavaScript has loaded
      successfully and the lightbox behavior is available.
    */

    standaloneImage.tabIndex = 0;


    standaloneImage.setAttribute(
      "role",
      "button"
    );


    standaloneImage.setAttribute(
      "aria-label",
      `Open ${standaloneImage.alt} in fullscreen view`
    );


    standaloneImage.addEventListener(
      "click",
      () => {
        openLightbox(
          [standaloneImage],
          0,
          standaloneImage
        );
      }
    );


    standaloneImage.addEventListener(
      "keydown",
      (event) => {
        const openWithKeyboard =
          event.key === "Enter" ||
          event.key === " ";


        if (!openWithKeyboard) {
          return;
        }


        event.preventDefault();


        openLightbox(
          [standaloneImage],
          0,
          standaloneImage
        );
      }
    );
  }
);