import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { addBirthday } from '../../firebase/birthdayService';

interface FormData {
  name: string;
  date: Date;
  time?: Date;
  includeTime: boolean;
}

const AddBirthdaysScreen = () => {
    const { control, handleSubmit, watch, setValue } = useForm<FormData>({
      defaultValues: {
        name: '',
        date: new Date(),
        time: new Date(),
        includeTime: false,
      }
    });
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const includeTime = watch('includeTime');
    
    const onSubmit = async (data: FormData) => {
      try {
        // Prepare the birthday data for Firestore
        const birthdayData = {
          name: data.name,
          date: data.date,
          time: data.includeTime ? data.time : undefined,
          includeTime: data.includeTime,
        };

        // Save to Firestore
        await addBirthday(birthdayData);
        
        // Show success message
        Alert.alert('Success', `Birthday added for ${data.name} on ${data.date.toLocaleDateString()}`);
        
        // Reset form
        setValue('name', '');
        setValue('date', new Date());
        setValue('time', new Date());
        setValue('includeTime', false);

        router.replace('/(tabs)/home');
        
      } catch (error: any) {
        console.error('Error adding birthday:', error);
        Alert.alert('Error', error.message || 'Failed to add birthday. Please try again.');
      }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
      // Only close picker if user dismisses it
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }
      
      // Update the date value but keep picker open
      if (selectedDate) {
        setValue('date', selectedDate);
      }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
      // Only close picker if user dismisses it
      if (event.type === 'dismissed') {
        setShowTimePicker(false);
        return;
      }
      
      // Update the time value but keep picker open
      if (selectedTime) {
        setValue('time', selectedTime);
      }
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString();
    };

    const formatTime = (date: Date | undefined) => {
      if (!date) return 'Select time';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
  
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Add Birthday</Text>
          
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: 'Name is required' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder="Enter name"
                    value={value}
                    onChangeText={onChange}
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />
          </View>

          {/* Date Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Birthday Date</Text>
            <Controller
              control={control}
              name="date"
              render={({ field: { value } }) => (
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.pickerButtonText}>
                    {formatDate(value)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={watch('date')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  style={styles.datePicker}
                />
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Time Toggle */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="includeTime"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity 
                  style={styles.toggleContainer}
                  onPress={() => onChange(!value)}
                >
                  <View style={[styles.toggle, value && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
                  </View>
                  <Text style={styles.toggleLabel}>Include time</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Time Picker (Conditional) */}
          {includeTime && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Time</Text>
              <Controller
                control={control}
                name="time"
                render={({ field: { value } }) => (
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {formatTime(value)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {showTimePicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={watch('time') || new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    style={styles.timePicker}
                  />
                  <TouchableOpacity 
                    style={styles.doneButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)}>
            <Text style={styles.submitButtonText}>Add Birthday</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    content: {
      padding: 20,
      paddingTop: 80,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: 32,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: '#1e293b',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    inputError: {
      borderColor: '#ef4444',
    },
    errorText: {
      color: '#ef4444',
      fontSize: 14,
      marginTop: 4,
    },
    pickerButton: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    pickerButtonText: {
      fontSize: 16,
      color: '#1e293b',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    toggle: {
      width: 44,
      height: 24,
      backgroundColor: '#e2e8f0',
      borderRadius: 12,
      padding: 2,
      marginRight: 12,
    },
    toggleActive: {
      backgroundColor: '#3b82f6',
    },
    toggleThumb: {
      width: 20,
      height: 20,
      backgroundColor: '#ffffff',
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 1,
      elevation: 2,
    },
    toggleThumbActive: {
      transform: [{ translateX: 20 }],
    },
    toggleLabel: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
    },
    submitButton: {
      backgroundColor: '#3b82f6',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 16,
      shadowColor: '#3b82f6',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
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
      marginBottom: 16,
      textAlign: 'center',
    },
    dateInput: {
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: '#1e293b',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      backgroundColor: '#f1f5f9',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: '#3b82f6',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#64748b',
    },
    modalButtonTextPrimary: {
      color: '#ffffff',
    },
    datePicker: {
      width: '100%',
      marginTop: 10,
    },
    timePicker: {
      width: '100%',
      marginTop: 10,
    },
    pickerContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    doneButton: {
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginTop: 16,
    },
    doneButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default AddBirthdaysScreen;