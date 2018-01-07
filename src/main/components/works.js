const EventEmitter = require('wolfy87-eventemitter');
require('gsap');

import { appModel } from './model/appModel';
import { imageloader } from './util/imageloader';

class Works extends EventEmitter {
	constructor() {
		super();

		this._closeDom = document.getElementById('works-close-btn');
		this._works = document.getElementById('works');
		this._worksDescriptions = document.getElementsByClassName('works-descriptions')[0];
		this._worksFooter = document.getElementsByClassName('works-footer')[0];

		// this._works.style.display = 'block';
		// this._works.style.opacity = 1;

		this.resizeHandler();
	}
	animateIn() {
		this.resizeHandler();

		if (appModel.isLoaded) {
			TweenMax.set(this._works, { display: 'block' });
			TweenMax.to(this._works, 1.6, { opacity: 1, delay: 0.0, ease: Quint.easeInOut });
		} else {
			imageloader.startLoad();
		}
	}
	animateOut() {}
	resizeHandler() {
		TweenMax.set(this._worksDescriptions, {
			x: window.innerWidth / 2 - 300,
			y: window.innerHeight / 2 - 100
		});

		TweenMax.set(this._worksFooter, {
			x: window.innerWidth / 2 - 250,
			y: window.innerHeight / 2 + 260
		});
	}
}

export let works = new Works();
