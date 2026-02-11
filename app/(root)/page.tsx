import Card from '../components/shared/card/Card';
import QRTypeSelector from '../components/home/QRTypeSelector';
import styles from './page.module.css';

export default function Home() {
    const modules = [
        {
            title: 'Terminal de Entrada',
            description: 'Registro manual de vehículos por parte del operador',
            icon: '🎫',
            href: '/counter',
            badge: 'Operador',
        },
        {
            title: 'Terminal de Salida',
            description: 'Procesamiento de salida y cálculo automático de tarifas',
            icon: '🚪',
            href: '/exit',
            badge: 'Operador',
        },
        {
            title: 'Dashboard',
            description: 'Monitoreo en tiempo real y estadísticas del parqueadero',
            icon: '📊',
            href: '/dashboard',
            badge: 'Monitor',
        },
        {
            title: 'Panel Operador',
            description: 'Interfaz especializada para registro rápido de vehículos',
            icon: '👨‍💼',
            href: '/operator',
            badge: 'Operador',
        },
        {
            title: 'Pantalla Torniquete',
            description: 'Simulación de pantalla grande en el punto de entrada',
            icon: '📺',
            href: '/entry-display',
            badge: 'Display',
        },
        {
            title: 'Vista de Usuario',
            description: 'Simulación completa de la experiencia móvil del usuario',
            icon: '📱',
            href: '/user',
            badge: 'Usuario',
        },
    ];

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>ParkQR</h1>
                    <p className={styles.subtitle}>
                        Gestión inteligente de parqueadero con códigos QR
                    </p>
                </header>

                <QRTypeSelector/>

                <div className={styles.modulesSection}>
                    <h2 className={styles.modulesTitle}>Módulos del Sistema</h2>
                </div>

                <div className={styles.grid}>
                    {modules.map((module) => (
                        <Card
                            key={module.href}
                            title={module.title}
                            description={module.description}
                            icon={module.icon}
                            href={module.href}
                            badge={module.badge}
                        />
                    ))}
                </div>

                <footer className={styles.footer}>
                    <p>Sistema inteligente de gestion de parqueadero</p>
                </footer>
            </div>
        </main>
    );
}
