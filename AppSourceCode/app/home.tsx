import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../constants/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const userId = auth.currentUser?.uid;
  console.log("UserId: ", userId);

  useEffect(() => {
    const loadFields = async () => {
      if (userId) {
        const fieldsCollectionRef = collection(db, 'users', userId, 'fields');
        console.log("FieldsCollectionRef: ", fieldsCollectionRef.path);

        try {
          const querySnapshot = await getDocs(fieldsCollectionRef);
          console.log("QuerySnapshot: ", querySnapshot.docs);
          console.log("QuerySnapshot.empty: ", querySnapshot.empty);
          console.log("QuerySnapshot.size: ", querySnapshot.size);

          const fieldList = [];

          for (const docSnapshot of querySnapshot.docs) {
            console.log("DocSnapshot: ", docSnapshot.id);
            const fieldData = docSnapshot.data();
             console.log("FieldData: ", fieldData);

            fieldList.push({
              id: docSnapshot.id,
              ...fieldData,
            });
          }

           console.log("FieldList: ", fieldList);
          setFields(fieldList);
        } catch (error) {
          console.error('Error fetching fields:', error);
        }
      }
    };

    loadFields();
  }, [userId]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.fieldCard}
      onPress={() => {
        console.log("Item", item );
        router.push({
          pathname: `/fieldInfo/${item.id}`,
          params: item,
        });
      }}
    >
      <Text style={styles.fieldTitle}>{item.FieldName || 'Untitled Field'}</Text>

      {/* Display other field information here, e.g., <Text>{item.Location}</Text> */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Fields ({fields.length})</Text>

      <FlatList
        data={fields}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No fields added yet.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/addField')}>
        <Ionicons name="add-circle" size={50} color="#28a745" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  fieldCard: { backgroundColor: '#f0f0f0', padding: 15, marginBottom: 10, borderRadius: 8 },
  fieldTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
  addButton: { position: 'absolute', bottom: 30, right: 30 },
});
