'use client';

import { useState } from 'react';
import { VehicleType } from '../../../interfaces/enums';
import { TicketResponse } from '../../../interfaces/interfaces';
import styles from './page.module.css';

export default function SelfServicePage() {
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

    // Validar formato de placa
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el vehículo');
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al procesar la solicitud'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl || !ticket) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qrpark-${ticket.plate_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewRegistration = () => {
    setTicket(null);
    setQrDataUrl(null);
    setError(null);
    setPlateNumber('');
    setVehicleType(null);
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.logo}>🚗 QRPark</div>
          <h1 className={styles.title}>Bienvenido al Parqueadero</h1>
          <p className={styles.subtitle}>
            Registra tu vehículo para obtener tu código QR de acceso
          </p>
        </header>

        {!ticket ? (
          <div className={styles.formCard}>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepText}>Ingresa tu placa</div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepText}>Selecciona tipo de vehículo</div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepText}>Obtén tu código QR</div>
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
                    className={`${styles.vehicleOption} ${
                      vehicleType === VehicleType.CAR ? styles.selected : ''
                    }`}
                    onClick={() => setVehicleType(VehicleType.CAR)}
                  >
                    <div className={styles.vehicleIcon}>🚗</div>
                    <div className={styles.vehicleLabel}>Automóvil</div>
                  </button>

                  <button
                    type="button"
                    className={`${styles.vehicleOption} ${
                      vehicleType === VehicleType.MOTORCYCLE ? styles.selected : ''
                    }`}
                    onClick={() => setVehicleType(VehicleType.MOTORCYCLE)}
                  >
                    <div className={styles.vehicleIcon}>🏍️</div>
                    <div className={styles.vehicleLabel}>Motocicleta</div>
                  </button>

                  <button
                    type="button"
                    className={`${styles.vehicleOption} ${
                      vehicleType === VehicleType.BICYCLE ? styles.selected : ''
                    }`}
                    onClick={() => setVehicleType(VehicleType.BICYCLE)}
                  >
                    <div className={styles.vehicleIcon}>🚲</div>
                    <div className={styles.vehicleLabel}>Bicicleta</div>
                  </button>
                </div>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !plateNumber || !vehicleType}
                className={styles.submitButton}
              >
                {loading ? '⏳ Registrando...' : '🎯 Registrar Vehículo'}
              </button>
            </form>

            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>ℹ️</div>
              <div className={styles.infoText}>
                <strong>Importante:</strong> Guarda el código QR que recibirás.
                Lo necesitarás para salir del parqueadero.
              </div>
            </div>
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
                <span className={styles.ticketValue}>
                  {formatDate(ticket.entry_timestamp)}
                </span>
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
                <p className={styles.qrInstruction}>
                  Guarda este código. Lo necesitarás para salir.
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={downloadQR} className={styles.downloadButton}>
                ⬇️ Descargar QR
              </button>
              <button
                onClick={handleNewRegistration}
                className={styles.newButton}
              >
                ➕ Nuevo Registro
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
          <p>Sistema QRPark - Autoservicio v1.0</p>
        </footer>
      </div>
    </div>
  );
}
