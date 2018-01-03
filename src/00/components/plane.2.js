const EventEmitter = require('wolfy87-eventemitter');
const Delaunator = require('delaunator');
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { base2ShaderVertSrc, base2ShaderFragSrc, wireFrameFragSrc } from './shaders/base.shader';
import { Program, ArrayBuffer, IndexArrayBuffer, VAO } from 'tubugl-core';
import {
	CULL_FACE,
	FRONT,
	BACK,
	TRIANGLES,
	UNSIGNED_SHORT,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE,
	ZERO,
	BLEND,
	LINES,
	UNSIGNED_INT
} from 'tubugl-constants';
import { generateWireframeIndices } from 'tubugl-utils';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';
// import { testPoints } from './testData';
let testPoints = [
	[-2, 9],
	[-1, 9],
	[0, 9],
	[1, 9],
	[-30, 8],
	[-29, 8],
	[-28, 8],
	[-27, 8],
	[-20, 8],
	[-19, 8],
	[-18, 8],
	[-17, 8],
	[-16, 8],
	[-15, 8],
	[-14, 8],
	[-13, 8],
	[-12, 8],
	[-11, 8],
	[-4, 8],
	[-3, 8],
	[-2, 8],
	[-1, 8],
	[0, 8],
	[1, 8],
	[2, 8],
	[3, 8],
	[9, 8],
	[10, 8],
	[11, 8],
	[18, 8],
	[19, 8],
	[20, 8],
	[21, 8],
	[22, 8],
	[23, 8],
	[24, 8],
	[25, 8],
	[26, 8],
	[27, 8],
	[28, 8],
	[29, 8],
	[30, 8],
	[31, 8],
	[32, 8],
	[33, 8],
	[34, 8],
	[-30, 7],
	[-29, 7],
	[-28, 7],
	[-27, 7],
	[-26, 7],
	[-20, 7],
	[-19, 7],
	[-18, 7],
	[-17, 7],
	[-16, 7],
	[-15, 7],
	[-14, 7],
	[-13, 7],
	[-12, 7],
	[-11, 7],
	[-10, 7],
	[-5, 7],
	[-4, 7],
	[-3, 7],
	[-2, 7],
	[-1, 7],
	[0, 7],
	[1, 7],
	[2, 7],
	[3, 7],
	[4, 7],
	[5, 7],
	[9, 7],
	[10, 7],
	[11, 7],
	[18, 7],
	[19, 7],
	[20, 7],
	[21, 7],
	[22, 7],
	[23, 7],
	[24, 7],
	[25, 7],
	[26, 7],
	[27, 7],
	[28, 7],
	[29, 7],
	[30, 7],
	[31, 7],
	[32, 7],
	[33, 7],
	[34, 7],
	[-31, 6],
	[-30, 6],
	[-29, 6],
	[-28, 6],
	[-27, 6],
	[-26, 6],
	[-20, 6],
	[-19, 6],
	[-18, 6],
	[-17, 6],
	[-16, 6],
	[-15, 6],
	[-14, 6],
	[-13, 6],
	[-12, 6],
	[-11, 6],
	[-10, 6],
	[-6, 6],
	[-5, 6],
	[-4, 6],
	[-3, 6],
	[-2, 6],
	[-1, 6],
	[0, 6],
	[1, 6],
	[2, 6],
	[3, 6],
	[4, 6],
	[5, 6],
	[9, 6],
	[10, 6],
	[11, 6],
	[18, 6],
	[19, 6],
	[20, 6],
	[21, 6],
	[22, 6],
	[23, 6],
	[24, 6],
	[25, 6],
	[26, 6],
	[27, 6],
	[28, 6],
	[29, 6],
	[30, 6],
	[31, 6],
	[32, 6],
	[33, 6],
	[34, 6],
	[-31, 5],
	[-30, 5],
	[-29, 5],
	[-28, 5],
	[-27, 5],
	[-26, 5],
	[-20, 5],
	[-19, 5],
	[-18, 5],
	[-12, 5],
	[-11, 5],
	[-10, 5],
	[-9, 5],
	[-7, 5],
	[-6, 5],
	[-5, 5],
	[-4, 5],
	[-3, 5],
	[3, 5],
	[4, 5],
	[5, 5],
	[6, 5],
	[9, 5],
	[10, 5],
	[11, 5],
	[18, 5],
	[19, 5],
	[20, 5],
	[21, 5],
	[27, 5],
	[28, 5],
	[29, 5],
	[-32, 4],
	[-31, 4],
	[-30, 4],
	[-29, 4],
	[-28, 4],
	[-27, 4],
	[-26, 4],
	[-25, 4],
	[-20, 4],
	[-19, 4],
	[-18, 4],
	[-12, 4],
	[-11, 4],
	[-10, 4],
	[-9, 4],
	[-7, 4],
	[-6, 4],
	[-5, 4],
	[-4, 4],
	[3, 4],
	[4, 4],
	[5, 4],
	[6, 4],
	[9, 4],
	[10, 4],
	[11, 4],
	[18, 4],
	[19, 4],
	[20, 4],
	[21, 4],
	[27, 4],
	[28, 4],
	[29, 4],
	[-32, 3],
	[-31, 3],
	[-30, 3],
	[-29, 3],
	[-28, 3],
	[-27, 3],
	[-26, 3],
	[-25, 3],
	[-20, 3],
	[-19, 3],
	[-18, 3],
	[-13, 3],
	[-12, 3],
	[-11, 3],
	[-10, 3],
	[-8, 3],
	[-7, 3],
	[-6, 3],
	[-5, 3],
	[4, 3],
	[5, 3],
	[6, 3],
	[7, 3],
	[9, 3],
	[10, 3],
	[11, 3],
	[18, 3],
	[19, 3],
	[20, 3],
	[21, 3],
	[27, 3],
	[28, 3],
	[29, 3],
	[-32, 2],
	[-31, 2],
	[-30, 2],
	[-29, 2],
	[-27, 2],
	[-26, 2],
	[-25, 2],
	[-24, 2],
	[-20, 2],
	[-19, 2],
	[-18, 2],
	[-17, 2],
	[-16, 2],
	[-15, 2],
	[-14, 2],
	[-13, 2],
	[-12, 2],
	[-11, 2],
	[-10, 2],
	[-7, 2],
	[-6, 2],
	[-5, 2],
	[4, 2],
	[5, 2],
	[6, 2],
	[7, 2],
	[9, 2],
	[10, 2],
	[11, 2],
	[18, 2],
	[19, 2],
	[20, 2],
	[21, 2],
	[27, 2],
	[28, 2],
	[29, 2],
	[-33, 1],
	[-32, 1],
	[-31, 1],
	[-30, 1],
	[-27, 1],
	[-26, 1],
	[-25, 1],
	[-24, 1],
	[-20, 1],
	[-19, 1],
	[-18, 1],
	[-17, 1],
	[-16, 1],
	[-15, 1],
	[-14, 1],
	[-13, 1],
	[-12, 1],
	[-11, 1],
	[-10, 1],
	[-8, 1],
	[-7, 1],
	[-6, 1],
	[-5, 1],
	[4, 1],
	[5, 1],
	[6, 1],
	[7, 1],
	[9, 1],
	[10, 1],
	[11, 1],
	[18, 1],
	[19, 1],
	[20, 1],
	[21, 1],
	[27, 1],
	[28, 1],
	[29, 1],
	[-33, 0],
	[-32, 0],
	[-31, 0],
	[-30, 0],
	[-29, 0],
	[-28, 0],
	[-27, 0],
	[-26, 0],
	[-25, 0],
	[-24, 0],
	[-20, 0],
	[-19, 0],
	[-18, 0],
	[-17, 0],
	[-16, 0],
	[-15, 0],
	[-14, 0],
	[-13, 0],
	[-12, 0],
	[-11, 0],
	[-10, 0],
	[-9, 0],
	[-8, 0],
	[-7, 0],
	[-6, 0],
	[-5, 0],
	[4, 0],
	[5, 0],
	[6, 0],
	[7, 0],
	[9, 0],
	[10, 0],
	[11, 0],
	[18, 0],
	[19, 0],
	[20, 0],
	[21, 0],
	[27, 0],
	[28, 0],
	[29, 0],
	[-34, -1],
	[-33, -1],
	[-32, -1],
	[-31, -1],
	[-30, -1],
	[-29, -1],
	[-28, -1],
	[-27, -1],
	[-26, -1],
	[-25, -1],
	[-24, -1],
	[-23, -1],
	[-20, -1],
	[-19, -1],
	[-18, -1],
	[-12, -1],
	[-11, -1],
	[-10, -1],
	[-9, -1],
	[-7, -1],
	[-6, -1],
	[-5, -1],
	[4, -1],
	[5, -1],
	[6, -1],
	[7, -1],
	[9, -1],
	[10, -1],
	[11, -1],
	[18, -1],
	[19, -1],
	[20, -1],
	[21, -1],
	[27, -1],
	[28, -1],
	[29, -1],
	[-34, -2],
	[-33, -2],
	[-32, -2],
	[-31, -2],
	[-30, -2],
	[-29, -2],
	[-28, -2],
	[-27, -2],
	[-26, -2],
	[-25, -2],
	[-24, -2],
	[-23, -2],
	[-20, -2],
	[-19, -2],
	[-18, -2],
	[-12, -2],
	[-11, -2],
	[-10, -2],
	[-9, -2],
	[-7, -2],
	[-6, -2],
	[-5, -2],
	[-4, -2],
	[3, -2],
	[4, -2],
	[5, -2],
	[6, -2],
	[9, -2],
	[10, -2],
	[11, -2],
	[18, -2],
	[19, -2],
	[20, -2],
	[27, -2],
	[28, -2],
	[29, -2],
	[-34, -3],
	[-33, -3],
	[-32, -3],
	[-31, -3],
	[-25, -3],
	[-24, -3],
	[-23, -3],
	[-22, -3],
	[-20, -3],
	[-19, -3],
	[-18, -3],
	[-12, -3],
	[-11, -3],
	[-10, -3],
	[-9, -3],
	[-7, -3],
	[-6, -3],
	[-5, -3],
	[-4, -3],
	[-3, -3],
	[3, -3],
	[4, -3],
	[5, -3],
	[6, -3],
	[9, -3],
	[10, -3],
	[11, -3],
	[12, -3],
	[17, -3],
	[18, -3],
	[19, -3],
	[20, -3],
	[27, -3],
	[28, -3],
	[29, -3],
	[-35, -4],
	[-34, -4],
	[-33, -4],
	[-32, -4],
	[-25, -4],
	[-24, -4],
	[-23, -4],
	[-22, -4],
	[-20, -4],
	[-19, -4],
	[-18, -4],
	[-17, -4],
	[-16, -4],
	[-15, -4],
	[-14, -4],
	[-13, -4],
	[-12, -4],
	[-11, -4],
	[-10, -4],
	[-9, -4],
	[-6, -4],
	[-5, -4],
	[-4, -4],
	[-3, -4],
	[-2, -4],
	[1, -4],
	[2, -4],
	[3, -4],
	[4, -4],
	[5, -4],
	[6, -4],
	[9, -4],
	[10, -4],
	[11, -4],
	[12, -4],
	[13, -4],
	[14, -4],
	[15, -4],
	[16, -4],
	[17, -4],
	[18, -4],
	[19, -4],
	[20, -4],
	[27, -4],
	[28, -4],
	[29, -4],
	[-35, -5],
	[-34, -5],
	[-33, -5],
	[-32, -5],
	[-25, -5],
	[-24, -5],
	[-23, -5],
	[-22, -5],
	[-20, -5],
	[-19, -5],
	[-18, -5],
	[-17, -5],
	[-16, -5],
	[-15, -5],
	[-14, -5],
	[-13, -5],
	[-12, -5],
	[-11, -5],
	[-10, -5],
	[-5, -5],
	[-4, -5],
	[-3, -5],
	[-2, -5],
	[-1, -5],
	[0, -5],
	[1, -5],
	[2, -5],
	[3, -5],
	[4, -5],
	[5, -5],
	[10, -5],
	[11, -5],
	[12, -5],
	[13, -5],
	[14, -5],
	[15, -5],
	[16, -5],
	[17, -5],
	[18, -5],
	[19, -5],
	[27, -5],
	[28, -5],
	[29, -5],
	[-35, -6],
	[-34, -6],
	[-33, -6],
	[-32, -6],
	[-24, -6],
	[-23, -6],
	[-22, -6],
	[-21, -6],
	[-20, -6],
	[-19, -6],
	[-18, -6],
	[-17, -6],
	[-16, -6],
	[-15, -6],
	[-14, -6],
	[-13, -6],
	[-12, -6],
	[-11, -6],
	[-4, -6],
	[-3, -6],
	[-2, -6],
	[-1, -6],
	[0, -6],
	[1, -6],
	[2, -6],
	[3, -6],
	[4, -6],
	[11, -6],
	[12, -6],
	[13, -6],
	[14, -6],
	[15, -6],
	[16, -6],
	[17, -6],
	[18, -6],
	[27, -6],
	[28, -6],
	[29, -6],
	[-2, -7],
	[-1, -7],
	[0, -7],
	[1, -7],
	[13, -7],
	[14, -7],
	[15, -7],
	[16, -7]
];
import { randomFloat } from 'tubugl-utils/src/mathUtils';
import { random } from 'gl-matrix/src/gl-matrix/vec2';
// import { testPoints } from './testData';
const baseShaderVertSrc = `
attribute vec4 position;
attribute vec3 theta;
attribute vec2 thetaVel;
attribute vec3 color;
attribute vec3 color2;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
void main() {
	vColor = color;
	vColor2 = color2;
    vPositionZ = clamp(position.z * ( 2.0 * (sin(theta.x + 1. * uTime * thetaVel.x) + 1.0)/3.), 0.0, 1.0);
    float rad = theta.z;
    vec2 pos = rad * vec2(cos(theta.x + uTime * thetaVel.x), sin(theta.y + uTime * thetaVel.y));
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * ( vec4(pos.xy + position.xy, position.z, 1.0));
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * ( vec4(position.xy, position.z * 3.0, 1.0));
}`;

