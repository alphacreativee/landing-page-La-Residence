"use strict";
import { customDropdown, createFilterTab } from "../../main/js/global.min.js";
import CustomModal from "../../main/js/modal.min.js";

const $ = jQuery;

const lenis = new Lenis({ autoResize: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ===== Khởi tạo tất cả custom modal =====
const modalInstances = new Map();

document.querySelectorAll(".custom-modal").forEach((modalEl) => {
  const instance = new CustomModal(modalEl, {
    lenis,
    onOpen: (el) => initSwiperInModal(el),
  });
  modalInstances.set(modalEl.id, instance);
});

document.querySelectorAll("[data-modal-open]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const targetId = trigger.dataset.modalOpen;
    modalInstances.get(targetId)?.open();
  });
});

// ===== Swiper trong modal =====
function initParallaxSwiper(swiperEl, options = {}) {
  const interleaveOffset = 0.85;

  return new Swiper(swiperEl, {
    slidesPerView: 1,
    loop: true,
    speed: 1500,
    watchSlidesProgress: true,
    grabCursor: true,
    a11y: false,
    ...options,
    on: {
      progress(swiper) {
        swiper.slides.forEach((slide) => {
          const slideProgress = slide.progress || 0;
          const innerOffset = swiper.width * interleaveOffset;
          const innerTranslate = slideProgress * innerOffset;

          if (!isNaN(innerTranslate)) {
            const image = slide.querySelector(".image");
            if (image) {
              image.style.transform = `translate3d(${innerTranslate}px, 0, 0)`;
            }
          }
        });
      },
      touchStart(swiper) {
        swiper.slides.forEach((slide) => {
          slide.style.transition = "";
        });
      },
      setTransition(swiper, speed) {
        const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)";
        swiper.slides.forEach((slide) => {
          slide.style.transition = `${speed}ms ${easing}`;
          const image = slide.querySelector(".image");
          if (image) image.style.transition = `${speed}ms ${easing}`;
        });
      },
      ...(options.on || {}),
    },
  });
}

function initSwiperInModal(modalEl) {
  const containerSwiperEl = modalEl.querySelector(".container-swiper");
  if (!containerSwiperEl) return;

  if (containerSwiperEl.dataset.swiperInited) {
    containerSwiperEl.swiperInstance?.update();
    return;
  }

  const swiperEl = containerSwiperEl.querySelector(".swiper-el-parallax");
  if (!swiperEl) return;

  const thumbnailEl = containerSwiperEl.querySelector(".swiper-el-thumbnail");
  let thumbnailSwiper = null;

  if (thumbnailEl) {
    thumbnailSwiper = new Swiper(thumbnailEl, {
      slidesPerView: 5,
      spaceBetween: 8,
      watchSlidesProgress: true,
      a11y: false,
    });
  }

  const swiperParallax = initParallaxSwiper(swiperEl, {
    navigation: {
      nextEl: containerSwiperEl.querySelector(".swiper-button-next"),
      prevEl: containerSwiperEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: containerSwiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
    ...(thumbnailSwiper && { thumbs: { swiper: thumbnailSwiper } }),
  });

  containerSwiperEl.swiperInstance = swiperParallax;
  containerSwiperEl.dataset.swiperInited = "true";

  requestAnimationFrame(() => {
    swiperParallax.update();
  });
}

// ===== Form trong modal (nếu form cũng nằm trong .custom-modal) =====
function formModal() {
  $(document).on("input change", ".modal-custom .required", function () {
    const $field = $(this);
    if (!$.trim($field.val())) return;
    $field.closest(".form-input").find("label").removeClass("error");
  });

  $(document).on("submit", ".modal-custom form", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $modal = $form.closest(".custom-modal");
    const $submitButton = $form.find('[type="submit"]');
    const $formMessage = $form.find(".form-message");
    const emailRecipient = $submitButton.attr("email-recipient") || "";

    const modalId = $modal.attr("id") || "";
    const actionName = "submit_" + modalId.replace(/^modal/i, "").toLowerCase();

    let hasError = false;
    if ($submitButton.hasClass("aloading")) return;

    $form.find("label.error").removeClass("error");
    $formMessage.removeClass("active").hide();

    $form.find(".required").each(function () {
      const $field = $(this);
      const value = $.trim($field.val());
      if (value) return;
      hasError = true;
      $field.closest(".form-input").find("label").first().addClass("error");
    });

    const $emailField = $form.find('input[name="email"]');
    const emailValue = $.trim($emailField.val());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailValue && !emailRegex.test(emailValue)) {
      hasError = true;
      $emailField.closest(".form-input").find("label").addClass("error");
    }

    if (hasError) return;

    const formData = $form.serializeArray();
    formData.push(
      { name: "action", value: actionName },
      { name: "email_recipient", value: emailRecipient },
    );

    $.ajax({
      url: ajaxUrl,
      type: "POST",
      dataType: "json",
      data: $.param(formData),
      beforeSend: function () {
        $submitButton.addClass("aloading").prop("disabled", true);
      },
      success: function (response) {
        if (!response.success) return;
        $form[0].reset();
        $formMessage.addClass("active").show();
        setTimeout(function () {
          $formMessage.removeClass("active").fadeOut();
          modalInstances.get(modalId)?.close();
        }, 3000);
      },
      complete: function () {
        $submitButton.removeClass("aloading").prop("disabled", false);
      },
    });
  });
}

