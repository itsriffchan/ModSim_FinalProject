'use client';

export function loadVendorThree(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('THREE can only load in the browser'));
  }
  if (window.THREE?.OrbitControls) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingThree = document.querySelector<HTMLScriptElement>(
      'script[data-modsim-three]',
    );
    if (existingThree && window.THREE) {
      const existingOc = document.querySelector<HTMLScriptElement>(
        'script[data-modsim-orbit]',
      );
      if (existingOc && window.THREE.OrbitControls) {
        resolve();
        return;
      }
    }

    const threeScript = document.createElement('script');
    threeScript.src = '/vendor/three.min.js';
    threeScript.async = true;
    threeScript.dataset.modsimThree = '1';

    threeScript.onload = () => {
      const ocScript = document.createElement('script');
      ocScript.src = '/vendor/OrbitControls.js';
      ocScript.async = true;
      ocScript.dataset.modsimOrbit = '1';
      ocScript.onload = () => resolve();
      ocScript.onerror = () => reject(new Error('Failed to load OrbitControls.js'));
      document.head.appendChild(ocScript);
    };
    threeScript.onerror = () => reject(new Error('Failed to load three.min.js'));
    document.head.appendChild(threeScript);
  });
}