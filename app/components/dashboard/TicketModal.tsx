'use client';

import { useEffect, useState } from 'react';
import styles from './ticketmodal.module.css';

interface TicketModalProps {
  ticketId: string;
  onClose: () => void;
}

interface TicketDetail {
  id: string;
  qr_token: string;
  plate_number: string;
  vehicle_type: string;
  status: string;
  entry_timestamp: string;
  exit_timestamp?: string;
  calculated_fee?: number;
  delivery_method: string;
}

export default function TicketModal({ ticketId, onClose }: TicketModalProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        // Primero obtener el ticket
        const ticketResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}`);

        if (!ticketResponse.ok) {
          throw new Error('Error al cargar detalles del ticket');
        }

        const ticketData = await ticketResponse.json();
        setTicket(ticketData);

        // Luego obtener el QR usando el qr_token
        if (ticketData.qr_token) {
          try {
            const qrResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/qr/${ticketData.qr_token}/dataurl`
            );

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              setQrDataUrl(qrData.qrDataUrl);
            }
          } catch (qrErr) {
            console.error('Error loading QR:', qrErr);
            // No lanzar error, solo no mostrar el QR
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0';
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const calculateDuration = () => {
    if (!ticket) return 'N/A';
    const entryTime = new Date(ticket.entry_timestamp).getTime();
    const exitTime = ticket.exit_timestamp ? new Date(ticket.exit_timestamp).getTime() : Date.now();
    const durationMs = exitTime - entryTime;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const calculateAccumulatedFee = () => {
    if (!ticket) return 0;
    if (ticket.calculated_fee) return ticket.calculated_fee;

    // Si no tiene tarifa calculada, está activo, calculamos en tiempo real
    const entryTime = new Date(ticket.entry_timestamp).getTime();
    const currentTime = Date.now();
    const durationHours = (currentTime - entryTime) / (1000 * 60 * 60);

    // Tarifas aproximadas por tipo
    const rates: { [key: string]: number } = {
      'CAR': 5000,
      'MOTORCYCLE': 3000,
      'BICYCLE': 1000,
    };

    const rate = rates[ticket.vehicle_type] || 5000;
    return Math.ceil(durationHours * rate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#2ecc71';
      case 'COMPLETED':
        return '#95a5a6';
      case 'PAID':
        return '#3498db';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'COMPLETED':
        return 'Completado';
      case 'PAID':
        return 'Pagado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getVehicleIcon = (type: string) => {
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

  const getVehicleName = (type: string) => {
    switch (type) {
      case 'CAR':
        return 'Automóvil';
      case 'MOTORCYCLE':
        return 'Motocicleta';
      case 'BICYCLE':
        return 'Bicicleta';
      default:
        return type;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Detalles del Ticket</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando detalles...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>⚠️ {error}</p>
          </div>
        ) : ticket ? (
          <div className={styles.content}>
            <div className={styles.topSection}>
              {qrDataUrl && (
                <div className={styles.qrSection}>
                  <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
                  <p className={styles.qrLabel}>Código QR del Ticket</p>
                </div>
              )}

              <div className={styles.summarySection}>
                <div className={styles.plateDisplay}>
                  <span className={styles.plateLabel}>Placa</span>
                  <span className={styles.plateValue}>{ticket.plate_number}</span>
                </div>

                <div className={styles.statusBadge} style={{ background: getStatusColor(ticket.status) }}>
                  {getStatusText(ticket.status)}
                </div>

                <div className={styles.feeDisplay}>
                  <span className={styles.feeLabel}>Tarifa Acumulada</span>
                  <span className={styles.feeValue}>{formatCurrency(calculateAccumulatedFee())}</span>
                </div>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>ID del Ticket</span>
                <span className={styles.detailValue}>{ticket.id}</span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Token QR</span>
                <span className={styles.detailValueMono}>{ticket.qr_token}</span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Tipo de Vehículo</span>
                <span className={styles.detailValue}>
                  {getVehicleIcon(ticket.vehicle_type)} {getVehicleName(ticket.vehicle_type)}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Método de Entrega</span>
                <span className={styles.detailValue}>{ticket.delivery_method}</span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Hora de Entrada</span>
                <span className={styles.detailValue}>{formatDate(ticket.entry_timestamp)}</span>
              </div>

              {ticket.exit_timestamp && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Hora de Salida</span>
                  <span className={styles.detailValue}>{formatDate(ticket.exit_timestamp)}</span>
                </div>
              )}

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Tiempo de Estadía</span>
                <span className={styles.detailValue}>{calculateDuration()}</span>
              </div>

              {ticket.calculated_fee !== undefined && ticket.calculated_fee !== null && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tarifa Final</span>
                  <span className={styles.detailValue}>{formatCurrency(ticket.calculated_fee)}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
