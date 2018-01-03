'use strict';

import App from './app';

let app;

var urlParams = new URLSearchParams(window.location.search);
const isDebug = !(urlParams.has('NoDebug') || urlParams.has('NoDebug/'));

(() => {
	init();
	start();
})();

function init() {
	app = new App({
		isDebug: isDebug
	});

	document.body.appendChild(app.canvas);
}

function start() {
	app.animateIn();
}

window.addEventListener('resize', function() {
	app.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', function(ev) {
	app.onKeyDown(ev);
});
