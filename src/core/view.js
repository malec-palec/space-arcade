import { HUD_H } from "../world";

const vertSrc = `
attribute vec2 aVertPos;
varying vec2 vTexCoord;
void main() {
  vTexCoord=(aVertPos+1.0)*0.5;
  gl_Position=vec4(aVertPos,0,1);
}`, fragSrc = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uRes;
uniform vec2 uOff;
uniform float uScale;
uniform float uAngle;
#define PI 3.14159265358979323844
float hash(vec2 co){return fract(sin(dot(co,vec2(12.9898, 78.233)))*43758.5453);}
float hash(float x,float y){return hash(vec2(x, y));}
float draw_circle(vec2 coord,float radius){
  return step(length(coord),radius);
}
void main() {
  vec2 pos=gl_FragCoord.xy/uRes;
  vec2 p=(pos-uOff)*uScale; 
  float circle=draw_circle(p,1.0);
  float r=length(p);
  float a=0.25-atan(p.y,p.x)/(PI*2.0)+uAngle;
  vec4 color=texture2D(uSampler,vec2(a, r));
  vec2 co=gl_FragCoord.xy/float(uRes.y);
  vec3 col=vec3(0.0);
  vec2 sco=co*500.0;
  if(hash(floor(sco))<0.005){
    float s1=hash(floor(sco)*floor(sco));
    float s2=max(1.-2.*distance(vec2(0.5),fract(sco)),0.0);
    col+=vec3(s1*s2);
  }
  if(color.xyz==vec3(0.0))color.xyz+=col;
  gl_FragColor=vec4(color.xyz*vec3(circle),1.0);
}`;

export function create(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.style.height = window.innerHeight - HUD_H + "px";
  document.body.appendChild(c);

  const gl = c.getContext("webgl", { alpha: false });

  let scaleUniformLoc, angleUniformLoc, offUniformLoc;

  function init(props, image) {
    let vs = gl.createShader(gl.VERTEX_SHADER),
      fs = gl.createShader(gl.FRAGMENT_SHADER),
      prog = gl.createProgram(),
      vertBuf = gl.createBuffer(),
      tex = gl.createTexture();

    gl.shaderSource(vs, vertSrc);
    gl.compileShader(vs);
    gl.shaderSource(fs, fragSrc);
    gl.compileShader(fs);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ // clip space
      -1, -1,
      1, -1,
      -1, 1,
      1, 1
    ]), gl.STATIC_DRAW);

    let vertPosAttr = gl.getAttribLocation(prog, 'aVertPos'),
      samplerUniformLoc = gl.getUniformLocation(prog, 'uSampler'),
      resUniformLoc = gl.getUniformLocation(prog, 'uRes');
    offUniformLoc = gl.getUniformLocation(prog, 'uOff');
    scaleUniformLoc = gl.getUniformLocation(prog, 'uScale');
    angleUniformLoc = gl.getUniformLocation(prog, 'uAngle');

    gl.enableVertexAttribArray(vertPosAttr);
    gl.vertexAttribPointer(vertPosAttr, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(samplerUniformLoc, 0);
    gl.uniform2f(resUniformLoc, w, h);
    gl.uniform2f(offUniformLoc, props.offX, props.offY);
    gl.uniform1f(scaleUniformLoc, props.scale);
    gl.uniform1f(angleUniformLoc, props.angle);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  function draw(image) {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function setScale(s) {
    gl.uniform1f(scaleUniformLoc, s);
  }

  function setAngle(a) {
    gl.uniform1f(angleUniformLoc, a);
  }

  function setOffset(x, y) {
    gl.uniform2f(offUniformLoc, x, y);
  }

  return { init, draw, setScale, setAngle, setOffset };
}