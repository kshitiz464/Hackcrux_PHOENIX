import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { auth, db } from '../../../constants/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, update } from 'firebase/database';
import { BlurView } from 'expo-blur';

export default function FieldInfoScreen() {
  const { id } = useLocalSearchParams();
  const userId = auth.currentUser?.uid;
  const [fieldData, setFieldData] = useState({});
  const [recommendationInfo, setRecommendationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waterStatus, setWaterStatus] = useState(false);
  
  // RTDB instance
  const dbRT = getDatabase();

  // Mapping for recommendation fields to friendly names and units.
  const fieldMapping = {
    irrigationPerSquareMeter: { label: "Irrigation per Square Meter", unit: "L/m²" },
    totalWaterToReleaseLiters: { label: "Total Water to Release", unit: "Liters" },
    expectedPumpOnTime: { label: "Expected Pump ON Time", unit: "Minutes" },
    totalTimeToRelease: { label: "Total Time to Release", unit: "Hours" },
  };

  // Helper: Convert hours to a string with hours and minutes.
  const convertHoursToHoursMinutes = (hoursValue) => {
    const value = Number(hoursValue);
    if (isNaN(value)) return 'N/A';
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} Hours ${minutes} Minutes`;
  };

  // Load data from Firestore as before.
  const loadData = useCallback(async () => {
    setLoading(true);
    if (!userId || !id) return;
    try {
      const fieldInfoRef = doc(db, 'users', userId, 'fields', id, 'FieldInfo', 'Data');
      const fieldInfoSnap = await getDoc(fieldInfoRef);
      setFieldData(fieldInfoSnap.exists() ? fieldInfoSnap.data() : {});

      const recommendationRef = doc(db, 'users', userId, 'fields', id, 'RecommendationInfo', 'Data');
      const recommendationSnap = await getDoc(recommendationRef);
      const recData = recommendationSnap.exists() ? recommendationSnap.data() : null;
      setRecommendationInfo(recData);

      // If RecommendationInfo includes a WaterStatus property, update local state.
      if (recData && recData.WaterStatus !== undefined) {
        setWaterStatus(recData.WaterStatus);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [loadData, id])
  );

  // Handler for the pump ON/OFF toggle.
  const handleWaterToggle = async () => {
    const newStatus = !waterStatus;
    setWaterStatus(newStatus);
    if (userId && id) {
      try {
        const pumpRef = ref(dbRT, `irrigationControl`);
        await update(pumpRef, { pumpOn: newStatus });
      } catch (error) {
        console.error('Error updating pump status in RTDB:', error);
      }
    }
  };

  // Automatically turn pump OFF if totalTimeToRelease (in minutes) is <= 0.
  useEffect(() => {
    if (recommendationInfo && recommendationInfo.totalTimeToRelease !== undefined) {
      const totalTime = parseFloat(recommendationInfo.totalTimeToRelease);
      // Convert hours to minutes.
      const totalMinutes = totalTime * 60;
      if (totalMinutes <= 0 && waterStatus) {
        const pumpRef = ref(dbRT, `irrigationControl`);
        update(pumpRef, { pumpOn: false })
          .then(() => {
            setWaterStatus(false);
            console.log('Pump automatically turned OFF because totalTimeToRelease is <= 0.');
          })
          .catch((error) => console.error('Error turning pump OFF:', error));
      }
    }
  }, [recommendationInfo, waterStatus, dbRT]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.container}>
        <Image source={require('../../../assets/images/Drawer3.jpg')} style={styles.backgroundImage} />
        <View style={styles.overlay}>
          {loading ? (
            <Text style={styles.loadingText}>Loading field data...</Text>
          ) : Object.keys(fieldData).length === 0 ? (
            <Text style={styles.noData}>No data available for this field.</Text>
          ) : (
            <>
              {/* Field Name with Blur, Border, and Text Shadow */}
              <BlurView intensity={50} tint="light" style={styles.titleBox}>
                <Text style={styles.title}>
                  {fieldData.FieldName || id || 'Untitled Field'}
                </Text>
              </BlurView>

              {/* Field Info Box */}
              <BlurView intensity={50} tint="light" style={styles.cardContainer}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📍 Location:</Text>
                  <Text style={styles.infoText}>{fieldData.Location || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🌱 Crop Name:</Text>
                  <Text style={styles.infoText}>{fieldData.CropName || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🗓 Month of Sowing:</Text>
                  <Text style={styles.infoText}>{fieldData.MonthOfSowing || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🧪 Soil Type:</Text>
                  <Text style={styles.infoText}>{fieldData.SoilType || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>📏 Area:</Text>
                  <Text style={styles.infoText}>{fieldData.Area || 'N/A'} acres</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>🕒 Date of Creation:</Text>
                  <Text style={styles.infoText}>{fieldData.DateOfCreation || 'N/A'}</Text>
                </View>
              </BlurView>

              {recommendationInfo ? (
                <BlurView intensity={50} tint="light" style={styles.cardContainer}>
                  <Text style={styles.sectionHeader}>💧 Water Requirement</Text>
                  {Object.entries(recommendationInfo).map(([key, value]) => {
                    if (fieldMapping[key]) {
                      const { label, unit } = fieldMapping[key];
                      // For totalTimeToRelease, display in hours/minutes format.
                      if (key === 'totalTimeToRelease') {
                        return (
                          <View key={key} style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{label}:</Text>
                            <Text style={styles.infoText}>
                              {convertHoursToHoursMinutes(value)}
                            </Text>
                          </View>
                        );
                      }
                      // Otherwise, display value with unit.
                      return (
                        <View key={key} style={styles.infoRow}>
                          <Text style={styles.infoLabel}>{label}:</Text>
                          <Text style={styles.infoText}>
                            {value} {unit}
                          </Text>
                        </View>
                      );
                    }
                    // Fallback: show the raw key (capitalized) and value.
                    const friendlyKey = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <View key={key} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{friendlyKey}:</Text>
                        <Text style={styles.infoText}>{value.toString()}</Text>
                      </View>
                    );
                  })}
                  {/* ON/OFF Toggle Button */}
                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Water Switch:</Text>
                    <TouchableOpacity
                      style={[styles.toggleButton, waterStatus ? styles.onButton : styles.offButton]}
                      onPress={handleWaterToggle}
                    >
                      <Text style={styles.toggleButtonText}>{waterStatus ? 'ON' : 'OFF'}</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              ) : (
                <Text style={styles.noData}>No water recommendation available.</Text>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
  
const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1 },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { flex: 1, padding: 20, borderRadius: 15, margin: 20 },
  titleBox: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  cardContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '120%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 5,
    flexShrink: 0,
  },
  infoText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff',
    flexShrink: 1,
  },
  sectionHeader: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  noData: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: 'gray', 
    textAlign: 'center', 
    marginTop: 10 
  },
  loadingText: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center', 
    marginTop: 20 
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleLabel: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 10, 
    color: '#fff' 
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  onButton: { backgroundColor: 'green' },
  offButton: { backgroundColor: 'red' },
  toggleButtonText: { color: '#fff', fontSize: 16 },
});
