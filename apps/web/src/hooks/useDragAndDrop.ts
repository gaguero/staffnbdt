import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DragDropState, 
  DropZone, 
  DragPreview,
  DRAG_TYPES
} from '../types/permissionEditor';
import { Permission } from '../types/permission';

interface UseDragAndDropOptions {
  onDrop?: (item: Permission, dropZone: string) => void;
  onDragStart?: (item: Permission) => void;
  onDragEnd?: () => void;
  enableTouch?: boolean;
  enableKeyboard?: boolean;
  autoScroll?: boolean;
  scrollThreshold?: number;
  scrollSpeed?: number;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
  const {
    onDrop,
    onDragStart,
    onDragEnd,
    enableTouch = true,
    enableKeyboard = true,
    autoScroll = true,
    scrollThreshold = 50,
    scrollSpeed = 10
  } = options;

  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedItem: null,
    dropTarget: null,
    dropZones: [],
    validDropTargets: [],
    dragPreview: null
  });

  // Refs for performance and state management
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const keyboardModeRef = useRef<boolean>(false);

  // Register drop zones
  const registerDropZone = useCallback((dropZone: DropZone) => {
    setDragState(prev => ({
      ...prev,
      dropZones: [...prev.dropZones.filter(zone => zone.id !== dropZone.id), dropZone]
    }));

    return () => {
      setDragState(prev => ({
        ...prev,
        dropZones: prev.dropZones.filter(zone => zone.id !== dropZone.id)
      }));
    };
  }, []);

  // Find valid drop targets for current dragged item
  const getValidDropTargets = useCallback((item: Permission): string[] => {
    return dragState.dropZones
      .filter(zone => zone.accepts(item))
      .map(zone => zone.id);
  }, [dragState.dropZones]);

  // Get drop zone by coordinates
  const getDropZoneAt = useCallback((x: number, y: number): DropZone | null => {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;

    const dropZoneElement = element.closest('[data-drop-zone]');
    if (!dropZoneElement) return null;

    const dropZoneId = dropZoneElement.getAttribute('data-drop-zone');
    return dragState.dropZones.find(zone => zone.id === dropZoneId) || null;
  }, [dragState.dropZones]);

  // Auto-scroll functionality
  const handleAutoScroll = useCallback((clientY: number) => {
    if (!autoScroll) return;

    const viewport = window.innerHeight;
    const scrollContainer = document.scrollingElement || document.documentElement;
    
    let scrollDirection = 0;
    if (clientY < scrollThreshold) {
      scrollDirection = -1;
    } else if (clientY > viewport - scrollThreshold) {
      scrollDirection = 1;
    }

    if (scrollDirection !== 0) {
      if (!scrollIntervalRef.current) {
        scrollIntervalRef.current = setInterval(() => {
          scrollContainer.scrollTop += scrollDirection * scrollSpeed;
        }, 16); // ~60fps
      }
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, [autoScroll, scrollThreshold, scrollSpeed]);

  // Stop auto-scroll
  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  // Create drag preview
  const createDragPreview = useCallback((item: Permission, x: number, y: number): DragPreview => {
    return {
      permission: item,
      position: { x, y },
      offset: dragOffsetRef.current
    };
  }, []);

  // Update drag preview position
  const updateDragPreview = useCallback((x: number, y: number) => {
    setDragState(prev => {
      if (!prev.dragPreview) return prev;
      
      return {
        ...prev,
        dragPreview: {
          ...prev.dragPreview,
          position: { 
            x: x - prev.dragPreview.offset.x, 
            y: y - prev.dragPreview.offset.y 
          }
        }
      };
    });
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((item: Permission, event: React.MouseEvent) => {
    event.preventDefault();
    keyboardModeRef.current = false;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const validTargets = getValidDropTargets(item);
    const preview = createDragPreview(item, event.clientX, event.clientY);

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item,
      validDropTargets: validTargets,
      dragPreview: preview
    }));

    onDragStart?.(item);

    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      updateDragPreview(e.clientX, e.clientY);
      handleAutoScroll(e.clientY);

      const dropZone = getDropZoneAt(e.clientX, e.clientY);
      setDragState(prev => ({
        ...prev,
        dropTarget: dropZone ? {
          id: dropZone.id,
          type: dropZone.id as any,
          accepts: [],
          isActive: true,
          isValid: validTargets.includes(dropZone.id)
        } : null
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      stopAutoScroll();
      
      const dropZone = getDropZoneAt(e.clientX, e.clientY);
      if (dropZone && validTargets.includes(dropZone.id)) {
        dropZone.onDrop(item);
        onDrop?.(item, dropZone.id);
      }

      setDragState(prev => ({
        ...prev,
        isDragging: false,
        draggedItem: null,
        dropTarget: null,
        dragPreview: null,
        validDropTargets: []
      }));

      onDragEnd?.();

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getValidDropTargets, createDragPreview, updateDragPreview, handleAutoScroll, stopAutoScroll, getDropZoneAt, onDragStart, onDrop, onDragEnd]);

  // Touch drag handlers
  const handleTouchStart = useCallback((item: Permission, event: React.TouchEvent) => {
    if (!enableTouch) return;
    
    event.preventDefault();
    keyboardModeRef.current = false;

    const touch = event.touches[0];
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };

    const validTargets = getValidDropTargets(item);

    // Add slight delay to distinguish between tap and drag
    setTimeout(() => {
      if (touchStartRef.current) {
        const preview = createDragPreview(item, touch.clientX, touch.clientY);
        
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          draggedItem: item,
          validDropTargets: validTargets,
          dragPreview: preview
        }));

        onDragStart?.(item);
      }
    }, 150);

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      
      updateDragPreview(touch.clientX, touch.clientY);
      handleAutoScroll(touch.clientY);

      const dropZone = getDropZoneAt(touch.clientX, touch.clientY);
      setDragState(prev => ({
        ...prev,
        dropTarget: dropZone ? {
          id: dropZone.id,
          type: dropZone.id as any,
          accepts: [],
          isActive: true,
          isValid: validTargets.includes(dropZone.id)
        } : null
      }));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchStartRef.current = null;
      stopAutoScroll();

      if (!dragState.isDragging) return;

      const touch = e.changedTouches[0];
      const dropZone = getDropZoneAt(touch.clientX, touch.clientY);
      
      if (dropZone && validTargets.includes(dropZone.id)) {
        dropZone.onDrop(item);
        onDrop?.(item, dropZone.id);
      }

      setDragState(prev => ({
        ...prev,
        isDragging: false,
        draggedItem: null,
        dropTarget: null,
        dragPreview: null,
        validDropTargets: []
      }));

      onDragEnd?.();

      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [enableTouch, getValidDropTargets, createDragPreview, updateDragPreview, handleAutoScroll, stopAutoScroll, getDropZoneAt, onDragStart, onDrop, onDragEnd, dragState.isDragging]);

  // Keyboard drag handlers
  const handleKeyDown = useCallback((item: Permission, event: React.KeyboardEvent) => {
    if (!enableKeyboard) return;

    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        keyboardModeRef.current = true;
        
        if (!dragState.isDragging) {
          // Start keyboard drag
          const validTargets = getValidDropTargets(item);
          
          setDragState(prev => ({
            ...prev,
            isDragging: true,
            draggedItem: item,
            validDropTargets: validTargets,
            dropTarget: null
          }));

          onDragStart?.(item);
        } else {
          // Drop at current target or cancel
          if (dragState.dropTarget && dragState.validDropTargets.includes(dragState.dropTarget.id)) {
            const dropZone = dragState.dropZones.find(zone => zone.id === dragState.dropTarget!.id);
            if (dropZone) {
              dropZone.onDrop(item);
              onDrop?.(item, dropZone.id);
            }
          }

          setDragState(prev => ({
            ...prev,
            isDragging: false,
            draggedItem: null,
            dropTarget: null,
            validDropTargets: []
          }));

          onDragEnd?.();
        }
        break;

      case 'Escape':
        if (dragState.isDragging) {
          event.preventDefault();
          setDragState(prev => ({
            ...prev,
            isDragging: false,
            draggedItem: null,
            dropTarget: null,
            validDropTargets: []
          }));
          onDragEnd?.();
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (dragState.isDragging && keyboardModeRef.current) {
          event.preventDefault();
          // Navigate between drop zones
          const currentIndex = dragState.validDropTargets.findIndex(id => 
            id === dragState.dropTarget?.id
          );
          
          let nextIndex = currentIndex;
          if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % dragState.validDropTargets.length;
          } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            nextIndex = currentIndex <= 0 ? dragState.validDropTargets.length - 1 : currentIndex - 1;
          }

          const nextDropZoneId = dragState.validDropTargets[nextIndex];
          const nextDropZone = dragState.dropZones.find(zone => zone.id === nextDropZoneId);
          
          if (nextDropZone) {
            setDragState(prev => ({
              ...prev,
              dropTarget: {
                id: nextDropZone.id,
                type: nextDropZone.id as any,
                accepts: [],
                isActive: true,
                isValid: true
              }
            }));

            // Announce to screen readers
            announceToScreenReader(`Focused on drop zone: ${nextDropZone.name}`);
          }
        }
        break;
    }
  }, [enableKeyboard, dragState, getValidDropTargets, onDragStart, onDrop, onDragEnd]);

  // Native HTML5 drag handlers (fallback)
  const handleDragStart = useCallback((item: Permission, event: React.DragEvent) => {
    const validTargets = getValidDropTargets(item);
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedItem: item,
      validDropTargets: validTargets
    }));

    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: DRAG_TYPES.PERMISSION,
      item
    }));

    event.dataTransfer.effectAllowed = 'copy';
    onDragStart?.(item);
  }, [getValidDropTargets, onDragStart]);

  const handleDragEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedItem: null,
      dropTarget: null,
      validDropTargets: [],
      dragPreview: null
    }));
    
    stopAutoScroll();
    onDragEnd?.();
  }, [stopAutoScroll, onDragEnd]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';

    const dropZone = getDropZoneAt(event.clientX, event.clientY);
    setDragState(prev => ({
      ...prev,
      dropTarget: dropZone ? {
        id: dropZone.id,
        type: dropZone.id as any,
        accepts: [],
        isActive: true,
        isValid: prev.validDropTargets.includes(dropZone.id)
      } : null
    }));
  }, [getDropZoneAt]);

  const handleDrop = useCallback((event: React.DragEvent, dropZoneId: string) => {
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('application/json'));
      
      if (dragData.type === DRAG_TYPES.PERMISSION && dragData.item) {
        const dropZone = dragState.dropZones.find(zone => zone.id === dropZoneId);
        if (dropZone && dropZone.accepts(dragData.item)) {
          dropZone.onDrop(dragData.item);
          onDrop?.(dragData.item, dropZoneId);
        }
      }
    } catch (error) {
      console.error('Invalid drag data:', error);
    }
  }, [dragState.dropZones, onDrop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    // State
    dragState,
    isDragging: dragState.isDragging,
    draggedItem: dragState.draggedItem,
    dropTarget: dragState.dropTarget,
    dragPreview: dragState.dragPreview,
    
    // Drop zone management
    registerDropZone,
    
    // Event handlers
    handleMouseDown,
    handleTouchStart,
    handleKeyDown,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    
    // Utilities
    getValidDropTargets,
    announceToScreenReader
  };
}