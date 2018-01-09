precision mediump float;

attribute vec4 position;
attribute vec3 color;
attribute vec3 color2;
attribute vec2 uv;
attribute float customUv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
uniform float uAnimateIn;
uniform float uTrans;
uniform vec2 uMouse;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;
varying float vCustomUv;
 
void main(){
    float loadRate = cos(uTime  - 6.28 * vUv.x) ;
    float yPos = position.y;
    float zPos = position.z;
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position.x, yPos, zPos, 1.0);

	vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
	float dis = length(dMouse);
	float scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.2 * length(uMouse);
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
    
    dMouse = vec2( ( cos(uTime -  6.28 * uv.x) + 1.0) * 10.0, (-uv.y + 0.5) * 1.0);
	mTheta = atan(dMouse.y, dMouse.x);
	dis = length(dMouse);
	scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.03;
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
	gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;

	float trans;
    trans = clamp(uTrans *2.2 - 0.8 * uv.x - 0.4 * uv.y, 0.0, 1.0);
	
	gl_Position.x = mix(gl_Position.x, (2. * uv.x - 1.0) * gl_Position.w, trans);
    gl_Position.y = mix(gl_Position.y, (2. * -uv.y + 1.0) * gl_Position.w, trans);
    gl_Position.y = gl_Position.y * clamp(4.0 * uAnimateIn - 3.0 * customUv, 0.0, 1.0);
	gl_Position.z =  -0.99 * gl_Position.w;
	
	vPositionZ =  vPositionZ * (scale * 1.  + 1.0);

	vColor = color;
	vColor2 = color2;
	vUv = uv;
    vTrans= trans;
    vCustomUv = customUv;
}