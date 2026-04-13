import { useEffect, useRef, useState } from 'react';

const Helper = {
  createShader: (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  },
  createProgram: (gl: WebGLRenderingContext, vertexShader: WebGLShader | null, fragmentShader: WebGLShader | null) => {
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  },
  pixel2DVertexVaryingShader: `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    attribute vec2 a_color;
    varying vec2 v_color;
    void main(){
      gl_Position = vec4( vec2( 1, -1 ) * ( ( a_position / u_resolution ) * 2.0 - 1.0 ), 0, 1 );
      v_color = a_color;
    }
  `,
  uniform2DFragmentVaryingShader: `
    precision mediump float;
    varying vec2 v_color;
    uniform float u_tick;
    float frac = 1.0/6.0;
    void main(){
      float hue = v_color.x + u_tick;
      hue = abs(hue - floor(hue));
      vec4 color = vec4( 0, 0, 0, 1 );
      if( hue < frac ){
        color.r = 1.0;
        color.g = hue / frac;
        color.b = 0.0;
      } else if( hue < frac * 2.0 ){
        color.r = 1.0 - ( hue - frac ) / frac;
        color.g = 1.0;
        color.b = 0.0;
      } else if( hue < frac * 3.0 ){
        color.r = 0.0;
        color.g = 1.0;
        color.b = ( hue - frac * 2.0 ) / frac;
      } else if( hue < frac * 4.0 ){
        color.r = 0.0;
        color.g = 1.0 - ( hue - frac * 3.0 ) / frac;
        color.b = 1.0;
      } else if( hue < frac * 5.0 ){
        color.r = ( hue - frac * 4.0 ) / frac;
        color.g = 0.0;
        color.b = 1.0;
      } else {
        color.r = 1.0;
        color.g = 0.0;
        color.b = 1.0 - ( hue - frac * 5.0 ) / frac;
      }
      color = vec4( color.rgb * v_color.y, 1.0 );
      gl_FragColor = color;
    }
  `,
  // 2D Fallback Color Logic (Hadamard-like color cycle)
  get2DColor: (hue: number, tick: number, opacity: number) => {
    let h = (hue + tick) % 1;
    if (h < 0) h += 1;
    return `hsla(${h * 360}, 100%, 50%, ${opacity})`;
  }
};

interface ParticleCanvasProps {
  maxParticles?: number;
  particleSizeMin?: number;
  particleSizeMax?: number;
  speedScale?: number;
}

