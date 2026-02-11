'use client';

import {useState} from 'react';
import Link from 'next/link';
import {VehicleType} from '../../../interfaces/enums';
import {TicketResponse} from '../../../interfaces/interfaces';
import VehicleTypeSelector from '../../components/counter/VehicleTypeSelector';
import QRDisplay from '../../components/counter/QRDisplay';
import styles from './page.module.css';

export default function CounterPage() {
    const [plateNumber, setPlateNumber] = useState('');
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [loading, setLoading] = useState(false);
    const [ticket, setTicket] = useState<TicketResponse | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/tickets`,
                {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        plate_number: plateNumber.toUpperCase(),
                        vehicle_type: vehicleType,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear el ticket');
            }

            const ticketData: TicketResponse = await response.json();

            // Obtener QR como Data URL
            const qrResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/qr/${ticketData.qr_token}/dataurl`
            );

            if (!qrResponse.ok) {
                throw new Error('Error al generar el código QR');
            }

            const qrData = await qrResponse.json();

            setTicket(ticketData);
            setQrDataUrl(qrData.qrDataUrl);

            // Limpiar formulario
            setPlateNumber('');
            setVehicleType(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al procesar la solicitud'
            );
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewTicket = () => {
        setTicket(null);
        setQrDataUrl(null);
        setError(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Link href="/" className={styles.backButton}>
                    ← Volver al inicio
                </Link>

                <header className={styles.header}>
                    <h1 className={styles.title}>🎫 Terminal de Entrada</h1>
                    <p className={styles.subtitle}>
                        Registro manual de vehículos por parte del operador
                    </p>
                </header>

                <div className={styles.mainContent}>
                    <div className={styles.formSection}>
                        <h2 className={styles.sectionTitle}>Registrar Vehículo</h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{marginBottom: '24px'}}>
                                <label
                                    htmlFor="plateNumber"
                                    style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#333',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Número de Placa
                                </label>
                                <input
                                    id="plateNumber"
                                    type="text"
                                    value={plateNumber}
                                    onChange={(e) =>
                                        setPlateNumber(e.target.value.toUpperCase())
                                    }
                                    placeholder="Ej: ABC123"
                                    maxLength={10}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '16px',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        transition: 'border-color 0.3s',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#4a90e2')}
                                    onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
                                />
                            </div>

                            <VehicleTypeSelector
                                selected={vehicleType}
                                onSelect={setVehicleType}
                            />

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
                                    background: loading ? '#ccc' : '#4a90e2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.3s',
                                }}
                            >
                                {loading ? 'Generando ticket...' : '✨ Generar Ticket'}
                            </button>
                        </form>

                        {ticket && (
                            <button
                                onClick={handleNewTicket}
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
                                ➕ Nuevo Ticket
                            </button>
                        )}
                    </div>

                    <div className={styles.qrSection}>
                        <h2 className={styles.sectionTitle}>Código QR</h2>
                        <QRDisplay ticket={ticket} qrDataUrl={qrDataUrl}/>
                    </div>
                </div>
            </div>
        </div>
    );
}
