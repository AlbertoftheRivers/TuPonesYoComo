/**
 * Web-based image picker using HTML input element and camera API
 */

/**
 * Capture photo from camera using getUserMedia (web only)
 */
export function capturePhotoFromCamera(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.zIndex = '9999';
    video.style.objectFit = 'cover';
    video.autoplay = true;
    video.playsInline = true;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const captureButton = document.createElement('button');
    captureButton.textContent = 'Capturar Foto';
    captureButton.style.position = 'fixed';
    captureButton.style.bottom = '20px';
    captureButton.style.left = '50%';
    captureButton.style.transform = 'translateX(-50%)';
    captureButton.style.zIndex = '10000';
    captureButton.style.padding = '15px 30px';
    captureButton.style.fontSize = '18px';
    captureButton.style.backgroundColor = '#D2691E';
    captureButton.style.color = 'white';
    captureButton.style.border = 'none';
    captureButton.style.borderRadius = '8px';
    captureButton.style.cursor = 'pointer';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.position = 'fixed';
    cancelButton.style.bottom = '80px';
    cancelButton.style.left = '50%';
    cancelButton.style.transform = 'translateX(-50%)';
    cancelButton.style.zIndex = '10000';
    cancelButton.style.padding = '15px 30px';
    cancelButton.style.fontSize = '18px';
    cancelButton.style.backgroundColor = '#666';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.cursor = 'pointer';

    const cleanup = () => {
      try {
        if (video.parentNode) {
          document.body.removeChild(video);
        }
        if (captureButton.parentNode) {
          document.body.removeChild(captureButton);
        }
        if (cancelButton.parentNode) {
          document.body.removeChild(cancelButton);
        }
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    };

    let stream: MediaStream | null = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((mediaStream) => {
        stream = mediaStream;
        video.srcObject = mediaStream;
        document.body.appendChild(video);
        document.body.appendChild(captureButton);
        document.body.appendChild(cancelButton);

        captureButton.onclick = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          cleanup();
          resolve(dataUrl);
        };

        cancelButton.onclick = () => {
          cleanup();
          resolve(null);
        };
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        let errorMessage = 'No se pudo acceder a la cámara.';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración del navegador.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No se encontró ninguna cámara disponible.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'La cámara está siendo usada por otra aplicación.';
        }
        console.error('Camera error details:', error);
        cleanup();
        // Show alert to user
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(errorMessage);
        }
        resolve(null);
      });
  });
}

/**
 * Pick image from file input (web only)
 */
export function pickImageFromFile(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          try {
            if (input.parentNode) {
              document.body.removeChild(input);
            }
          } catch (e) {
            console.warn('Error removing input:', e);
          }
          resolve(result);
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          try {
            if (input.parentNode) {
              document.body.removeChild(input);
            }
          } catch (e) {
            console.warn('Error removing input:', e);
          }
          resolve(null);
        };
        reader.readAsDataURL(file);
      } else {
        try {
          if (input.parentNode) {
            document.body.removeChild(input);
          }
        } catch (e) {
          console.warn('Error removing input:', e);
        }
        resolve(null);
      }
    };

    input.oncancel = () => {
      try {
        if (input.parentNode) {
          document.body.removeChild(input);
        }
      } catch (e) {
        console.warn('Error removing input:', e);
      }
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Pick multiple images from file input (web only)
 */
export function pickMultipleImagesFromFile(): Promise<string[]> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve([]);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      
      if (files.length === 0) {
        document.body.removeChild(input);
        resolve([]);
        return;
      }

      const readers = files.map(file => {
        return new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            res(result);
          };
          reader.onerror = () => res('');
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then(results => {
        document.body.removeChild(input);
        resolve(results.filter(r => r !== ''));
      });
    };

    input.oncancel = () => {
      document.body.removeChild(input);
      resolve([]);
    };

    document.body.appendChild(input);
    input.click();
  });
}