const ParticleCanvas = ({ 
  maxParticles = 1000, 
  particleSizeMin = 2, 
  particleSizeMax = 5, 
  speedScale = 2 
}: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<any>({});
  const particlesRef = useRef<any[]>([]);
  const tickRef = useRef(0);
  const dimensionsRef = useRef({ width: 0, height: 0, cx: 0, cy: 0 });
  const [isAnimating] = useState(true);
  const [rendererType, setRendererType] = useState<'webgl' | '2d'>('webgl');
  const animationFrameIdRef = useRef<number | null>(null);

  function getCircleTriangles(x: number, y: number, r: number) {
    const triangles: number[] = [];
    const inc = Math.PI * 2 / 6;
    let px = x + r;
    let py = y;
    for (let i = 0; i <= Math.PI * 2 + inc; i += inc) {
      const nx = x + r * Math.cos(i);
      const ny = y + r * Math.sin(i);
      triangles.push(x, y, px, py, nx, ny);
      px = nx;
      py = ny;
    }
    return triangles;
  }

  function Particle(this: any) {
    this.reset = () => {
      this.size = particleSizeMin + (particleSizeMax - particleSizeMin) * Math.random();
      this.x = dimensionsRef.current.cx;
      this.y = dimensionsRef.current.cy;
      this.vx = (Math.random() - 0.5) * 2 * speedScale;
      this.vy = -2 - speedScale * Math.random();
      this.time = 1;
      this.hue = 0;
    };
    this.step = () => {
      this.x += (this.vx *= 0.995);
      this.y += (this.vy += 0.05);
      this.time *= 0.99;
      this.hue = this.vy / 10;
      
      if (this.y - this.size > dimensionsRef.current.height || this.time < 0.01) {
        this.reset();
      }
    };
    this.reset();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;

    if (rendererType === 'webgl') {
      try {
        gl = canvas.getContext('webgl', { alpha: true, antialias: false }) as WebGLRenderingContext;
        if (!gl) {
          console.warn('WebGL context creation failed, switching to 2D');
          setRendererType('2d');
          return;
        }
      } catch (e) {
        console.warn('WebGL initialization error, switching to 2D:', e);
        setRendererType('2d');
        return;
      }
    } else {
      ctx2d = canvas.getContext('2d');
      if (!ctx2d) {
        console.error('Canvas 2D context not available');
        return;
      }
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    dimensionsRef.current = { width: w, height: h, cx: w / 2, cy: h / 2 };

    if (gl) {
      // Explicitly set viewport to match canvas size
      gl.viewport(0, 0, w, h);

      const shaderProgram = Helper.createProgram(
        gl,
        Helper.createShader(gl, gl.VERTEX_SHADER, Helper.pixel2DVertexVaryingShader),
        Helper.createShader(gl, gl.FRAGMENT_SHADER, Helper.uniform2DFragmentVaryingShader)
      );

      if (!shaderProgram) {
        console.warn('WebGL shader compilation failed, falling back to 2D');
        setRendererType('2d');
        return;
      }

      webglRef.current.shaderProgram = shaderProgram;
      webglRef.current.attribLocs = {
        position: gl.getAttribLocation(shaderProgram, 'a_position'),
        color: gl.getAttribLocation(shaderProgram, 'a_color')
      };
      webglRef.current.buffers = {
        position: gl.createBuffer(),
        color: gl.createBuffer()
      };
      webglRef.current.uniformLocs = {
        resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        tick: gl.getUniformLocation(shaderProgram, 'u_tick')
      };
      webglRef.current.data = { triangles: [], colors: [] };

      gl.useProgram(shaderProgram);
      gl.enableVertexAttribArray(webglRef.current.attribLocs.position);
      gl.enableVertexAttribArray(webglRef.current.attribLocs.color);
      gl.bindBuffer(gl.ARRAY_BUFFER, webglRef.current.buffers.position);
      gl.vertexAttribPointer(webglRef.current.attribLocs.position, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, webglRef.current.buffers.color);
      gl.vertexAttribPointer(webglRef.current.attribLocs.color, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(webglRef.current.uniformLocs.resolution, w, h);
      gl.clearColor(0, 0, 0, 0);
    }

    const animate = () => {
      if (!isAnimating) return;

      tickRef.current++;
      
      if (particlesRef.current.length < maxParticles) {
        particlesRef.current.push(new (Particle as any)(), new (Particle as any)());
      }
      
      particlesRef.current.forEach(particle => particle.step());

      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        const triangles: number[] = [];
        const colors: number[] = [];

        particlesRef.current.forEach(p => {
          const tri = getCircleTriangles(p.x, p.y, p.size * p.time);
          for (let i = 0; i < tri.length; i += 2) {
            triangles.push(tri[i], tri[i + 1]);
            colors.push(p.hue, p.time);
          }
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, webglRef.current.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, webglRef.current.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        gl.uniform1f(webglRef.current.uniformLocs.tick, tickRef.current / 100);
        gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 2);
      } else if (ctx2d) {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        const tick = tickRef.current / 100;
        
        particlesRef.current.forEach(p => {
          ctx2d!.beginPath();
          ctx2d!.arc(p.x, p.y, p.size * p.time, 0, Math.PI * 2);
          ctx2d!.fillStyle = Helper.get2DColor(p.hue, tick, p.time);
          ctx2d!.fill();
        });
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      dimensionsRef.current.cx = e.clientX;
      dimensionsRef.current.cy = e.clientY;
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      dimensionsRef.current.width = w;
      dimensionsRef.current.height = h;
      if (gl) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(webglRef.current.uniformLocs.resolution, w, h);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [isAnimating, rendererType, maxParticles, particleSizeMin, particleSizeMax, speedScale]);

  return (
    <canvas
      key={rendererType}
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};

export { ParticleCanvas };
