'use client';;
import * as React from 'react';

import {
  FloatingMedia as FloatingMediaPrimitive,
  FloatingMediaStore,
  useFloatingMediaValue,
  useImagePreviewValue,
} from '@platejs/media/react';
import { cva } from 'class-variance-authority';
import { Link, Trash2Icon } from 'lucide-react';
import {
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useSelected,
} from 'platejs/react';

import { Button, buttonVariants } from '@/components/ui (plate files)/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui (plate files)/popover';
import { Separator } from '@/components/ui (plate files)/separator';
import { deleteImage } from '@/utils/proposalApi';

import { CaptionButton } from './caption';

const inputVariants = cva(
  'flex h-[28px] w-full rounded-md border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

export function MediaToolbar({
  children,
  plugin
}) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();
  const isFocusedLast = useFocusedLast();
  const selectionCollapsed = useEditorSelector((editor) => !editor.api.isExpanded(), []);
  const isImagePreviewOpen = useImagePreviewValue('isOpen', editor.id);
  const open =
    isFocusedLast &&
    !readOnly &&
    selected &&
    selectionCollapsed &&
    !isImagePreviewOpen;
  const isEditing = useFloatingMediaValue('isEditing');

  React.useEffect(() => {
    if (!open && isEditing) {
      FloatingMediaStore.set('isEditing', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const element = useElement();

  // Helper function to extract s3Key from Supabase URL
  const extractS3KeyFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    // Skip base64 data URLs
    if (url.startsWith('data:')) return null;
    
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public/images/')) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf('images');
        if (bucketIndex !== -1) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
    }
    return null;
  };

  // Custom delete handler that also deletes from S3
  const handleDeleteWithS3 = async (e) => {
    // Get s3Key from element or extract from URL
    let s3Key = element?.s3Key;
    if (!s3Key && element?.url) {
      s3Key = extractS3KeyFromUrl(element.url);
    }
    
    // First, remove the node from the editor using the path
    const path = editor.api.findPath(element);
    if (path) {
      console.log('[MediaToolbar] Removing image node at path:', path);
      editor.tf.removeNodes({ at: path });
    }
    
    // Then delete from S3 (async, don't wait)
    if (s3Key) {
      console.log('[MediaToolbar] Deleting image from S3:', s3Key);
      deleteImage(s3Key)
        .then(() => console.log('[MediaToolbar] Image deleted from S3 successfully'))
        .catch((error) => console.error('[MediaToolbar] Failed to delete image from S3:', error));
    } else {
      console.log('[MediaToolbar] No s3Key found, skipping S3 deletion');
    }
  };

  return (
    <Popover open={open} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>
      <PopoverContent className="w-auto p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {isEditing ? (
          <div className="flex w-[330px] flex-col">
            <div className="flex items-center">
              <div className="flex items-center pr-1 pl-2 text-muted-foreground">
                <Link className="size-4" />
              </div>

              <FloatingMediaPrimitive.UrlInput
                className={inputVariants()}
                placeholder="Paste the embed link..."
                options={{ plugin }} />
            </div>
          </div>
        ) : (
          <div className="box-content flex items-center">
            <FloatingMediaPrimitive.EditButton className={buttonVariants({ size: 'sm', variant: 'ghost' })}>
              Edit link
            </FloatingMediaPrimitive.EditButton>

            <CaptionButton size="sm" variant="ghost">
              Caption
            </CaptionButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            <Button size="sm" variant="ghost" onClick={handleDeleteWithS3}>
              <Trash2Icon />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
