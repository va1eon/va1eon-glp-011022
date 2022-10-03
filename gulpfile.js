'use strict';

/* === GLOBAL === */
import gulp from 'gulp';

const {src, dest, watch, series, parallel} = gulp;
import If from 'gulp-if';
import browserSync from 'browser-sync';
import plumber from 'gulp-plumber';
import del from 'del';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';

/* === HTML === */
import htmlMin from 'gulp-htmlmin';

/* === STYLES === */
import autoprefixer from 'gulp-autoprefixer';
import cleanCss from 'gulp-clean-css';
import gulpCssMedia from 'gulp-group-css-media-queries';
import {stream as critical} from 'critical';
import gulpSass from 'gulp-sass';
import dartSass from 'sass';

const sass = gulpSass(dartSass);

/* === JS === */
import webpack from 'webpack-stream';
import terser from 'gulp-terser';

/* === IMAGES === */
import gulpImage from 'gulp-image';
import gulpWebp from 'gulp-webp';
import gulpSvgSprite from 'gulp-svg-sprite';

let isDev = false;

const srcDir = 'src';
const buildDir = 'dist';
const path = {
  src: {
    html: `${srcDir}/*.html`,
    scss: `${srcDir}/scss/**/*.scss`,
    js: `${srcDir}/js/main.js`,
    img: `${srcDir}/img/**/*.{jpg,jpeg,png,svg,gif}`,
    imgFormat: `${srcDir}/img/**/*.{jpg,jpeg,png}`,
    assets: [`${srcDir}/fonts/**/*.*`, `${srcDir}/icons/**/*.*`,],
    svg: `${srcDir}/sprites/**/*.svg`,

  },
  dist: {
    html: `${buildDir}/`,
    css: `${buildDir}/css/`,
    js: `${buildDir}/js/`,
    img: `${buildDir}/img/`,
    svg: `${buildDir}/sprites/`,
  },
  watch: {
    html: `${srcDir}/*.html`,
    scss: `${srcDir}/scss/**/*.scss`,
    js: `${srcDir}/js/**/*.js`,
    img: `${srcDir}/img/**/*.{jpg,jpeg,png,svg,gif}`,
    imgFormat: `${srcDir}/img/**/*.{jpg,jpeg,png}`,
    assets: [`${srcDir}/fonts/**/*.*`, `${srcDir}/icons/**/*.*`,],
    svg: `${srcDir}/sprites/**/*.svg`,
  }
}

const html = () => src(path.src.html)
  .pipe(If(!isDev, htmlMin({
    removeComments: true,
    collapseWhitespace: true
  })))
  .pipe(dest(path.dist.html))
  .pipe(browserSync.stream());

const scss = () => src(path.src.scss)
  .pipe(If(isDev, sourcemaps.init()))
  .pipe(sass().on('error', sass.logError))
  .pipe(If(!isDev, autoprefixer({
    cascade: false,
    grid: false
  })))
  .pipe(If(!isDev, gulpCssMedia()))
  .pipe(If(!isDev, dest(path.dist.css)))
  .pipe(If(!isDev, cleanCss({
    2: {
      specialComments: 0
    }
  })))
  .pipe(rename({suffix: '.min'}))
  .pipe(If(isDev, sourcemaps.write()))
  .pipe(dest(path.dist.css))
  .pipe(browserSync.stream());

const webpackConfig = {
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'source-map' : false,
  optimization: {
    minimize: false
  },
  output: {
    filename: 'main.js'
  },
  module: {
    rules: []
  }
}

if (!isDev) {
  webpackConfig.module.rules.push({
    test: /\.m?js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: ["@babel/plugin-transform-runtime"]
      }
    }
  })
}

const js = () => src(path.src.js)
  .pipe(plumber())
  .pipe(webpack(webpackConfig))
  .pipe(If(!isDev, dest(path.dist.js)))
  .pipe(If(!isDev, terser()))
  .pipe(rename({suffix: '.min'}))
  .pipe(dest(path.dist.js))
  .pipe(browserSync.stream());

const image = () => src(path.src.img)
  .pipe(If(!isDev, gulpImage({
    optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
    pngquant: ['--speed=1', '--force', 256],
    zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
    jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
    mozjpeg: ['-optimize', '-progressive'],
    gifsicle: ['--optimize'],
    svgo: true
  })))
  .pipe(dest(path.dist.img))
  .pipe(browserSync.stream({
    once: true
  }));

const webp = () => src(path.src.imgFormat)
  .pipe(gulpWebp({
    quality: isDev ? 100 : 70
  }))
  .pipe(dest(path.dist.img))
  .pipe(browserSync.stream({
    once: true
  }));

const svgSprite = () => src(path.src.svg)
  .pipe(gulpSvgSprite({
    mode: {
      stack: {
        sprite: '../sprites.svg',
      }
    }
  }))
  .pipe(dest(path.dist.svg))
  .pipe(browserSync.stream({
    once: true
  }));

const copy = () => src(path.src.assets, {base: buildDir})
  .pipe(dest(buildDir))
  .pipe(browserSync.stream({
    once: true
  }));


const server = () => {
  browserSync.init({
    ui: false,
    notify: false,
    host: 'localhost',
    // tunnel: true
    server: {
      baseDir: buildDir
    }
  });

  watch(path.watch.html, html);
  watch(path.watch.scss, scss);
  watch(path.watch.js, js);
  watch(path.watch.img, image);
  watch(path.watch.imgFormat, webp);
  watch(path.watch.assets, copy);
  watch(path.watch.svg, svgSprite);
}

const devMode = ready => {
  isDev = true;
  ready();
}

const clean = () => del(buildDir, {
  force: true,
});

const base = parallel(html, scss, js, image, webp, svgSprite, copy);

export const build = series(clean, base);

export const dev = series(clean, devMode, base)

export default series(dev, server);

