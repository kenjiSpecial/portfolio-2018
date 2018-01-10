const EventEmitter = require('wolfy87-eventemitter');
require('gsap');

import { appModel } from './model/appModel';
import { imageloader } from './util/imageloader';
import { TweenMax } from 'gsap';

class Works extends EventEmitter {
	constructor() {
		super();

		this._closeDom = document.getElementsByClassName('works-close-btn')[0];
		this._works = document.getElementById('works');
		this._worksDescriptions = document.getElementsByClassName('works-descriptions')[0];
		this._worksFooter = document.getElementsByClassName('works-footer')[0];
		this._closeBtn = document.getElementsByClassName('works-close-btn')[0];
		this._titles = document.getElementsByClassName('works-name');
		this._worksBtns = document.getElementsByClassName('works-list-btn');
		this._workList = document.getElementsByClassName('works-list')[0];

		this._setEvent();
		this.resizeHandler();

		appModel.addListener('updateWork', this._updateWorkHandler);
	}
	animateIn() {
		this.resetTitle();

		if (appModel.isLoaded) {
			this.fadeIn();
		} else {
			imageloader.startLoad();
		}

		this.resizeHandler();
	}
	fadeIn(delay = 0) {
		TweenMax.set(this._works, { display: 'block' });

		this._titles[appModel.curWorkNum].style.display = 'block';
		this._titles[appModel.curWorkNum].style.opacity = 1;
		addClass(this._worksBtns[appModel.curWorkNum], 'selected');

		TweenMax.to(this._works, 1.5, { opacity: 1, delay: delay, ease: Quint.easeInOut });
	}
	fadeOut(delay = 0) {
		TweenMax.to(this._works, 1, { opacity: 0, display: 'none', ease: Quint.easeOut });
	}
	_updateWorkHandler() {
		TweenMax.to(this._titles[appModel.prevWorkNum], 0.3, { display: 'none', opacity: 0 });
		removeClass(this._worksBtns[appModel.prevWorkNum], 'selected');

		TweenMax.set(this._titles[appModel.curWorkNum], { display: 'block' });
		TweenMax.to(this._titles[appModel.curWorkNum], 0.3, { opacity: 1, delay: 0.2 });
		addClass(this._worksBtns[appModel.curWorkNum], 'selected');
	}
	animateOut() {}
	resizeHandler() {
		// min < 720
		let minSide = Math.min(window.innerWidth, window.innerHeight);
		let scale = Math.min(minSide / 720, 1);

		TweenMax.set(this._worksDescriptions, {
			x: window.innerWidth / 2 - 350 * scale,
			y: window.innerHeight / 2 - 100 * scale
		});

		console.log(this._workList.clientWidth);

		if (this._workList.clientWidth > 512 * scale) {
			TweenMax.set(this._worksFooter, {
				x: parseInt((window.innerWidth - this._workList.clientWidth) / 2),
				y: parseInt(window.innerHeight / 2 + 260 * scale)
			});

			TweenMax.set(this._closeBtn, { width: parseInt(this._workList.clientWidth) });
		} else {
			TweenMax.set(this._worksFooter, {
				x: parseInt(window.innerWidth / 2 - 256 * scale),
				y: parseInt(window.innerHeight / 2 + 260 * scale)
			});

			TweenMax.set(this._closeBtn, { width: parseInt(512 * scale) });
		}
	}
	resize() {
		this.resizeHandler();
	}
	imageloadedHandler() {
		this.fadeIn(0.2);
		this.resizeHandler();
	}
	resetTitle() {
		TweenMax.set(this._titles, { display: 'none', opacity: 0 });
	}
	_setEvent() {
		this.imageloadedHandler = this.imageloadedHandler.bind(this);
		this._updateWorkHandler = this._updateWorkHandler.bind(this);
		this._clickBtnHandler = this._clickBtnHandler.bind(this);
		this._clickCloseDomHandler = this._clickCloseDomHandler.bind(this);

		appModel.addListener('image:loaded', this.imageloadedHandler);
		appModel.addListener('uupdteWork', this._updateWorkHandler);

		for (let ii = 0; ii < this._worksBtns.length; ii++) {
			this._worksBtns[ii].addEventListener('click', this._clickBtnHandler.bind(this, ii));
		}

		let prevButton = document.getElementsByClassName('works-navigation-prev')[0];
		let nextButton = document.getElementsByClassName('works-navigation-next')[0];

		prevButton.addEventListener('click', this._clickNextWorkHandler);
		nextButton.addEventListener('click', this._clickPrevWorkHandler);
		this._closeDom.addEventListener('click', this._clickCloseDomHandler);
	}
	_clickBtnHandler(workNum) {
		if (workNum === appModel.curWorkNum) return;

		appModel.showWork(workNum);
	}
	_clickCloseDomHandler() {
		this.trigger('closeWorkHandler');
	}
	close() {
		console.log('fadeOut');
		this.fadeOut();
	}
	_clickPrevWorkHandler() {
		if (this._isAnimation) return;
		console.log(this._isAnimation);
		this._isAnimation = true;
		appModel.showPrevWork();

		TweenMax.delayedCall(0.6, () => {
			this._isAnimation = false;
		});
	}
	_clickNextWorkHandler() {
		if (this._isAnimation) return;
		console.log(this._isAnimation);
		this._isAnimation = true;
		appModel.showNextWork();

		TweenMax.delayedCall(0.6, () => {
			this._isAnimation = false;
		});
	}
}

export let works = new Works();

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
