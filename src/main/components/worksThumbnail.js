const EventEmitter = require('wolfy87-eventemitter');

import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Loader } from './works/loader';
import { appModel } from './model/appModel';
import { ThumbnailPlane } from './works/thumbnailPlane';
import { imageloader } from './util/imageloader';
import { TweenMax } from 'gsap';
const isMobile = require('./util/isMobile');
// const dragDis = 300;

export class WorksThumbnail extends EventEmitter {
	constructor(gl, params = {}) {
		super();
		this._mouseDownHandler = this._mouseDownHandler.bind(this);
		this._mouseMoveHandler = this._mouseMoveHandler.bind(this);
		this._mouseUpHandler = this._mouseUpHandler.bind(this);

		this._gl = gl;
		this._time = 0;
		this._modelMatrix = mat4.create();
		this._thumbnails = [];
		this._isMouseEnable = false;

		this._makeLoaders();
		appModel.addListener('image:loaded', this._loadedHandler.bind(this));
		appModel.addListener('showWork', nextNum => {
			let duration = 0.6;
			if (appModel.curWorkNum == 0) {
				if (nextNum == 1) this.showPrevWork(duration);
				else this.showNextWork(duration);
			} else if (appModel.curWorkNum == 1) {
				if (nextNum == 2) this.showPrevWork(duration);
				else this.showNextWork(duration);
			} else {
				if (nextNum == 0) this.showPrevWork(duration);
				else this.showNextWork(duration);
			}

			this._isMouseEnable = false;
			TweenMax.delayedCall(duration, () => {
				this._isMouseEnable = true;
			});
		});
		appModel.addListener('showNextWork', () => {
			this.showPrevWork(0.6);
		});
		appModel.addListener('showPrevWork', () => {
			this.showNextWork(0.6);
		});

		this.dragDis = window.innerWidth / 2;
	}
	_loadedHandler() {
		let side = 180;
		let segments = 30;
		for (let ii = 0; ii < imageloader.assets.length; ii++) {
			let thumbnail = new ThumbnailPlane(
				this._gl,
				{
					id: ii,
					isWire: false,
					texture: imageloader.assets[ii].texture
				},
				side,
				side,
				segments,
				segments
			);
			this._thumbnails.push(thumbnail);
		}

		this._animateInWorkThumbnail();
	}

	_mouseDownHandler(event) {
		this._distanceRate = 0;
		if (!this._isMouseEnable) return;
		if (!isMobile) {
			window.addEventListener('mousemove', this._mouseMoveHandler);
			window.addEventListener('mouseup', this._mouseUpHandler);
		}

		this._startPt = isMobile ? event.touches[0].clientX : event.clientX;
		// event.preventDefault();
	}

	_mouseMoveHandler(event) {
		if (!this._isMouseEnable) return;
		let pt = isMobile ? event.touches[0].clientX : event.clientX;
		if (this._startPt == null) this._startPt = pt;
		let dis = pt - this._startPt;
		let distanceRate = dis / this.dragDis;

		this._thumbnails.forEach(thumbniail => {
			thumbniail.mouseMove(distanceRate);
		});

		if (distanceRate > 1 || distanceRate < -1) {
			if (distanceRate > 1) {
				appModel.curWorkNum = (appModel.curWorkNum + 2) % 3;
				distanceRate = 1;
			} else {
				appModel.curWorkNum = (appModel.curWorkNum + 1) % 3;
				distanceRate = -1;
			}

			this._thumbnails[appModel.curWorkNum].updateRandom();
			this._startPt = event.clientX;

			// this._removeMouseUpEvent();
		}

		this._distanceRate = distanceRate;
		// event.preventDefault();
	}

	_mouseUpHandler(event) {
		console.log(this._isMouseEnable);
		if (!this._isMouseEnable) return;

		this._removeMouseUpEvent();

		if (this._distanceRate > 0.2) {
			this.showNextWork();
		} else if (this._distanceRate < -0.2) {
			this.showPrevWork();
		} else {
			this._thumbnails.forEach(thumbniail => {
				thumbniail.mouseUp();
			});
		}

		this._startPt = null;

		// event.preventDefault();
	}

