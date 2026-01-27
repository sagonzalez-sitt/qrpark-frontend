import Link from 'next/link';
import styles from './card.module.css';

interface CardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
}

export default function Card({ title, description, icon, href, badge }: CardProps) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {badge && <span className={styles.badge}>{badge}</span>}
    </Link>
  );
}
