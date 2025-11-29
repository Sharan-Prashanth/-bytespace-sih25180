import { createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // You can add auth checks here if needed
      return { uploadedBy: 'user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log('Upload complete for userId:', metadata.uploadedBy);
      console.log('file url', file.url);
      return { uploadedBy: metadata.uploadedBy };
    }),

  // FileRoute for PDF uploads
  pdfUploader: f({ pdf: { maxFileSize: '16MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      return { uploadedBy: 'user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('PDF upload complete:', file.url);
      return { uploadedBy: metadata.uploadedBy };
    }),

  // FileRoute for document uploads
  documentUploader: f({
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    'application/msword': { maxFileSize: '8MB', maxFileCount: 5 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '8MB', maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      return { uploadedBy: 'user' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Document upload complete:', file.url);
      return { uploadedBy: metadata.uploadedBy };
    }),
};
