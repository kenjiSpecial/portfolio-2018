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

const vertexShaderSrc = require('./shaders/normalShape.vert');
const fragmentShaderSrc = require('./shaders/normalShape.frag');

export class NormalShape {
	constructor(gl) {
		this.name = 'normal';
		this._gl = gl;
		this._side = 'double';
		this._coords = [];
		this._colors = [];
		this._color2s = [];
		this._thetas = [];
		this._thetaVelocities = [];
		this._initPositionArr = [];
	}
	addPt(indice, coords, thetaArr, thetaVelocityArr) {
		let randX = randomFloat(0, 0),
			randY = randomFloat(0, 0),
			randZ = randomFloat(0, 0);

		for (let kk = 0; kk < 3; kk++) {
			let rand = randomFloat(0, 0.1) + 0.85;
			this._colors.push(rand, rand, rand);
			rand = randomFloat(0, 0.1) + 0.75;
			this._color2s.push(rand, rand, rand);
			this._initPositionArr.push(randX, randY, randZ);
		}

		let center = {
			x: 0,
			y: 0
		};
		let introRad = randomFloat(0, 1);
		indice.forEach((index, num) => {
			this._coords.push(coords[3 * index], coords[3 * index + 1], coords[3 * index + 2]);
			center.x += coords[3 * index] / 3;
			center.y += coords[3 * index + 1] / 3;

			this._thetas.push(
				thetaArr[3 * index],
				thetaArr[3 * index + 1],
				thetaArr[3 * index + 2]
			);

			this._thetaVelocities.push(thetaVelocityArr[2 * index + 0], introRad);
		});
	}
	initialize() {
		this._makeProgram();
		this._makeAttribuetes();
	}
	_makeAttribuetes() {
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
		}
	}
	render(camera, modelMatrix, introRate, mouse, time) {
		this.update(camera, modelMatrix, introRate, mouse, time).draw();
	}
	update(camera, modelMatrix, introRate, mouse, time) {
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
