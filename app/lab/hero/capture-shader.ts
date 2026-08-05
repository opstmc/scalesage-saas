/**
 * SPIKE — /lab/hero. Throwaway. Not wired into the homepage.
 *
 * GLSL for the "Capture" state of the Five-State Engine.
 *
 * This module is loaded by a *second* dynamic import inside capture-canvas.tsx
 * so the shader source lands in its own chunk and can be weighed separately
 * from three/R3F/drei in the network trace. That is the only reason it is a
 * separate file; functionally it could be inlined.
 *
 * Compile target: three compiles a (non-raw) ShaderMaterial as `#version 300 es`
 * with compatibility defines (WebGLProgram.js ~L805), so `varying`/`gl_FragColor`
 * are legal here AND `fwidth` is core — no extension pragma needed.
 *
 * Nothing in here draws a number, a figure, a pipe, a river, a city, a brain, a
 * robot, a gradient blob, a particle sphere or a dashboard.
 */

export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Fullscreen pass: the geometry is a [2,2] plane, so clip space directly.
    // Bypassing the camera means resize needs no camera bookkeeping.
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;    // seconds since mount (continuous)
  uniform float uLoop;    // 0..1 position within the Capture loop
  uniform float uSeed;    // re-randomised every loop -> no two loops identical
  uniform float uAspect;  // width / height
  uniform float uQuality; // 1.0 = 3 fbm octaves, 0.0 = 2 (degrade path)
  uniform float uReveal;  // 0..1 mount fade-in
  uniform vec3  uBg;
  uniform vec3  uAccent;
  uniform vec3  uGlow;

  // ---- simplex noise (Ashima / Gustavson, 2D) -------------------------------
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Octave 3 is multiplied by uQuality rather than branched, so the degrade
  // path costs one extra multiply and never recompiles the program.
  float fbm(vec2 p, float t) {
    float s = 0.5 * snoise(p + vec2(0.0, t * 0.045));
    p *= 2.03;
    s += 0.25 * snoise(p + vec2(t * 0.038, 0.0));
    p *= 2.07;
    s += uQuality * 0.125 * snoise(p - vec2(t * 0.031));
    return s;
  }

  // Divergence-free drift, so the field circulates instead of sliding.
  vec2 flow(vec2 p, float t) {
    const float e = 0.14;
    float n1 = snoise(vec2(p.x, p.y + e) + t * 0.028);
    float n2 = snoise(vec2(p.x, p.y - e) + t * 0.028);
    float n3 = snoise(vec2(p.x + e, p.y) + t * 0.028);
    float n4 = snoise(vec2(p.x - e, p.y) + t * 0.028);
    return vec2(n1 - n2, n4 - n3) / (2.0 * e);
  }

  float easeOut(float x) { return 1.0 - pow(1.0 - x, 3.0); }
  float gate(float u, float a, float b) { return clamp((u - a) / (b - a), 0.0, 1.0); }

  // ---- the Capture beat -----------------------------------------------------
  // All of this branches on uLoop, which is a uniform, so every branch is
  // uniform across the draw call: no divergence cost.
  //
  //  .00-.06  off the right edge
  //  .06-.38  drifts in, decelerating
  //  .38-.50  slows, dims, drifts back out — nearly slips away
  //  .50-.60  caught: pulled along a curve into the locus
  //  .60-.72  latch: one ring, one settle
  //  .72-.94  held
  //  .94-1.0  released; the loop reseeds
  const vec2 LOCUS_N = vec2(0.20, -0.06); // normalised; x is scaled by aspect

  vec2 pathAt(float u, float seed, float aspect) {
    vec2 locus = vec2(LOCUS_N.x * aspect, LOCUS_N.y);
    float j1 = snoise(vec2(seed * 3.1, 11.0));
    float j2 = snoise(vec2(seed * 5.7, 23.0));

    vec2 enter = vec2(0.575 * aspect, 0.300 + 0.055 * j1);
    vec2 near  = vec2(0.452 * aspect, 0.115 + 0.050 * j2);
    vec2 slip  = vec2(0.510 * aspect, 0.055 + 0.030 * j1);
    vec2 ctrl  = vec2(0.430 * aspect, -0.285 + 0.060 * j2);

    vec2 pos = mix(enter, near, easeOut(gate(u, 0.06, 0.38)));
    pos = mix(pos, slip, smoothstep(0.0, 1.0, gate(u, 0.38, 0.50)));

    if (u > 0.50) {
      float c = easeOut(gate(u, 0.50, 0.60));
      pos = mix(mix(slip, ctrl, c), mix(ctrl, locus, c), c);
    }
    if (u > 0.60) {
      // Settles: a small damped overshoot, then dead still.
      float s = gate(u, 0.60, 0.70);
      pos = locus + vec2(0.0, 0.004) * cos(s * 12.0) * (1.0 - s);
    }
    return pos;
  }

  void main() {
    vec2 st = (vUv - 0.5) * vec2(uAspect, 1.0);
    float u = uLoop;
    float aa = 1.0 / 900.0; // roughly one device pixel, for soft edges

    vec2 locus = vec2(LOCUS_N.x * uAspect, LOCUS_N.y);
    vec2 pos = pathAt(u, uSeed, uAspect);

    // A shiver while it is nearly lost — legible as "about to go", not as noise.
    float slipping = smoothstep(0.34, 0.44, u) * (1.0 - smoothstep(0.48, 0.52, u));
    pos += vec2(snoise(vec2(u * 60.0, uSeed * 9.0)),
                snoise(vec2(uSeed * 4.0, u * 57.0))) * 0.0055 * slipping;

    // ---- substrate: iso-contours of a drifting noise field ------------------
    // During the catch the field itself bends toward the locus, so the signal
    // reads as *drawn in* rather than teleported.
    float pull = smoothstep(0.47, 0.60, u) * (1.0 - smoothstep(0.64, 0.86, u));
    vec2 toLocus = locus - st;
    float dLocus = length(toLocus) + 1e-5;
    vec2 warped = st + (toLocus / dLocus) * pull * 0.050 * exp(-dLocus * 2.1);

    vec2 q = warped * 1.55 + vec2(uSeed * 7.31, uSeed * 3.17);
    float f = fbm(q + flow(q * 0.62, uTime) * 0.26, uTime);

    float bandPhase = f * 2.55 + uTime * 0.016;
    float band = abs(fract(bandPhase) - 0.5);
    float w = fwidth(bandPhase) * 1.35 + 0.004;
    float filament = smoothstep(w, 0.0, band);
    filament *= 0.30 + 0.70 * smoothstep(-0.35, 0.60, f);

    float haze = smoothstep(-0.65, 0.95, f);

    // ---- the signal ---------------------------------------------------------
    float lum = smoothstep(0.02, 0.10, u);
    lum *= mix(1.0, 0.26, smoothstep(0.30, 0.47, u));   // dims as it slips
    if (u > 0.50) lum = mix(0.26, 1.0, easeOut(gate(u, 0.50, 0.62)));
    lum *= 1.0 - smoothstep(0.945, 1.0, u);

    float d = length(st - pos);
    float core = exp(-pow(d / 0.0062, 2.0));
    float halo = exp(-pow(d / 0.052, 2.0));

    // Short motion trail: five samples back along the same parametric path.
    float trail = 0.0;
    for (int k = 1; k <= 5; k++) {
      float uu = u - float(k) * 0.0055;
      if (uu < 0.0) break;
      vec2 tp = pathAt(uu, uSeed, uAspect);
      float tw = 1.0 - float(k) / 6.0;
      trail += exp(-pow(length(st - tp) / (0.0075 + 0.0022 * float(k)), 2.0)) * tw * 0.34;
    }

    // ---- the locus and its latch -------------------------------------------
    float dl = length(st - locus);
    float anchorLum = (0.09 + 0.91 * smoothstep(0.54, 0.63, u)) * (1.0 - smoothstep(0.945, 1.0, u));
    float anchor = exp(-pow(dl / 0.0105, 2.0)) * anchorLum;
    float anchorRing = smoothstep(aa, 0.0, abs(dl - 0.026) - 0.0008) * 0.22 * anchorLum;

    float rt = gate(u, 0.585, 0.760);
    float rr = 0.014 + easeOut(rt) * 0.092;
    float latch = (u > 0.585)
      ? exp(-pow((dl - rr) / 0.0055, 2.0)) * (1.0 - rt) * (1.0 - rt)
      : 0.0;

    // ---- composite ----------------------------------------------------------
    vec3 col = uBg;
    col += uAccent * filament * 0.115;
    col += uAccent * haze * 0.055;
    col += uAccent * (anchor * 0.75 + anchorRing);
    col += uGlow * (core * 1.15 + halo * 0.20 + trail) * lum;
    col += uGlow * latch * 0.85;

    // Vignette, then a hard left-side darkening so the headline always sits on
    // near-solid navy no matter what the field is doing.
    float vig = 1.0 - smoothstep(0.34, 1.02, length((vUv - 0.5) * vec2(uAspect, 1.0)) * 1.32);
    col *= mix(0.52, 1.0, vig);
    col = mix(uBg, col, smoothstep(0.02, 0.58, vUv.x));
    col = mix(uBg, col, smoothstep(0.0, 0.14, vUv.y));

    col = mix(uBg, col, uReveal);

    // Ordered-ish dither: 8-bit navy gradients band badly without it.
    float dth = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    col += (dth - 0.5) * (1.6 / 255.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;
