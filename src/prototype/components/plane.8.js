const EventEmitter = require('wolfy87-eventemitter');
const Delaunator = require('delaunator');
const TweenLite = require('gsap/TweenLite');

import { mat4 } from 'gl-matrix/src/gl-matrix';
import { DebugPlane } from './debugPlane';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';

import { randomFloat } from 'tubugl-utils/src/mathUtils';
import { testPoints } from './data/aboutData';
import { workData } from './data/workData';

import { InteractiveShape } from './sub/interactiveShape';
import { NormalShape } from './sub/normalShape';
import { TransitionShape } from './sub/transitionShape';

export class Plane extends EventEmitter {
	/**
	 *
	 * @param {*} gl
	 * @param {*} width
	 * @param {*} height
	 * @param {*} widthSegment
	 * @param {*} heightSegment
	 * @param {*} params
	 */
	constructor(gl, width = 100, height = 100, widthSegment = 1, heightSegment = 1, params = {}) {
		super();

		this.startIntro = this.startIntro.bind(this);

		this.position = new Vector3();
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this._isGl2 = params.isGl2;

		this._gl = gl;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'
		this._introRate = 0;

		this._width = width;
		this._height = height;
		this._widthSegment = widthSegment;
		this._heightSegment = heightSegment;

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = true;
		this._isTransparent = !!params.isTransparent;

		this._makeShapes();
		this._makeTransitionShape();

		this._isDebug = false;
		if (this._isDebug) this._makeDebugPlane();
	}
	startIntro() {
		TweenLite.fromTo(
			this,
			4,
			{
				_introRate: 0
			},
			{
				_introRate: 1
			}
		);
	}
	setPosition(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.position.x = x;
		if (y !== undefined) this.position.y = y;
		if (z !== undefined) this.position.z = z;

		return this;
	}

	setRotation(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.rotation.x = x;
		if (y !== undefined) this.rotation.y = y;
		if (z !== undefined) this.rotation.z = z;

		return this;
	}

	_makeDebugPlane() {
		this._debugObjArr = [];
		let plane = new DebugPlane(this._gl, 200, 40, 1, 1, {
			isTransparent: true
		});
		plane.position.y = 40;
		this._debugObjArr.push(plane);

		let plane2 = new DebugPlane(this._gl, 210, 40, 1, 1, {
			isTransparent: true
		});
		plane2.position.y = -40;
		this._debugObjArr.push(plane2);
	}

