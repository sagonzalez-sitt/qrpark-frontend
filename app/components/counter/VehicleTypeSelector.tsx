import styles from './VehicleTypeSelector.module.css';
import {VehicleType} from "@/interfaces/enums";

interface VehicleTypeSelectorProps {
  selected: VehicleType | null;
  onSelect: (type: VehicleType) => void;
}

const vehicleOptions = [
  { type: VehicleType.CAR, icon: '🚗', name: 'Carro' },
  { type: VehicleType.MOTORCYCLE, icon: '🏍️', name: 'Moto' },
  { type: VehicleType.BICYCLE, icon: '🚲', name: 'Bicicleta' },
];

export default function VehicleTypeSelector({
  selected,
  onSelect,
}: VehicleTypeSelectorProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Tipo de Vehículo</label>
      <div className={styles.options}>
        {vehicleOptions.map((option) => (
          <div
            key={option.type}
            className={`${styles.option} ${selected === option.type ? styles.selected : ''}`}
            onClick={() => onSelect(option.type)}
          >
            <span className={styles.icon}>{option.icon}</span>
            <span className={styles.name}>{option.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
