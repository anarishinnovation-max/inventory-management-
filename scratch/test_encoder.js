const secret = process.env.JWT_SECRET;
try {
    const encoded = new TextEncoder().encode(secret);
    console.log("Encoded:", encoded);
} catch (e) {
    console.error("Error encoding:", e);
}
