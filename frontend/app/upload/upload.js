export async function uploadFile(file) {
    // 1) request presigned url from backend
    const params = new URLSearchParams({ filename: file.name, content_type: file.type });
    const resp = await fetch(`/api/proxy-presign?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`);
    if (!resp.ok) throw new Error("Could not get presigned URL");
    const data = await resp.json(); // { url, key }
  
    // 2) upload file to S3
    const putResp = await fetch(data.url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type
      },
      body: file
    });
    if (!putResp.ok) throw new Error("Upload failed");
  
    // 3) return S3 key to use for inference or listing
    return data.key;
  }
  