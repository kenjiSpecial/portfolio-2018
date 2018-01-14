const EventEmitter = require('wolfy87-eventemitter');

import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Loader } from './works/loader';
import { appModel } from './model/appModel';
import { ThumbnailPlane } from './works/thumbnailPlane';
import { imageloader } from './util/imageloader';
import { TweenLite } from 'gsap/TweenLite';
import { distance } from 'gl-matrix/src/gl-matrix/vec2';
const isMobile = require('./util/isMobile');
// const dragDis = 300;

export class WorksThumbnail extends EventEmitter {
	constructor(gl, params = {}) {
		super();
		this._mouseDownHandler = this._mouseDownHandler.bind(this);
		this._mouseMoveHandler = this._mouseMoveHandler.bind(this);
		this._mouseUpHandler = this._mouseUpHandler.bind(this);

		this.dragDis = Math.max(window.innerWidth / 4, isMobile ? 150 : 200);
		this.prevFocusNum = this.focusNum = 0;

		this._parent = params.parent ? params.parent : document.getElementById('main');
		this._gl = gl;
		this._time = 0;
		this._totalSlideTargetRate = this._totalSlideRate = 0;
		this._mouseVelocity = 0;
		this._mouseDownScale = 0;
		this._modelMatrix = mat4.create();
		this._thumbnails = [];
		this._isMouseEnable = false;

		this.velocity = 0;
		this.yScale = 1;

		this._makeLoaders();
		appModel.addListener('image:loaded', this._loadedHandler.bind(this));
		appModel.addListener('showWork', nextNum => {
			let num = this._getCurFocusThumbId(true);
			let focusRawNum = Math.round(this._totalSlideTargetRate);
			if (num == 2) {
				this._totalSlideTargetRate = focusRawNum + (nextNum - num);
				if (nextNum == 0) this._totalSlideTargetRate += 3;
			} else if (num == 0) {
				this._totalSlideTargetRate = focusRawNum + (nextNum - num);
				if (nextNum == 2) this._totalSlideTargetRate -= 3;
			} else {
				this._totalSlideTargetRate = focusRawNum + (nextNum - num);
			}
			TweenLite.to(this, 0.3, { _totalSlideTargetRate: this._totalSlideTargetRate });
		});

		appModel.addListener('showNextWork', () => {
			let focusRawNum = Math.round(this._totalSlideTargetRate);
			this._totalSlideTargetRate = focusRawNum + 1;
			TweenLite.to(this, 0.3, { _totalSlideTargetRate: this._totalSlideTargetRate });
		});
		appModel.addListener('showPrevWork', () => {
			let focusRawNum = Math.round(this._totalSlideTargetRate);
			this._totalSlideTargetRate = focusRawNum - 1;
			TweenLite.to(this, 0.3, { _totalSlideTargetRate: this._totalSlideTargetRate });
		});
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
		TweenLite.killTweensOf([this._totalSlideTargetRate, this._totalSlideRate]);
		if (!isMobile) {
			// console.log(this._parent);
			window.addEventListener('mousemove', this._mouseMoveHandler);
			window.addEventListener('mouseup', this._mouseUpHandler);
		}

		this._curDistanceRate = this._prevDistanceRate = 0;
		this._startPt = isMobile ? event.touches[0].clientX : event.clientX;
		TweenLite.killTweensOf(this._mouseDownScale);
		TweenLite.to(this, 0.4, { _mouseDownScale: 1 });
	}

	_mouseMoveHandler(event) {
		if (!this._isAnimateIn) return;
		let pt = isMobile ? event.touches[0].clientX : event.clientX;
		if (this._startPt == null) this._startPt = pt;
		let dis = pt - this._startPt;
		this._startPt = pt;

		let distanceRate = dis / this.dragDis;
		this._totalSlideTargetRate += distanceRate;
		this._prevDistanceRate = this._curDistanceRate;
		this._curDistanceRate = distanceRate;

		this._mouseVelocity = Math.abs(this._curDistanceRate - this._prevDistanceRate);
	}

