'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PricingManager from '../../components/dashboard/PricingManager';
import TicketModal from '../../components/dashboard/TicketModal';
import styles from './page.module.css';

interface Statistics {
  activeTickets: number;
  dailyRevenue: number;
  dailyEntries: number;
  averageStayMs: number;
  averageStayFormatted: string;
  distribution: {
    cars: number;
    motorcycles: number;
    bicycles: number;
  };
  deliveryMethodDistribution: {
    digitalPhoto: number;
    digitalDownload: number;
    printed: number;
    unknown: number;
  };
}

interface Ticket {
  id: string;
  plate_number: string;
  vehicle_type: string;
  status: string;
  entry_timestamp: string;
  exit_timestamp?: string;
  calculated_fee?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      const [statsResponse, ticketsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/dashboard`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets`)
      ]);

      if (!statsResponse.ok || !ticketsResponse.ok) {
        throw new Error('Error al cargar datos');
      }

      const statsData = await statsResponse.json();
      const ticketsData = await ticketsResponse.json();

      setStats(statsData);
      setTickets(ticketsData.slice(0, 20)); // Limitar a 20 tickets
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar datos'
      );
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;
  };

  const getTotalVehicles = () => {
    if (!stats) return 0;
    return (
      stats.distribution.cars +
      stats.distribution.motorcycles +
      stats.distribution.bicycles
    );
  };

  const getVehiclePercentage = (count: number) => {
    const total = getTotalVehicles();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { text: 'Activo', color: '#2ecc71' };
      case 'COMPLETED':
        return { text: 'Completado', color: '#95a5a6' };
      case 'PAID':
        return { text: 'Pagado', color: '#3498db' };
      default:
        return { text: status, color: '#999' };
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backButton}>
          ← Volver al inicio
        </Link>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>📊 Dashboard</h1>
            <p className={styles.subtitle}>
              Estadísticas en tiempo real del sistema de parqueadero
            </p>
          </div>
          <button onClick={fetchStatistics} className={styles.refreshButton}>
            🔄 Actualizar
          </button>
        </header>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Cargando estadísticas...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>⚠️ {error}</p>
            <button onClick={fetchStatistics} className={styles.retryButton}>
              Reintentar
            </button>
          </div>
        ) : stats ? (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🚗</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statLabel}>Vehículos Activos</h3>
                  <p className={styles.statValue}>{stats.activeTickets}</p>
                  <span className={styles.statSubtext}>en el parqueadero</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statLabel}>Ingresos del Día</h3>
                  <p className={styles.statValue}>{formatCurrency(stats.dailyRevenue)}</p>
                  <span className={styles.statSubtext}>generados hoy</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statLabel}>Tiempo Promedio</h3>
                  <p className={styles.statValue}>{stats.averageStayFormatted}</p>
                  <span className={styles.statSubtext}>de estadía</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📈</div>
                <div className={styles.statContent}>
                  <h3 className={styles.statLabel}>Entradas del Día</h3>
                  <p className={styles.statValue}>{stats.dailyEntries}</p>
                  <span className={styles.statSubtext}>vehículos hoy</span>
                </div>
              </div>
            </div>

            <div className={styles.mainContentGrid}>
              <div className={styles.leftColumn}>
                {/* Historial de Vehículos */}
                <div className={styles.chartCard}>
                  <h2 className={styles.chartTitle}>Historial de Vehículos</h2>
                  <div className={styles.tableContainer}>
                    <table className={styles.ticketsTable}>
                      <thead>
                        <tr>
                          <th>Placa</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Hora Entrada</th>
                          <th>Tarifa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan={5} className={styles.emptyTable}>
                              No hay vehículos registrados
                            </td>
                          </tr>
                        ) : (
                          tickets.map((ticket) => {
                            const status = getStatusBadge(ticket.status);
                            return (
                              <tr key={ticket.id}>
                                <td
                                  className={styles.plateCell}
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                >
                                  {ticket.plate_number}
                                </td>
                                <td className={styles.iconCell}>
                                  {getVehicleIcon(ticket.vehicle_type)}
                                </td>
                                <td>
                                  <span
                                    className={styles.statusBadge}
                                    style={{ background: status.color }}
                                  >
                                    {status.text}
                                  </span>
                                </td>
                                <td>{formatTime(ticket.entry_timestamp)}</td>
                                <td className={styles.feeCell}>
                                  {ticket.calculated_fee
                                    ? formatCurrency(ticket.calculated_fee)
                                    : '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen y Distribución */}
                <div className={styles.bottomCardsGrid}>
                  <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Resumen General</h2>
                    <div className={styles.summaryList}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryDot} style={{ background: '#3498db' }}></span>
                        <span className={styles.summaryLabel}>Tickets Activos:</span>
                        <span className={styles.summaryValue}>{stats.activeTickets}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryDot} style={{ background: '#2ecc71' }}></span>
                        <span className={styles.summaryLabel}>Ingresos del Día:</span>
                        <span className={styles.summaryValue}>{formatCurrency(stats.dailyRevenue)}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryDot} style={{ background: '#f39c12' }}></span>
                        <span className={styles.summaryLabel}>Promedio Estadía:</span>
                        <span className={styles.summaryValue}>{stats.averageStayFormatted}</span>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryDot} style={{ background: '#9b59b6' }}></span>
                        <span className={styles.summaryLabel}>Entradas del Día:</span>
                        <span className={styles.summaryValue}>{stats.dailyEntries}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>Distribución de Vehículos</h2>
                    <div className={styles.vehicleDistribution}>
                      <div className={styles.vehicleItemCompact}>
                        <div className={styles.vehicleHeader}>
                          <span className={styles.vehicleLabel}>🚗 Autos</span>
                          <span className={styles.vehicleCount}>{stats.distribution.cars}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${getVehiclePercentage(stats.distribution.cars)}%`,
                              background: '#3498db',
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className={styles.vehicleItemCompact}>
                        <div className={styles.vehicleHeader}>
                          <span className={styles.vehicleLabel}>🏍️ Motos</span>
                          <span className={styles.vehicleCount}>{stats.distribution.motorcycles}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${getVehiclePercentage(stats.distribution.motorcycles)}%`,
                              background: '#e74c3c',
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className={styles.vehicleItemCompact}>
                        <div className={styles.vehicleHeader}>
                          <span className={styles.vehicleLabel}>🚲 Bicis</span>
                          <span className={styles.vehicleCount}>{stats.distribution.bicycles}</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${getVehiclePercentage(stats.distribution.bicycles)}%`,
                              background: '#2ecc71',
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.rightColumn}>
                <PricingManager />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {selectedTicketId && (
        <TicketModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}