function updateSumImageCount() {
  document.querySelectorAll("[data-modal-open]").forEach((btn) => {
    const targetId = btn.dataset.modalOpen;
    const modalEl = document.getElementById(targetId);
    if (!modalEl) return;

    const totalSlides = modalEl.querySelectorAll(
      ".swiper-el-thumbnail .swiper-slide",
    ).length;

    const sumImageEl = btn.querySelector(".sum-image");
    if (sumImageEl) {
      sumImageEl.textContent = `+${totalSlides}`;
    }
  });
}

function swiperFacilities() {
  const parentSwiperEl = document.querySelector(".facilities-list");
  if (!parentSwiperEl) return;
  const swiperEl = parentSwiperEl.querySelector(".swiper-facilities");
  if (!swiperEl) return;

  return new Swiper(swiperEl, {
    slidesPerView: 3,
    slidesPerGroup: 3,
    spaceBetween: 24,
    speed: 1500,
    navigation: {
      nextEl: parentSwiperEl.querySelector(".swiper-button-next"),
      prevEl: parentSwiperEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: parentSwiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
  });
}

function swiperFoods() {
  const parentSwiperEl = document.querySelector(".foods-list");
  if (!parentSwiperEl) return;
  const swiperEl = parentSwiperEl.querySelector(".swiper-foods");
  if (!swiperEl) return;

  const FEATURED_COUNT = 2; // số slide hiển thị full cùng lúc
  const SLIDE_RATIO = 0.365; // mỗi slide full chiếm 40% container -> 2 slide = 80%, còn 20% chia đều 2 bên lấp ló
  const GAP = 24; // phải khớp spaceBetween

  const swiper = new Swiper(swiperEl, {
    slidesPerView: "auto",
    spaceBetween: GAP,
    loop: true,
    speed: 1500,
    watchSlidesProgress: true,
    a11y: false,

    slidesPerGroup: 2,
    slidesPerGroupSkip: 0,
    initialSlide: 2,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,

    navigation: {
      nextEl: parentSwiperEl.querySelector(".swiper-button-next"),
      prevEl: parentSwiperEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: parentSwiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },

    on: {
      init(sw) {
        requestAnimationFrame(() => {
          setPeekOffset(sw);
          updateOpacity(sw);
        });
      },
      resize(sw) {
        setPeekOffset(sw);
        updateOpacity(sw);
      },
      progress(sw) {
        updateOpacity(sw);
      },
      setTransition(sw, duration) {
        sw.slides.forEach((slide) => {
          slide.style.transition = `opacity ${duration}ms ease`;
        });
      },
    },
  });

  function setPeekOffset(sw) {
    const containerWidth = sw.el.offsetWidth;
    const slideWidth = Math.round(containerWidth * SLIDE_RATIO);

    sw.slides.forEach((slide) => {
      slide.style.boxSizing = "border-box";
      slide.style.width = `${slideWidth}px`;
    });

    let peek = (containerWidth - FEATURED_COUNT * slideWidth - GAP) / 2;
    peek = Math.max(peek, 28);
    peek = Math.min(peek, containerWidth * 0.15);
    peek = Math.round(peek);

    sw.params.slidesOffsetBefore = peek;
    sw.params.slidesOffsetAfter = peek;

    // loop:true cần rebuild lại khi đổi width slide bằng tay,
    // tránh duplicate slide bị lệch kích thước 2 đầu
    sw.loopDestroy();
    sw.loopCreate();
    sw.update();
  }

  function updateOpacity(sw) {
    const slidesWithProgress = sw.slides.map((slide, index) => ({
      slide,
      index,
      absProgress: Math.abs(slide.progress || 0),
    }));

    slidesWithProgress.sort((a, b) => a.absProgress - b.absProgress);

    const featuredIndexes = new Set(
      slidesWithProgress.slice(0, FEATURED_COUNT).map((item) => item.index),
    );

    sw.slides.forEach((slide, index) => {
      // slide.style.opacity = featuredIndexes.has(index) ? "1" : "0.35";
    });
  }

  return swiper;
}
function scrollToSection() {
  gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

  const menuLinks = document.querySelectorAll(".header-menu ul li a");
  const sections = document.querySelectorAll("section[id]");
  const headerMenu = document.querySelector(".header-menu");
  const headerEl =
    document.querySelector("header") || document.querySelector(".header"); // đổi selector đúng với header thật của bạn

  let isClicking = false;

  function getHeaderOffset() {
    // Lấy chiều cao thật của header lúc click, để section luôn nằm sát mép dưới header
    return headerEl ? headerEl.offsetHeight : 0;
  }

  function handleScrollClick(e, link) {
    e.preventDefault();
    isClicking = true;

    menuLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");

    if (window.innerWidth <= 991) {
      headerMenu?.classList.remove("active");
    }

    const targetId = link.getAttribute("href");
    const offset = getHeaderOffset();

    gsap.to(window, {
      duration: 0.5,
      scrollTo: {
        y: targetId,
        offsetY: offset, // trừ đúng chiều cao header, section không bị che
      },
      ease: "none",
      onComplete: () => {
        isClicking = false;
      },
    });
  }

  menuLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      handleScrollClick(e, this);
    });
  });

  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onEnter: () => {
        if (!isClicking) updateActiveLink(section.id);
      },
      onEnterBack: () => {
        if (!isClicking) updateActiveLink(section.id);
      },
      onLeave: () => {},
      onLeaveBack: () => {
        if (!isClicking && section === sections[0]) {
          menuLinks.forEach((link) => link.classList.remove("active"));
        }
      },
    });
  });

  function updateActiveLink(sectionId) {
    menuLinks.forEach((link) => link.classList.remove("active"));
    const activeLink = document.querySelector(
      `.header-menu a[href="#${sectionId}"]`,
    );
    if (activeLink) activeLink.classList.add("active");
  }
}
function hero() {
  const containerSwiperEl = document.querySelector(".banner .container-swiper");
  if (!containerSwiperEl) return;

  const swiperEl = containerSwiperEl.querySelector(".swiper-el-parallax");
  if (!swiperEl) return;

  const swiperParallax = initParallaxSwiper(swiperEl, {
    pagination: {
      el: containerSwiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
  });
}
function init() {
  gsap.registerPlugin(ScrollTrigger);
  customDropdown();
  createFilterTab();
  formModal();
  updateSumImageCount();
  swiperFacilities();
  swiperFoods();
  hero();
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  scrollToSection();
});

let isLinkClicked = false;

document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (
    link?.href &&
    !link.href.startsWith("#") &&
    !link.href.startsWith("javascript:")
  ) {
    isLinkClicked = true;
  }
});

window.addEventListener("beforeunload", () => {
  if (!isLinkClicked) window.scrollTo(0, 0);
  isLinkClicked = false;
});
