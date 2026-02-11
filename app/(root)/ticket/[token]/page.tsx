'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {TicketResponse} from '../../../../interfaces/interfaces';
import {TicketDeliveryMethod} from '../../../../interfaces/enums';
import styles from './page.module.css';

interface Props {
    params: {
        token: string;
    };
}

export default function TicketPage({params}: Props) {
    const router = useRouter();
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const loadTicket = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/tickets/token/${params.token}`
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Ticket no encontrado');
                    }
                    throw new Error('Error al cargar el ticket');
                }

                const ticketData: TicketResponse = await response.json();

                if (!ticketData.delivered) {
                    try {
                        await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${params.token}/delivery`,
                            {
                                method: 'PATCH',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                    delivery_method: TicketDeliveryMethod.DIGITAL_PHOTO,
                                }),
                            }
                        );

                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 3000);

                        ticketData.delivered = true;
                    } catch (err) {
                        console.error('Error marking as delivered:', err);
                    }
                }

                const qrResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/qr/${params.token}/dataurl`
                );

                if (qrResponse.ok) {
                    const qrData = await qrResponse.json();
                    setQrDataUrl(qrData.qrDataUrl);
                }

                setTicket(ticketData);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Error al cargar el ticket'
                );
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadTicket();
    }, [params.token]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getVehicleIcon = (type?: string) => {
        switch (type) {
            case 'CAR':
                return '🚗';
            case 'MOTORCYCLE':
                return '🏍️';
            case 'BICYCLE':
                return '🚲';
            default:
                return '🚗';
        }
    };

    const getVehicleLabel = (type?: string) => {
        switch (type) {
            case 'CAR':
                return 'Automóvil';
            case 'MOTORCYCLE':
                return 'Motocicleta';
            case 'BICYCLE':
                return 'Bicicleta';
            default:
                return 'Vehículo';
        }
    };

    const downloadQR = () => {
        if (!qrDataUrl || !ticket) return;

        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `parkqr-${ticket.plate_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Cargando tu ticket...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.errorTitle}>Error</h2>
                    <p className={styles.errorMessage}>{error}</p>
                    <button onClick={() => router.push('/')} className={styles.homeButton}>
                        Ir al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {showSuccess && (
                <div className={styles.successNotification}>
                    <div className={styles.successIcon}>✅</div>
                    <p className={styles.successText}>¡Ticket recibido correctamente!</p>
                </div>
            )}

            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.logo}>ParkQR</div>
                    <h1 className={styles.title}>Tu Ticket de Parqueadero</h1>
                </header>

                {ticket && (
                    <div className={styles.ticketCard}>
                        <div className={styles.ticketHeader}>
                            <div className={styles.vehicleInfo}>
                                <div className={styles.vehicleIcon}>
                                    {getVehicleIcon(ticket.vehicle_type)}
                                </div>
                                <div className={styles.vehicleDetails}>
                                    <div className={styles.vehicleType}>
                                        {getVehicleLabel(ticket.vehicle_type)}
                                    </div>
                                    <div className={styles.plateNumber}>{ticket.plate_number}</div>
                                </div>
                            </div>
                            <div className={styles.statusBadge}>
                                {ticket.delivered ? '✅ Recibido' : '⏳ Pendiente'}
                            </div>
                        </div>

                        {qrDataUrl && (
                            <div className={styles.qrSection}>
                                <p className={styles.qrLabel}>Tu código QR</p>
                                <div className={styles.qrContainer}>
                                    <img
                                        src={qrDataUrl}
                                        alt="Código QR"
                                        className={styles.qrImage}
                                    />
                                </div>
                                <p className={styles.qrInstruction}>
                                    Guarda este código para salir del parqueadero
                                </p>
                            </div>
                        )}

                        <div className={styles.ticketDetails}>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Entrada</span>
                                <span className={styles.detailValue}>{formatDate(ticket.entry_timestamp)}</span>
                            </div>

                            {ticket.exit_timestamp && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Salida</span>
                                    <span className={styles.detailValue}>{formatDate(ticket.exit_timestamp)}</span>
                                </div>
                            )}

                            {ticket.duration_formatted && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Tiempo de estadía</span>
                                    <span className={styles.detailValue}>{ticket.duration_formatted}</span>
                                </div>
                            )}

                            {ticket.calculated_fee !== null &&
                                ticket.calculated_fee !== undefined && (
                                    <div className={styles.detailRowHighlight}>
                                        <span className={styles.detailLabel}>Tarifa</span>
                                        <span className={styles.detailValueLarge}>
                                            ${Number(ticket.calculated_fee).toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                )}
                        </div>

                        <div className={styles.actions}>
                            <button onClick={downloadQR} className={styles.downloadButton}>
                                ⬇️ Descargar QR
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className={styles.homeButton}
                            >
                                🏠 Ir al inicio
                            </button>
                        </div>

                        <div className={styles.warningBox}>
                            <div className={styles.warningIcon}>💡</div>
                            <div className={styles.warningText}>
                                <strong>Importante:</strong> Presenta este código QR al salir
                                del parqueadero para procesar tu pago.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
