// src/utils/localStore.ts
import { set, get, del } from 'idb-keyval';

/**
 * Saves a raw File/Blob to the browser's IndexedDB.
 * Returns a unique ID string (e.g., "img_123_abc") to store in your Node Data.
 */
export const saveLocalImage = async (file: Blob): Promise<string> => {
  const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  await set(id, file);
  return id;
};

/**
 * Retrieves an image from IndexedDB and creates a temporary
 * browser URL (blob:http://...) so the <img> tag can display it.
 */
export const getLocalImageSrc = async (id: string): Promise<string | null> => {
  try {
    const blob = await get<Blob>(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`Failed to load image ${id}`, error);
    return null;
  }
};

/**
 * Helper to retrieve the raw Blob (used during Save/Zip process)
 */
export const getLocalImageBlob = async (
  id: string
): Promise<Blob | undefined> => {
  return await get<Blob>(id);
};

/**
 * Deletes an image from the store.
 */
export const deleteLocalImage = async (id: string): Promise<void> => {
  await del(id);
};
