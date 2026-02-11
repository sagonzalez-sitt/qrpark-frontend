'use client';

import {useEffect, useRef, useCallback} from 'react';
import styles from './QrScanner.module.css';

interface QrScannerProps {
    isOpen: boolean;
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function QrScanner({isOpen, onScan, onClose}: QrScannerProps) {
    const readerRef = useRef<HTMLDivElement>(null);
    const scannerRef = useRef<any>(null);
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);

    onScanRef.current = onScan;
    onCloseRef.current = onClose;

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch { /* ignore cleanup errors */ }
            scannerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !readerRef.current) return;

        let cancelled = false;

        (async () => {
            const {Html5Qrcode} = await import('html5-qrcode');
            if (cancelled) return;

            const readerId = readerRef.current!.id;
            const scanner = new Html5Qrcode(readerId);
            scannerRef.current = scanner;

            try {
                await scanner.start(
                    {facingMode: 'environment'},
                    {fps: 10, qrbox: {width: 250, height: 250}},
                    (decodedText) => {
                        scanner.stop().then(() => {
                            scanner.clear();
                            scannerRef.current = null;
                        }).catch(() => {});
                        onScanRef.current(decodedText);
                        onCloseRef.current();
                    },
                    undefined
                );
            } catch (err) {
                console.error('Error al acceder a la cámara:', err);
            }
        })();

        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [isOpen, stopScanner]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={() => { stopScanner(); onClose(); }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Escanear QR</h3>
                    <button
                        type="button"
                        onClick={() => { stopScanner(); onClose(); }}
                        className={styles.closeButton}
                    >
                        ✕
                    </button>
                </div>
                <div id="qr-scanner-reader" ref={readerRef} className={styles.reader} />
                <p className={styles.hint}>Apunta la cámara al código QR del ticket</p>
            </div>
        </div>
    );
}