export const baseShaderFragSrc = `
precision mediump float;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;

void main() {
    vec3 color =  mix(vColor2, vColor, vPositionZ);
    
    gl_FragColor = vec4(color, 1.0);

}`;

export class Plane extends EventEmitter {
	constructor(gl, width = 100, height = 100, widthSegment = 1, heightSegment = 1, params = {}) {
		super();

		this.position = new Vector3();
		// this.position.x = -200;
		// this.position.y = -100;
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this._isGl2 = params.isGl2;
		this._gl = gl;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

		this._width = width;
		this._height = height;
		this._widthSegment = widthSegment;
		this._heightSegment = heightSegment;

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = true;
		this._isTransparent = !!params.isTransparent;

		this._makeProgram(params);
		this._makeBuffer();

		if (this._isWire) {
			this._makeWireframe();
			this._makeWireframeBuffer();
		}
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

	_makeProgram(params) {
		const fragmentShaderSrc = params.fragmentShaderSrc
			? params.fragmentShaderSrc
			: this._isGl2 ? base2ShaderFragSrc : baseShaderFragSrc;
		const vertexShaderSrc = params.vertexShaderSrc
			? params.vertexShaderSrc
			: this._isGl2 ? base2ShaderVertSrc : baseShaderVertSrc;

		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
	}

	_makeBuffer() {
		if (this._isGl2) {
			this._vao = new VAO(this._gl);
			this._vao.bind();
		}

		let points = [];
		let colors = [];
		let color2s = [];
		for (var xx = -20; xx <= 20; xx++) {
			for (var yy = -20; yy <= 20; yy++) {
				points.push([xx * 20 + randomFloat(-5, 5), yy * 20 + randomFloat(-5, 5)]);
				var rand2 = randomFloat(0, 0.4) + 0.6;
				var rand = randomFloat(0, 0.2) + 0.8;
				color2s.push(rand2, rand2, rand2);
				colors.push(rand, rand, rand);
			}
		}

		for (var ii = 0; ii < testPoints.length; ii++) {
			points.push([testPoints[ii][0], testPoints[ii][1]]);
			colors.push(0.3, 0.4, 0.6);
			var rand = randomFloat(0, 0.1) + 0.8;
			color2s.push(rand, rand, rand);
		}

		var delaunay = new Delaunator(points);
		let coords = new Float32Array(delaunay.coords.length * 1.5);
		let thetaVelocityArr = new Float32Array(delaunay.coords.length);
		let thetaArr = new Float32Array(delaunay.coords.length * 1.5);

		for (var ii = 0; ii < delaunay.coords.length / 2; ii++) {
			coords[3 * ii] = delaunay.coords[2 * ii] + randomFloat(-1, 1) * 0;
			coords[3 * ii + 1] = delaunay.coords[2 * ii + 1];
			+randomFloat(-1, 1) / 3;
			coords[3 * ii + 2] = 1;

			thetaVelocityArr[2 * ii] = randomFloat(0, 2 * Math.PI);
			thetaVelocityArr[2 * ii + 1] = randomFloat(0, 2 * Math.PI);

			thetaArr[3 * ii] = randomFloat(0, 2 * Math.PI);
			thetaArr[3 * ii + 1] = randomFloat(0, 2 * Math.PI);
			thetaArr[3 * ii + 2] = randomFloat(0, 2);
		}

		this._positionBuffer = new ArrayBuffer(this._gl, coords);
		this._positionBuffer.setAttribs('position', 3);

		this._thetaBuffer = new ArrayBuffer(this._gl, thetaArr);
		this._thetaBuffer.setAttribs('theta', 3);

		this._colorBuffer = new ArrayBuffer(this._gl, new Float32Array(colors));
		this._colorBuffer.setAttribs('color', 3);

		this._color2Buffer = new ArrayBuffer(this._gl, new Float32Array(color2s));
		this._color2Buffer.setAttribs('color2', 3);

		this._thetaVelocityBuffer = new ArrayBuffer(this._gl, thetaVelocityArr);
		this._thetaVelocityBuffer.setAttribs('thetaVel', 2);

		if (this._vao) {
			this._positionBuffer.bind().attribPointer(this._program);
		}

		// console.log(delaunay);
		let indices = delaunay.triangles; //Plane.getIndices(this._widthSegment, this._heightSegment);
		// console.log(delaunay);
		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._cnt = indices.length;
	}

	_makeWireframeBuffer() {
		this._wireframeIndexBuffer = new IndexArrayBuffer(
			this._gl,
			generateWireframeIndices(this._indexBuffer.dataArray, false)
		);
		this._wireframeIndexCnt = this._wireframeIndexBuffer.dataArray.length;
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
			this._indexBuffer.bind();
		}
	}

