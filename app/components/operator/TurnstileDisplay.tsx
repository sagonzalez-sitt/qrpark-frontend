import {useEffect, useState} from 'react';
import Image from 'next/image';
import styles from './TurnstileDisplay.module.css';
import {TicketResponse} from "@/interfaces/interfaces";

interface TurnstileDisplayProps {
    ticket: TicketResponse | null;
    qrDataUrl: string | null;
    onConfirm: () => void;
}

export default function TurnstileDisplay({ticket, qrDataUrl, onConfirm}: TurnstileDisplayProps) {
    const [countdown, setCountdown] = useState(10);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (ticket && !confirmed) {
            setCountdown(10);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        // Auto-print cuando llega a 0
                        handleAutoPrint();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [ticket, confirmed]);

    const handleAutoPrint = () => {
        console.log('🖨️ Imprimiendo ticket automáticamente...');
        setConfirmed(true);
        setTimeout(() => {
            onConfirm();
            setConfirmed(false);
        }, 2000);
    };

    const handlePhotoTaken = () => {
        setConfirmed(true);
        setTimeout(() => {
            onConfirm();
            setConfirmed(false);
        }, 1500);
    };

    if (!ticket || !qrDataUrl) {
        return (
            <div className={styles.waiting}>
                <div className={styles.waitingIcon}>⏳</div>
                <p className={styles.waitingText}>
                    Esperando nuevo ticket del operador...
                </p>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className={styles.confirmed}>
                <div className={styles.confirmedIcon}>✅</div>
                <p className={styles.confirmedText}>Ticket entregado correctamente</p>
            </div>
        );
    }

    return (
        <div className={styles.showing}>
            <div className={styles.qrContainer}>
                <Image
                    src={qrDataUrl}
                    alt="QR Code"
                    width={400}
                    height={400}
                />
            </div>

            <div className={styles.ticketInfo}>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Placa:</span>
                    <span className={styles.infoValue}>{ticket.plate_number}</span>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Tipo:</span>
                    <span className={styles.infoValue}>
                        {ticket.vehicle_type === 'CAR' && '🚗 Carro'}
                        {ticket.vehicle_type === 'MOTORCYCLE' && '🏍️ Moto'}
                        {ticket.vehicle_type === 'BICYCLE' && '🚲 Bicicleta'}
                    </span>
                </div>
            </div>

            <div className={styles.countdown}>{countdown}s</div>

            <p className={styles.instructions}>
                📸 Tome una foto del QR o espere a que se imprima automáticamente
            </p>

            <button className={styles.confirmButton} onClick={handlePhotoTaken}>
                ✅ YA TOMÉ LA FOTO
            </button>
        </div>
    );
}
