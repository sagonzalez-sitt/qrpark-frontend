'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type DisplayState =
  | 'loading'
  | 'showing_qr'
  | 'confirming'
  | 'transitioning'
  | 'error';

interface RegistrationSession {
  id: string;
  session_token: string;
  status: string;
  ticket_id: string | null;
  expires_at: string;
}

interface CompletedTicket {
  plate_number: string;
  vehicle_type: string;
}

export default function EntryDisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [state, setState] = useState<DisplayState>('loading');
  const [currentSession, setCurrentSession] =
    useState<RegistrationSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [completedTicket, setCompletedTicket] =
    useState<CompletedTicket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generar sesión inicial
  useEffect(() => {
    generateNewSession();
  }, []);

  // Polling para verificar si la sesión se completó
  useEffect(() => {
    if (state !== 'showing_qr' || !currentSession) return;

    const checkSessionStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/registration-sessions/${currentSession.session_token}`
        );

        if (!response.ok) return;

        const session: RegistrationSession = await response.json();

        // Si la sesión se completó, obtener el ticket y mostrar confirmación
        if (session.status === 'COMPLETED' && session.ticket_id) {
          // Obtener información del ticket
          const ticketResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${session.ticket_id}`
          );

          if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            setCompletedTicket({
              plate_number: ticketData.plate_number,
              vehicle_type: ticketData.vehicle_type,
            });

            setState('confirming');

            // Después de 3 segundos, generar nueva sesión
            setTimeout(() => {
              setState('transitioning');
              setTimeout(() => {
                generateNewSession();
              }, 500);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };

    pollingIntervalRef.current = setInterval(checkSessionStatus, 1500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [state, currentSession]);

  const generateNewSession = async () => {
    try {
      setState('loading');
      setError(null);

      // Crear nueva sesión
      const sessionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/registration-sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!sessionResponse.ok) {
        throw new Error('Error al crear sesión');
      }

      const session: RegistrationSession = await sessionResponse.json();

      // Generar QR con la URL de registro
      const registerUrl = `${window.location.origin}/register?session=${session.session_token}`;

      const qrResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: registerUrl }),
        }
      );

      if (!qrResponse.ok) {
        throw new Error('Error al generar QR');
      }

      const qrData = await qrResponse.json();

      setCurrentSession(session);
      setQrDataUrl(qrData.qrDataUrl);
      setCompletedTicket(null);

      // Pequeño delay para la animación
      setTimeout(() => {
        setState('showing_qr');
      }, 100);
    } catch (error) {
      console.error('Error generating session:', error);
      setError(
        error instanceof Error ? error.message : 'Error al generar sesión'
      );
      setState('error');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getVehicleIcon = (type?: string) => {
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

  const getVehicleLabel = (type?: string) => {
    switch (type) {
      case 'CAR':
        return 'Automóvil';
      case 'MOTORCYCLE':
        return 'Motocicleta';
      case 'BICYCLE':
        return 'Bicicleta';
      default:
        return 'Vehículo';
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        ← Volver
      </Link>

      <div className={styles.displayContent}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🅿️</span>
            <span className={styles.logoText}>QRPark</span>
          </div>
          <div className={styles.clock}>
            <div className={styles.time}>{formatTime(currentTime)}</div>
            <div className={styles.date}>{formatDate(currentTime)}</div>
          </div>
        </div>

        {state === 'loading' && (
          <div className={styles.waitingState}>
            <div className={styles.instructionsCard}>
              <div className={styles.iconLarge}>⏳</div>
              <h2 className={styles.instructionsTitle}>
                Generando código QR...
              </h2>
              <div className={styles.loadingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className={styles.waitingState}>
            <div className={styles.instructionsCard}>
              <div className={styles.iconLarge}>⚠️</div>
              <h2 className={styles.instructionsTitle}>Error</h2>
              <p className={styles.instructionsText}>{error}</p>
              <button
                onClick={generateNewSession}
                style={{
                  marginTop: '24px',
                  padding: '12px 24px',
                  background: 'white',
                  color: '#1e3c72',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {state === 'showing_qr' && qrDataUrl && (
          <div className={styles.qrState}>
            <div className={styles.qrMainContent}>
              <div className={styles.qrCard}>
                <div className={styles.scanPrompt}>
                  <div className={styles.scanIcon}>📸</div>
                  <h2 className={styles.scanTitle}>Escanea para Registrarte</h2>
                  <p className={styles.scanSubtitle}>
                    Usa tu teléfono para escanear e ingresar tu placa
                  </p>
                </div>

                <div className={styles.qrImageContainer}>
                  <img
                    src={qrDataUrl}
                    alt="Código QR"
                    className={styles.qrImage}
                  />
                  <div className={styles.qrPulse}></div>
                </div>

                <div className={styles.ticketInfo}>
                  <div className={styles.stepsInfo}>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>1</span>
                      <span className={styles.stepText}>Escanea el QR</span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>2</span>
                      <span className={styles.stepText}>Ingresa tu placa</span>
                    </div>
                    <div className={styles.stepItem}>
                      <span className={styles.stepNumber}>3</span>
                      <span className={styles.stepText}>Recibe tu ticket</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.waitingForScan}>
                <div className={styles.waitingIcon}>⏳</div>
                <p className={styles.waitingText}>
                  Esperando que completes tu registro...
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'confirming' && completedTicket && (
          <div className={styles.confirmingState}>
            <div className={styles.successAnimation}>
              <div className={styles.successIcon}>✅</div>
              <h2 className={styles.successTitle}>¡Registro Exitoso!</h2>
              <p className={styles.successSubtitle}>
                Vehículo{' '}
                <strong>
                  {getVehicleIcon(completedTicket.vehicle_type)}{' '}
                  {completedTicket.plate_number}
                </strong>{' '}
                registrado correctamente
              </p>
              <div className={styles.successMessage}>
                <p>🎫 Ticket generado y entregado</p>
                <p>✨ Generando siguiente código...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
