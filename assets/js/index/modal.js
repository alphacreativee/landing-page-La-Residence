class CustomModal {
  constructor(modalEl, { lenis, onOpen, onClose } = {}) {
    this.modalEl = modalEl;
    this.lenis = lenis;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.isOpen = false;
    this.savedScroll = 0;
    this.lastFocusedEl = null;

    this._bindCloseTriggers();
  }

  _bindCloseTriggers() {
    this.modalEl.querySelectorAll("[data-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    // Đóng khi click ra ngoài content (nếu muốn giữ hành vi backdrop static thì bỏ đoạn này)
    // this.modalEl.addEventListener("click", (e) => {
    //   if (e.target === this.modalEl) this.close();
    // });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.lastFocusedEl = document.activeElement;
    this.savedScroll = this.lenis ? this.lenis.scroll : window.scrollY;

    this.lenis?.stop();
    document.body.classList.add("custom-modal-open");

    this.modalEl.classList.add("is-open");
    this.modalEl.removeAttribute("aria-hidden");
    this.modalEl.setAttribute("aria-modal", "true");
    this.modalEl.setAttribute("role", "dialog");

    // reflow để transition opacity chạy được
    requestAnimationFrame(() => {
      this.modalEl.classList.add("is-visible");
    });

    document.addEventListener("keydown", this._handleKeydown);

    this.onOpen?.(this.modalEl);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Blur trước khi ẩn, tránh focus bị kẹt trong phần tử sắp mất hiển thị
    if (this.modalEl.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    this.modalEl.classList.remove("is-visible");
    document.removeEventListener("keydown", this._handleKeydown);

    const finish = () => {
      this.modalEl.classList.remove("is-open");
      this.modalEl.setAttribute("aria-hidden", "true");
      this.modalEl.removeAttribute("aria-modal");
      document.body.classList.remove("custom-modal-open");

      this.lenis?.start();
      requestAnimationFrame(() => {
        this.lenis?.resize();
        this.lenis?.scrollTo(this.savedScroll, { immediate: true });
      });

      // Trả focus về đúng nút đã mở modal (tốt cho a11y, không gây scroll lạ vì nó nằm sẵn trong viewport đã khôi phục)
      this.lastFocusedEl?.focus?.({ preventScroll: true });

      this.onClose?.(this.modalEl);
      this.modalEl.removeEventListener("transitionend", finish);
    };

    this.modalEl.addEventListener("transitionend", finish, { once: true });
  }

  _handleKeydown = (e) => {
    if (e.key === "Escape") this.close();
  };
}

export default CustomModal;
