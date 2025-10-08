// Object Storage helper functions for client-side file uploads

export async function getSignedUploadUrl(
  fileName: string,
): Promise<{ method: "PUT"; url: string }> {
  const response = await fetch("/api/object-storage/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  const data = await response.json();
  return {
    method: "PUT",
    url: data.url,
  };
}
