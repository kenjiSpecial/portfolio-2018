/**
 * make demo with rendering of plane(webgl)
 */

const dat = require('dat.gui/build/dat.gui.min');
const TweenLite = require('gsap/TweenLite');
const Stats = require('stats.js');

import { DEPTH_TEST } from 'tubugl-constants';
import { Plane } from './components/plane.6';
import { PerspectiveCamera, CameraController } from 'tubugl-camera';

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
		this._makePlane();
		this._makeCamera();

		this._mouse = { x: -999, y: -999 };
		this._targetMouse = { x: -999, y: -999 };

		this._angle = { theta: 0, phi: 0 };
		this._targetAngle = { theta: 0, phi: 0 };

		this.resize(this._width, this._height);

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		}

		this.canvas.addEventListener('mousemove', event => {
			let xRate = (event.clientX - this._width / 2) / (this._width / 2);
			let yRate = (-event.clientY + this._height / 2) / (this._height / 2);

			this._targetMouse = { x: xRate, y: yRate };

			let theta = this._targetMouse.x / 12;
			let phi = this._targetMouse.y / 10;
			this._targetAngle.theta = theta;
			this._targetAngle.phi = phi;
		});
	}

	animateIn() {
		this.isLoop = true;
		this._plane.startIntro();
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		// Clear to black, fully opaque
		this.gl.clearColor(0.9, 0.9, 0.9, 1);
		// Clear everything
		this.gl.clearDepth(1.0);
		// Enable depth testing
		this.gl.enable(this.gl.DEPTH_TEST);
		// Near things obscure far things
		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this._camera.time += 1 / 60;

		this._angle.theta += (this._targetAngle.theta - this._angle.theta) / 10;
		this._angle.phi += (this._targetAngle.phi - this._angle.phi) / 10;
		this._camera.position.z = 300 * Math.cos(this._angle.theta) * Math.cos(this._angle.phi);
		this._camera.position.x = 300 * Math.sin(this._angle.theta) * Math.cos(this._angle.phi);
		this._camera.position.y = 300 * Math.sin(this._angle.phi);
		this._camera.lookAt([0, 0, 0]);
		this._camera.update();

		if (this._mouse.x === -999) this._mouse.x = this._targetMouse.x;
		else this._mouse.x += (this._targetMouse.x - this._mouse.x) / 10;
		if (this._mouse.y === -999) this._mouse.y = this._targetMouse.y;
		else this._mouse.y += (this._targetMouse.y - this._mouse.y) / 10;
		this._plane.render(this._camera, this._mouse);
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

		this.canvas.width = this._width;
		this.canvas.height = this._height;
		this.gl.viewport(0, 0, this._width, this._height);

		this._plane.resize(this._width, this._height);
		this._camera.updateSize(this._width, this._height);
	}

	destroy() {}

	_setClear() {
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.enable(DEPTH_TEST);
	}

	_makePlane() {
		this._plane = new Plane(this.gl, 200, 200, 20, 20, {
			isWire: false,
			side: 'back',
			isTransparent: true
		});
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
		this._cameraController.minDistance = 10;
		this._cameraController.maxDistance = 1000;
	}
	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.position.z = 300;
		this._camera.lookAt([0, 0, 0]);
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		// this._boxGUIFolder = this.gui.addFolder('rounding  cube');
		this._plane.addGui(this.gui);
		// this._boxGUIFolder.open();
	}
}
