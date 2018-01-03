/**
 * make demo with rendering of plane(webgl)
 */

const dat = require('dat.gui/build/dat.gui.min');
const TweenLite = require('gsap/TweenLite');
const Stats = require('stats.js');

import { DEPTH_TEST } from 'tubugl-constants';
// import { ProceduralRoundingCube } from 'tubugl-3d-shape';
// import { NormalHelper, GridHelper } from 'tubugl-helper';
import { Plane } from './components/plane.1';
import { PerspectiveCamera, CameraController } from 'tubugl-camera';

export default class App {
	constructor(params = {}) {
		this._isMouseDown = false;
		this._isPlaneAnimation = false;
		this._width = params.width ? params.width : window.innerWidth;
		this._height = params.height ? params.height : window.innerHeight;

		this.canvas = document.createElement('canvas');
		this.gl = this.canvas.getContext('webgl');
		this.gl.getExtension('OES_element_index_uint');

		this._setClear();
		// this._makeBox();
		this._makePlane();
		this._makeCamera();
		this._makeCameraController();

		this.resize(this._width, this._height);

		if (params.isDebug) {
			this.stats = new Stats();
			document.body.appendChild(this.stats.dom);
			this._addGui();
		}
	}

	animateIn() {
		this.isLoop = true;
		TweenLite.ticker.addEventListener('tick', this.loop, this);
	}

	loop() {
		if (this.stats) this.stats.update();

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		// Clear to black, fully opaque
		this.gl.clearColor(0.0, 0.0, 0.0, 1);
		// Clear everything
		this.gl.clearDepth(1.0);
		// Enable depth testing
		this.gl.enable(this.gl.DEPTH_TEST);
		// Near things obscure far things
		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		this._camera.time += 1 / 60;

		this._camera.update();
		this._plane.render(this._camera);
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
		this._plane = new Plane(this.gl, 200, 200, 20, 20, { isWire: false });
	}

	_makeCameraController() {
		this._cameraController = new CameraController(this._camera, this.canvas);
		this._cameraController.minDistance = 10;
		this._cameraController.maxDistance = 1000;
	}
	_makeCamera() {
		this._camera = new PerspectiveCamera(window.innerWidth, window.innerHeight, 60, 1, 2000);
		this._camera.position.z = 250;
	}

	_addGui() {
		this.gui = new dat.GUI();
		this.playAndStopGui = this.gui.add(this, '_playAndStop').name('pause');
		// this._boxGUIFolder = this.gui.addFolder('rounding  cube');
		// this._box.addGui(this._boxGUIFolder);
		// this._boxGUIFolder.open();
	}
}
