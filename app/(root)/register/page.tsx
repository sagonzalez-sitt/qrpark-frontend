'use client';

import {useState, useEffect, useCallback, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {VehicleType} from '../../../interfaces/enums';
import {TicketResponse} from '../../../interfaces/interfaces';
import {smartDownloadQR} from '../../utils/downloadQR';
import styles from './page.module.css';

const STORAGE_KEY = 'parkqr_vehicle';

function vehicleIcon(type: VehicleType) {
    if (type === VehicleType.CAR) return '🚗';
    if (type === VehicleType.MOTORCYCLE) return '🏍️';
    return '🚲';
}

function vehicleTypeName(type: VehicleType) {
    if (type === VehicleType.CAR) return 'Automóvil';
    if (type === VehicleType.MOTORCYCLE) return 'Motocicleta';
    return 'Bicicleta';
}

function RegisterContent() {
    const searchParams = useSearchParams();
    const sessionToken = searchParams.get('session');

    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sessionValid, setSessionValid] = useState<boolean | null>(null);
    const [savedVehicle, setSavedVehicle] = useState<{plate: string; type: VehicleType} | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // Cargar vehículo guardado del localStorage
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.plate && saved.type) {
                    setSavedVehicle({plate: saved.plate, type: saved.type as VehicleType});
                } else {
                    setShowForm(true);
                }
            } else {
                setShowForm(true);
            }
        } catch {
            setShowForm(true);
        }

        if (!sessionToken) {
            setError('No se proporcionó un código de sesión válido');
            setSessionValid(false);
            return;
        }

        const checkSession = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/registration-sessions/${sessionToken}`
                );

                if (!response.ok) {
                    setError('Sesión no encontrada o expirada');
                    setSessionValid(false);
                    return;
                }

                const session = await response.json();

                if (session.status !== 'PENDING') {
                    setError('Esta sesión ya fue utilizada o ha expirado');
                    setSessionValid(false);
                    return;
                }

                setSessionValid(true);
            } catch (err) {
                console.error('Error checking session:', err);
                setError('Error al verificar la sesión');
                setSessionValid(false);
            }
        };

        checkSession();
    }, [sessionToken]);

    const doRegister = useCallback(async (plate: string, type: VehicleType) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/registration-sessions/${sessionToken}/complete`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({plate_number: plate, vehicle_type: type}),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar el vehículo');
            }

            const data = await response.json();
            const ticketData: TicketResponse = data.ticket;

            const qrResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/qr/${ticketData.qr_token}/dataurl`
            );
            if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                setQrDataUrl(qrData.qrDataUrl);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify({plate, type}));
            setTicket(ticketData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [sessionToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!plateNumber || !vehicleType) {
            setError('Por favor completa todos los campos');
            return;
        }

        const plateRegex = /^[A-Z0-9]{6,10}$/;
        if (!plateRegex.test(plateNumber.toUpperCase())) {
            setError('Placa inválida. Debe tener 6-10 caracteres alfanuméricos');
            return;
        }

        await doRegister(plateNumber.toUpperCase(), vehicleType);
    };

    const handleQuickRegister = () => {
        if (!savedVehicle) return;
        doRegister(savedVehicle.plate, savedVehicle.type);
    };

    const downloadQR = () => {
        if (!qrDataUrl || !ticket) return;
        smartDownloadQR(qrDataUrl, `parkqr-${ticket.plate_number}.png`);
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

    if (sessionValid === null) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (sessionValid === false) {
        return (
            <div className={styles.container}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h2 className={styles.errorTitle}>Sesión Inválida</h2>
                    <p className={styles.errorMessage}>{error}</p>
                    <p className={styles.errorHint}>
                        Por favor, escanea un nuevo código QR desde el torniquete
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <header className={styles.header}>
                    <div className={styles.logo}>ParkQR</div>
                    <h1 className={styles.title}>Registro de Entrada</h1>
                    <p className={styles.subtitle}>
                        Ingresa los datos de tu vehículo para obtener tu ticket
                    </p>
                </header>

                {!ticket ? (
                    <div className={styles.formCard}>
                        {savedVehicle && !showForm ? (
                            <div className={styles.quickCard}>
                                <p className={styles.quickLabel}>¿Entras con tu vehículo habitual?</p>
                                <button
                                    type="button"
                                    className={styles.quickVehicleBtn}
                                    onClick={handleQuickRegister}
                                    disabled={loading}
                                >
                                    <span className={styles.quickVehicleIcon}>{vehicleIcon(savedVehicle.type)}</span>
                                    <div className={styles.quickVehicleInfo}>
                                        <span className={styles.quickPlate}>{savedVehicle.plate}</span>
                                        <span className={styles.quickType}>{vehicleTypeName(savedVehicle.type)}</span>
                                    </div>
                                    <span className={styles.quickArrow}>{loading ? '⏳' : '→'}</span>
                                </button>
                                {error && <div className={styles.errorBox}>⚠️ {error}</div>}
                                <button
                                    type="button"
                                    className={styles.changeVehicleBtn}
                                    onClick={() => setShowForm(true)}
                                >
                                    Usar otro vehículo
                                </button>
                            </div>
                        ) : (
                            <>
                                {savedVehicle && (
                                    <button
                                        type="button"
                                        className={styles.backToSavedBtn}
                                        onClick={() => setShowForm(false)}
                                    >
                                        ← Volver a vehículo guardado
                                    </button>
                                )}

                                <div className={styles.steps}>
                                    <div className={styles.step}>
                                        <div className={styles.stepNumber}>1</div>
                                        <div className={styles.stepText}>Ingresa tu placa</div>
                                    </div>
                                    <div className={styles.step}>
                                        <div className={styles.stepNumber}>2</div>
                                        <div className={styles.stepText}>Selecciona vehículo</div>
                                    </div>
                                    <div className={styles.step}>
                                        <div className={styles.stepNumber}>3</div>
                                        <div className={styles.stepText}>Obtén tu código</div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="plateNumber" className={styles.label}>
                                            Número de Placa
                                        </label>
                                        <input
                                            id="plateNumber"
                                            type="text"
                                            value={plateNumber}
                                            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                            placeholder="Ej: ABC123"
                                            maxLength={10}
                                            className={styles.input}
                                            autoFocus
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Tipo de Vehículo</label>
                                        <div className={styles.vehicleOptions}>
                                            <button
                                                type="button"
                                                className={`${styles.vehicleOption} ${vehicleType === VehicleType.CAR ? styles.selected : ''}`}
                                                onClick={() => setVehicleType(VehicleType.CAR)}
                                            >
                                                <div className={styles.vehicleIcon}>🚗</div>
                                                <div className={styles.vehicleLabel}>Automóvil</div>
                                            </button>

                                            <button
                                                type="button"
                                                className={`${styles.vehicleOption} ${vehicleType === VehicleType.MOTORCYCLE ? styles.selected : ''}`}
                                                onClick={() => setVehicleType(VehicleType.MOTORCYCLE)}
                                            >
                                                <div className={styles.vehicleIcon}>🏍️</div>
                                                <div className={styles.vehicleLabel}>Motocicleta</div>
                                            </button>

                                            <button
                                                type="button"
                                                className={`${styles.vehicleOption} ${vehicleType === VehicleType.BICYCLE ? styles.selected : ''}`}
                                                onClick={() => setVehicleType(VehicleType.BICYCLE)}
                                            >
                                                <div className={styles.vehicleIcon}>🚲</div>
                                                <div className={styles.vehicleLabel}>Bicicleta</div>
                                            </button>
                                        </div>
                                    </div>

                                    {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                                    <button
                                        type="submit"
                                        disabled={loading || !plateNumber || !vehicleType}
                                        className={styles.submitButton}
                                    >
                                        {loading ? '⏳ Registrando...' : '🎯 Completar Registro'}
                                    </button>
                                </form>

                                <div className={styles.infoBox}>
                                    <div className={styles.infoIcon}>ℹ️</div>
                                    <div className={styles.infoText}>
                                        <strong>Importante:</strong> Guarda el código QR que recibirás.
                                        Lo necesitarás para salir del parqueadero.
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.successTitle}>¡Registro Exitoso!</h2>
                        <p className={styles.successMessage}>
                            Tu vehículo ha sido registrado correctamente
                        </p>

                        <div className={styles.ticketInfo}>
                            <div className={styles.ticketRow}>
                                <span className={styles.ticketLabel}>Placa:</span>
                                <span className={styles.ticketValue}>{ticket.plate_number}</span>
                            </div>
                            <div className={styles.ticketRow}>
                                <span className={styles.ticketLabel}>Tipo:</span>
                                <span className={styles.ticketValue}>
                                    {ticket.vehicle_type === 'CAR' && '🚗 Automóvil'}
                                    {ticket.vehicle_type === 'MOTORCYCLE' && '🏍️ Motocicleta'}
                                    {ticket.vehicle_type === 'BICYCLE' && '🚲 Bicicleta'}
                                </span>
                            </div>
                            <div className={styles.ticketRow}>
                                <span className={styles.ticketLabel}>Hora de entrada:</span>
                                <span className={styles.ticketValue}>{formatDate(ticket.entry_timestamp)}</span>
                            </div>
                        </div>

                        {qrDataUrl && (
                            <div className={styles.qrContainer}>
                                <p className={styles.qrTitle}>Tu Código QR</p>
                                <img
                                    src={qrDataUrl}
                                    alt="Código QR"
                                    className={styles.qrImage}
                                />
                                <p className={styles.qrInstruction}>Guarda este código. Lo necesitarás para salir.</p>
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button onClick={downloadQR} className={styles.downloadButton}>
                                ⬇️ Descargar QR
                            </button>
                        </div>

                        <div className={styles.warningBox}>
                            <div className={styles.warningIcon}>⚠️</div>
                            <div className={styles.warningText}>
                                <strong>No pierdas este código:</strong> Es tu comprobante de
                                entrada y lo necesitarás para salir del parqueadero y pagar tu
                                estadía.
                            </div>
                        </div>
                    </div>
                )}

                <footer className={styles.footer}>
                    <p>ParkQR - Torniquete Automatico</p>
                </footer>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className={styles.container}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p className={styles.loadingText}>Cargando...</p>
                    </div>
                </div>
            }
        >
            <RegisterContent/>
        </Suspense>
    );
}
