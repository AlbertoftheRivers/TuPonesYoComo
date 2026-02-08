/**
 * Web-based image picker using HTML input element
 */

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
          document.body.removeChild(input);
          resolve(result);
        };
        reader.onerror = () => {
          document.body.removeChild(input);
          resolve(null);
        };
        reader.readAsDataURL(file);
      } else {
        document.body.removeChild(input);
        resolve(null);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
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

