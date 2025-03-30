// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { auth, db } from '../../constants/firebaseConfig';
// import { collection, getDocs, doc, getDoc } from 'firebase/firestore'; // Removed doc and getDoc

// export default function FieldInfoScreen() {
//   // 1. call the new hook
//   const { id } = useLocalSearchParams();
//   const [fieldData, setFieldData] = useState({});
//   const userId = auth.currentUser?.uid;
//   const [loading, setLoading] = useState(true); // Add a loading state

//   useEffect(() => {
//     const loadFieldData = async () => {
//       setLoading(true); // Set loading to true when starting fetch
//       if (userId && id) {
//         // 2. create relevant references to your Firestore Document
//         const fieldInfoDataRef = doc(db, 'users', userId, 'fields', id, 'FieldInfo', 'Data');
//         const fieldInfoDataSnap = await getDoc(fieldInfoDataRef);

//         // 3. test to verify data was pulled, and that the results exist!
//         if (fieldInfoDataSnap.exists()) {
//           console.log("New Page - Field", fieldInfoDataSnap);
//           setFieldData(fieldInfoDataSnap.data());
//         } else {
//           console.log("No data found for field ID:", id);
//           setFieldData({}); // Set to empty object to trigger "No data" message
//         }
//       }
//       setLoading(false); // Set loading to false after fetch completes
//     };
//     loadFieldData();
//   }, [userId, id]);

//   // 4. set the values you're pulling to match your stored values!
//   const { FieldName, Location, MonthOfSowing, CropName, SoilType, Area, DateOfCreation } = fieldData;

//   return (
//     <View style={styles.container}>
//       {loading ? (
//         <Text>Loading field data...</Text>
//       ) : Object.keys(fieldData).length === 0 ? (
//         <Text>No data available for this field.</Text>
//       ) : (
//         <>
//           {/* 5. set the values you render, such as FieldName */}
//           <Text style={styles.title}>{FieldName || id || 'Untitled Field'}</Text>
//           <Text>Location: {Location}</Text>
//           <Text>Month of Sowing: {MonthOfSowing}</Text>
//           <Text>Crop Name: {CropName}</Text>
//           <Text>Soil Type: {SoilType}</Text>
//           <Text>Area: {Area}</Text>
//           <Text>Date of Creation: {DateOfCreation}</Text>
//         </>
//       )}
//     </View>
//   );
// }







// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
// });
// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { auth, db } from '../../constants/firebaseConfig';
// import { doc, getDoc } from 'firebase/firestore';

// export default function FieldInfoScreen() {
//   const { id } = useLocalSearchParams();
//   const [fieldData, setFieldData] = useState({});
//   const userId = auth.currentUser?.uid;
//   const [loading, setLoading] = useState(true);
//   const [recommendationInfo, setRecommendationInfo] = useState<any>(null);

//   useEffect(() => {
//     const loadFieldData = async () => {
//       setLoading(true);
//       if (userId && id) {
//         try {
//           // Fetch Field Info
//           const fieldInfoDataRef = doc(db, 'users', userId, 'fields', id, 'FieldInfo', 'Data');
//           const fieldInfoDataSnap = await getDoc(fieldInfoDataRef);

//           if (fieldInfoDataSnap.exists()) {
//             console.log("Field Info - Data:", fieldInfoDataSnap.data());
//             setFieldData(fieldInfoDataSnap.data());
//           } else {
//             console.log("No Field Info data found for field ID:", id);
//             setFieldData({});
//           }

//           // Fetch Recommendation Info
//           const RecommendationInfoDataRef = doc(db, 'users', userId, 'fields', id, 'RecommendationInfo', 'Data');
//           const RecommendationInfoDataSnap = await getDoc(RecommendationInfoDataRef);

//           if (RecommendationInfoDataSnap.exists()) {
//             console.log("Recommendation Info - Data:", RecommendationInfoDataSnap.data());
//             setRecommendationInfo(RecommendationInfoDataSnap.data());
//           } else {
//             console.log("No Recommendation Info found for field ID:", id);
//             setRecommendationInfo(null);
//           }
//         } catch (error) {
//           console.error('Error fetching field info:', error);
//         } finally {
//           setLoading(false);
//         }
//       } else {
//         setLoading(false);
//       }
//     };
//     loadFieldData();
//   }, [userId, id]);

