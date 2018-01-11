precision mediump float;

attribute vec4 position;
attribute vec3 color;
attribute vec3 color2;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
uniform float uTrans;
uniform vec2 uMouse;
uniform bool uAnimateIn;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;


  float cubicOut(float t) {
	float f = t - 1.0;
	return f * f * f + 1.0;
  }

  float cubicIn(float t) {
	return t * t * t;
  }

  #ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

float sineOut(float t) {
  return sin(t * HALF_PI);
}
float qinticInOut(float t) {
	return t < 0.5
	  ? +16.0 * pow(t, 5.0)
	  : -0.5 * pow(2.0 * t - 2.0, 5.0) + 1.0;
  } 
void main(){
	vPositionZ = clamp( (sin(10.0* uTime) + 1.0) * 0.5, 0.0, 1.0);

	gl_Position = projectionMatrix * viewMatrix * modelMatrix *  ( vec4( position.xy , position.z  , 1.0));

	vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
	float dis = length(dMouse);
	float scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.24 * clamp( 2.0 * length(uMouse) - 0.3, 0.12, 1.0);
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
	gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
	float trans;
	if(uAnimateIn){
		float uvX = cubicOut(uv.x);
		float uvY =  uv.y;

		trans = clamp(uTrans *2.2 - 0.8 * uvX - 0.4 * uvY, 0.0, 1.0);
	}else{
		trans = clamp(uTrans *1.4 - 0.25 * uv.x - 0.6  * uv.y * (1.0 - uv.y), 0.0, 1.0);
	}
	gl_Position.x = mix(gl_Position.x, (2. * uv.x - 1.0) * gl_Position.w, trans);
	gl_Position.y = mix(gl_Position.y, (2. * -uv.y + 1.0) * gl_Position.w, trans);
	gl_Position.z = mix(gl_Position.z, -0.9 * gl_Position.w, trans);
	
	vPositionZ =  vPositionZ * (scale * 1.  + 1.0);

	vColor = color;
	vColor2 = color2;
	vUv = uv;
	vTrans= trans;
}