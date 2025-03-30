import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth, db } from '../../constants/firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const userId = auth.currentUser?.uid;
  const [isRefreshing, setIsRefreshing] = useState(false);
  // This object tracks alerts per field:
  // e.g. { fieldId1: { firstAlert: true, secondAlert: false } }
  const [fieldAlerts, setFieldAlerts] = useState({});
  // To hold timeout IDs for scheduling second alerts.
  const secondAlertTimeoutRef = useRef({});

  // Fetch list of fields from the main collection
  const loadFields = useCallback(async () => {
    setIsRefreshing(true);
    if (userId) {
      const fieldsCollectionRef = collection(db, 'users', userId, 'fields');
      try {
        const querySnapshot = await getDocs(fieldsCollectionRef);
        const fieldList = [];
        querySnapshot.docs.forEach((docSnapshot) => {
          const fieldData = docSnapshot.data();
          const fieldId = docSnapshot.id;
          fieldList.push({ id: fieldId, ...fieldData });
        });
        setFields(fieldList);
      } catch (error) {
        console.error('Error fetching fields:', error);
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadFields();
      return () => {};
    }, [loadFields])
  );

  // For each field, fetch its RecommendationInfo and check totalTimeToRelease.
  useEffect(() => {
    if (!isRefreshing && fields.length > 0 && userId) {
      fields.forEach(async (field) => {
        const recRef = doc(db, 'users', userId, 'fields', field.id, 'RecommendationInfo', 'Data');
        try {
          const recSnap = await getDoc(recRef);
          if (recSnap.exists()) {
            const recData = recSnap.data();
            const totalTimeRaw = recData.totalTimeToRelease;
            const totalTime = parseFloat(totalTimeRaw);
            // Convert hours to minutes:
            const totalMinutes = totalTime * 60;
            // Define threshold: ≤ 3 minutes (i.e. 3 or less)
            if (!isNaN(totalMinutes)) {
              if (totalMinutes <= 3) {
                // If the first alert hasn't been triggered for this field, trigger it.
                if (!fieldAlerts[field.id]?.firstAlert) {
                  Alert.alert(
                    field.FieldName || 'A Field',
                    'Water is overflowing, stop the pump',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          setFieldAlerts((prev) => ({
                            ...prev,
                            [field.id]: { firstAlert: true, secondAlert: false }
                          }));
                        }
                      }
                    ],
                    { cancelable: true }
                  );
                }
                // Schedule the second alert if not already scheduled.
                if (!fieldAlerts[field.id]?.secondAlert && !secondAlertTimeoutRef.current[field.id]) {
                  secondAlertTimeoutRef.current[field.id] = setTimeout(() => {
                    // Re-check the condition before triggering the second alert.
                    if (totalMinutes <= 3) {
                      Alert.alert(
                        field.FieldName || 'A Field',
                        'Second Alert: Water is still overflowing, please check the pump!',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              setFieldAlerts((prev) => ({
                                ...prev,
                                [field.id]: { firstAlert: true, secondAlert: true }
                              }));
                              // Clear the timeout reference for this field.
                              delete secondAlertTimeoutRef.current[field.id];
                            }
                          }
                        ],
                        { cancelable: true }
                      );
                    } else {
                      // Condition no longer holds, clear the timeout.
                      delete secondAlertTimeoutRef.current[field.id];
                    }
                  }, 2 * 60 * 1000); // 2 minutes in milliseconds
                }
              } else {
                // If the condition no longer holds, clear any scheduled second alert
                // and reset the alert state for the field.
                if (secondAlertTimeoutRef.current[field.id]) {
                  clearTimeout(secondAlertTimeoutRef.current[field.id]);
                  delete secondAlertTimeoutRef.current[field.id];
                }
                if (fieldAlerts[field.id]) {
                  setFieldAlerts((prev) => {
                    const newState = { ...prev };
                    delete newState[field.id];
                    return newState;
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching RecommendationInfo for field ${field.id}:`, error);
        }
      });
    }
  }, [fields, isRefreshing, fieldAlerts, userId]);

  const onRefresh = useCallback(() => {
    loadFields();
  }, [loadFields]);

  /**
   * Delete a field document and its subcollections.
   */
  const deleteFieldAndSubcollections = async (fieldId) => {
    try {
      const fieldDocRef = doc(db, 'users', userId, 'fields', fieldId);
      const subcollectionNames = ['FieldInfo', 'RecommendationInfo'];
      for (const subName of subcollectionNames) {
        const subCollRef = collection(db, 'users', userId, 'fields', fieldId, subName);
        const subSnap = await getDocs(subCollRef);
        subSnap.docs.forEach(async (subDoc) => {
          await deleteDoc(subDoc.ref);
        });
      }
      await deleteDoc(fieldDocRef);
      setFields((currentFields) => currentFields.filter((field) => field.id !== fieldId));
    } catch (error) {
      console.error('Error deleting field from Firestore:', error);
      Alert.alert('Error', 'Failed to delete field. Please try again.');
    }
  };

  const handleDeleteField = async (fieldId) => {
    Alert.alert(
      'Delete Field',
      'Are you sure you want to delete this field?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (userId) {
              await deleteFieldAndSubcollections(fieldId);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteField(item.id)}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity style={styles.fieldCard} onPress={() => router.push(`/fieldInfo/${item.id}`)}>
        <Image
          source={item.image ? { uri: item.image } : require('../../assets/images/card2.jpg')}
          style={styles.fieldImage}
        />
        <BlurView intensity={50} tint="light" style={styles.blurContainer}>
          <View style={styles.cardContent}>
            <Text style={styles.fieldTitle}>{item.FieldName || 'Untitled Field'}</Text>
            <Text style={styles.fieldDescription}>{item.Location || ' '}</Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/homeImage1.jpg')} style={styles.backgroundImage} />
      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No fields added yet.</Text>}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 93 }}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(drawer)/addField')}>
        <Text style={styles.addButtonText}>+ Add Field</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  fieldCard: {
    borderRadius: 12,
    margin: 10,
    overflow: 'hidden',
    elevation: 4,
    backgroundColor: 'transparent',
  },
  fieldImage: {
    width: '100%',
    height: 150,
  },
  blurContainer: {
    padding: 10,
  },
  cardContent: {},
  fieldTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  fieldDescription: {
    fontSize: 16,
    color: '#777',
    marginTop: 5,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.25,
    right: width * 0.25,
    backgroundColor: '#2C7865',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#BF3131',
    borderRadius: 8,
    marginTop: 10,
  },
});
