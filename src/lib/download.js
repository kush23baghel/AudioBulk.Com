import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Downloads a list of files as a single ZIP archive or triggers individual download.
 * @param {Array<{name: string, blob: Blob}>} files 
 * @param {string} zipName 
 */
export const downloadFiles = async (files, zipName = 'audiobulk-processed.zip') => {
  if (!files || files.length === 0) return;

  if (files.length === 1) {
    // If only one file, just save it directly
    const file = files[0];
    saveAs(file.url || file.blob, file.name);
    return;
  }

  const zip = new JSZip();
  const nameCounts = {};
  
  for (const file of files) {
    let data = file.blob;
    if (file.url) {
      data = await fetch(file.url).then(r => r.blob());
    }

    // Deduplicate file names in the zip to prevent collisions
    let finalName = file.name;
    if (nameCounts[finalName] !== undefined) {
      const dotIndex = finalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        const base = finalName.substring(0, dotIndex);
        const ext = finalName.substring(dotIndex);
        finalName = `${base} (${nameCounts[finalName]})${ext}`;
      } else {
        finalName = `${finalName} (${nameCounts[finalName]})`;
      }
      nameCounts[file.name]++;
    } else {
      nameCounts[finalName] = 1;
    }

    zip.file(finalName, data);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
};
