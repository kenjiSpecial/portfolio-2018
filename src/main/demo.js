'use strict';

import './main.scss';

import App from './app';
import { appModel } from './components/model/appModel';
import { imageloader } from './components/util/imageloader';
import { TweenLite } from 'gsap/TweenLite';
import CSSPlugin from 'gsap/CSSPlugin';

var urlParams = new URLSearchParams(window.location.search);
const isDebug = !(urlParams.has('NoDebug') || urlParams.has('NoDebug/'));
const isMobile = require('./components/util/isMobile');

let aboutDom = document.getElementById('about');
let aboutCloseDom = document.getElementById('about-close-btn');
let main = document.getElementById('main');

let app;
import { works } from './components/works';
if (isMobile) addClass(document.body, 'mobile');

(() => {
	init();
	setEvent();
	start();
})();

function init() {
	let id = document.getElementById('main');
	app = new App({
		parent: id,
		isDebug: false
	});
	imageloader.setGL(app.gl);

	id.appendChild(app.canvas);
}

function setEvent() {
	appModel.on('updatePage', updatePageHandler);
	appModel.on('updatePage:done', donePageHandler);
	aboutCloseDom.addEventListener('click', clickCloseDomHandler);
	works.on('closeWorkHandler', closeWorkHandler);
}
function start() {
	app.animateIn();

	updatePageHandler();
}

window.addEventListener('resize', function() {
	app.resize(window.innerWidth, window.innerHeight);
	works.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', function(ev) {
	app.onKeyDown(ev);
});

function updatePageHandler() {
	if (appModel.prevPage === 'works') {
		works.close();
		app.worksAnimateOut();
		removeClass(main, 'mouseup');
	}

	if (appModel.page === 'about') {
		TweenLite.set(aboutDom, { display: 'block' });
		TweenLite.to(aboutDom, 1.6, { opacity: 1, delay: 0.0, ease: Quint.easeInOut });
		app.removeClickEvent();
	} else if (appModel.page === 'home') {
		if (!appModel.isInit) {
			app.backToHome();
			TweenLite.to(aboutDom, 1.0, { opacity: 0, display: 'none', ease: Quint.easeOut });
		}
	} else {
		works.animateIn();
		app.worksAnimateIn();
		app.removeClickEvent();

		setTimeout(() => {
			app.canvas.style.cursor = '';
		}, 0);
		addClass(main, 'cursor-move');
	}
	appModel.isInit = false;
}

function donePageHandler() {}

function clickCloseDomHandler(event) {
	if (appModel.page == 'about' && !appModel.isPageTransition) {
		appModel.page = 'home';
	}
}

function closeWorkHandler() {
	if (appModel.page == 'works' && !appModel.isPageTransition) appModel.page = 'home';
}

function addClass(el, className) {
	if (el.classList) el.classList.add(className);
	else if (!hasClass(el, className)) el.className += ' ' + className;
}

function removeClass(el, className) {
	if (el.classList) el.classList.remove(className);
	else el.className = el.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
}

function hasClass(el, className) {
	return el.classList
		? el.classList.contains(className)
		: new RegExp('\\b' + className + '\\b').test(el.className);
}
