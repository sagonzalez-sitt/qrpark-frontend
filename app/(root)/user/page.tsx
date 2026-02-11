'use client';

import {useState, useEffect, useCallback, useRef} from 'react';
import Link from 'next/link';
import {TicketResponse, PricingConfig} from '../../../interfaces/interfaces';
import QrScanner from '../../components/shared/qr-scanner/QrScanner';
import styles from './page.module.css';

type SearchMode = 'token' | 'plate';

function extractTokenFromQr(text: string): string {
    const match = text.match(/\/ticket\/([a-f0-9]+)/i);
    if (match) return match[1];
    return text.trim();
}

function formatElapsed(ms: number): string {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}min`;
}

function calculateEstimatedFee(entryTimestamp: string, pricePerHour: number): number {
    const entryMs = new Date(entryTimestamp).getTime();
    const nowMs = Date.now();
    const diffMs = nowMs - entryMs;
    const minutes = Math.ceil(diffMs / (1000 * 60));
    return Math.round((pricePerHour / 60) * minutes);
}

export default function UserPage() {
    const [searchMode, setSearchMode] = useState<SearchMode>('token');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pricePerHour, setPricePerHour] = useState<number | null>(null);
    const [now, setNow] = useState(Date.now());
    const [scannerOpen, setScannerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileScannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ticket || ticket.status !== 'ACTIVE') return;

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 30000);

        return () => clearInterval(interval);
    }, [ticket]);

    const fetchPricing = useCallback(async (vehicleType: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing`);
            if (!res.ok) return;
            const configs: PricingConfig[] = await res.json();
            const config = configs.find(c => c.vehicle_type === vehicleType);
            if (config) {
                setPricePerHour(config.price_per_hour);
            }
        } catch {
            // Silently fail
        }
    }, []);

    const searchByToken = useCallback(async (token: string) => {
        setError(null);
        setTicket(null);
        setQrDataUrl(null);
        setPricePerHour(null);
        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets/token/${token}`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Ticket no encontrado. Verifica tu código QR');
                }
                throw new Error('Error al consultar el ticket');
            }

            const ticketData: TicketResponse = await response.json();
            const qrToken = ticketData.qr_token || token;

            const qrResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/qr/${qrToken}/dataurl`
            );

            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                setQrDataUrl(qrData.qrDataUrl);
            }

            setTicket(ticketData);
            setNow(Date.now());

            if (ticketData.status === 'ACTIVE') {
                fetchPricing(ticketData.vehicle_type);
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al consultar el ticket'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchPricing]);

    const searchByPlate = useCallback(async (plate: string) => {
        setError(null);
        setTicket(null);
        setQrDataUrl(null);
        setPricePerHour(null);
        setLoading(true);

        try {
            const searchResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets?plate_number=${encodeURIComponent(plate.toUpperCase())}&status=ACTIVE`
            );

            if (!searchResponse.ok) {
                throw new Error('Error al buscar el ticket');
            }

            const tickets: TicketResponse[] = await searchResponse.json();

            if (tickets.length === 0) {
                throw new Error('No se encontró un ticket activo para esta placa');
            }

            const ticketData = tickets[0];
            const qrToken = ticketData.qr_token;

            const qrResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/qr/${qrToken}/dataurl`
            );

            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                setQrDataUrl(qrData.qrDataUrl);
            }

            setTicket(ticketData);
            setNow(Date.now());

            if (ticketData.status === 'ACTIVE') {
                fetchPricing(ticketData.vehicle_type);
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al consultar el ticket'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchPricing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            setError(searchMode === 'token' ? 'Por favor ingresa tu código QR' : 'Por favor ingresa tu placa');
            return;
        }

        if (searchMode === 'plate') {
            searchByPlate(searchValue.trim());
        } else {
            searchByToken(searchValue.trim());
        }
    };

    const handleQrScan = useCallback((decodedText: string) => {
        const token = extractTokenFromQr(decodedText);
        setSearchValue(token);
        searchByToken(token);
    }, [searchByToken]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input immediately
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        setError(null);

        try {
            const {Html5Qrcode} = await import('html5-qrcode');

            if (!fileScannerRef.current) return;
            const scanner = new Html5Qrcode(fileScannerRef.current.id);

            const decodedText = await scanner.scanFile(file, false);
            scanner.clear();

            const token = extractTokenFromQr(decodedText);
            setSearchValue(token);
            searchByToken(token);
        } catch {
            setError('No se pudo leer el código QR de la imagen. Intenta con otra foto.');
        }
    }, [searchByToken]);

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

    const formatCurrency = (amount?: number | null) => {
        if (amount === undefined || amount === null) return 'N/A';
        return `$${amount.toLocaleString('es-CO', {minimumFractionDigits: 0})}`;
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'ACTIVE':
                return '#10B981';
            case 'PAID':
                return '#6366F1';
            default:
                return '#94A3B8';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'Activo';
            case 'PAID':
                return 'Pagado';
            case 'EXITED':
                return 'Salida';
            default:
                return status || 'Desconocido';
        }
    };

    const isActive = ticket?.status === 'ACTIVE';
    const elapsedMs = ticket
        ? isActive
            ? now - new Date(ticket.entry_timestamp).getTime()
            : ticket.duration_ms || (ticket.exit_timestamp
                ? new Date(ticket.exit_timestamp).getTime() - new Date(ticket.entry_timestamp).getTime()
                : null)
        : null;

    const displayFee = ticket
        ? isActive && pricePerHour !== null
            ? calculateEstimatedFee(ticket.entry_timestamp, pricePerHour)
            : ticket.calculated_fee != null
                ? Number(ticket.calculated_fee)
                : null
        : null;

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Link href="/" className={styles.backButton}>
                    ← Volver al inicio
                </Link>

                <header className={styles.header}>
                    <h1 className={styles.title}>Vista de Usuario</h1>
                    <p className={styles.subtitle}>
                        Consulta el estado de tu ticket de parqueadero
                    </p>
                </header>

                <div className={styles.mainContent}>
                    <div className={styles.searchSection}>
                        <div className={styles.searchCard}>
                            <h2 className={styles.searchTitle}>Consultar mi Ticket</h2>
                            <p className={styles.searchDescription}>
                                Busca tu ticket por código QR o por placa del vehículo
                            </p>

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
                                        {searchMode === 'token' ? 'Código QR' : 'Placa del Vehículo'}
                                    </label>
                                    <input
                                        id="searchValue"
                                        type="text"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(searchMode === 'plate' ? e.target.value.toUpperCase() : e.target.value)}
                                        placeholder={searchMode === 'token' ? 'Ingresa tu código QR' : 'Ej: ABC123'}
                                        autoFocus
                                        className={styles.input}
                                    />
                                </div>

                                {searchMode === 'token' && (
                                    <div className={styles.scanActions}>
                                        <button
                                            type="button"
                                            className={styles.scanButton}
                                            onClick={() => setScannerOpen(true)}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                                <circle cx="12" cy="13" r="4"/>
                                            </svg>
                                            Escanear con cámara
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.uploadButton}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="17 8 12 3 7 8"/>
                                                <line x1="12" y1="3" x2="12" y2="15"/>
                                            </svg>
                                            Subir foto del QR
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className={styles.fileInputHidden}
                                        />
                                    </div>
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
                                    {loading ? 'Consultando...' : 'Consultar'}
                                </button>
                            </form>
                        </div>

                        <div className={styles.infoCard}>
                            <h3 className={styles.infoTitle}>¿Cómo usar?</h3>
                            <ol className={styles.infoList}>
                                <li>Escanea el QR de tu ticket o ingresa tu placa</li>
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
                                    Escanea tu QR o ingresa tu placa para ver la información de tu ticket
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
                                            {ticket.vehicle_type === 'CAR' && 'Automóvil'}
                                            {ticket.vehicle_type === 'MOTORCYCLE' && 'Motocicleta'}
                                            {ticket.vehicle_type === 'BICYCLE' && 'Bicicleta'}
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

                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Tiempo de Estadía</span>
                                        <span className={styles.detailValue}>
                                            {elapsedMs != null ? formatElapsed(elapsedMs) : 'N/A'}
                                        </span>
                                    </div>

                                    <div className={styles.detailRowHighlight}>
                                        <span className={styles.detailLabel}>
                                            {isActive ? 'Tarifa Estimada' : 'Tarifa'}
                                        </span>
                                        <span className={styles.detailValueLarge}>
                                            {formatCurrency(displayFee)}
                                        </span>
                                    </div>

                                    {isActive && (
                                        <p className={styles.feeNote}>
                                            La tarifa se calcula por minuto y se actualiza en tiempo real
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden div for file-based QR scanning */}
            <div id="qr-file-scanner" ref={fileScannerRef} style={{display: 'none'}} />

            <QrScanner
                isOpen={scannerOpen}
                onScan={handleQrScan}
                onClose={() => setScannerOpen(false)}
            />
        </div>
    );
}
