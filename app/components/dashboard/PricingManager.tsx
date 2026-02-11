'use client';

import { useState, useEffect } from 'react';
import { VehicleType } from '../../../interfaces/enums';
import styles from './pricingmanager.module.css';

interface PricingConfig {
  id: string;
  vehicle_type: VehicleType;
  price_per_hour: number;
  active: boolean;
}

export default function PricingManager() {
  const [pricingConfigs, setPricingConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>(VehicleType.CAR);
  const [newPrice, setNewPrice] = useState<number>(0);

  const fetchPricing = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing`);
      if (!response.ok) throw new Error('Error al cargar precios');
      const data = await response.json();
      setPricingConfigs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar precios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleEdit = (config: PricingConfig) => {
    setEditingId(config.id);
    setEditPrice(config.price_per_hour);
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_hour: editPrice }),
      });

      if (!response.ok) throw new Error('Error al actualizar precio');

      await fetchPricing();
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice(0);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_type: newVehicleType,
          price_per_hour: newPrice,
          active: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear configuración');
      }

      await fetchPricing();
      setShowNewForm(false);
      setNewPrice(0);
      setNewVehicleType(VehicleType.CAR);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración de precio?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pricing/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      await fetchPricing();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case VehicleType.CAR:
        return '🚗';
      case VehicleType.MOTORCYCLE:
        return '🏍️';
      case VehicleType.BICYCLE:
        return '🚲';
      default:
        return '🚗';
    }
  };

  const getVehicleName = (type: VehicleType) => {
    switch (type) {
      case VehicleType.CAR:
        return 'Automóvil';
      case VehicleType.MOTORCYCLE:
        return 'Motocicleta';
      case VehicleType.BICYCLE:
        return 'Bicicleta';
      default:
        return type;
    }
  };

  const availableVehicleTypes = Object.values(VehicleType).filter(
    (type) => !pricingConfigs.some((config) => config.vehicle_type === type)
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando configuración de precios...</div>
      </div>
    );
  }

  const handleAddClick = () => {
    if (availableVehicleTypes.length === 0) {
      setError('Ya tienes configurados todos los tipos de vehículos disponibles');
      return;
    }
    setNewVehicleType(availableVehicleTypes[0]);
    setShowNewForm(true);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Gestión de Tarifas</h3>
        {!showNewForm && (
          <button onClick={handleAddClick} className={styles.addButton}>
            + Agregar
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {showNewForm && (
        <div className={styles.newForm}>
          <h4 className={styles.formTitle}>Nuevo Tipo de Vehículo</h4>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Vehículo</label>
              <select
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}
                className={styles.select}
              >
                {availableVehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {getVehicleIcon(type)} {getVehicleName(type)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Precio por Hora</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                placeholder="5000"
                min="0"
                step="100"
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button onClick={handleCreate} className={styles.saveButton}>
              Crear
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewPrice(0);
              }}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className={styles.configList}>
        {pricingConfigs.length === 0 ? (
          <div className={styles.empty}>
            No hay configuraciones de precios. Agrega una para comenzar.
          </div>
        ) : (
          pricingConfigs.map((config) => (
            <div key={config.id} className={styles.configItem}>
              <div className={styles.configHeader}>
                <div className={styles.vehicleInfo}>
                  <span className={styles.icon}>{getVehicleIcon(config.vehicle_type)}</span>
                  <span className={styles.vehicleName}>{getVehicleName(config.vehicle_type)}</span>
                </div>
                {editingId !== config.id && (
                  <div className={styles.actions}>
                    <button onClick={() => handleEdit(config)} className={styles.editButton}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(config.id)} className={styles.deleteButton}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {editingId === config.id ? (
                <div className={styles.editForm}>
                  <div className={styles.editGroup}>
                    <label className={styles.label}>Precio por Hora</label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      min="0"
                      step="100"
                      className={styles.input}
                      autoFocus
                    />
                  </div>
                  <div className={styles.editActions}>
                    <button onClick={() => handleSave(config.id)} className={styles.saveButton}>
                      Guardar
                    </button>
                    <button onClick={handleCancel} className={styles.cancelButton}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.priceDisplay}>
                  <span className={styles.priceLabel}>Tarifa:</span>
                  <span className={styles.priceValue}>{formatCurrency(config.price_per_hour)}/hora</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
