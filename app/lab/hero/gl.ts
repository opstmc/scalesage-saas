/**
 * SPIKE — /lab/hero. A minimal WebGL renderer for one fullscreen fragment pass.
 *
 * This exists to test the spike's own conclusion: that three, R3F and drei earn
 * almost nothing for a single fullscreen shader, and that hand rolling costs
 * around 4 KB against their 191 KB. The measurement in the spike report was of a
 * throwaway sketch; this is the real thing, doing everything the R3F version did
 * (DPR, resize, visibility pause, context loss, a degrade ladder) so the
 * comparison is like for like rather than flattering.
 *
 * No React in here on purpose. The React layer above owns mounting; this owns
 * pixels. Keeping them apart is what makes the renderer weighable.
 *
 * ## The GLSL version question, which is the only fiddly part
 *
 * The fragment shader is written for what three produces: `#version 300 es`
 * with compatibility defines, so it uses `varying` and `gl_FragColor` while
 * still getting `fwidth` as core. Reproducing that exactly means the shader
 * source needs no edit, which matters because the shader is the artwork and
 * rewriting it to port the harness would be the tail wagging the dog.
 *
 * So: WebGL2 with the same defines three injects. On a context that only does
 * WebGL1, `fwidth` moves behind GL_OES_standard_derivatives, which is enabled
 * explicitly. If neither path compiles, the caller keeps the poster up.
 */

export type GLHandle = {
  /** Write a float uniform. Unknown names are ignored, not thrown. */
  setFloat: (name: string, value: number) => void;
  /** Write a vec3 uniform. */
  setVec3: (name: string, value: readonly [number, number, number]) => void;
  /** Draw one frame. */
  draw: () => void;
  /** Current backing-store size, after DPR. */
  size: () => { width: number; height: number; dpr: number };
  /** Change the pixel ratio; re-sizes the backing store on the next frame. */
  setDpr: (dpr: number) => void;
  /** True while the GPU context is lost, so the caller can stop driving it. */
  isLost: () => boolean;
  dispose: () => void;
};

const VERTEX_300 = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // A fullscreen TRIANGLE, not a quad. Two triangles meeting on a diagonal make
  // the GPU shade the seam twice and can leave a hairline on some drivers; one
  // oversized triangle clipped to the viewport has neither problem and needs
  // one vertex fewer.
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const VERTEX_100 = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/**
 * The compatibility prologue three prepends to a non-raw ShaderMaterial. Copied
 * deliberately rather than paraphrased: the shader was authored against these
 * exact rules, and the point of this file is that the artwork does not change.
 */
const FRAG_PROLOGUE_300 = `#version 300 es
precision highp float;
#define varying in
#define gl_FragColor pc_fragColor
out highp vec4 pc_fragColor;
`;

const FRAG_PROLOGUE_100 = `#extension GL_OES_standard_derivatives : enable
precision highp float;
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Left as a warning rather than a throw: a shader that will not compile is
    // a reason to keep the poster, not a reason to break the page.
    console.warn("[lab/hero] shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  frag: string,
  initialDpr: number,
): GLHandle | null {
  const attrs: WebGLContextAttributes = {
    // A fullscreen fragment pass needs none of these. Each one costs memory
    // bandwidth on exactly the mobile GPUs this has to hold 30fps on.
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  };

  const gl2 = canvas.getContext("webgl2", attrs) as WebGL2RenderingContext | null;
  const gl = (gl2 ?? canvas.getContext("webgl", attrs)) as WebGLRenderingContext | null;
  if (!gl) return null;

  const isGL2 = gl2 !== null;
  if (!isGL2) {
    // fwidth is core in 300 es and an extension in 100. The shader uses it for
    // antialiased edges; without it the compile fails and we keep the poster.
    if (!gl.getExtension("OES_standard_derivatives")) return null;
  }

  const vertSrc = isGL2 ? VERTEX_300 : VERTEX_100;
  const fragSrc = (isGL2 ? FRAG_PROLOGUE_300 : FRAG_PROLOGUE_100) + frag;

  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[lab/hero] program link failed:", gl.getProgramInfoLog(program));
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // One triangle covering clip space: (-1,-1), (3,-1), (-1,3).
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations resolved once. getUniformLocation is a string lookup into
  // the driver and is not free; doing it per frame per uniform is a classic way
  // to spend the budget this whole exercise is trying to protect.
  const locations = new Map<string, WebGLUniformLocation | null>();
  const locate = (name: string): WebGLUniformLocation | null => {
    let loc = locations.get(name);
    if (loc === undefined) {
      loc = gl.getUniformLocation(program, name);
      locations.set(name, loc);
    }
    return loc;
  };

  let dpr = initialDpr;
  let width = 0;
  let height = 0;
  let lost = false;

  const onLost = (e: Event) => {
    // Without preventDefault the context never restores, and a phone that
    // backgrounds the tab for a while comes back to a dead canvas.
    e.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    lost = false;
  };
  canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);

  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };

  return {
    setFloat(name, value) {
      const loc = locate(name);
      if (loc) gl.uniform1f(loc, value);
    },
    setVec3(name, value) {
      const loc = locate(name);
      if (loc) gl.uniform3f(loc, value[0], value[1], value[2]);
    },
    draw() {
      if (lost) return;
      resize();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    size: () => ({ width, height, dpr }),
    setDpr(next) {
      dpr = next;
    },
    isLost: () => lost,
    dispose() {
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      // Frees the backing store immediately rather than at the next GC, which
      // matters when a route is mounted and unmounted repeatedly in dev.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
