"use strict";
import { customDropdown, createFilterTab } from "../../main/js/global.min.js";

const $ = jQuery;

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

function initParallaxSwiper(swiperEl, options = {}) {
  const interleaveOffset = 0.85;

  return new Swiper(swiperEl, {
    slidesPerView: 1,
    loop: true,
    speed: 1500,
    watchSlidesProgress: true,
    grabCursor: true,
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

function initSwiper() {
  const containerSwiperEls = document.querySelectorAll(".container-swiper");
  if (!containerSwiperEls.length) return;

  containerSwiperEls.forEach((containerSwiperEl) => {
    // Kiểm tra xem container này có nằm trong modal không
    const modalEl = containerSwiperEl.closest(".modal");

    const setup = () => {
      // Tránh khởi tạo lại nếu đã init rồi
      if (containerSwiperEl.dataset.swiperInited) {
        // Nếu đã có instance, chỉ cần update lại size
        containerSwiperEl.swiperInstance?.update();
        return;
      }

      const swiperEl = containerSwiperEl.querySelector(".swiper-el-parallax");
      if (!swiperEl) return;

      const thumbnailEl = containerSwiperEl.querySelector(
        ".swiper-el-thumbnail",
      );
      let thumbnailSwiper = null;

      if (thumbnailEl) {
        thumbnailSwiper = new Swiper(thumbnailEl, {
          slidesPerView: 5,
          spaceBetween: 8,
          watchSlidesProgress: true,
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

      // update lại ngay sau khi modal hiện xong để tính đúng kích thước
      requestAnimationFrame(() => {
        swiperParallax.update();
      });
    };

    if (modalEl) {
      // Nằm trong modal → chỉ init khi modal thực sự đã hiện (đủ kích thước)
      modalEl.addEventListener("shown.bs.modal", setup);
    } else {
      // Không trong modal → init bình thường ngay
      setup();
    }
  });
}

function formModal() {
  // Bỏ trạng thái lỗi khi người dùng nhập vào field required
  $(document).on("input change", ".modal-custom .required", function () {
    const $field = $(this);

    if (!$.trim($field.val())) return;

    $field.closest(".form-input").find("label").removeClass("error");
  });

  $(document).on("submit", ".modal-custom form", function (e) {
    e.preventDefault();

    const $form = $(this);
    const $modal = $form.closest(".modal-custom");
    const $submitButton = $form.find('[type="submit"]');
    const $formMessage = $form.find(".form-message");
    const emailRecipient = $submitButton.attr("email-recipient") || "";

    // action AJAX lấy theo id modal, ví dụ modalBook -> submit_book, modalContact -> submit_contact
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
      {
        name: "action",
        value: actionName,
      },
      {
        name: "email_recipient",
        value: emailRecipient,
      },
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
          $modal.modal("hide");
        }, 3000);
      },

      complete: function () {
        $submitButton.removeClass("aloading").prop("disabled", false);
      },
    });
  });
}
function updateSumImageCount() {
  document.querySelectorAll(".room-wrapper").forEach((btn) => {
    const targetSelector = btn.dataset.bsTarget;
    if (!targetSelector) return;

    const modalEl = document.querySelector(targetSelector);
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

  const swiper = new Swiper(swiperEl, {
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

  return swiper;
}
document.addEventListener("DOMContentLoaded", () => {
  updateSumImageCount();
});
function init() {
  gsap.registerPlugin(ScrollTrigger);
  customDropdown();
  createFilterTab();
  formModal();
  updateSumImageCount();
  swiperFacilities();
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  initSwiper();
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
let scrollPosition = 0;

const modalEls = document.querySelectorAll(".modal");

modalEls.forEach((modalEl) => {
  modalEl.addEventListener("show.bs.modal", () => {
    scrollPosition = window.scrollY; // lưu vị trí cuộn hiện tại
    document.body.style.top = `-${scrollPosition}px`;
  });

  modalEl.addEventListener("hidden.bs.modal", () => {
    document.body.style.top = "";
    window.scrollTo(0, scrollPosition); // khôi phục lại đúng vị trí cũ
  });
});
