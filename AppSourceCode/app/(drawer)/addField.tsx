import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { auth, db } from '../../constants/firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars'; // Assuming you imported a Calendar component here

const { width } = Dimensions.get('window');
const cropOptions = ['Wheat', 'Corn', 'Rice', 'Soybean', 'Potato'];
const soilOptions = ['Clay', 'Sandy', 'Silty', 'Loamy'];
const monthOptions = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AddFieldScreen() {
  const [fieldName, setFieldName] = useState('');
  const [location, setLocation] = useState('');
  const [monthOfSowing, setMonthOfSowing] = useState('');
  const [cropName, setCropName] = useState('');
  const [soilType, setSoilType] = useState('');
  const [area, setArea] = useState('');
  const [dateOfCreation, setDateOfCreation] = useState(new Date());
  // const [showDatePicker, setShowDatePicker] = useState(false); // Removed
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const [isSoilDropdownOpen, setIsSoilDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  const router = useRouter();

  const handleSaveField = async () => {
    if (!fieldName || !location || !monthOfSowing || !cropName || !soilType || !area || !dateOfCreation) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const fieldsCollectionRef = collection(db, 'users', userId, 'fields');
        const fieldNameQuery = query(fieldsCollectionRef, where('FieldName', '==', fieldName));
        const fieldNameQuerySnapshot = await getDocs(fieldNameQuery);

        if (!fieldNameQuerySnapshot.empty) {
          Alert.alert('Error', 'A field with that name already exists. Please choose a different name.');
          return;
        }

        const newFieldDocRef = doc(fieldsCollectionRef, fieldName);
        await setDoc(newFieldDocRef, { FieldName: fieldName });

        const fieldInfoDataRef = doc(db, 'users', userId, 'fields', fieldName, 'FieldInfo', 'Data');
        await setDoc(fieldInfoDataRef, {
          Location: location,
          MonthOfSowing: monthOfSowing,
          CropName: cropName,
          SoilType: soilType,
          Area: parseFloat(area),
          DateOfCreation: dateOfCreation.toDateString(),
        });

        // Clear the fields so they appear empty when adding a new field
        setFieldName('');
        setLocation('');
        setMonthOfSowing('');
        setCropName('');
        setSoilType('');
        setArea('');
        setDateOfCreation(new Date());

        Alert.alert('Success', 'Field added successfully!', [
          { text: 'OK', onPress: () => router.push('/home') }
        ]);
      } else {
        Alert.alert('Error', 'User not authenticated.');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      Alert.alert('Error', 'Failed to add field. Please try again.');
    }
  };

  const onDayPress = (day) => {
    setDateOfCreation(new Date(day.year, day.month - 1, day.day));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Image source={require('../../assets/images/newField1.jpg')} style={styles.backgroundImage} />
        <BlurView intensity={50} tint="light" style={styles.overlay}>
          <Text style={styles.title}>Add New Field</Text>

          {/* Field Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Field Name</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter Field Name"
              placeholderTextColor="#666"
              value={fieldName}
              onChangeText={setFieldName}
            />
          </View>

          {/* Location Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter Location"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Month of Sowing Dropdown */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Month of Sowing</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              <Text style={styles.pickerText}>{monthOfSowing || 'Select Month'}</Text>
            </TouchableOpacity>
            {isMonthDropdownOpen && (
              <View style={styles.pickerDropdown}>
                <Picker
                  selectedValue={monthOfSowing}
                  onValueChange={(itemValue) => {
                    setMonthOfSowing(itemValue);
                    setIsMonthDropdownOpen(false);
                  }}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Select Month" value="" />
                  {monthOptions.map((month) => (
                    <Picker.Item key={month} label={month} value={month} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Area Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Area (in acres)</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter Area"
              placeholderTextColor="#666"
              value={area}
              onChangeText={setArea}
              keyboardType="numeric"
            />
          </View>

          {/* Crop Name Dropdown */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Select Crop Name</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setIsCropDropdownOpen(!isCropDropdownOpen)}
            >
              <Text style={styles.pickerText}>{cropName || 'Select Crop'}</Text>
            </TouchableOpacity>
            {isCropDropdownOpen && (
              <View style={styles.pickerDropdown}>
                <Picker
                  selectedValue={cropName}
                  onValueChange={(itemValue) => {
                    setCropName(itemValue);
                    setIsCropDropdownOpen(false);
                  }}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Select Crop" value="" />
                  {cropOptions.map((crop) => (
                    <Picker.Item key={crop} label={crop} value={crop} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Soil Type Dropdown */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Select Soil Type</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setIsSoilDropdownOpen(!isSoilDropdownOpen)}
            >
              <Text style={styles.pickerText}>{soilType || 'Select Soil Type'}</Text>
            </TouchableOpacity>
            {isSoilDropdownOpen && (
              <View style={styles.pickerDropdown}>
                <Picker
                  selectedValue={soilType}
                  onValueChange={(itemValue) => {
                    setSoilType(itemValue);
                    setIsSoilDropdownOpen(false);
                  }}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Select Soil Type" value="" />
                  {soilOptions.map((soil) => (
                    <Picker.Item key={soil} label={soil} value={soil} />
                  ))}
                </Picker>
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.dateWrapper}>
            <Text style={styles.pickerLabel}>Set Date of Creation</Text>
            <Calendar
              onDayPress={onDayPress}
              markedDates={{
                [dateOfCreation.toISOString().split('T')[0]]: { selected: true, marked: true, selectedColor: '#2C7865' },
              }}
            />
          </View>

          {/* Save Field Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleSaveField}>
            <Text style={styles.addButtonText}>Save Field</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1 },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  inputWrapper: { marginBottom: 10 },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: 'bold'
  },
  inputBox: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8', // offwhite background
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  pickerWrapper: { marginBottom: 10 },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: 'bold'
  },
  pickerContainer: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  pickerText: { color: '#333', fontSize: 16, fontWeight: '600' },
  pickerDropdown: {
    width: '100%',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginTop: 5,
  },
  picker: { width: '100%', height: '100%' },
  dateWrapper: { marginBottom: 10 },
  dateInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dateText: { color: '#333', fontSize: 16, fontWeight: '600' },
  calendarIcon: { marginRight: 10 },
  addButton: { backgroundColor: '#2C7865', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});