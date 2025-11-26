import "@testing-library/jest-dom";

// Mock WebGL context for Three.js tests
class MockWebGLRenderingContext {
  canvas = { width: 800, height: 600 };
  drawingBufferWidth = 800;
  drawingBufferHeight = 600;
  
  getExtension() { return null; }
  getParameter() { return 0; }
  createShader() { return {}; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter() { return true; }
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  useProgram() {}
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  getAttribLocation() { return 0; }
  getUniformLocation() { return {}; }
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  uniform4f() {}
  uniformMatrix4fv() {}
  viewport() {}
  clearColor() {}
  clear() {}
  enable() {}
  disable() {}
  blendFunc() {}
  depthFunc() {}
  cullFace() {}
  frontFace() {}
  createTexture() { return {}; }
  bindTexture() {}
  texImage2D() {}
  texParameteri() {}
  generateMipmap() {}
  activeTexture() {}
  pixelStorei() {}
  createFramebuffer() { return {}; }
  bindFramebuffer() {}
  framebufferTexture2D() {}
  checkFramebufferStatus() { return 36053; } // FRAMEBUFFER_COMPLETE
  createRenderbuffer() { return {}; }
  bindRenderbuffer() {}
  renderbufferStorage() {}
  framebufferRenderbuffer() {}
  drawArrays() {}
  drawElements() {}
  deleteShader() {}
  deleteProgram() {}
  deleteBuffer() {}
  deleteTexture() {}
  deleteFramebuffer() {}
  deleteRenderbuffer() {}
  getShaderInfoLog() { return ""; }
  getProgramInfoLog() { return ""; }
  isContextLost() { return false; }
}

// Mock HTMLCanvasElement.getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: unknown[]) {
  if (contextType === "webgl" || contextType === "webgl2" || contextType === "experimental-webgl") {
    return new MockWebGLRenderingContext() as unknown as RenderingContext;
  }
  return originalGetContext.call(this, contextType, ...args);
};
