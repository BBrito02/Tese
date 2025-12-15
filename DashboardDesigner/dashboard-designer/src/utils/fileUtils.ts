import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { set } from 'idb-keyval';
import { getLocalImageBlob } from './localStore';
import { nanoid } from 'nanoid';

// Helper to calculate slugs (must match your old logic to find the old handles)
const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

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
 * 4. MIGRATES legacy data (adds IDs and fixes edges).
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
  const project = JSON.parse(jsonString);

  // --- MIGRATION START: Fix IDs and Edges ---

  // Map to track changes: NodeID -> { OldSlug -> NewUUID }
  const nodeSlugMap = new Map<string, Map<string, string>>();

  if (project.nodes && Array.isArray(project.nodes)) {
    project.nodes.forEach((node: any) => {
      // Ensure map exists for this node
      if (!nodeSlugMap.has(node.id)) {
        nodeSlugMap.set(node.id, new Map());
      }
      const map = nodeSlugMap.get(node.id)!;

      // Check if node has a 'data' array (Visualizations, Legends, etc.)
      if (node.data && Array.isArray(node.data.data)) {
        node.data.data = node.data.data.map((item: any) => {
          let newItem = item;
          let needsId = false;

          // Case 1: Legacy string format "Name" -> convert to object
          if (typeof item === 'string') {
            newItem = { name: item, dtype: 'Other' };
            needsId = true;
          }
          // Case 2: Object missing ID
          else if (typeof item === 'object' && item !== null && !item.id) {
            needsId = true;
          }

          if (needsId || !newItem.id) {
            newItem = { ...newItem, id: nanoid() };

            // Record mapping so we can fix edges later
            // We calculate what the OLD slug would have been based on the name
            const originalName = typeof item === 'string' ? item : item.name;
            const oldSlug = slug(originalName);
            map.set(oldSlug, newItem.id);
          }

          return newItem;
        });
      }
    });
  }

  // Migrate Edges to use New UUIDs
  if (project.edges && Array.isArray(project.edges)) {
    project.edges = project.edges.map((edge: any) => {
      // Helper to fix a handle string
      const fixHandle = (
        handle: string | null | undefined,
        nodeId: string
      ): string | null | undefined => {
        if (!handle || !handle.startsWith('data:')) return handle;

        // Handle format: "data:slug:port"
        const parts = handle.split(':');
        // parts[0] is 'data', parts[1] is the old slug, parts[2] is optional port (hover/click)
        if (parts.length >= 2) {
          const oldSlug = parts[1];
          const map = nodeSlugMap.get(nodeId);

          if (map && map.has(oldSlug)) {
            const newId = map.get(oldSlug);
            // Reconstruct: data:UUID:port
            const suffix = parts.slice(2).join(':');
            return `data:${newId}${suffix ? ':' + suffix : ''}`;
          }
        }
        return handle;
      };

      // Fix Source Handle
      edge.sourceHandle = fixHandle(edge.sourceHandle, edge.source);

      // Fix Target Handle
      edge.targetHandle = fixHandle(edge.targetHandle, edge.target);

      // Fix Metadata references inside edge.data
      if (edge.data && edge.data.targetDataRef) {
        const map = nodeSlugMap.get(edge.target);
        if (map && map.has(edge.data.targetDataRef)) {
          edge.data.targetDataRef = map.get(edge.data.targetDataRef);
        }
      }

      return edge;
    });
  }
  // --- MIGRATION END ---

  return project;
};
