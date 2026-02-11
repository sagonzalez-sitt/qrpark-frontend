'use client';

import {useState, useCallback} from 'react';
import Link from 'next/link';
import {TicketResponse} from '../../../interfaces/interfaces';
import QrScanner from '../../components/shared/qr-scanner/QrScanner';
import styles from './page.module.css';

type SearchMode = 'token' | 'plate';

function extractTokenFromQr(text: string): string {
    const match = text.match(/\/ticket\/([a-f0-9]+)/i);
    if (match) return match[1];
    return text.trim();
}

export default function ExitPage() {
    const [searchMode, setSearchMode] = useState<SearchMode>('token');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);

    const processExitByToken = useCallback(async (token: string) => {
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets/${token}/exit`,
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
            setSearchValue('');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al procesar la solicitud'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!searchValue.trim()) {
            setError(searchMode === 'token' ? 'Por favor ingresa el código QR' : 'Por favor ingresa la placa');
            return;
        }

        if (searchMode === 'plate') {
            setLoading(true);
            try {
                const searchResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/tickets?plate_number=${encodeURIComponent(searchValue.trim().toUpperCase())}&status=ACTIVE`
                );

                if (!searchResponse.ok) {
                    throw new Error('Error al buscar el ticket');
                }

                const tickets: TicketResponse[] = await searchResponse.json();

                if (tickets.length === 0) {
                    throw new Error('No se encontró un ticket activo para esta placa');
                }

                const token = tickets[0].qr_token;
                setLoading(false);
                processExitByToken(token);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Error al procesar la solicitud'
                );
                setLoading(false);
            }
        } else {
            processExitByToken(searchValue.trim());
        }
    };

    const handleQrScan = useCallback((decodedText: string) => {
        const token = extractTokenFromQr(decodedText);
        setSearchValue(token);
        processExitByToken(token);
    }, [processExitByToken]);

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

    const formatDuration = (durationFormatted?: string) => {
        if (!durationFormatted) return 'N/A';
        return durationFormatted;
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
                    <h1 className={styles.title}>Terminal de Salida</h1>
                    <p className={styles.subtitle}>
                        Procesa la salida de vehículos y calcula tarifas
                    </p>
                </header>

                <div className={styles.mainContent}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>Procesar Salida</h2>

                        <div className={styles.searchToggle}>
                            <button
                                type="button"
                                className={`${styles.toggleOption} ${searchMode === 'token' ? styles.toggleOptionActive : ''}`}
                                onClick={() => {
                                    setSearchMode('token');
                                    setSearchValue('');
                                    setError(null);
                                }}
                            >
                                Código QR
                            </button>
                            <button
                                type="button"
                                className={`${styles.toggleOption} ${searchMode === 'plate' ? styles.toggleOptionActive : ''}`}
                                onClick={() => {
                                    setSearchMode('plate');
                                    setSearchValue('');
                                    setError(null);
                                }}
                            >
                                Placa
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="searchValue" className={styles.label}>
                                    {searchMode === 'token' ? 'Código QR del Ticket' : 'Placa del Vehículo'}
                                </label>
                                <input
                                    id="searchValue"
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(searchMode === 'plate' ? e.target.value.toUpperCase() : e.target.value)}
                                    placeholder={searchMode === 'token' ? 'Escanea o ingresa el código' : 'Ej: ABC123'}
                                    autoFocus
                                    className={styles.input}
                                />
                            </div>

                            {searchMode === 'token' && (
                                <button
                                    type="button"
                                    className={styles.scanButton}
                                    onClick={() => setScannerOpen(true)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                    Escanear QR con cámara
                                </button>
                            )}

                            {error && (
                                <div className={styles.errorBox}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitButton}
                            >
                                {loading ? 'Procesando...' : 'Procesar Salida'}
                            </button>
                        </form>

                        {ticket && (
                            <button
                                onClick={handleNewExit}
                                className={styles.newExitButton}
                            >
                                Nueva Salida
                            </button>
                        )}
                    </div>

                    <div className={styles.summarySection}>
                        <h2 className={styles.sectionTitle}>Resumen de Salida</h2>

                        {!ticket ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📋</div>
                                <p className={styles.emptyText}>
                                    Escanea un QR o ingresa una placa para procesar la salida
                                </p>
                            </div>
                        ) : (
                            <div className={styles.ticketSummary}>
                                <div className={styles.summaryHeader}>
                                    <h3 className={styles.summaryTitle}>{ticket.plate_number}</h3>
                                    <span className={styles.statusBadge}>{ticket.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}</span>
                                </div>

                                <div className={styles.summaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Placa</span>
                                        <span className={styles.summaryValue}>{ticket.plate_number}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Tipo de Vehículo</span>
                                        <span className={styles.summaryValue}>
                                            {ticket.vehicle_type === 'CAR' && 'Automóvil'}
                                            {ticket.vehicle_type === 'MOTORCYCLE' && 'Motocicleta'}
                                            {ticket.vehicle_type === 'BICYCLE' && 'Bicicleta'}
                                        </span>
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
                                        <span className={styles.summaryValue}>{formatDuration(ticket?.duration_formatted)}</span>
                                    </div>

                                    <div className={styles.summaryItem}>
                                        <span className={styles.summaryLabel}>Tarifa Total</span>
                                        <span className={styles.summaryValueLarge}>{formatCurrency(ticket.calculated_fee)}</span>
                                    </div>
                                </div>

                                <div className={styles.paymentSection}>
                                    {paymentSuccess && (
                                        <div className={styles.successBox}>
                                            Pago registrado exitosamente
                                        </div>
                                    )}
                                    <button
                                        onClick={handlePayment}
                                        className={styles.payButton}
                                        disabled={ticket.status === 'PAID' || processingPayment}
                                    >
                                        {processingPayment
                                            ? 'Procesando...'
                                            : ticket.status === 'PAID'
                                                ? 'Ya Pagado'
                                                : 'Registrar Pago'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <QrScanner
                isOpen={scannerOpen}
                onScan={handleQrScan}
                onClose={() => setScannerOpen(false)}
            />
        </div>
    );
}
