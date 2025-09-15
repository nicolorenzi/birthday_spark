import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Birthday, deleteBirthday, getBirthdays, subscribeToBirthdays } from '../../firebase/birthdayService';

export default function SavedBirthdaysScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortOption, setSortOption] = useState('newest');

  const sortOptions = [
    { key: 'newest', label: 'Newest Added' },
    { key: 'oldest', label: 'Oldest Added' },
    { key: 'alphabetical', label: 'Alphabetical' },
    { key: 'soonest-asc', label: 'Soonest Birthday (Ascending)' },
    { key: 'soonest-desc', label: 'Soonest Birthday (Descending)' },
  ];

  // Load birthdays on component mount
  useEffect(() => {
    loadBirthdays();
    
    // Set up real-time listener
    const unsubscribe = subscribeToBirthdays((updatedBirthdays) => {
      setBirthdays(updatedBirthdays);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if user is authenticated
      const { auth } = await import('../../FirebaseConfig');
      if (!auth.currentUser) {
        console.log('No authenticated user found');
        Alert.alert('Error', 'Please sign in to view birthdays');
        return;
      }
      
      console.log('Loading birthdays for user:', auth.currentUser.uid);
      const data = await getBirthdays();
      setBirthdays(data);
    } catch (error: any) {
      console.error('Error loading birthdays:', error);
      Alert.alert('Error', `Failed to load birthdays: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBirthdays();
    setRefreshing(false);
  };

  const handleDeleteBirthday = (birthday: Birthday) => {
    Alert.alert(
      'Delete Birthday',
      `Are you sure you want to delete ${birthday.name}'s birthday?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (birthday.id) {
                await deleteBirthday(birthday.id);
                Alert.alert('Success', 'Birthday deleted successfully');
              }
            } catch (error: any) {
              console.error('Error deleting birthday:', error);
              Alert.alert('Error', 'Failed to delete birthday');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilBirthday = (birthday: Date) => {
    const today = new Date();
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    // If birthday has passed this year, calculate for next year
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const sortBirthdays = (birthdaysToSort: Birthday[]) => {
    const sorted = [...birthdaysToSort];
    
    switch (sortOption) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      case 'oldest':
        return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      
      case 'alphabetical':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
      case 'soonest-asc':
        return sorted.sort((a, b) => {
          const daysA = getDaysUntilBirthday(a.date);
          const daysB = getDaysUntilBirthday(b.date);
          return daysA - daysB;
        });
      
      case 'soonest-desc':
        return sorted.sort((a, b) => {
          const daysA = getDaysUntilBirthday(a.date);
          const daysB = getDaysUntilBirthday(b.date);
          return daysB - daysA;
        });
      
      default:
        return sorted;
    }
  };

  const sortedBirthdays = sortBirthdays(birthdays);

  const renderBirthdayItem = ({ item }: { item: Birthday }) => {
    const daysUntil = getDaysUntilBirthday(item.date);
    const isToday = daysUntil === 0;
    const isUpcoming = daysUntil <= 30;

    return (
      <View style={[styles.birthdayCard, isToday && styles.todayCard]}>
        <View style={styles.birthdayHeader}>
          <Text style={styles.birthdayName}>{item.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteBirthday(item)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.birthdayDetails}>
          <Text style={styles.birthdayDate}>
            {formatDate(item.date)}
            {item.includeTime && item.time && (
              <Text style={styles.birthdayTime}> • {formatTime(item.time)}</Text>
            )}
          </Text>
          
          <View style={styles.daysUntilContainer}>
            {isToday ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayText}>🎉 Today!</Text>
              </View>
            ) : (
              <Text style={[styles.daysUntil, isUpcoming && styles.upcomingDays]}>
                {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎂</Text>
      <Text style={styles.emptyStateTitle}>No birthdays yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first birthday to get started!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading birthdays...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Saved Birthdays</Text>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.sortButtonText}>↓↑</Text>
            <Text style={styles.sortButtonLabel}>Sort</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {birthdays.length} birthday{birthdays.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={sortedBirthdays}
        renderItem={renderBirthdayItem}
        keyExtractor={(item) => item.id || item.name}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Birthdays</Text>
            
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortOption === option.key && styles.sortOptionSelected
                ]}
                onPress={() => {
                  setSortOption(option.key);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortOption === option.key && styles.sortOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {sortOption === option.key && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sortButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sortButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  sortButtonLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  birthdayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  birthdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  birthdayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#ef4444',
    fontWeight: '600',
  },
  birthdayDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  birthdayDate: {
    fontSize: 16,
    color: '#64748b',
  },
  birthdayTime: {
    fontSize: 16,
    color: '#64748b',
  },
  daysUntilContainer: {
    alignItems: 'flex-end',
  },
  daysUntil: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  upcomingDays: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#3b82f6',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});