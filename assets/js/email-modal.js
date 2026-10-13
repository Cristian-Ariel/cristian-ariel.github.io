/* ==========================================================================
   Email Modal
   ========================================================================== */

   (() => {
    const modal = document.querySelector("[data-email-modal]");
  
    if (!modal) {
      return;
    }
  
    const openButtons = document.querySelectorAll("[data-email-open]");
    const closeButton = modal.querySelector("[data-email-close]");
    const addressElement = modal.querySelector("[data-email-address]");
    const copyButton = modal.querySelector("[data-email-copy]");
    const statusElement = modal.querySelector("[data-email-status]");
  
  
    /* -----------------------------------------------------------------------
       Email address
  
       The address is deliberately stored in separate pieces so the complete
       email address does not appear directly in the page HTML or JavaScript
       source as a normal email string.
  
       This is only light obfuscation and is not intended as strong protection
       against sophisticated email scrapers.
       ----------------------------------------------------------------------- */
  
    const emailName = [
      "ca",
      "guzman",
      "lopez"
    ].join("");
  
    const emailDomain = [
      "csuchico",
      "edu"
    ].join(".");
  
    const emailAddress = `${emailName}@${emailDomain}`;
  
  
    /* -----------------------------------------------------------------------
       Open / Close
       ----------------------------------------------------------------------- */
  
    const openModal = () => {
      addressElement.textContent = emailAddress;
      copyButton.textContent = "Copy Email";
      statusElement.textContent = "";
  
      if (!modal.open) {
        modal.showModal();
      }
  
      copyButton.focus();
    };
  
  
    const closeModal = () => {
      modal.close();
    };
  
  
    openButtons.forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        openModal();
      });
    });
  
  
    closeButton.addEventListener("click", closeModal);
  
  
    /* Close when clicking the dark backdrop. */
  
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
      }
    });
  
  
    /* Remove the visible address again after the modal closes. */
  
    modal.addEventListener("close", () => {
      addressElement.textContent = "";
      copyButton.textContent = "Copy Email";
      statusElement.textContent = "";
    });
  
  
    /* -----------------------------------------------------------------------
       Copy Email
       ----------------------------------------------------------------------- */
  
       const copyEmail = async () => {
        try {
          await navigator.clipboard.writeText(emailAddress);
      
          copyButton.textContent = "Copied!";
          statusElement.textContent = "Email copied to clipboard.";
        } catch {
          const selection = window.getSelection();
          const range = document.createRange();
      
          range.selectNodeContents(addressElement);
      
          selection.removeAllRanges();
          selection.addRange(range);
      
          statusElement.textContent =
            "Automatic copy isn't available here. The email address has been selected for you.";
        }
      };
  
  
    copyButton.addEventListener("click", copyEmail);
  })();