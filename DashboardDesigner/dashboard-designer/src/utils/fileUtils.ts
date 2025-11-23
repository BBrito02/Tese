// src/utils/fileUtils.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { set } from 'idb-keyval';
import { getLocalImageBlob } from './localStore';

/**
 * PACKS the project:
 * 1. Clones the JSON.
 * 2. Finds all nodes with 'previewImageId'.
 * 3. Pulls those images from IndexedDB and puts them in an 'images/' folder in the zip.
 * 4. Downloads as filename.dashboard
 */
export const saveProjectAsZip = async (jsonContent: any, filename: string) => {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');

  // Clone JSON to avoid mutating live state
  const projectJson = JSON.parse(JSON.stringify(jsonContent));
  const nodes = projectJson.nodes || [];

  // Gather all images concurrently
  const imagePromises = nodes.map(async (node: any) => {
    // We cast to 'any' here to avoid TS errors if a node type doesn't have the field
    const d = node.data as any;

    if (d.previewImageId) {
      const blob = await getLocalImageBlob(d.previewImageId);
      if (blob && imagesFolder) {
        // Save file into zip as "images/img_123_abc"
        imagesFolder.file(d.previewImageId, blob);
      }
    }
  });

  await Promise.all(imagePromises);

  // Add the main JSON logic
  zip.file('dashboard.json', JSON.stringify(projectJson, null, 2));

  // Generate and Download
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${filename}.dashboard`);
};

/**
 * UNPACKS the project:
 * 1. Unzips the file.
 * 2. Reads images from 'images/' folder and saves them to the User's IndexedDB.
 * 3. Returns the JSON object to React Flow.
 */
export const loadProjectFromZip = async (file: File): Promise<any> => {
  const zip = await JSZip.loadAsync(file);

  // 1. Restore Images to IndexedDB
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    const writePromises: Promise<void>[] = [];

    imagesFolder.forEach((relativePath, zipEntry) => {
      const promise = async () => {
        const blob = await zipEntry.async('blob');
        // The filename (e.g., "img_123_abc") is the ID
        const id = relativePath.split('/').pop() || relativePath;
        await set(id, blob);
      };
      writePromises.push(promise());
    });

    await Promise.all(writePromises);
  }

  // 2. Extract & Parse JSON
  const jsonFile = zip.file('dashboard.json');
  if (!jsonFile) {
    throw new Error('Invalid file: missing dashboard.json');
  }

  const jsonString = await jsonFile.async('string');
  return JSON.parse(jsonString);
};