	render(camera) {
		this.update(camera).draw();
		if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera) {
		this._updateModelMatrix();

		this._program.bind();

		this._updateAttributres();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
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

		if (!this._time) this._time = 1 / 60;
		else this._time += 1 / 500;

		this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);

		return this;
	}

	updateWire(camera) {
		let prg = this._wireframeProgram;

		prg.bind();
		this._positionBuffer.bind().attribPointer(prg);
		this._wireframeIndexBuffer.bind();

		this._gl.uniformMatrix4fv(
			prg.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
		);
		this._gl.uniformMatrix4fv(prg.getUniforms('viewMatrix').location, false, camera.viewMatrix);
		this._gl.uniformMatrix4fv(
			prg.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

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

		if (this._isDepthTest) this._gl.enable(DEPTH_TEST);
		else this._gl.disable(DEPTH_TEST);

		if (this._isTransparent) {
			this._gl.blendFunc(SRC_ALPHA, ONE);
			this._gl.enable(BLEND);
		} else {
			this._gl.blendFunc(SRC_ALPHA, ZERO);
			this._gl.disable(BLEND);
		}

		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_INT, 0);

		return this;
	}

	drawWireframe() {
		this._gl.drawElements(LINES, this._wireframeIndexCnt, UNSIGNED_INT, 0);

		return;
	}

	resize() {}

	addGui(gui) {
		let positionFolder = gui.addFolder('position');
		positionFolder.add(this.position, 'x', -200, 200);
		positionFolder.add(this.position, 'y', -200, 200);
		positionFolder.add(this.position, 'z', -200, 200);

		let scaleFolder = gui.addFolder('scale');
		scaleFolder.add(this.scale, 'x', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'y', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'z', 0.05, 2).step(0.01);

		let rotationFolder = gui.addFolder('rotation');
		rotationFolder.add(this.rotation, 'x', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'y', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'z', -Math.PI, Math.PI).step(0.01);

		gui
			.add(this, '_isWire')
			.name('isWire')
			.onChange(() => {
				if (this._isWire && !this._wireframeProgram) {
					this._makeWireframe();
					this._makeWireframeBuffer();
				}
			});
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

	static getVertices(width, height, widthSegment, heightSegment) {
		let vertices = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		// set vertices and barycentric vertices
		for (let yy = 0; yy <= heightSegment; yy++) {
			let yPos = (-0.5 + yRate * yy) * height;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;
				vertices.push(xPos);
				vertices.push(yPos);
			}
		}
		vertices = new Float32Array(vertices);

		return vertices;
	}

	static getIndices(widthSegment, heightSegment) {
		let indices = [];

		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1);
				let nextRowStartNum = (yy + 1) * (widthSegment + 1);

				indices.push(rowStartNum + xx);
				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);

				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);
			}
		}

		indices = new Uint32Array(indices);

		return indices;
	}
}
