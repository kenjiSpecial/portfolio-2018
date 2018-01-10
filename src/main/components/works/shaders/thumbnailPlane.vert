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
uniform float uWindowRate;
uniform float uIntro;

varying vec2 vUv;
varying float vScale;
varying float vAlpha;

void main(){
    float transIn = 1.0 - max(uTrans, 0.0);
    float posX = position.x  + uSide * (1.0 - transIn) + uv.x * 150. * (1.0 - transIn);
    float posY = position.y * (1.0 - 0.9 * uv.x * (1.0 - transIn)) * (1.0 - uIntro) - uRandY0 * (1.0 - transIn) * uv.x ; 
    float posZ = position.z - 500. * (1.0 - transIn) * uv.x;
    
    float transOut = -min(uTrans - uIntro, 0.0);
    posX = posX - transOut * uSide - (1.0 - uv.x) * 150. *transOut;
    posY = posY * (1.0 - 0.9 * (1.0 - uv.x) * transOut) - uRandY1 * transOut * (1.0 - uv.x);
    posZ = posZ - 500. * transOut * (1.0 - uv.x);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix  * vec4(posX, posY, posZ, 1.0);
    vUv = uv;
    
    vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
    float scaleRate = uWindowRate;
    dMouse.y = dMouse.y  / ( scaleRate );
	float mTheta = atan(dMouse.y, dMouse.x);
    float dis = length(dMouse);
    float scale;
    scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.1;
    
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * scaleRate * sin(mTheta) * gl_Position.w;
    
    vAlpha = clamp(transIn * 2.0 - vUv.x, 0.0, 1.0) * clamp(1.0 + vUv.x- 2.0 * transOut, 0.0, 1.0 ) * (1.0 -  uIntro);
    vScale = dis * 10. ;
}