//   const { FieldName, Location, MonthOfSowing, CropName, SoilType, Area, DateOfCreation } = fieldData;

//   return (
//     <View style={styles.container}>
//       {loading ? (
//         <Text>Loading field data...</Text>
//       ) : Object.keys(fieldData).length === 0 ? (
//         <Text>No data available for this field.</Text>
//       ) : (
//         <>
//           <Text style={styles.title}>{FieldName || id || 'Untitled Field'}</Text>
//           <Text>Location: {Location || 'N/A'}</Text>
//           <Text>Month of Sowing: {MonthOfSowing || 'N/A'}</Text>
//           <Text>Crop Name: {CropName || 'N/A'}</Text>
//           <Text>Soil Type: {SoilType || 'N/A'}</Text>
//           <Text>Area: {Area || 'N/A'}</Text>
//           <Text>Date of Creation: {DateOfCreation || 'N/A'}</Text>

//           {recommendationInfo && (
//             <View style={styles.recommendationContainer}>
//               <Text style={styles.recommendationHeader}>Irrigation Recommendation</Text>
//               {Object.entries(recommendationInfo).map(([key, value]) => (
//                 <Text key={key}>{key}: {value}</Text>
//               ))}
//             </View>
//           )}
//           {!recommendationInfo && !loading && Object.keys(fieldData).length > 0 && (
//             <Text style={styles.noRecommendation}>No irrigation recommendation available for this field.</Text>
//           )}
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   recommendationContainer: { marginTop: 20, padding: 15, backgroundColor: '#e0f7fa', borderRadius: 8 },
//   recommendationHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
//   noRecommendation: { marginTop: 10, fontStyle: 'italic', color: 'gray' },
// });











import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../constants/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function FieldInfoScreen() {
  const { id } = useLocalSearchParams();  // Selected field ID
  const userId = auth.currentUser?.uid;

  const [fieldData, setFieldData] = useState<any>({});
  const [recommendationInfo, setRecommendationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!userId || !id) return;

      try {
        // Fetch Field Info (Dynamically based on selected field)
        const fieldInfoRef = doc(db, 'users', userId, 'fields', id, 'FieldInfo', 'Data');
        const fieldInfoSnap = await getDoc(fieldInfoRef);
        setFieldData(fieldInfoSnap.exists() ? fieldInfoSnap.data() : {});

        // Fetch Recommendation Info (Water Data)
        const recommendationRef = doc(db, 'users', userId, 'fields', id, 'RecommendationInfo', 'Data');
        const recommendationSnap = await getDoc(recommendationRef);
        setRecommendationInfo(recommendationSnap.exists() ? recommendationSnap.data() : null);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, id]);

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <Text>Loading field data...</Text>
      ) : Object.keys(fieldData).length === 0 ? (
        <Text>No data available for this field.</Text>
      ) : (
        <>
          {/* Field Information */}
          <Text style={styles.title}>{fieldData.FieldName || id || 'Untitled Field'}</Text>
          <Text>📍 Location: {fieldData.Location || 'N/A'}</Text>
          <Text>🌱 Crop Name: {fieldData.CropName || 'N/A'}</Text>
          <Text>🗓 Month of Sowing: {fieldData.MonthOfSowing || 'N/A'}</Text>
          <Text>🧪 Soil Type: {fieldData.SoilType || 'N/A'}</Text>
          <Text>📏 Area: {fieldData.Area || 'N/A'} acres</Text>
          <Text>🕒 Date of Creation: {fieldData.DateOfCreation || 'N/A'}</Text>

          {/* Recommendation Section (Water Data) */}
          {recommendationInfo ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>💧 Water Requirement</Text>
              {Object.entries(recommendationInfo).map(([key, value]) => (
                <Text key={key}>{key}: {value}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.noData}>No water recommendation available.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  sectionContainer: { marginTop: 20, padding: 15, backgroundColor: '#e3f2fd', borderRadius: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#007aff' },
  noData: { marginTop: 10, fontStyle: 'italic', color: 'gray' },
});
