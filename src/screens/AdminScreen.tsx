import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../lib/constants';
import { useLanguage } from '../lib/LanguageContext';
import {
  getCustomProteins,
  getCustomCuisines,
  addCustomProtein,
  addCustomCuisine,
  updateCustomProtein,
  updateCustomCuisine,
  deleteCustomProtein,
  deleteCustomCuisine,
  CustomProtein,
  CustomCuisine,
} from '../api/categories';
import { MAIN_PROTEINS, CUISINES } from '../lib/constants';
import { getAllProteins, getAllCuisines } from '../lib/customCategories';

type RootStackParamList = {
  Home: undefined;
  Admin: undefined;
};

type AdminScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Admin'>;

interface Props {
  navigation: AdminScreenNavigationProp;
}

export default function AdminScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'proteins' | 'cuisines'>('proteins');
  const [allProteins, setAllProteins] = useState<Array<{ value: string; label: string; icon: string; isDefault?: boolean }>>([]);
  const [allCuisines, setAllCuisines] = useState<Array<{ value: string; label: string; flag: string; isDefault?: boolean }>>([]);
  const [customProteins, setCustomProteins] = useState<CustomProtein[]>([]);
  const [customCuisines, setCustomCuisines] = useState<CustomCuisine[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomProtein | CustomCuisine | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ value: '', label: '', icon: '', flag: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [ADMIN] Loading all proteins and cuisines...');
      
      // Load all proteins (default + custom)
      const allProteinsData = await getAllProteins();
      const allProteinsWithFlag = allProteinsData.map(p => ({
        ...p,
        isDefault: MAIN_PROTEINS.some(mp => mp.value === p.value)
      }));
      
      // Load all cuisines (default + custom)
      const allCuisinesData = await getAllCuisines();
      const allCuisinesWithFlag = allCuisinesData.map(c => ({
        ...c,
        isDefault: CUISINES.some(mc => mc.value === c.value)
      }));
      
      // Also load custom only for editing/deleting
      const customProteinsData = await getCustomProteins();
      const customCuisinesData = await getCustomCuisines();
      
      console.log('✅ [ADMIN] Loaded all proteins:', allProteinsWithFlag.length);
      console.log('✅ [ADMIN] Loaded all cuisines:', allCuisinesWithFlag.length);
      console.log('✅ [ADMIN] Custom proteins:', customProteinsData.length);
      console.log('✅ [ADMIN] Custom cuisines:', customCuisinesData.length);
      
      setAllProteins(allProteinsWithFlag);
      setAllCuisines(allCuisinesWithFlag);
      setCustomProteins(customProteinsData);
      setCustomCuisines(customCuisinesData);
    } catch (error: any) {
      console.error('❌ [ADMIN] Error loading admin data:', error);
      const errorMessage = error?.message || 'Error desconocido';
      console.error('❌ [ADMIN] Error details:', errorMessage);
      Alert.alert(
        t('error'), 
        `Error al cargar las categorías: ${errorMessage}\n\n¿Has ejecutado la migración SQL en Supabase?`
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = async (item: CustomProtein | CustomCuisine, type: 'protein' | 'cuisine') => {
    if (!item.id) return;

    const confirmMessage = type === 'protein' 
      ? `¿Eliminar la categoría "${item.label}"?`
      : `¿Eliminar la cocina "${item.label}"?`;

    Alert.alert(
      t('delete'),
      confirmMessage,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'protein') {
                await deleteCustomProtein(item.id!);
              } else {
                await deleteCustomCuisine(item.id!);
              }
              await loadData();
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert(t('error'), 'Error al eliminar');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item: CustomProtein | CustomCuisine) => {
    setEditingItem(item);
    setNewItem({
      value: item.value,
      label: item.label,
      icon: 'icon' in item ? item.icon : '',
      flag: 'flag' in item ? item.flag : '',
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!newItem.value.trim() || !newItem.label.trim()) {
      Alert.alert(t('error'), 'Todos los campos son obligatorios');
      return;
    }

    try {
      if (editingItem) {
        // Update existing
        if (activeTab === 'proteins') {
          if (!editingItem.id) return;
          await updateCustomProtein(editingItem.id, {
            value: newItem.value,
            label: newItem.label,
            icon: newItem.icon,
          });
        } else {
          if (!editingItem.id) return;
          await updateCustomCuisine(editingItem.id, {
            value: newItem.value,
            label: newItem.label,
            flag: newItem.flag,
          });
        }
      } else {
        // Add new
        if (activeTab === 'proteins') {
          await addCustomProtein({
            value: newItem.value,
            label: newItem.label,
            icon: newItem.icon,
          });
        } else {
          await addCustomCuisine({
            value: newItem.value,
            label: newItem.label,
            flag: newItem.flag,
          });
        }
      }
      setShowAddModal(false);
      setEditingItem(null);
      setNewItem({ value: '', label: '', icon: '', flag: '' });
      await loadData();
    } catch (error: any) {
      console.error('Error saving:', error);
      Alert.alert(t('error'), error.message || 'Error al guardar');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setNewItem({ value: '', label: '', icon: '', flag: '' });
    setShowAddModal(true);
  };

  const renderItem = (item: { value: string; label: string; icon?: string; flag?: string; isDefault?: boolean }, type: 'protein' | 'cuisine') => {
    const isDefault = item.isDefault || false;
    const customItem = type === 'protein' 
      ? customProteins.find(p => p.value === item.value)
      : customCuisines.find(c => c.value === item.value);
    
    return (
      <View key={item.value} style={[styles.itemCard, isDefault && styles.defaultItemCard]}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            {type === 'protein' && item.icon && (
              <Text style={styles.itemIcon}>{item.icon}</Text>
            )}
            {type === 'cuisine' && item.flag && (
              <Text style={styles.itemIcon}>{item.flag}</Text>
            )}
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemValue}>{item.value}</Text>
              {isDefault && (
                <Text style={styles.defaultBadge}>Predeterminada</Text>
              )}
            </View>
          </View>
          {!isDefault && customItem && (
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEdit(customItem)}
              >
                <Text style={styles.actionButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(customItem, type)}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Administración</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'proteins' && styles.tabActive]}
          onPress={() => setActiveTab('proteins')}
        >
          <Text style={[styles.tabText, activeTab === 'proteins' && styles.tabTextActive]}>
            Categorías ({allProteins.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cuisines' && styles.tabActive]}
          onPress={() => setActiveTab('cuisines')}
        >
          <Text style={[styles.tabText, activeTab === 'cuisines' && styles.tabTextActive]}>
            Cocinas ({allCuisines.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNew}
          >
            <Text style={styles.addButtonText}>➕ Añadir {activeTab === 'proteins' ? 'Categoría' : 'Cocina'}</Text>
          </TouchableOpacity>

          {activeTab === 'proteins' ? (
            allProteins.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay categorías</Text>
                <Text style={styles.emptyHint}>
                  Añade una nueva categoría usando el botón de arriba
                </Text>
              </View>
            ) : (
              allProteins.map(item => renderItem(item, 'protein'))
            )
          ) : (
            allCuisines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay cocinas</Text>
                <Text style={styles.emptyHint}>
                  Añade una nueva cocina usando el botón de arriba
                </Text>
              </View>
            ) : (
              allCuisines.map(item => renderItem(item, 'cuisine'))
            )
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
          setNewItem({ value: '', label: '', icon: '', flag: '' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editar' : 'Añadir'} {activeTab === 'proteins' ? 'Categoría' : 'Cocina'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Valor (value) - sin espacios, minúsculas"
              value={newItem.value}
              onChangeText={(text) => setNewItem({ ...newItem, value: text.toLowerCase().replace(/\s/g, '_') })}
              editable={!editingItem}
            />

            <TextInput
              style={styles.input}
              placeholder="Etiqueta (label)"
              value={newItem.label}
              onChangeText={(text) => setNewItem({ ...newItem, label: text })}
            />

            {activeTab === 'proteins' ? (
              <TextInput
                style={styles.input}
                placeholder="Icono (emoji)"
                value={newItem.icon}
                onChangeText={(text) => setNewItem({ ...newItem, icon: text })}
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Bandera (emoji)"
                value={newItem.flag}
                onChangeText={(text) => setNewItem({ ...newItem, flag: text })}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItem({ value: '', label: '', icon: '', flag: '' });
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  emptyHint: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  defaultItemCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary + '40',
    borderWidth: 2,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  defaultBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.accent + '30',
  },
  deleteButton: {
    backgroundColor: COLORS.error + '30',
  },
  actionButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
  },
});

