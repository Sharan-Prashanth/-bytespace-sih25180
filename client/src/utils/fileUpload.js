import { API_ENDPOINTS } from './api';

export async function uploadFile(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_ENDPOINTS.UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("File upload failed");
  return res.json();
}
