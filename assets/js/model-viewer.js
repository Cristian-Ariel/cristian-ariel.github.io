customElements.whenDefined("model-viewer").then(() => {
  /*
   * Shared expanded-view lightbox.
   *
   * Only one lightbox exists per project page. Individual 3D viewers
   * are moved into this lightbox when expanded, then returned to their
   * original position when the lightbox is closed.
   */
  const lightbox = document.querySelector(
    "[data-model-viewer-lightbox]"
  );

  const lightboxBackdrop = lightbox?.querySelector(
    "[data-model-viewer-lightbox-backdrop]"
  );

  const lightboxStage = lightbox?.querySelector(
    "[data-model-viewer-lightbox-stage]"
  );

  const lightboxClose = lightbox?.querySelector(
    "[data-model-viewer-lightbox-close]"
  );

  /*
   * Tracks the currently expanded viewer.
   */
  let activeWrapper = null;
  let activeExpandButton = null;
  let wrapperPlaceholder = null;


  /* -------------------------------------------------
     Camera State Helpers
  ------------------------------------------------- */

  /*
   * Capture the viewer's CURRENT interactive camera state.
   *
   * These values can differ from the original HTML attributes after
   * the user rotates or zooms the model.
   */
  const captureViewState = (viewer) => ({
    orbit: viewer.getCameraOrbit().toString(),
    target: viewer.getCameraTarget().toString(),
    fieldOfView: `${viewer.getFieldOfView()}deg`,
    turntableRotation: viewer.turntableRotation
  });


  /*
   * Restore a previously captured interactive camera state.
   *
   * This is necessary after moving <model-viewer> to another parent
   * because the component may recalculate its camera when its size
   * and layout context change.
   */
  const restoreViewState = async (viewer, viewState) => {
    if (!viewState) return;

    viewer.cameraOrbit = viewState.orbit;
    viewer.cameraTarget = viewState.target;
    viewer.fieldOfView = viewState.fieldOfView;

    /*
     * Preserve any rotation produced by the turntable/auto-rotate
     * system independently of the camera orbit.
     */
    viewer.resetTurntableRotation(
      viewState.turntableRotation
    );

    await viewer.updateComplete;

    /*
     * Apply the saved camera immediately instead of interpolating
     * toward it.
     */
    viewer.jumpCameraToGoal();
  };


  /* -------------------------------------------------
     Close Expanded View
  ------------------------------------------------- */

  /*
   * Returns the active viewer to its original position
   * on the page and closes the shared lightbox.
   */
  const closeExpandedView = async () => {
    if (
      !lightbox ||
      !activeWrapper ||
      !wrapperPlaceholder
    ) {
      return;
    }

    const viewer =
      activeWrapper.querySelector("model-viewer");

    /*
     * Save the exact view the user currently has while expanded.
     *
     * This means any rotation or zoom performed inside the expanded
     * viewer is preserved when returning to the project page.
     */
    const currentViewState =
      viewer ? captureViewState(viewer) : null;

    /*
     * Restore normal embedded-view styling.
     */
    activeWrapper.classList.remove(
      "model-viewer-wrapper--expanded"
    );

    /*
     * Put the same live viewer back exactly where it
     * originally appeared on the page.
     */
    wrapperPlaceholder.replaceWith(activeWrapper);

    /*
     * Restore the camera after the DOM move.
     */
    if (viewer && currentViewState) {
      await restoreViewState(
        viewer,
        currentViewState
      );
    }

    /*
     * Restore the Expand button once the viewer is embedded again.
     */
    if (activeExpandButton) {
      activeExpandButton.hidden = false;
    }

    /*
     * Hide the lightbox.
     */
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");

    /*
     * Re-enable normal page scrolling.
     */
    document.body.classList.remove("lightbox-open");

    /*
     * Save the button before clearing the active-viewer references,
     * so keyboard focus can return to the control that opened it.
     */
    const buttonToFocus = activeExpandButton;

    activeWrapper = null;
    activeExpandButton = null;
    wrapperPlaceholder = null;

    buttonToFocus?.focus();
  };


  /* -------------------------------------------------
     Expanded View Controls
  ------------------------------------------------- */

  if (
    lightbox &&
    lightboxBackdrop &&
    lightboxStage &&
    lightboxClose
  ) {
    /*
     * Handle all mouse/touch clicks inside the expanded overlay.
     *
     * Behavior:
     * - X button -> close
     * - 3D viewer -> stay open
     * - surrounding dark overlay -> close
     */
    lightbox.addEventListener("click", (event) => {
      if (
        event.target.closest(
          "[data-model-viewer-lightbox-close]"
        )
      ) {
        closeExpandedView();
        return;
      }

      if (
        event.target.closest(
          ".model-viewer-wrapper--expanded"
        )
      ) {
        return;
      }

      closeExpandedView();
    });


    /*
     * Escape key also closes the expanded viewer.
     */
    document.addEventListener("keydown", (event) => {
      if (!activeWrapper || !lightbox) {
        return;
      }
    
      /*
       * Escape closes the expanded viewer.
       */
      if (event.key === "Escape") {
        closeExpandedView();
        return;
      }
    
      /*
       * Keep keyboard focus inside the expanded viewer.
       *
       * Tab cycles only through controls inside the lightbox
       * instead of continuing into links and buttons on the
       * page behind it.
       */
      if (event.key === "Tab") {
        const focusableElements = [
          ...lightbox.querySelectorAll(
            `
              button:not([disabled]):not([hidden]),
              [href],
              input:not([disabled]),
              select:not([disabled]),
              textarea:not([disabled]),
              [tabindex]:not([tabindex="-1"])
            `
          )
        ].filter((element) => {
          return element.offsetParent !== null;
        });
    
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }
    
        const firstElement =
          focusableElements[0];
    
        const lastElement =
          focusableElements[
            focusableElements.length - 1
          ];
    
        /*
         * Shift + Tab from the first control wraps
         * around to the final control.
         */
        if (
          event.shiftKey &&
          document.activeElement === firstElement
        ) {
          event.preventDefault();
          lastElement.focus();
          return;
        }
    
        /*
         * Tab from the final control wraps back
         * around to the first control.
         */
        if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });
  }


  /* -------------------------------------------------
     Initialize Every 3D Viewer on the Page
  ------------------------------------------------- */

  document
    .querySelectorAll("[data-model-viewer]")
    .forEach((wrapper) => {
      const viewer =
        wrapper.querySelector("model-viewer");

      const loadingMessage = wrapper.querySelector(
        "[data-model-viewer-loading]"
      );

      const resetButton = wrapper.querySelector(
        "[data-model-viewer-reset]"
      );

      const expandButton = wrapper.querySelector(
        "[data-model-viewer-expand]"
      );

      const interactionHint = wrapper.querySelector(
        "[data-model-viewer-hint]"
      );

      /*
       * Do not initialize an incomplete viewer component.
       */
      if (
        !viewer ||
        !loadingMessage ||
        !resetButton ||
        !expandButton
      ) {
        return;
      }


      /* -------------------------------------------------
         Initial Camera State
      ------------------------------------------------- */

      /*
       * These values represent the designed starting camera.
       *
       * Reset View always returns to these values, regardless
       * of the current expanded/embedded state.
       */
      let initialOrbit = null;
      let initialTarget = null;
      let initialFieldOfView = null;


      /* -------------------------------------------------
         Reduced Motion
      ------------------------------------------------- */

      const prefersReducedMotion =
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

      if (prefersReducedMotion) {
        viewer.removeAttribute("auto-rotate");
      }


      /* -------------------------------------------------
         Save Initial Camera
      ------------------------------------------------- */

      const saveInitialCamera = () => {
        /*
         * Prefer explicitly configured attributes where available.
         *
         * This preserves hand-tuned camera settings while still
         * supporting automatic framing such as:
         *
         * camera-orbit="auto auto 70%"
         */
        initialOrbit =
          viewer.getAttribute("camera-orbit") ||
          viewer.getCameraOrbit().toString();

        initialTarget =
          viewer.getAttribute("camera-target") ||
          viewer.getCameraTarget().toString();

        initialFieldOfView =
          viewer.getAttribute("field-of-view") ||
          `${viewer.getFieldOfView()}deg`;
      };


      /* -------------------------------------------------
         Successful Model Load
      ------------------------------------------------- */

      const showReadyState = async () => {
        await viewer.updateComplete;

        saveInitialCamera();

        loadingMessage.hidden = true;
        resetButton.hidden = false;
        expandButton.hidden = false;

        if (interactionHint) {
          interactionHint.hidden = false;
        }

        wrapper.setAttribute(
          "aria-busy",
          "false"
        );
      };


      /* -------------------------------------------------
         Model Loading Error
      ------------------------------------------------- */

      const showErrorState = () => {
        loadingMessage.textContent =
          "Unable to load 3D model.";

        loadingMessage.classList.add("is-error");
        loadingMessage.hidden = false;
        loadingMessage.setAttribute(
          "role",
          "alert"
        );

        resetButton.hidden = true;
        expandButton.hidden = true;

        if (interactionHint) {
          interactionHint.hidden = true;
        }

        viewer.removeAttribute("auto-rotate");

        wrapper.setAttribute(
          "aria-busy",
          "false"
        );
      };


      /*
       * A cached model may already be loaded by the time this
       * script initializes, so handle both possibilities.
       */
      if (viewer.loaded) {
        showReadyState();
      } else {
        viewer.addEventListener(
          "load",
          showReadyState,
          { once: true }
        );
      }

      viewer.addEventListener(
        "error",
        showErrorState,
        { once: true }
      );


      /* -------------------------------------------------
         First User Interaction
      ------------------------------------------------- */

      let hasInteracted = false;

      const handleFirstInteraction = () => {
        if (hasInteracted) return;

        hasInteracted = true;

        viewer.removeAttribute("auto-rotate");

        if (interactionHint) {
          setTimeout(() => {
            interactionHint.classList.add(
              "is-hidden"
            );
          }, 1000);
        }
      };


      viewer.addEventListener(
        "pointerdown",
        handleFirstInteraction,
        { once: true }
      );

      viewer.addEventListener(
        "keydown",
        handleFirstInteraction,
        { once: true }
      );

      viewer.addEventListener(
        "wheel",
        handleFirstInteraction,
        {
          once: true,
          passive: true
        }
      );


      /* -------------------------------------------------
         Expand View
      ------------------------------------------------- */

      expandButton.addEventListener(
        "click",
        async () => {
          if (
            !lightbox ||
            !lightboxStage ||
            activeWrapper
          ) {
            return;
          }

          /*
           * Expanding counts as deliberate interaction.
           */
          handleFirstInteraction();


          /*
           * IMPORTANT:
           *
           * Capture the current view BEFORE moving the viewer.
           *
           * This includes the user's current:
           * - rotation
           * - zoom
           * - camera target
           * - turntable rotation
           */
          const currentViewState =
            captureViewState(viewer);


          /*
           * Leave a placeholder so the viewer can later return
           * to exactly the same location in the document.
           */
          wrapperPlaceholder =
            document.createComment(
              "model-viewer-original-position"
            );

          wrapper.before(wrapperPlaceholder);

          activeWrapper = wrapper;
          activeExpandButton = expandButton;

          expandButton.hidden = true;

          wrapper.classList.add(
            "model-viewer-wrapper--expanded"
          );


          /*
           * Move the SAME live viewer into the expanded stage.
           */
          lightboxStage.append(wrapper);

          lightbox.hidden = false;
          lightbox.setAttribute(
            "aria-hidden",
            "false"
          );

          document.body.classList.add(
            "lightbox-open"
          );


          /*
           * Moving and resizing the component can cause
           * <model-viewer> to recalculate its camera.
           *
           * Restore the view we captured immediately before
           * the DOM move.
           */
          await restoreViewState(
            viewer,
            currentViewState
          );


                  /*
        * Move keyboard focus into the dialog itself.
        *
        * The dialog uses tabindex="-1", so it can receive
        * programmatic focus without becoming part of the
        * normal Tab order.
        *
        * The user's first Tab press will therefore move
        * naturally to the X close button.
        */
        const lightboxContent = lightbox.querySelector(
          ".model-viewer-lightbox__content"
        );

        lightboxContent?.focus({
          preventScroll: true
        });
        }
      );


      /* -------------------------------------------------
         Reset View
      ------------------------------------------------- */

      resetButton.addEventListener(
        "click",
        async () => {
          if (
            !initialOrbit ||
            !initialTarget ||
            !initialFieldOfView
          ) {
            return;
          }

          /*
           * Restore the designed starting camera.
           */
          viewer.cameraOrbit = initialOrbit;
          viewer.cameraTarget = initialTarget;
          viewer.fieldOfView =
            initialFieldOfView;

          /*
           * Auto-rotate modifies the model's turntable
           * independently from the camera.
           */
          viewer.resetTurntableRotation();

          await viewer.updateComplete;

          viewer.jumpCameraToGoal();
        }
      );
    });
});