import { useState, useCallback, useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';

// Define what a snapshot looks like
interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

export function useUndoRedo(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void
) {
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  // We use refs for current nodes/edges to access them inside the event listener
  // without re-binding the listener on every render.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  /**
   * Call this function BEFORE making a change that you want to be undoable.
   * It saves the *current* state to the 'past' stack.
   */
  const takeSnapshot = useCallback(() => {
    const snapshot = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    };

    // Optional: Limit history size (e.g., max 50 steps)
    setPast((prev) => {
      const newPast = [...prev, snapshot];
      if (newPast.length > 50) return newPast.slice(1);
      return newPast;
    });

    // Whenever we do a new action, the "future" (redo stack) is invalid
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length === 0) return prev;

      const newPast = [...prev];
      const snapshot = newPast.pop(); // Get the last saved state

      if (snapshot) {
        // Save CURRENT state to future before restoring old state
        setFuture((prevFuture) => [
          ...prevFuture,
          { nodes: nodesRef.current, edges: edgesRef.current },
        ]);

        // Restore
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
      }

      return newPast;
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;

      const newFuture = [...prev];
      const snapshot = newFuture.pop(); // Get the next state

      if (snapshot) {
        // Save CURRENT state to past before restoring new state
        setPast((prevPast) => [
          ...prevPast,
          { nodes: nodesRef.current, edges: edgesRef.current },
        ]);

        // Restore
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
      }

      return newFuture;
    });
  }, [setNodes, setEdges]);

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.shiftKey && e.key === 'Z'))
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
