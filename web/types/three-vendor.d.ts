/** Globals from /public/vendor/three.min.js and OrbitControls.js */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ThreeVendor = any;

declare global {
  // eslint-disable-next-line no-var
  var THREE: ThreeVendor;

  interface Window {
    THREE: ThreeVendor;
  }
}

export {};