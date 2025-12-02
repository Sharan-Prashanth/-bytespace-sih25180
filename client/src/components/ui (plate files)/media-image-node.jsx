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

  const { isDragging, handleRef } = useDraggable({
    element: props.element,
  });

  // Get the URL from element (supports both base64 and regular URLs)
  const imageUrl = props.element?.url || '';
  
  // Don't render anything if no URL (prevents "No image URL provided" showing during upload)
  if (!imageUrl) {
    return null;
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
            <img
              ref={handleRef}
              src={imageUrl}
              className={cn(
                'block w-full max-w-full cursor-pointer object-cover px-0',
                'rounded-sm',
                focused && selected && 'ring-2 ring-ring ring-offset-2',
                isDragging && 'opacity-50'
              )}
              alt={props.element?.alt || 'Uploaded image'}
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl.substring(0, 50));
              }}
            />
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
