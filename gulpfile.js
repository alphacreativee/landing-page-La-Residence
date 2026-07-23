const { src, dest, watch, series, parallel } = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass")(require("sass"));
const cleanCSS = require("gulp-clean-css");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");

const isProd = process.env.NODE_ENV === "production";

function js() {
  return src("assets/js/index/*.js", { allowEmpty: true })
    .pipe(uglify({ compress: { drop_console: isProd } }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("assets/main/js"))
    .pipe(browserSync.stream());
}

function css() {
  return src("assets/scss/*.scss", { allowEmpty: true })
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(dest("assets/main/css"))
    .pipe(cleanCSS({ compatibility: "ie11" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest("assets/main/css"))
    .pipe(browserSync.stream());
}

function serve() {
  browserSync.init({
    server: "./",
    notify: false,
    open: false,
  });

  watch("assets/js/index/*.js", js);
  watch("assets/scss/**/*.scss", css);
  watch("*.html").on("change", browserSync.reload);
}

exports.default = series(parallel(js, css), serve);
exports.build = series(parallel(js, css));
