attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform vec2 uMouse;
uniform float uSide;
uniform float uTrans;
uniform float uRandY0;
uniform float uRandY1;
// uniform float uWindowRate;
uniform vec3 uWindow;
uniform float uIntro;
uniform float uYScale;

varying vec2 vUv;
varying float vScale;
varying float vAlpha;

void main(){
    float transIn =  max(1.0 * uTrans  , 0.0);
    float posX = position.x  + uSide * ( transIn) + uv.x * 350. * ( transIn);
    float posY = position.y * (1.0 - 0.9 * uv.x * transIn) * (1.0 - uIntro) * uYScale - uRandY0 * uYScale *  transIn * uv.x ; 
    float posZ = position.z - 1200. * (transIn) * uv.x;

    // float transIn = 1.0 - max(uTrans, 0.0);
    // float posX = position.x  + uSide * (1.0 - transIn) + uv.x * 150. * (1.0 - transIn);
    // float posY = position.y * (1.0 - 0.9 * uv.x * (1.0 - transIn)) * (1.0 - uIntro) * uYScale - uRandY0 * (1.0 - transIn) * uv.x ; 
    // float posZ = position.z - 1200. * (1.0 - transIn) * uv.x;
    
    float transOut = -min(1.0 * uTrans - uIntro, 0.0);
    posX = posX - transOut * uSide - (1.0 - uv.x) * 350. *transOut;
    posY = posY * (1.0 - 0.9 * (1.0 - uv.x) * transOut) * uYScale - uRandY1 * uYScale * transOut * (1.0 - uv.x);
    posZ = posZ - 1200. * transOut * (1.0 - uv.x);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix  * vec4(posX, posY, posZ, 1.0);
    vUv = uv;
    
    vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y) * uWindow.xy;
    // float scaleRate = uWindowRate;
    // dMouse.y = dMouse.y  / ( scaleRate );
	float mTheta = atan(dMouse.y, dMouse.x);
    float dis = length(dMouse)/(1500. * uWindow.z);
    float scale;
    scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.1;
    
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
    
    vAlpha = clamp( (1.0 - transIn) * 2.0 - vUv.x, 0.0, 1.0) * clamp(1.0 + vUv.x- 2.0 * transOut, 0.0, 1.0 ) * (1.0 -  uIntro);
    vScale = dis * 10. ;
}