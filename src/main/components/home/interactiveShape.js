const EventEmitter = require('wolfy87-eventemitter');
import { Program, ArrayBuffer } from 'tubugl-core';
import {
	CULL_FACE,
	BACK,
	FRONT,
	DEPTH_TEST,
	BLEND,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	TRIANGLES
} from 'tubugl-constants';
import { randomFloat, mix, clamp } from 'tubugl-utils/src/mathUtils';

const vertexShaderSrc = require('./shaders/interactiveShape.vert');
const fragmentShaderSrc = require('./shaders/interactiveShape.frag');

export class InteractiveShape extends EventEmitter {
	/**
	 *
	 * @param {*} gl
	 * @param {{name: string}} params
	 */
	constructor(
		gl,
		params = {
			name: 'default'
		}
	) {
		super();
		this.name = params.name;

		this._gl = gl;
		this._side = 'double';
		this._isDesktop = true;
		this._isRollover = false;
		this._rollOverrate = 0;
		this._rolloutrate = 0;
		this._minArea = 999999;
		this._maxArea = -this._minArea;
		this._coords = [];
		this._colors = [];
		this._color2s = [];
		this._thetas = [];
		this._thetaVelocities = [];
		this._initPositionArr = [];
		this._areas = [];
		this._interactiveArea = null;
	}

	addPt(indice, coords, thetaArr, thetaVelocityArr) {
		let x0 = coords[3 * indice[0]];
		let y0 = coords[3 * indice[0] + 1];
		let x1 = coords[3 * indice[1]];
		let y1 = coords[3 * indice[1] + 1];
		let x2 = coords[3 * indice[2]];
		let y2 = coords[3 * indice[2] + 1];
		let dX01 = x0 - x1;
		let dY01 = y0 - y1;
		let side0 = Math.sqrt(dX01 * dX01 + dY01 * dY01);
		let dX12 = x1 - x2;
		let dY12 = y1 - y2;
		let side1 = Math.sqrt(dX12 * dX12 + dY12 * dY12);
		let dX20 = x2 - x0;
		let dY20 = y2 - y0;
		let side2 = Math.sqrt(dX20 * dX20 + dY20 * dY20);
		let sp = (side0 + side1 + side2) / 2;
		let area = Math.sqrt(sp * (sp - side0) * (sp - side1) * (sp - side2));
		let mixRate = 1.0 - clamp((area - 0.6) * 6.0, 0.0, 1.0);
		let center = (x0 + x1 + x2) / 3;

		if (this._minArea > area) this._minArea = area;
		if (this._maxArea < area) this._maxArea = area;

		let randX = randomFloat(0, 0),
			randY = randomFloat(0, 0),
			randZ = randomFloat(-20, 0);

		for (let kk = 0; kk < 3; kk++) {
			let rand = randomFloat(0, 0.1) + 0.85;
			let colorRate = mix(1.0, 0.5, mixRate);
			let colorRate2 = mix(1.0, 0.4, mixRate);
			let blue1 = mix(rand, 1.0, mixRate);

			this._colors.push(rand * colorRate, rand * colorRate, blue1);
			this._color2s.push(rand * colorRate2, rand * colorRate2, blue1);

			this._initPositionArr.push(
				randX + randomFloat(-10, 10),
				randY + randomFloat(-10, 10),
				randZ
			);

			this._areas.push(area);
		}

		let introRad = center / 30 + 1.8;

		indice.forEach(index => {
			this._coords.push(coords[3 * index], coords[3 * index + 1], coords[3 * index + 2]);

			this._thetas.push(
				thetaArr[3 * index],
				thetaArr[3 * index + 1],
				thetaArr[3 * index + 2]
			);

			this._thetaVelocities.push(thetaVelocityArr[2 * index + 0], introRad);
		});
	}

	setInteractiveArea(xx, yy, width, height) {
		this._glInteractiveArea = {
			x: xx,
			y: yy,
			width: width,
			height: height
		};
	}

	resize(windowWidth, windowHeight) {
		this._area = {
			left: this._glInteractiveArea.x - this._glInteractiveArea.width / 2 + windowWidth / 2,
			right: this._glInteractiveArea.x + this._glInteractiveArea.width / 2 + windowWidth / 2,
			top: this._glInteractiveArea.y - this._glInteractiveArea.height / 2 + windowHeight / 2,
			bottom:
				this._glInteractiveArea.y + this._glInteractiveArea.height / 2 + windowHeight / 2
		};
	}

	initialize() {
		this._makeProgram();
		this._makeAttribuetes();
	}

	_makeAttribuetes() {
		this._areas.forEach((area, index) => {
			this._areas[index] = (area - this._minArea) / (this._maxArea - this._minArea);
		});

		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(this._coords));
		this._positionBuffer.setAttribs('position', 3);

		this._thetaBuffer = new ArrayBuffer(this._gl, new Float32Array(this._thetas));
		this._thetaBuffer.setAttribs('theta', 3);

		this._colorBuffer = new ArrayBuffer(this._gl, new Float32Array(this._colors));
		this._colorBuffer.setAttribs('color', 3);

		this._color2Buffer = new ArrayBuffer(this._gl, new Float32Array(this._color2s));
		this._color2Buffer.setAttribs('color2', 3);

		this._initPositionBuffer = new ArrayBuffer(
			this._gl,
			new Float32Array(this._initPositionArr)
		);
		this._initPositionBuffer.setAttribs('initPosition', 3);

		this._thetaVelocityBuffer = new ArrayBuffer(
			this._gl,
			new Float32Array(this._thetaVelocities)
		);
		this._thetaVelocityBuffer.setAttribs('thetaVel', 2);

		this._areaBuffer = new ArrayBuffer(this._gl, new Float32Array(this._areas));
		this._areaBuffer.setAttribs('area', 1);

		this._cnt = this._positionBuffer.dataArray.length / 3;
	}

	_makeProgram() {
		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
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
			this._areaBuffer.bind().attribPointer(this._program);
		}
	}

	_checkRollover(mouse) {}
	render(camera, modelMatrix, introRate, mouse, time) {
		this.update(camera, modelMatrix, introRate, mouse, time).draw();
	}
	update(camera, modelMatrix, introRate, mouse, time) {
		if (this._isDesktop) this._checkRollover(mouse);

		this._program.bind();

		this._updateAttributres();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		this._gl.uniform1f(this._program.getUniforms('uTrans').location, introRate);
		this._gl.uniform2f(this._program.getUniforms('uMouse').location, mouse.x, mouse.y);
		this._gl.uniform1f(this._program.getUniforms('uTime').location, time);

		return this;
	}

	draw() {
		if (this._side === 'double') {
			this._gl.disable(CULL_FACE);
		} else if (this._side === 'front') {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(BACK);
		} else {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(FRONT);
		}

		this._gl.enable(DEPTH_TEST);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		this._gl.enable(BLEND);

		this._gl.drawArrays(TRIANGLES, 0, this._cnt);

		return this;
	}
}