	_removeMouseUpEvent() {
		if (!isMobile) {
			window.removeEventListener('mousemove', this._mouseMoveHandler);
			window.removeEventListener('mouseup', this._mouseUpHandler);
		}

		this._isMouseEnable = false;
		TweenMax.killTweensOf([this._mouseEnableHandler]);
		// TweenMax.delayedCall(0.5, this._mouseEnableHandler, null, this);
		// TweenMax.delayedCall(1, () => {});
	}
	_mouseEnableHandler() {
		this._isMouseEnable = true;
	}

	_makeLoaders() {
		this._loader = new Loader(this._gl);
	}

	_setMouseEvent() {
		if (isMobile) {
			document.body.addEventListener('touchstart', this._mouseDownHandler, {
				passive: true
			});
			document.body.addEventListener('touchmove', this._mouseMoveHandler, {
				passive: true
			});
			document.body.addEventListener('touchend', this._mouseUpHandler, {
				passive: true
			});
		} else {
			window.addEventListener('mousedown', this._mouseDownHandler);
		}
	}

	_removeMouseEvent() {
		document.body.removeEventListener('mousedown', this._mouseDownHandler);
		document.body.removeEventListener('mousemove', this._mouseMoveHandler);
		document.body.removeEventListener('mouseup', this._mouseUpHandler);

		window.removeEventListener('touchstart', this._mouseDownHandler);
		window.removeEventListener('touchmove', this._mouseMoveHandler);
		window.removeEventListener('touchend', this._mouseUpHandler);
	}

	render(camera, mouse) {
		this._time += 1 / 60;

		this._thumbnails.forEach(thumbnail => {
			thumbnail.render(camera, mouse);
		});

		if (this._loader.animateOutRate !== 0.0) {
			this._loader.render(camera, this._modelMatrix, mouse, this._time);
		}
	}
	_animateInWorkThumbnail() {
		this._thumbnails[appModel.curWorkNum].animateIn();
		TweenMax.delayedCall(1.2, () => {
			this._isMouseEnable = true;
		});
	}
	animateIn() {
		if (!appModel.isLoaded) this._loader.animateIn();
		else this._animateInWorkThumbnail();

		this._setMouseEvent();
	}
	animateOut() {
		this._thumbnails[appModel.curWorkNum].animateOut();
		TweenMax.delayedCall(1.2, () => {
			this._isMouseEnable = false;
		});

		this._removeMouseEvent();
	}
	addGui(gui) {
		this._testAnimateIn = this._testAnimateIn.bind(this);
		this._testAnimateOut = this._testAnimateOut.bind(this);
		let worksThumbnailGUI = gui.addFolder('worksThumbnail');
		worksThumbnailGUI.add(this, '_testAnimateIn');
		worksThumbnailGUI.add(this, '_testAnimateOut');
	}
	showNextWork(value) {
		let workNum =
			(appModel.curWorkNum + (imageloader.assets.length - 1)) % imageloader.assets.length;
		appModel.curWorkNum = workNum;

		let forceLeftNum =
			(appModel.curWorkNum + (imageloader.assets.length - 1)) % imageloader.assets.length;
		this._thumbnails[forceLeftNum].forceLeft();

		this._thumbnails.forEach((thumbniail, index) => {
			if (index != forceLeftNum) thumbniail.mouseUp(value);
		});
	}
	showPrevWork(value) {
		appModel.curWorkNum = (appModel.curWorkNum + 1) % imageloader.assets.length;
		let forceRightNum = (appModel.curWorkNum + 1) % imageloader.assets.length;
		this._thumbnails[forceRightNum].forceRight();

		this._thumbnails.forEach((thumbniail, index) => {
			if (index !== forceRightNum) thumbniail.mouseUp(value);
		});
	}
	resize() {
		this.dragDis = window.innerWidth / 2;

		this._thumbnails.forEach(thumbniail => {
			thumbniail.resize();
		});
	}
	_testAnimateIn() {
		if (this._plane) this._plane.animateIn();
		if (this._outPlane) this._outPlane.animateOut();
	}
	_testAnimateOut() {
		if (this._plane) this._plane.animateOut();
		if (this._outPlane) this._outPlane.animateIn();
	}
}
