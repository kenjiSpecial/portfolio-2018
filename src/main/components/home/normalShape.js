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

const vertexShaderSrc = `
attribute vec4 position;
attribute vec3 theta;
attribute vec2 thetaVel;
attribute vec3 color;
attribute vec3 color2;
attribute vec3 initPosition;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
uniform vec2 uMouse;
uniform float uTrans;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
varying float vAlpha;
void main() {
	vColor = color;
	vColor2 = color2;
	vPositionZ = clamp(( (sin(theta.x + 3.0 * uTime * thetaVel.x) + 1.0)) * 0.5, 0.0, 1.0);
	float rad = theta.z;
	float introProgress = clamp(2.0 * uTrans - thetaVel.y, 0.0, 1.0);
	vec3 transVec = initPosition * (1.0 - introProgress);
	vAlpha = clamp(introProgress * 2.0 - 1.0, 0.0, 1.0); //clamp(2.0 * uTrans, 0.0, 1.0);
	vec2 pos = vec2(0.0);
	
	gl_Position = projectionMatrix * viewMatrix * modelMatrix *  ( vec4(pos.xy + position.xy , position.z * vPositionZ , 0.0)  + vec4(transVec, 0.0) + vec4(0.0, 0.0, 0.0, 1.0));
	vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
	float dis = length(dMouse);
	float scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.24 * clamp( 2.0 * length(uMouse) - 0.3, 0.12, 1.0);
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
	gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
	
	vPositionZ =  vPositionZ * (scale * 15.  + 1.0);
}`;

export const fragmentShaderSrc = `
precision mediump float;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
varying float vAlpha;
void main() {
	if(vAlpha < 0.001) discard;
    vec3 color =  mix(vColor2, vColor, vPositionZ * 2. - 0.5);
    
    gl_FragColor = vec4(color, vAlpha);

}`;

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
			// console.log(index);
			this._coords.push(coords[3 * index], coords[3 * index + 1], coords[3 * index + 2]);
			center.x += coords[3 * index] / 3;
			center.y += coords[3 * index + 1] / 3;

			this._thetas.push(
				thetaArr[3 * index],
				thetaArr[3 * index + 1],
				thetaArr[3 * index + 2]
			);

			this._thetaVelocities.push(thetaVelocityArr[2 * index + 0], introRad);
			// if (num % 3 == 0) {
			// 	let dis = Math.sqrt(center.x * center.x + center.y * center.y) / 100;
			// 	dis = clamp(dis, 0, 1);

			// 	// console.log(2 * num, this._thetaVelocities.length - 1);

			// 	this._thetaVelocities[this._thetaVelocities.length - 1] = 10;
			// 	this._thetaVelocities[this._thetaVelocities.length - 1 - 2] = 10;
			// 	this._thetaVelocities[this._thetaVelocities.length - 4] = 10;
			// 	// 	console.log(dis);
			// 	center = { x: 0, y: 0 };
			// }
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
