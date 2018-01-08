const EventEmitter = require('wolfy87-eventemitter');

import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Loader } from './works/loader';
import { appModel } from './model/appModel';
import { ThumbnailPlane } from './works/thumbnailPlane';
import { imageloader } from './util/imageloader';
import { TweenMax } from 'gsap';

const dragDis = 300;

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
	}
	_loadedHandler() {
		let side = 190;
		let segments = 19;
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

		this._thumbnails[appModel.curWorkNum].animateIn();
		TweenMax.delayedCall(1.2, () => {
			this._isMouseEnable = true;
		});
	}

	_mouseDownHandler(event) {
		if (!this._isMouseEnable) return;
		window.addEventListener('mousemove', this._mouseMoveHandler);
		window.addEventListener('mouseup', this._mouseUpHandler);

		this._startPt = event.clientX;
	}

	_mouseMoveHandler(event) {
		let dis = event.clientX - this._startPt;
		let distanceRate = dis / dragDis;

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
			this._removeMouseUpEvent();
		}

		this._distanceRate = distanceRate;
	}

	_mouseUpHandler(event) {
		let dis = event.clientX - this._startPt;
		let distanceRate = dis / dragDis;
		this._distanceRate = distanceRate;

		this._removeMouseUpEvent();

		if (this._distanceRate > 0.2) {
			let workNum =
				(appModel.curWorkNum + (imageloader.assets.length - 1)) % imageloader.assets.length;
			appModel.curWorkNum = workNum;
			this._thumbnails[
				(appModel.curWorkNum + (imageloader.assets.length - 1)) % imageloader.assets.length
			].forceLeft();
		} else if (this._distanceRate < -0.2) {
			appModel.curWorkNum = (appModel.curWorkNum + 1) % imageloader.assets.length;
			this._thumbnails[(appModel.curWorkNum + 1) % imageloader.assets.length].forceRight();
		}

		this._thumbnails.forEach(thumbniail => {
			thumbniail.mouseUp();
		});
	}

	_removeMouseUpEvent() {
		window.removeEventListener('mousemove', this._mouseMoveHandler);
		window.removeEventListener('mouseup', this._mouseUpHandler);

		this._isMouseEnable = false;
		TweenMax.delayedCall(0.4, () => {
			this._isMouseEnable = true;
		});
	}

	_makeLoaders() {
		this._loader = new Loader(this._gl);
	}

	_setMouseEvent() {
		window.addEventListener('mousedown', this._mouseDownHandler);
	}

	_removeMouseEvent() {}

	render(camera, mouse) {
		this._time += 1 / 60;

		this._thumbnails.forEach(thumbnail => {
			thumbnail.render(camera, mouse);
		});

		if (this._loader.animateOutRate !== 0.0) {
			this._loader.render(camera, this._modelMatrix, mouse, this._time);
		}
	}
	animateIn() {
		if (!appModel.isLoaded) this._loader.animateIn();

		this._setMouseEvent();
	}
	addGui(gui) {
		this._testAnimateIn = this._testAnimateIn.bind(this);
		this._testAnimateOut = this._testAnimateOut.bind(this);
		let worksThumbnailGUI = gui.addFolder('worksThumbnail');
		worksThumbnailGUI.add(this, '_testAnimateIn');
		worksThumbnailGUI.add(this, '_testAnimateOut');
	}

	resize() {}
	_testAnimateIn() {
		if (this._plane) this._plane.animateIn();
		if (this._outPlane) this._outPlane.animateOut();
	}
	_testAnimateOut() {
		if (this._plane) this._plane.animateOut();
		if (this._outPlane) this._outPlane.animateIn();
	}
}
