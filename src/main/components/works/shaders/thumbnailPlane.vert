attribute vec4 position;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform vec2 uMouse;
uniform float uSide;
uniform float uTransIn;
uniform float uTransOut;
uniform float uRandY0;
uniform float uRandY1;
uniform float uWindowRate;
varying vec2 vUv;
varying float vScale;
varying float vAlpha;
void main(){
    float posX = position.x + uSide * (1.0 - uTransIn) + uv.x * 120. * (1.0 - uTransIn);
    float posY = position.y - uRandY0 * (1.0 - uTransIn) * uv.x; 
    float posZ = position.z - 500. * (1.0 - uTransIn) * uv.x;
    
    posX = posX - uTransOut * uSide - (1.0 - uv.x) * 120. *uTransOut;
    posY = posY - uRandY1 * uTransOut * (1.0 - uv.x);
    posZ = posZ - 500. * uTransOut * (1.0 - uv.x);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix  * vec4(posX, posY, posZ, 1.0);
    vUv = uv;
    
    vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
    dMouse.y = dMouse.y / uWindowRate;
	float mTheta = atan(dMouse.y, dMouse.x);
    float dis = length(dMouse);
    float scale;
    if(dis < 0.05){
        scale = dis/0.05 * 0.12 * max(dis * 2.0, 1.0);    
    }else{
        scale =(1.0 - clamp( dis - 0.05 , 0.0, 1.0)) * 0.2 * max(dis * 0.5, 1.0);
    }
    
    
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
    
    vAlpha = clamp(uTransIn * 2.0 - vUv.x, 0.0, 1.0) * clamp(1.0 + vUv.x- 2.0 * uTransOut, 0.0, 1.0 );
    vScale = dis * 3.;
}