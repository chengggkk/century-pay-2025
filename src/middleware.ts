import { verifyKey } from 'discord-interactions';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    if (req.method !== "POST") {
        return NextResponse.next(); // Allow non-POST requests
    }

    try {
        // Extract headers
        const signature = req.headers.get("X-Signature-Ed25519");
        const timestamp = req.headers.get("X-Signature-Timestamp");

        if (!signature || !timestamp) {
            return new NextResponse("Missing headers", { status: 400 });
        }

        // Read request body as ArrayBuffer
        const bodyBuffer = await req.arrayBuffer();
        const isValidRequest = await verifyKey(bodyBuffer, signature, timestamp, process.env.PUBLIC_KEY!);
        if (!isValidRequest) {
            return new NextResponse("Bad request signature", { status: 401 });
        }
    } catch (error) {
        return new NextResponse("Verification failed", { status: 500 });
    }

    return NextResponse.next(); // Allow valid requests to proceed
}

export const config = {
    matcher: '/api/:path*', // Only for API routes
};