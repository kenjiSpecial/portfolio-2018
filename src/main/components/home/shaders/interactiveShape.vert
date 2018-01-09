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
varying vec2 vPos;

uniform bool uRollover;

void main() {
	vColor = color;
	vColor2 = color2;
	
	vPositionZ = clamp(( (sin(theta.x + 3.0 * uTime * thetaVel.x) + 1.0)) * 0.5, 0.0, 1.0);
	float rad = theta.z;
	float introProgress = clamp(4.0 * uTrans - thetaVel.y, 0.0, 1.0);
	vec3 transVec = initPosition * (1.0 - introProgress);
	vAlpha = clamp(introProgress * 2.0 - 1.0, 0.0, 1.0); //clamp(2.0 * uTrans, 0.0, 1.0);

	vPos = position.xy;
	
	gl_Position = projectionMatrix * viewMatrix * modelMatrix *  ( vec4( position.xy , position.z * vPositionZ , 0.0)  + vec4(transVec, 0.0) + vec4(0.0, 0.0, 0.0, 1.0));
	vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
	float dis = length(dMouse);
	float scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.24 * clamp( 2.0 * length(uMouse) - 0.3, 0.12, 1.0);
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
	gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
	
	vPositionZ =  vPositionZ * (scale * 15.  + 1.0);
}