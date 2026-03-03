"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScanPage() {
    const router = useRouter();
    const scannerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html5QrCodeRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const hasNavigated = useRef(false);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let scanner: any = null;

        const startScanner = async () => {
            try {
                // Dynamically import to avoid SSR issues
                const { Html5Qrcode } = await import("html5-qrcode");

                if (!scannerRef.current) return;

                scanner = new Html5Qrcode("qr-reader");
                html5QrCodeRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1,
                    },
                    (decodedText: string) => {
                        // Prevent multiple navigations
                        if (hasNavigated.current) return;

                        // Check if the scanned URL is a valid menu URL
                        try {
                            const url = new URL(decodedText);
                            const pathname = url.pathname;

                            // Accept URLs that match /menu/{slug} pattern
                            if (pathname.startsWith("/menu/")) {
                                hasNavigated.current = true;

                                // Stop scanner before navigating
                                scanner.stop().catch(() => { });

                                // Build the internal path with query params
                                const menuPath = pathname + url.search;
                                router.push(menuPath);
                            } else {
                                setError("This QR code doesn't link to a menu. Please scan a table QR code.");
                                setTimeout(() => setError(null), 3000);
                            }
                        } catch {
                            // Not a URL — try treating as a relative path
                            if (decodedText.startsWith("/menu/")) {
                                hasNavigated.current = true;
                                scanner.stop().catch(() => { });
                                router.push(decodedText);
                            } else {
                                setError("Invalid QR code. Please scan a MenuOrder table QR code.");
                                setTimeout(() => setError(null), 3000);
                            }
                        }
                    },
                    () => {
                        // QR code not found in frame — ignore
                    }
                );

                setScanning(true);
            } catch (err: unknown) {
                console.error("Scanner error:", err);
                const errStr = String(err);
                if (errStr.includes("NotAllowedError") || errStr.includes("Permission")) {
                    setPermissionDenied(true);
                } else {
                    setError("Unable to access camera. Please make sure you've granted camera permission.");
                }
            }
        };

        startScanner();

        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-950 text-white flex flex-col">
            {/* Header */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <span className="font-bold text-xl">MenuOrder</span>
                </Link>
            </nav>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                        Scan to Order
                    </h1>
                    <p className="text-white/50 text-sm md:text-base max-w-sm mx-auto">
                        Point your camera at the QR code on your table to view the menu and start ordering
                    </p>
                </div>

                {/* Scanner Container */}
                <div className="relative w-full max-w-sm mx-auto">
                    {/* Decorative frame */}
                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 blur-xl pointer-events-none" />

                    <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        {/* Scanner viewport */}
                        <div id="qr-reader" ref={scannerRef} className="w-full" />

                        {/* Scanning overlay with corner markers */}
                        {scanning && !error && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="relative w-[250px] h-[250px]">
                                    {/* Top-left corner */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
                                    {/* Top-right corner */}
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
                                    {/* Bottom-left corner */}
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
                                    {/* Bottom-right corner */}
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />

                                    {/* Scanning line animation */}
                                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-scan-line" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mt-6 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center max-w-sm animate-fade-in">
                        ⚠️ {error}
                    </div>
                )}

                {permissionDenied && (
                    <div className="mt-6 text-center max-w-sm">
                        <div className="px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm mb-4">
                            <p className="font-semibold mb-2">📷 Camera Permission Required</p>
                            <p className="text-amber-300/70">
                                Please allow camera access in your browser settings to scan QR codes.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary text-sm px-6 py-3"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Hint text */}
                {scanning && (
                    <p className="mt-6 text-white/30 text-xs text-center animate-pulse-soft">
                        📡 Scanning for QR code...
                    </p>
                )}

                {/* Manual Entry Fallback */}
                <div className="mt-8 text-center">
                    <p className="text-white/30 text-xs mb-3">
                        Having trouble scanning?
                    </p>
                    <Link
                        href="/"
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>

            {/* Inline CSS for scan animation */}
            <style jsx>{`
                @keyframes scanLine {
                    0% { top: 8px; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: calc(100% - 8px); opacity: 0; }
                }
                .animate-scan-line {
                    animation: scanLine 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
