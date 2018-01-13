const EventEmitter = require('wolfy87-eventemitter');
const Delaunator = require('delaunator');
const isMobile = require('./util/isMobile');

import { TweenLite } from 'gsap/TweenLite';
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { DebugPlane } from './debugPlane';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';

import { randomFloat } from 'tubugl-utils/src/mathUtils';
import { aboutData } from './data/aboutData';
import { workData } from './data/workData';
import { appModel } from './model/appModel';

import { TextShape } from './home/textShape';
import { NormalShape } from './home/normalShape';
import { TransitionShape } from './home/transitionShape';

export class Home extends EventEmitter {
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
		this._introMainTitleRate = 0;

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

		this.isRollover = this.isPrevRollover = false;
	}
	startIntro() {
		TweenLite.to(this, 4, { _introRate: 1 });
		TweenLite.to(this, 3, { _introMainTitleRate: 1 });
	}

	backToHome() {
		if (appModel.prevPage === 'about') this._aboutTransitionShape.backToHome();
		else this._workTransitionShape.backToHome();
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

		let yMax = isMobile ? -4 : 3;
		for (let xx = -9; xx < 9; xx++) {
			for (let yy = -10; yy <= yMax; yy++) {
				let theta = xx / 9 * Math.PI + randomFloat(-0.2, 0.2);
				let rad =
					(11 + yy) * (40 + 2 * yy) + randomFloat(-10 * (yy + 11), 10 * (yy + 11)) + 40;

				let isInsideInteractiveAreas = false;
				let xPos = rad * Math.cos(theta);
				let yPos = rad * Math.sin(theta);

				if (!isInsideInteractiveAreas) points.push([xPos, yPos]);
				indicesColor[indexNum++] = 'normal';
			}
		}

		for (let ii = 0; ii < aboutData.length; ii++) {
			points.push([aboutData[ii][0], aboutData[ii][1] + 15]);
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

		for (let ii = 0; ii < delaunay.coords.length / 2; ii++) {
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
		this._textShape = new TextShape(this._gl, {
			name: 'about'
		});

		for (let ii = 0; ii < indices.length; ii += 3) {
			let indice0 = indices[ii];
			let indice1 = indices[ii + 1];
			let indice2 = indices[ii + 2];

			if (
				(indicesColor[indice0] == 'about' &&
					indicesColor[indice1] == 'about' &&
					indicesColor[indice2] == 'about') ||
				(indicesColor[indice0] == 'works' &&
					indicesColor[indice1] == 'works' &&
					indicesColor[indice2] == 'works')
			) {
				this._textShape.addPt(
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
		this._textShape.initialize();
	}

	_makeTransitionShape() {
		this._aboutTransitionShape = new TransitionShape(this._gl, { name: 'about' });
		this._aboutTransitionShape.setInteractiveArea(0, -40, 220, 50);

		this._workTransitionShape = new TransitionShape(this._gl, { name: 'works' }, 0, -14);
		this._workTransitionShape.setInteractiveArea(0, 40, 220, 50);

		this._transitionShapes = [this._aboutTransitionShape, this._workTransitionShape];
	}

	render(camera, mouse) {
		let isRollover = false;

		if (!this._time) this._time = 1 / 60;
		else this._time += 1 / 500;

		this._normalShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);
		/** 
		this._aboutShape.render(
			camera,
			this._modelMatrix,
			this._introMainTitleRate,
			mouse,
			this._time
		);
		this._worksShape.render(
			camera,
			this._modelMatrix,
			this._introMainTitleRate,
			mouse,
			this._time
		);*/
		this._textShape.render(
			camera,
			this._modelMatrix,
			this._introMainTitleRate,
			mouse,
			this._time
		);
		this._transitionShapes.forEach(transitionShape => {
			transitionShape.render(camera, this._modelMatrix, this._introRate, mouse, this._time);
			if (transitionShape.getRollOVer()) isRollover = true;
		});

		this.isPrevRollover = this.isRollover;

		if (isRollover) {
			this.isRollover = true;
		} else {
			this.isRollover = false;
		}

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

		this._textShape.resize(width, height);
		this._transitionShapes.forEach(transitionShape => {
			transitionShape.resize(width, height);
		});
	}

	addGui(gui) {
		this._testAbout = this._testAbout.bind(this);
		gui.add(this, 'startIntro');
		gui.add(this, '_testAbout');
	}
	_testAbout() {
		this._aboutTransitionShape.testAbout();
	}
	click() {
		this._transitionShapes.forEach(transitionShape => {
			transitionShape.click();
		});
	}
	touch(mouse) {
		this._transitionShapes.forEach(transitionShape => {
			transitionShape.checkRollover(mouse);
		});
		this._transitionShapes.forEach(transitionShape => {
			transitionShape.click();
		});
	}
}
