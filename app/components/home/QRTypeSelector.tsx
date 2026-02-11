'use client';

import { useState } from 'react';
import styles from './qrtypeselector.module.css';

export default function QRTypeSelector() {
  const [showStaticQR, setShowStaticQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateStaticQR = async () => {
    setLoading(true);
    try {
      // URL de autoservicio (donde apunta el QR estático)
      const selfServiceUrl = `${window.location.origin}/self-service`;

      // Generar QR usando el endpoint del backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/qr/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: selfServiceUrl }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al generar QR');
      }

      const data = await response.json();
      setQrDataUrl(data.qrDataUrl);
      setShowStaticQR(true);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al generar el código QR estático');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'parkqr-estatico.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>⚙️ Configuración de Acceso</h2>
        <p className={styles.subtitle}>
          Elige el tipo de sistema de entrada según tu infraestructura
        </p>
      </div>

      <div className={styles.optionsGrid}>
        {/* QR Dinámico */}
        <div className={styles.optionCard}>
          <div className={styles.optionBadge}>Recomendado</div>
          <div className={styles.optionIcon}>🔄</div>
          <h3 className={styles.optionTitle}>QR Dinámico</h3>
          <p className={styles.optionDescription}>
            Sistema completo con torniquete y pantalla. El código QR se genera
            automáticamente para cada vehículo cuando el operador registra la
            entrada.
          </p>
          <ul className={styles.featureList}>
            <li>✓ QR único por vehículo</li>
            <li>✓ Pantalla de torniquete</li>
            <li>✓ Mayor seguridad</li>
            <li>✓ Control total del flujo</li>
          </ul>
          <div className={styles.optionNote}>
            <strong>Estado:</strong> Activo automáticamente
          </div>
        </div>

        {/* QR Estático */}
        <div className={styles.optionCard}>
          <div className={styles.optionBadge} style={{ background: '#f39c12' }}>
            Económico
          </div>
          <div className={styles.optionIcon}>📌</div>
          <h3 className={styles.optionTitle}>QR Estático</h3>
          <p className={styles.optionDescription}>
            Opción simplificada sin torniquete. Un solo código QR impreso que
            los usuarios escanean para registrarse por autoservicio.
          </p>
          <ul className={styles.featureList}>
            <li>✓ Un QR para todos</li>
            <li>✓ Sin infraestructura física</li>
            <li>✓ Autoservicio usuarios</li>
            <li>✓ Bajo costo inicial</li>
          </ul>

          {!showStaticQR ? (
            <button
              onClick={generateStaticQR}
              disabled={loading}
              className={styles.generateButton}
            >
              {loading ? '⏳ Generando...' : '🎯 Generar QR Estático'}
            </button>
          ) : (
            <div className={styles.qrResult}>
              {qrDataUrl && (
                <>
                  <img
                    src={qrDataUrl}
                    alt="QR Estático"
                    className={styles.qrImage}
                  />
                  <p className={styles.qrLabel}>
                    QR de Acceso al Autoservicio
                  </p>
                  <button onClick={downloadQR} className={styles.downloadButton}>
                    ⬇️ Descargar QR
                  </button>
                  <button
                    onClick={() => setShowStaticQR(false)}
                    className={styles.resetButton}
                  >
                    ↻ Regenerar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.infoBox}>
        <div className={styles.infoIcon}>💡</div>
        <div className={styles.infoContent}>
          <h4 className={styles.infoTitle}>¿Cuál elegir?</h4>
          <p className={styles.infoText}>
            <strong>QR Dinámico:</strong> Ideal si tienes presupuesto para
            pantalla y torniquete. Mayor control y seguridad.
            <br />
            <strong>QR Estático:</strong> Perfecto para iniciar sin inversión
            en hardware. Imprime el QR y colócalo en la entrada.
          </p>
        </div>
      </div>
    </div>
  );
}
