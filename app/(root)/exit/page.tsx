'use client';

import {useState} from 'react';
import Link from 'next/link';
import {TicketResponse} from '../../../interfaces/interfaces';
import styles from './page.module.css';

export default function ExitPage() {
    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!qrToken.trim()) {
            setError('Por favor ingresa el código QR');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets/${qrToken}/exit`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al procesar la salida');
            }

            const ticketData: TicketResponse = await response.json();
            setTicket(ticketData);
            setQrToken('');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al procesar la solicitud'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewExit = () => {
        setTicket(null);
        setError(null);
        setPaymentSuccess(false);
    };

    const handlePayment = async () => {
        if (!ticket) return;

        setProcessingPayment(true);
        setError(null);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket.id}/pay`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al procesar el pago');
            }

            const updatedTicket = await response.json();
            setTicket(updatedTicket);
            setPaymentSuccess(true);

            // Ocultar mensaje de éxito después de 3 segundos
            setTimeout(() => {
                setPaymentSuccess(false);
            }, 3000);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al procesar el pago'
            );
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatDuration = (duration?: string | undefined) => {
        if (!duration) return 'N/A';

        const match = duration.match(/(\d+)\s*horas?,?\s*(\d+)\s*minutos?/);
        if (match) {
            const hours = match[1];
            const minutes = match[2];
            return `${hours}h ${minutes}m`;
        }
        return duration;
    };

    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return 'N/A';
        return `$${amount.toLocaleString('es-CO', {minimumFractionDigits: 0})}`;
    };

    const formatDate = (dateString?: string | null) => {
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

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Link href="/" className={styles.backButton}>
                    ← Volver al inicio
                </Link>

                <header className={styles.header}>
                    <h1 className={styles.title}>🚗 Terminal de Salida</h1>
                    <p className={styles.subtitle}>
                        Procesa la salida de vehículos y calcula tarifas
                    </p>
                </header>

                <div className={styles.mainContent}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>Procesar Salida</h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '24px'}}>
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
                                    Código QR del Ticket
                                </label>
                                <input
                                    id="qrToken"
                                    type="text"
                                    value={qrToken}
                                    onChange={(e) => setQrToken(e.target.value)}
                                    placeholder="Escanea o ingresa el código"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'border-color 0.3s',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#e74c3c')}
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
                                    background: loading ? '#ccc' : '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.3s',
                                }}
                            >
                                {loading ? 'Procesando...' : '🚀 Procesar Salida'}
                            </button>
                        </form>

                        {ticket && (
                            <button
                                onClick={handleNewExit}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#f0f0f0',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: '16px',
                                }}
                            >
                                ➕ Nueva Salida
                            </button>
                        )}
                    </div>

                    <div className={styles.summarySection}>
                        <h2 className={styles.sectionTitle}>Resumen de Salida</h2>

                        {!ticket ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📋</div>
                                <p className={styles.emptyText}>
                                    Ingresa un código QR para procesar la salida
                                </p>
                            </div>
                        ) : (
                            <div className={styles.ticketSummary}>
                                <div className={styles.summaryHeader}>
                                    <h3 className={styles.summaryTitle}>Ticket #{ticket.id}</h3>
                                    <span className={styles.statusBadge}>{ticket.status === 'PAID' ? '✅ PAGADO' : '⏳ PENDIENTE'}</span>
                                </div>

                                <div className={styles.summaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Placa</span>
                                        <span className={styles.summaryValue}>{ticket.plate_number}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Tipo de Vehículo</span>
                                        <span className={styles.summaryValue}>{ticket.vehicle_type}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Entrada</span>
                                        <span className={styles.summaryValue}>{formatDate(ticket.entry_timestamp)}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Salida</span>
                                        <span className={styles.summaryValue}>{formatDate(ticket?.exit_timestamp)}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Tiempo de Estadía</span>
                                        <span className={styles.summaryValue}>{formatDuration(String(ticket?.duration_ms))}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Tarifa Total</span>
                                        <span className={styles.summaryValueLarge}>{formatCurrency(ticket.calculated_fee)}</span>
                                    </div>
                                </div>

                                <div className={styles.paymentSection}>
                                    {paymentSuccess && (
                                        <div
                                            style={{
                                                padding: '16px',
                                                background: '#d4edda',
                                                color: '#155724',
                                                borderRadius: '8px',
                                                marginBottom: '16px',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                fontSize: '15px',
                                            }}
                                        >
                                            ✅ Pago registrado exitosamente
                                        </div>
                                    )}
                                    <button
                                        onClick={handlePayment}
                                        className={styles.payButton}
                                        disabled={ticket.status === 'PAID' || processingPayment}
                                    >
                                        {processingPayment
                                            ? '⏳ Procesando...'
                                            : ticket.status === 'PAID'
                                                ? '✅ Ya Pagado'
                                                : '💳 Registrar Pago'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
