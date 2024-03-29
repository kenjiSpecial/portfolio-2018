/**
 * make demo with rendering of plane(webgl)
 */

import { DEPTH_TEST } from 'tubugl-constants';
import { Home } from './components/home';
import { WorksThumbnail } from './components/worksThumbnail';
import { PerspectiveCamera } from 'tubugl-camera';
import { appModel } from './components/model/appModel';
const isMobile = require('./components/util/isMobile');
const WinHeight = 950;

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._isPlaneAnimation = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl', { antialias: true, alpha: false });
		this.gl.getExtension('OES_element_index_uint');

		this._setClear();
		this._makeHome();
		this._makeWorkThumbnail();
		this._makeCamera();

		this._mouse = { x: 0, y: 0, windowX: -9999, windowY: -9999 };
		this._targetMouse = { x: 0, y: 0, windowX: -9999, windowY: -9999 };

		this._angle = { theta: 0, phi: 0 };
		this._targetAngle = { theta: 0, phi: 0 };

		this.resize(this._width, this._height);

		if (params.isDebug) {
			// this.stats = new Stats();
			// document.body.appendChild(this.stats.dom);
			// this._addGui();
		}

		if (isMobile) {
			// window.addEventListener('deviceorientation', event => {
			// 	var y = event.beta; // In degree in the range [-180,180]
			// 	var x = event.gamma; // In degree in the range [-90,90]
			// 	if (y > 90) y = 90;
			// 	if (y < 0) y = 0;

			// 	let scaleX, scaleY, maxX, maxY;
			// 	if (appModel.page == 'home') {
			// 		scaleX = 2.0;
			// 		scaleY = 1.0;
			// 		maxX = 0.4;
			// 		maxY = 0.4;
			// 	} else {
			// 		scaleX = 1.0;
			// 		scaleY = 0.5;
			// 		maxX = 200 / this._width;
			// 		maxY = 200 / this._height;
			// 	}
			// 	this._targetMouse.x = ((-x + 90) / 180 - 0.5) * scaleX;
			// 	this._targetMouse.y = (-y / 45 + 1) * scaleY;

			// 	if (this._targetMouse.x < -maxX) this._targetMouse.x = -maxX;
			// 	else if (this._targetMouse.x > maxX) this._targetMouse.x = maxX;

			// 	if (this._targetMouse.y < -maxY) this._targetMouse.y = -maxY;
			// 	else if (this._targetMouse.y > maxY) this._targetMouse.y = maxY;

			// 	let theta = this._targetMouse.x / 2;
			// 	let phi = this._targetMouse.y / 2;
			// 	this._targetAngle.theta = theta;
			// 	this._targetAngle.phi = phi;
			// });

			this.canvas.addEventListener('touchmove', event => {
				event.preventDefault();

				this._targetMouse.windowX = event.touches[0].clientX;
				this._targetMouse.windowY = event.touches[0].clientY;

				this._targetMouse.x =
					(this._targetMouse.windowX - this._width / 2) / (this._width / 2);
				this._targetMouse.y =
					(-this._targetMouse.windowY + this._height / 2) / (this._height / 2);

				this._mouse.windowX = this._targetMouse.windowX;
				this._mouse.windowY = this._targetMouse.windowY;

				this._targetAngle.theta = this._targetMouse.x / 10;
				this._targetAngle.phi = this._targetMouse.y / 10;
			});

			this.canvas.addEventListener('touchstart', event => {
				this._targetMouse.windowX = event.touches[0].clientX;
				this._targetMouse.windowY = event.touches[0].clientY;

				this._mouse.windowX = event.touches[0].clientX;
				this._mouse.windowY = event.touches[0].clientY;
				this._targetMouse.x =
					(this._targetMouse.windowX - this._width / 2) / (this._width / 2);
				this._targetMouse.y =
					(-this._targetMouse.windowY + this._height / 2) / (this._height / 2);

				this._targetAngle.theta = this._targetMouse.x / 10;
				this._targetAngle.phi = this._targetMouse.y / 10;
				this._startTime = +new Date();
			});

			this.canvas.addEventListener('touchend', event => {
				if (appModel.page === 'home') {
					let duration = +new Date() - this._startTime;
					if (duration < 300) this._home.touch(this._mouse);
				}
			});
		} else {
			document.body.addEventListener('mousemove', event => {
				let xRate = (event.clientX - this._width / 2) / (this._width / 2);
				let yRate = (-event.clientY + this._height / 2) / (this._height / 2);

				this._targetMouse = {
					x: xRate,
					y: yRate,
					windowX: event.clientX,
					windowY: event.clientY
				};

				this._mouse.windowX = this._targetMouse.windowX;
				this._mouse.windowY = this._targetMouse.windowY;

				let theta = this._targetMouse.x / 10;
				let phi = this._targetMouse.y / 10;
				this._targetAngle.theta = theta;
				this._targetAngle.phi = phi;
			});

			this._clickHandler = this._clickHandler.bind(this);
		}
	}
	_clickHandler() {
		if (appModel.page === 'home') this._home.click();
	}

	animateIn() {
		this.isLoop = true;
		this._home.startIntro();
		this._loopTime = +new Date();
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	worksAnimateIn() {
		this._worksThumbnail.animateIn();
	}

	worksAnimateOut() {
		this._worksThumbnail.animateOut();
	}

	loop() {
		if (this.stats) this.stats.update();
		let time = +new Date();
		let del = (time - this._loopTime) / 1000;
		// console.log(del);
		this._loopTime = time;

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(1.0, 1.0, 1.0, 1);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this._camera.time += del;

		this._angle.theta += (this._targetAngle.theta - this._angle.theta) / 10;
		this._angle.phi += (this._targetAngle.phi - this._angle.phi) / 10;
		this._camera.position.z = 300 * Math.cos(this._angle.theta) * Math.cos(this._angle.phi);
		this._camera.position.x = 300 * Math.sin(this._angle.theta) * Math.cos(this._angle.phi);
		this._camera.position.y = 300 * Math.sin(this._angle.phi);
		this._camera.lookAt([0, 0, 0]);
		this._camera.update();

		let inc = isMobile ? 8 : 6;
		this._mouse.x += (this._targetMouse.x - this._mouse.x) / inc;
		this._mouse.y += (this._targetMouse.y - this._mouse.y) / inc;

		// render home
		if (appModel.page == 'home' || (appModel.prevPage == 'home' && appModel.isPageTransition))
			this._home.render(this._camera, this._mouse, del);

		// render works thumbnail
		if (
			appModel.page == 'works' ||
			(appModel.prevPage == 'works' && appModel.isPageTransition)
		) {
			this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
			this._worksThumbnail.render(this._camera, this._mouse, del);
		}

		if (appModel.page === 'home') {
			if (this._home.isRollover && !this._home.isPrevRollover) {
				this.canvas.style.cursor = 'pointer';
			} else if (!this._home.isRollover && this._home.isPrevRollover) {
				this.canvas.style.cursor = 'default';
			}
		}
	}

	animateOut() {
		TweenLite.ticker.removeEventListener('tick', this.loop, this);
	}

	mouseMoveHandler(mouse) {
		if (!this._isMouseDown) return;

		const PI_TWO = Math.PI * 2;
		this._camera.theta += (mouse.x - this._prevMouse.x) * -PI_TWO;
		this._camera.phi += (mouse.y - this._prevMouse.y) * -PI_TWO;

		this._prevMouse = mouse;
	}

	mouseDownHandler(mouse) {
		this._isMouseDown = true;
		this._prevMouse = mouse;
	}

	mouseupHandler() {
		this._isMouseDown = false;
	}

	onKeyDown(ev) {
		switch (ev.which) {
			case 27:
				this._playAndStop();
				break;
		}
	}

	_playAndStop() {
		this.isLoop = !this.isLoop;
		if (this.isLoop) {
			TweenLite.ticker.addEventListener('tick', this.loop, this);
			this.playAndStopGui.name('pause');
		} else {
			TweenLite.ticker.removeEventListener('tick', this.loop, this);
			this.playAndStopGui.name('play');
		}
	}

	resize(width, height) {
		this._width = width;
		this._height = height;

		let pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;
		this.canvas.width = this._width * pixelRatio;
		this.canvas.height = this._height * pixelRatio;
		this.canvas.style.width = `${this._width}px`;
		this.canvas.style.height = `${this._height}px`;

		this.gl.viewport(0, 0, this._width, this._height);

		let tanFOV = Math.tan(Math.PI / 180 * 60 / 2);
		this._camera.updateFov(
			360 / Math.PI * Math.atan(tanFOV * (window.innerHeight / WinHeight)),
			false
		);
		this._camera.updateSize(this._width, this._height);

		this._home.resize(this._width, this._height);
		this._worksThumbnail.resize();
	}

	destroy() {}

	_setClear() {
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(DEPTH_TEST);
	}

	_makeHome() {
		this._home = new Home(this.gl, 200, 200, 20, 20, {
			isWire: false,
			side: 'back',
			isTransparent: true
		});
	}

	_makeWorkThumbnail() {
		this._worksThumbnail = new WorksThumbnail(this.gl);
	}

	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.position.z = 300;
		this._camera.lookAt([0, 0, 0]);
	}

	_addGui() {
		// this.gui = new dat.GUI();
		// this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		// this._home.addGui(this.gui);
		// this._worksThumbnail.addGui(this.gui);
	}

	backToHome() {
		this._home.backToHome();
		if (!isMobile) this.canvas.addEventListener('click', this._clickHandler);
	}

	updateRotationHome() {
		this._home.updateRotation();
	}

	removeClickEvent() {
		if (!isMobile) this.canvas.removeEventListener('click', this._clickHandler);
	}
}
