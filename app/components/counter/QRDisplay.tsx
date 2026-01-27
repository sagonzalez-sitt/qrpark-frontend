import Image from 'next/image';
import styles from './QRDisplay.module.css';
import {TicketResponse} from "@/interfaces/interfaces";

interface QRDisplayProps {
  ticket: TicketResponse | null;
  qrDataUrl: string | null;
}

export default function QRDisplay({ ticket, qrDataUrl }: QRDisplayProps) {
  if (!ticket || !qrDataUrl) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🎫</div>
        <p className={styles.emptyText}>
          El código QR aparecerá aquí una vez que generes el ticket
        </p>
      </div>
    );
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `ticket-${ticket.plate_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Ticket - ${ticket.plate_number}</title></head>
          <body style="text-align: center; padding: 20px;">
            <h2>Ticket de Parqueadero</h2>
            <p><strong>Placa:</strong> ${ticket.plate_number}</p>
            <p><strong>Tipo:</strong> ${ticket.vehicle_type}</p>
            <img src="${qrDataUrl}" style="width: 400px; height: 400px;" />
            <p>Escanea este código QR al salir</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticket.qr_token);
      alert('Token copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className={styles.qrContainer}>
      <Image
        src={qrDataUrl}
        alt="QR Code"
        width={300}
        height={300}
        className={styles.qrImage}
      />

      <div className={styles.ticketInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Placa:</span>
          <span className={styles.infoValue}>{ticket.plate_number}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Tipo:</span>
          <span className={styles.infoValue}>
            {ticket.vehicle_type === 'CAR' && '🚗 Carro'}
            {ticket.vehicle_type === 'MOTORCYCLE' && '🏍️ Moto'}
            {ticket.vehicle_type === 'BICYCLE' && '🚲 Bicicleta'}
          </span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Hora de entrada:</span>
          <span className={styles.infoValue}>
            {new Date(ticket.entry_timestamp).toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleDownload}
        >
          📥 Descargar QR
        </button>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handlePrint}
        >
          🖨️ Imprimir Ticket
        </button>
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          onClick={handleCopy}
        >
          📋 Copiar Token
        </button>
      </div>
    </div>
  );
}
