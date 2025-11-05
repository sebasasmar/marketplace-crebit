/**
 * Calculates the SHA-256 hash of a message.
 * This is required for generating the Wompi integrity signature.
 * @param message The string message to hash.
 * @returns A promise that resolves to the hex-encoded SHA-256 hash.
 */
export async function calculateSha256(message: string): Promise<string> {
    // Encode the message as a Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Hash the data
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    // Convert the ArrayBuffer to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}