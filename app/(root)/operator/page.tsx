'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VehicleType } from '../../../interfaces/enums';
import { TicketResponse } from '../../../interfaces/interfaces';
import VehicleTypeSelector from '../../components/counter/VehicleTypeSelector';
import TurnstileDisplay from '../../components/operator/TurnstileDisplay';
import styles from './page.module.css';

export default function OperatorPage() {
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
      // Crear ticket
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate_number: plateNumber.toUpperCase(),
            vehicle_type: vehicleType,
            isOperatorEntry: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al crear el ticket');
      }

      const ticketData: TicketResponse = await response.json();

      // Obtener QR como Data URL
      const qrResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/${ticketData.qr_token}/large`
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

  const handleDisplayConfirm = () => {
    // Resetear el display
    setTicket(null);
    setQrDataUrl(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>👨‍💼 Panel Operador</h1>
            <p className={styles.subtitle}>
              Interfaz especializada para registro rápido de vehículos
            </p>
          </div>
          <Link href="/" className={styles.backButton}>
            ← Volver
          </Link>
        </header>

        <div className={styles.mainGrid}>
          {/* Panel del Operador */}
          <div className={styles.operatorPanel}>
            <h2 className={styles.sectionTitle}>Registrar Vehículo</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
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
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '24px',
                    fontWeight: '600',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.3s',
                    textAlign: 'center',
                    letterSpacing: '2px',
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
                  padding: '20px',
                  background: loading ? '#ccc' : '#4a90e2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                {loading ? 'Enviando...' : '🚀 Generar y Enviar a Pantalla'}
              </button>
            </form>

            {ticket && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#2e7d32', fontWeight: '600' }}>
                  ✅ Ticket enviado a pantalla de torniquete
                </p>
              </div>
            )}
          </div>

          {/* Simulación de Pantalla Torniquete */}
          <div className={styles.displaySimulation}>
            <h2 className={styles.displayTitle}>
              📺 Simulación Pantalla Torniquete
            </h2>
            <TurnstileDisplay
              ticket={ticket}
              qrDataUrl={qrDataUrl}
              onConfirm={handleDisplayConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
