import { auth } from '@/FirebaseConfig';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Birthday, subscribeToBirthdays } from '../../firebase/birthdayService';

export default function HomeScreen() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Birthday[]>([]);
  const [todayBirthdays, setTodayBirthdays] = useState<Birthday[]>([]);

  useEffect(() => {
    getAuth().onAuthStateChanged((user) => {
      if (!user) router.replace('/');
    });

    // Load birthdays and set up real-time listener
    const unsubscribe = subscribeToBirthdays((updatedBirthdays) => {
      setBirthdays(updatedBirthdays);
      processBirthdays(updatedBirthdays);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const processBirthdays = (allBirthdays: Birthday[]) => {
    const currentDate = new Date();

    const upcoming: Birthday[] = [];
    const todayBirthdays: Birthday[] = [];

    allBirthdays.forEach(birthday => {
      const birthdayDate = birthday.date;
      const daysUntil = getDaysUntilBirthday(birthdayDate);
      
      if (daysUntil === 0) {
        todayBirthdays.push(birthday);
      } else if (daysUntil <= 30) {
        upcoming.push(birthday);
      }
    });

    // Sort upcoming by days until birthday
    upcoming.sort((a, b) => getDaysUntilBirthday(a.date) - getDaysUntilBirthday(b.date));
    
    setTodayBirthdays(todayBirthdays);
    setUpcomingBirthdays(upcoming.slice(0, 5)); // Show top 5 upcoming
  };

  const getDaysUntilBirthday = (birthday: Date) => {
    const today = new Date();
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => auth.signOut()
        }
      ]
    );
  };

  const renderTodayBirthday = ({ item }: { item: Birthday }) => (
    <View style={styles.todayCard}>
      <View style={styles.todayCardHeader}>
        <Text style={styles.todayCardTitle}>🎉 Today!</Text>
        <Text style={styles.todayCardName}>{item.name}</Text>
      </View>
      {item.includeTime && item.time && (
        <Text style={styles.todayCardTime}>{formatTime(item.time)}</Text>
      )}
    </View>
  );

  const renderUpcomingBirthday = ({ item }: { item: Birthday }) => {
    const daysUntil = getDaysUntilBirthday(item.date);
    const isTomorrow = daysUntil == 1;
    const isThisWeek = daysUntil <= 7;
    
    return (
      <TouchableOpacity style={[styles.upcomingCard, isThisWeek && styles.thisWeekCard]}>
        <View style={styles.upcomingCardContent}>
          <View style={styles.upcomingCardLeft}>
            <Text style={styles.upcomingCardName}>{item.name}</Text>
            <Text style={styles.upcomingCardDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.upcomingCardRight}>
                          <Text style={[styles.daysUntil, isThisWeek && styles.thisWeekDays]}>
                {isTomorrow ? (
                  "Tomorrow"
                ) : (
                  `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`
                )}
              </Text>
            {isThisWeek && <Text style={styles.thisWeekBadge}>This Week!</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.subtitle}>Here's what's happening with your birthdays</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Birthdays */}
      {todayBirthdays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎉 Today's Birthdays</Text>
          <FlatList
            data={todayBirthdays}
            renderItem={renderTodayBirthday}
            keyExtractor={(item) => item.id || item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.todayList}
          />
        </View>
      )}

      {/* Upcoming Birthdays */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Birthdays</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/saved')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingBirthdays.length > 0 ? (
          <FlatList
            data={upcomingBirthdays}
            renderItem={renderUpcomingBirthday}
            keyExtractor={(item) => item.id || item.name}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📅</Text>
            <Text style={styles.emptyStateTitle}>No upcoming birthdays</Text>
          </View>
        )}
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{birthdays.length}</Text>
            <Text style={styles.statLabel}>Total Birthdays</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{upcomingBirthdays.length}</Text>
            <Text style={styles.statLabel}>Upcoming (30 days)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayBirthdays.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    alignItems: 'flex-start',
    paddingRight: 80,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  signOutButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  signOutText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  todayList: {
    paddingRight: 20,
  },
  todayCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
  },
  todayCardHeader: {
    marginBottom: 8,
  },
  todayCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  todayCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  todayCardTime: {
    fontSize: 14,
    color: '#64748b',
  },
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  thisWeekCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  upcomingCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingCardLeft: {
    flex: 1,
  },
  upcomingCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  upcomingCardDate: {
    fontSize: 14,
    color: '#64748b',
  },
  upcomingCardRight: {
    alignItems: 'flex-end',
  },
  daysUntil: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  thisWeekDays: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  thisWeekBadge: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
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
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
});
