export const baseShaderVertSrc = `
attribute vec4 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}`;

export const baseShaderFragSrc = `
precision mediump float;

void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
    gl_FragColor = vec4(colorR, colorG, 0.0, 1.0);

}`;

export const uvBaseShaderVertSrc = `
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec2 vUv;
void main(){
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vUv = uv;
}
`;

export const uvBaseShaderFragSrc = `
precision mediump float;

varying vec2 vUv;
void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    
    gl_FragColor = vec4(vUv, colorR, 1.0);

}
`;

export const textureBaseShaderFragSrc = `
precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uvTexture;

varying vec2 vUv;

void main(){
    if(gl_FrontFacing){
        gl_FragColor = texture2D(uTexture, vUv);
    }else{
        gl_FragColor = texture2D(uvTexture, vUv);
    }
}

`;

export const wireFrameFragSrc = `
precision mediump float;

void main(){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

export const base2ShaderVertSrc = `#version 300 es
in vec4 position;
in vec3 barycentricPosition;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

out vec3 vBarycentricPosition;

void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    
    vBarycentricPosition = barycentricPosition; 
}
`;

export const base2ShaderFragSrc = `#version 300 es
precision mediump float;
in vec3 vBarycentricPosition;

uniform bool uWireframe;

out vec4 outColor;

void main() {

    if(uWireframe){
        float minBarycentricVal = min(min(vBarycentricPosition.x, vBarycentricPosition.y), vBarycentricPosition.z);
        if(minBarycentricVal > 0.01) discard;
    }
    
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;