	_mouseUpHandler(event) {
		this._removeMouseUpEvent();
		TweenLite.to(this, 0.3, { _totalSlideTargetRate: Math.round(this._totalSlideTargetRate) });
		TweenLite.killTweensOf(this._mouseDownScale);
		TweenLite.to(this, 0.4, { _mouseDownScale: 0 });
	}

	_removeMouseUpEvent() {
		if (!isMobile) {
			// removeClass(this._parent, 'cursor-move-active');
			window.removeEventListener('mousemove', this._mouseMoveHandler);
			window.removeEventListener('mouseup', this._mouseUpHandler);
		}

		// this._isMouseEnable = false;
		// TweenLite.killTweensOf([this._mouseEnableHandler]);
		// TweenLite.delayedCall(0.5, this._mouseEnableHandler, null, this);
	}
	_mouseEnableHandler() {
		this._isMouseEnable = true;
	}

	_makeLoaders() {
		this._loader = new Loader(this._gl);
	}

	_setMouseEvent() {
		if (isMobile) {
			let main = document.getElementById('main');
			main.addEventListener('touchstart', this._mouseDownHandler, {
				// passive: true
			});
			main.addEventListener('touchmove', this._mouseMoveHandler, {
				// passive: true
			});
			main.addEventListener('touchend', this._mouseUpHandler, {
				// passive: true
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

	render(camera, mouse, del) {
		this._time += del;
		if (del > 0) {
			if (this._isAnimateIn) {
				// only
				this._totalSlideRate += (this._totalSlideTargetRate - this._totalSlideRate) / 10;

				let focusNum = this._getCurFocusThumbId();
				this.prevFocusNum = this.focusNum;
				this.focusNum = focusNum;

				if (this.prevFocusNum != this.focusNum)
					appModel.curWorkNum = parseInt(this.focusNum);

				this.velocity -= this._mouseVelocity * this.yScale * 10;
			}
			this.velocity -= 0.1 * (this.yScale - 1);
			this.velocity *= 0.8;

			this.yScale += del * this.velocity;
			this.yScale += (1.0 - this.yScale) * 0.2;
			if (this.yScale < 0.4) this.yScale += (0.4 - this.yScale) / 10;
			this._mouseVelocity = 0;
		}

		this._thumbnails.forEach(thumbnail => {
			thumbnail.render(
				camera,
				mouse,
				this._totalSlideRate,
				this._thumbnails.length,
				this.yScale,
				this._mouseDownScale
			);
		});

		if (this._loader.animateOutRate !== 0.0) {
			this._loader.render(camera, this._modelMatrix, mouse, this._time);
		}
	}
	_getCurFocusThumbId(isRound = false) {
		let mathFun = isRound ? Math.floor : Math.round;
		let focusRawNum = mathFun(this._totalSlideTargetRate);
		let focusNum = focusRawNum % this._thumbnails.length;
		if (focusNum < 0) focusNum += this._thumbnails.length;

		return focusNum;
	}
	_animateInWorkThumbnail(delay = 0.2) {
		this._thumbnails.forEach(thumbnail => thumbnail.reset());
		this._thumbnails[appModel.curWorkNum].animateIn(delay);

		TweenLite.delayedCall(0.8, () => {
			this._isAnimateIn = true;
		});
	}
	animateIn() {
		this._isAnimateIn = false;
		if (!appModel.isLoaded) this._loader.animateIn();
		else this._animateInWorkThumbnail(0.7);

		this._setMouseEvent();
	}
	animateOut() {
		if (this._thumbnails[appModel.curWorkNum])
			this._thumbnails[appModel.curWorkNum].animateOut();
		TweenLite.delayedCall(0.8, () => {
			this._isMouseEnable = false;
		});

		this._removeMouseEvent();
	}
	addGui(gui) {}
	resize() {
		this._width = window.innerWidth;
		this._height = window.innerHeight;
		this.dragDis = Math.max(window.innerWidth / 4, isMobile ? 150 : 200);

		this._thumbnails.forEach(thumbniail => {
			thumbniail.resize();
		});
	}
}
