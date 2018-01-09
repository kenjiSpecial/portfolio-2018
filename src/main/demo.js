'use strict';

import './main.scss';

import App from './app';
import { appModel } from './components/model/appModel';
import { imageloader } from './components/util/imageloader';

require('gsap');

var urlParams = new URLSearchParams(window.location.search);
const isDebug = !(urlParams.has('NoDebug') || urlParams.has('NoDebug/'));

let aboutDom = document.getElementById('about');
let aboutCloseDom = document.getElementById('about-close-btn');

let app;
import { works } from './components/works';

(() => {
	init();
	setEvent();
	start();
})();

function init() {
	app = new App({
		isDebug: isDebug
	});
	imageloader.setGL(app.gl);

	let id = document.getElementById('main');
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
	}

	if (appModel.page === 'about') {
		TweenMax.set(aboutDom, { display: 'block' });
		TweenMax.to(aboutDom, 1.6, { opacity: 1, delay: 0.0, ease: Quint.easeInOut });
	} else if (appModel.page === 'home') {
		if (!appModel.isInit) {
			app.backToHome();
			TweenMax.to(aboutDom, 1.0, { opacity: 0, display: 'none', ease: Quint.easeOut });
		}
	} else {
		works.animateIn();
		app.worksAnimateIn();
	}
	appModel.isInit = false;
}

function donePageHandler() {
	if (appModel.page === 'works') {
	}
}

function clickCloseDomHandler(event) {
	if (appModel.page == 'about' && !appModel.isPageTransition) {
		appModel.page = 'home';
	}
}

function closeWorkHandler() {
	if (appModel.page == 'works' && !appModel.isPageTransition) appModel.page = 'home';
}
