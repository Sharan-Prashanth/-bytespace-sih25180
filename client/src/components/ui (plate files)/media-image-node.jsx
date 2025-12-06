'use client';;
import * as React from 'react';

import { useDraggable } from '@platejs/dnd';
import { ImagePlugin, useMediaState } from '@platejs/media/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { PlateElement, withHOC } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { MediaToolbar } from './media-toolbar';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const ImageElement = withHOC(ResizableProvider, function ImageElement(props) {
  const { align = 'center', focused, readOnly, selected } = useMediaState();
  const width = useResizableValue('width');
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const prevUrlRef = React.useRef(null);
  const imageLoadedRef = React.useRef(false);

  const { isDragging, handleRef } = useDraggable({
    element: props.element,
  });

  // Get the URL from element (supports both base64 and regular URLs)
  const imageUrl = props.element?.url || '';
  
  // Log element state for debugging
  React.useEffect(() => {
    console.log('[ImageElement] Rendering with:', {
      id: props.element?.id,
      url: imageUrl?.substring(0, 50),
      hasUrl: !!imageUrl,
      isLoading,
      hasError
    });
  });
  
  // Reset error state only when URL actually changes (not just re-renders)
  React.useEffect(() => {
    if (imageUrl && imageUrl !== prevUrlRef.current) {
      console.log('[ImageElement] URL changed from', prevUrlRef.current?.substring(0, 30), 'to', imageUrl?.substring(0, 30));
      prevUrlRef.current = imageUrl;
      setHasError(false);
      // Only reset loading if image hasn't been loaded yet
      if (!imageLoadedRef.current) {
        setIsLoading(true);
      }
    }
  }, [imageUrl]);
  
  // Don't render anything if no URL (prevents "No image URL provided" showing during upload)
  if (!imageUrl) {
    return (
      <PlateElement {...props} className="py-2.5">
        <div className="flex items-center justify-center h-32 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
          <span className="text-slate-400 dark:text-slate-500 text-sm">Image loading...</span>
        </div>
        {props.children}
      </PlateElement>
    );
  }

  return (
    <MediaToolbar plugin={ImagePlugin}>
      <PlateElement {...props} className="py-2.5">
        <figure className="group relative m-0" contentEditable={false}>
          <Resizable
            align={align}
            options={{
              align,
              readOnly,
            }}>
            <ResizeHandle
              className={mediaResizeHandleVariants({ direction: 'left' })}
              options={{ direction: 'left' }} />
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-sm">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
              </div>
            )}
            {hasError ? (
              <div className="flex items-center justify-center h-32 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-red-500 dark:text-red-400 text-sm">Failed to load image</span>
              </div>
            ) : (
              <img
                ref={handleRef}
                src={imageUrl}
                className={cn(
                  'block w-full max-w-full cursor-pointer object-cover px-0',
                  'rounded-sm',
                  focused && selected && 'ring-2 ring-ring ring-offset-2',
                  isDragging && 'opacity-50',
                  isLoading && 'opacity-0'
                )}
                alt={props.element?.alt || 'Uploaded image'}
                onError={(e) => {
                  console.error('[ImageElement] Image failed to load:', imageUrl.substring(0, 100));
                  imageLoadedRef.current = false;
                  setHasError(true);
                  setIsLoading(false);
                }}
                onLoad={() => {
                  console.log('[ImageElement] Image loaded successfully:', imageUrl.substring(0, 50));
                  imageLoadedRef.current = true;
                  setIsLoading(false);
                  setHasError(false);
                }}
              />
            )}
            <ResizeHandle
              className={mediaResizeHandleVariants({
                direction: 'right',
              })}
              options={{ direction: 'right' }} />
          </Resizable>

          <Caption style={{ width }} align={align}>
            <CaptionTextarea
              readOnly={readOnly}
              onFocus={(e) => {
                e.preventDefault();
              }}
              placeholder="Write a caption..." />
          </Caption>
        </figure>

        {props.children}
      </PlateElement>
    </MediaToolbar>
  );
});
