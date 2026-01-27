'use client';

import {useState} from 'react';
import Link from 'next/link';
import {TicketResponse} from '../../../interfaces/interfaces';
import styles from './page.module.css';

export default function UserPage() {
    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setTicket(null);
        setQrDataUrl(null);

        if (!qrToken.trim()) {
            setError('Por favor ingresa tu código QR');
            return;
        }

        setLoading(true);

        try {
            // Obtener información del ticket
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets/${qrToken}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Ticket no encontrado. Verifica tu código QR');
                }
                throw new Error('Error al consultar el ticket');
            }

            const ticketData: TicketResponse = await response.json();

            // Obtener QR como Data URL
            const qrResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/qr/${qrToken}/dataurl`
            );

            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                setQrDataUrl(qrData.qrDataUrl);
            }

            setTicket(ticketData);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al consultar el ticket'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

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

    const formatDuration = (duration?: string) => {
        if (!duration) return 'N/A';
        return duration;
    };

    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return 'N/A';
        return `$${amount.toLocaleString('es-CO', {minimumFractionDigits: 0})}`;
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'ACTIVE':
                return '#2ecc71';
            case 'PAID':
                return '#3498db';
            case 'EXITED':
                return '#95a5a6';
            default:
                return '#999';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'ACTIVE':
                return '🟢 Activo';
            case 'PAID':
                return '💳 Pagado';
            case 'EXITED':
                return '🚪 Salida';
            default:
                return status || 'Desconocido';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Link href="/" className={styles.backButton}>
                    ← Volver al inicio
                </Link>

                <header className={styles.header}>
                    <h1 className={styles.title}>👤 Vista de Usuario</h1>
                    <p className={styles.subtitle}>
                        Consulta el estado de tu ticket de parqueadero
                    </p>
                </header>

                <div className={styles.mainContent}>
                    <div className={styles.searchSection}>
                        <div className={styles.searchCard}>
                            <h2 className={styles.searchTitle}>Consultar mi Ticket</h2>
                            <p className={styles.searchDescription}>
                                Ingresa el código QR de tu ticket para ver el estado y tiempo
                                de estadía
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div style={{marginBottom: '20px'}}>
                                    <label
                                        htmlFor="qrToken"
                                        style={{
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#333',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Código QR
                                    </label>
                                    <input
                                        id="qrToken"
                                        type="text"
                                        value={qrToken}
                                        onChange={(e) => setQrToken(e.target.value)}
                                        placeholder="Ingresa tu código QR"
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            fontSize: '16px',
                                            border: '2px solid #e0e0e0',
                                            borderRadius: '8px',
                                            outline: 'none',
                                            transition: 'border-color 0.3s',
                                        }}
                                        onFocus={(e) => (e.target.style.borderColor = '#3498db')}
                                        onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                                    />
                                </div>

                                {error && (
                                    <div
                                        style={{
                                            padding: '12px',
                                            background: '#fee',
                                            color: '#c33',
                                            borderRadius: '8px',
                                            marginBottom: '16px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        ⚠️ {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: loading ? '#ccc' : '#3498db',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.3s',
                                    }}
                                >
                                    {loading ? 'Consultando...' : '🔍 Consultar'}
                                </button>
                            </form>
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.infoTitle}>¿Cómo usar?</h3>
                            <ol className={styles.infoList}>
                                <li>Ingresa el código QR que recibiste al entrar</li>
                                <li>Verás el tiempo de estadía y tarifa actual</li>
                                <li>Guarda tu código para salir del parqueadero</li>
                            </ol>
                        </div>
                    </div>

                    <div className={styles.resultSection}>
                        {!ticket ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🎫</div>
                                <p className={styles.emptyText}>
                                    Ingresa tu código QR para ver la información de tu ticket
                                </p>
                            </div>
                        ) : (
                            <div className={styles.ticketCard}>
                                <div className={styles.ticketHeader}>
                                    <h2 className={styles.ticketTitle}>Tu Ticket</h2>
                                    <span
                                        className={styles.statusBadge}
                                        style={{background: getStatusColor(ticket.status)}}
                                    >
                                        {getStatusText(ticket.status)}
                                    </span>
                                </div>

                                {qrDataUrl && (
                                    <div className={styles.qrSection}>
                                        <img
                                            src={qrDataUrl}
                                            alt="Código QR"
                                            className={styles.qrImage}
                                        />
                                        <p className={styles.qrText}>
                                            Guarda este código para salir
                                        </p>
                                    </div>
                                )}

                                <div className={styles.ticketDetails}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Placa</span>
                                        <span className={styles.detailValue}>{ticket.plate_number}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Tipo de Vehículo</span>
                                        <span className={styles.detailValue}>
                                            {ticket.vehicle_type === 'CAR' && '🚗 Automóvil'}
                                            {ticket.vehicle_type === 'MOTORCYCLE' && '🏍️ Motocicleta'}
                                            {ticket.vehicle_type === 'BICYCLE' && '🚲 Bicicleta'}
                                        </span>
                                    </div>

                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Hora de Entrada</span>
                                        <span className={styles.detailValue}>{formatDate(ticket.entry_timestamp)}</span>
                                    </div>

                                    {ticket.exit_timestamp && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Hora de Salida</span>
                                            <span className={styles.detailValue}>{formatDate(ticket.exit_timestamp)}</span>
                                        </div>
                                    )}

                                    {ticket.duration_ms && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Tiempo de Estadía</span>
                                            <span className={styles.detailValue}>{formatDuration(String(ticket.duration_ms))}</span>
                                        </div>
                                    )}

                                    <div className={styles.detailRowHighlight}>
                                        <span className={styles.detailLabel}>Tarifa</span>
                                        <span className={styles.detailValueLarge}>{formatCurrency(ticket.calculated_fee)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
