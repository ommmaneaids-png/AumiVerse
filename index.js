import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Router } from 'itty-router'; // Initialize the router
const router = Router(); // Function to initialize the S3 client const S3 = (env) => { return new S3Client({ region: "auto", endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey:
env.R2_SECRET_ACCESS_KEY,
},
});
}; // Middleware to handle CORS and JSON responses const withCors = (request, env) => { const corsHeaders = { "Access-Control-Allow-Origin": "*", // In production, restrict this to your domain "Access-Control-Allow-Methods":
"GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type",
};
if (request.method === 'OPTIONS') { return new Response(null, { headers: corsHeaders }); } // Attach CORS headers to subsequent responses return (response) => { for (const
[key, value] of Object.entries(corsHeaders)) { response.headers.set(key, value); }
return response;
};
}; // GET /files?prefix=[folderName] - List files in a folder router.get("/files", async (request, env) => { const s3 = S3(env); const prefix = request.query.prefix
||
'';
const listCommand = new ListObjectsV2Command({ Bucket: env.FILE_BUCKET.bucketName, Prefix: `${prefix}/`, });
const contents = await s3.send(listCommand);
return Response.json(contents.Contents || []);
}); // POST /upload - Get a secure, temporary
URL to upload a file router.post("/upload", async(request, env) => {
    const s3 = S3(env);
    const { key, contentType } = await request.json();
    const putCommand = new PutObjectCommand({
        Bucket: env.FILE_BUCKET.bucketName,
        Key: key,
        ContentType: contentType,
    });
    const signedUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 }); // URL expires in 5 minutes return Response.json({ url: signedUrl }); }); // POST /download - Get a secure, temporary URL to download a file router.post("/download", async (request,
    env) => {
    const s3 = S3(env);
    const { key } = await request.json();
    const getCommand = new GetObjectCommand({ Bucket: env.FILE_BUCKET.bucketName, Key: key, });
    const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 300 }); // URL expires in
    5 minutes
    return Response.json({ url: signedUrl });
}); // DELETE /delete - Delete a file from R2 router.delete("/delete", async (request, env) => { const s3 = S3(env); const { key } = await request.json(); const deleteCommand = new DeleteObjectCommand({
Bucket: env.FILE_BUCKET.bucketName, Key: key,
});
await s3.send(deleteCommand);
return Response.json({ success: true });
}); // Main fetch handler export default { async fetch(request, env, ctx) { const setCorsHeaders = withCors(request, env); if (request.method
===
'OPTIONS') { return setCorsHeaders(); }
const response = await router.handle(request, env, ctx).catch(err => new Response(err.message || 'Server Error', { status: 500 }));
return setCorsHeaders(response);
}
};