	_makeShapes() {
		let points = [];
		let indexNum = 0;
		let indicesColor = {};

		for (let j = -1; j <= 1; j++) {
			for (let ii = -6; ii <= 6; ii++) {
				points.push([
					20 * ii + randomFloat(-5, 5),
					randomFloat(-5, 5) * (Math.abs(j) + 1) + 35 * j
				]);
				indicesColor[indexNum++] = 'normal';
			}
		}

		for (let xx = -9; xx < 9; xx++) {
			for (let yy = -10; yy <= 3; yy++) {
				let theta = xx / 9 * Math.PI + randomFloat(-0.2, 0.2);
				let rad = (11 + yy) * (30 + yy) + randomFloat(-10 * (yy + 11), 10 * (yy + 11)) + 40;

				let isInsideInteractiveAreas = false;
				let xPos = rad * Math.cos(theta);
				let yPos = rad * Math.sin(theta);

				if (!isInsideInteractiveAreas) points.push([xPos, yPos]);
				indicesColor[indexNum++] = 'normal';
			}
		}

		for (let ii = 0; ii < testPoints.length; ii++) {
			points.push([testPoints[ii][0], testPoints[ii][1] + 15]);
			indicesColor[indexNum++] = 'about';
		}
		for (let ii = 0; ii < workData.length; ii++) {
			points.push([workData[ii][0], workData[ii][1] - 15]);
			indicesColor[indexNum++] = 'works';
		}

		// ----------------------------------

		var delaunay = new Delaunator(points);
		let coords = new Float32Array(delaunay.coords.length * 1.5);
		let thetaVelocityArr = new Float32Array(delaunay.coords.length);
		let thetaArr = new Float32Array(delaunay.coords.length * 1.5);

		for (var ii = 0; ii < delaunay.coords.length / 2; ii++) {
			coords[3 * ii] = delaunay.coords[2 * ii];
			coords[3 * ii + 1] = delaunay.coords[2 * ii + 1];
			if (indicesColor[ii] == 'normal') coords[3 * ii + 2] = randomFloat(0, 20);
			else coords[3 * ii + 2] = randomFloat(-5, 5);

			thetaVelocityArr[2 * ii] = randomFloat(0, 2 * Math.PI);

			thetaArr[3 * ii] = randomFloat(0, 2 * Math.PI);
			thetaArr[3 * ii + 1] = randomFloat(0, 2 * Math.PI);

			if (indicesColor[ii] == 'normal') thetaArr[3 * ii + 2] = 2;
			else thetaArr[3 * ii + 2] = 2;
		}

		let indices = delaunay.triangles;

		this._normalShape = new NormalShape(this._gl);
		this._aboutShape = new InteractiveShape(this._gl, {
			name: 'about'
		});
		this._aboutShape.setInteractiveArea(0, -40, 220, 50);
		this._worksShape = new InteractiveShape(this._gl, {
			name: 'works'
		});
		this._worksShape.setInteractiveArea(0, 40, 220, 50);

		for (let ii = 0; ii < indices.length; ii += 3) {
			let indice0 = indices[ii];
			let indice1 = indices[ii + 1];
			let indice2 = indices[ii + 2];

			if (
				indicesColor[indice0] == 'about' &&
				indicesColor[indice1] == 'about' &&
				indicesColor[indice2] == 'about'
			) {
				this._aboutShape.addPt(
					[indice0, indice1, indice2],
					coords,
					thetaArr,
					thetaVelocityArr
				);
			} else if (
				indicesColor[indice0] == 'works' &&
				indicesColor[indice1] == 'works' &&
				indicesColor[indice2] == 'works'
			) {
				this._worksShape.addPt(
					[indice0, indice1, indice2],
					coords,
					thetaArr,
					thetaVelocityArr
				);
			} else {
				this._normalShape.addPt(
					[indice0, indice1, indice2],
					coords,
					thetaArr,
					thetaVelocityArr
				);
			}
		}

		this._normalShape.initialize();
		this._aboutShape.initialize();
		this._worksShape.initialize();
	}

	_makeTransitionShape() {
		this._transitionShape = new TransitionShape(this._gl);
		this._transitionShape.setInteractiveArea(0, -40, 220, 50);
	}

	_updateAttributres() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._thetaVelocityBuffer.bind().attribPointer(this._program);
			this._thetaBuffer.bind().attribPointer(this._program);
			this._colorBuffer.bind().attribPointer(this._program);
			this._color2Buffer.bind().attribPointer(this._program);
			this._initPositionBuffer.bind().attribPointer(this._program);
		}
	}

	render(camera, mouse) {
		if (!this._time) this._time = 1 / 60;
		else this._time += 1 / 500;

		this._normalShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);
		this._aboutShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);
		this._worksShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);
		this._transitionShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);

		if (this._isDebug && this._debugObjArr) {
			this._debugObjArr.forEach(debugObj => {
				debugObj.render();
			});
		}
	}

	resize(width = window.innerWidth, height = window.innerHeight) {
		if (this._isDebug && this._debugObjArr) {
			this._debugObjArr.forEach(obj => {
				obj.resize(width, height);
			});
		}

		this._aboutShape.resize(width, height);
		this._worksShape.resize(width, height);
		this._transitionShape.resize(width, height);
	}

	addGui(gui) {
		this._testAbout = this._testAbout.bind(this);
		gui.add(this, 'startIntro');
		gui.add(this, '_testAbout');
	}
	_testAbout() {
		this._transitionShape.testAbout();
	}
	_updateModelMatrix() {
		if (
			!this._isNeedUpdate &&
			!this.position.needsUpdate &&
			!this.rotation.needsMatrixUpdate &&
			!this.scale.needsUpdate
		)
			return;

		mat4.fromTranslation(this._modelMatrix, this.position.array);
		mat4.scale(this._modelMatrix, this._modelMatrix, this.scale.array);

		this.rotation.updateMatrix();
		mat4.multiply(this._modelMatrix, this._modelMatrix, this.rotation.matrix);

		this._isNeedUpdate = false;
		this.position.needsUpdate = false;
		this.scale.needsUpdate = false;

		return this;
	}
	click() {
		this._transitionShape.click();
	}
}
