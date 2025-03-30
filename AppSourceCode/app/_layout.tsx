// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { useFonts } from 'expo-font';
// import { Stack } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// import { StatusBar } from 'expo-status-bar';
// import { useEffect } from 'react';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/useColorScheme';

// // Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
//   });

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen name="+not-found" />
//       </Stack>
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }

// Dev Code
// import React, { useState, useEffect, useCallback } from 'react';
// import { Drawer } from 'expo-router/drawer';
// import { auth, db , collection, getDocs} from '../constants/firebaseConfig'; // Import auth
// import { TouchableOpacity, Text, View, StyleSheet, FlatList } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { StatusBar } from 'expo-status-bar';
// import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/useColorScheme';

// SplashScreen.preventAutoHideAsync();

// function CustomDrawerContent({ navigation }) {
//   const router = useRouter();
//   const userId = auth.currentUser?.uid;
//   const [fields, setFields] = useState<any>();

//   const loadFields = useCallback(async () => {
//     if (userId) {
//       const fieldsCollectionRef = collection(db, 'users', userId, 'fields');
//       try {
//         const querySnapshot = await getDocs(fieldsCollectionRef);
//         const fieldList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         setFields(fieldList);
//       } catch (error) {
//         console.error('Error fetching fields for drawer:', error);
//       }
//     }
//   }, [userId]);

//   useEffect(() => {
//     loadFields();
//   }, [loadFields]);

//   const handleLogout = async () => {
//     try {
//       await auth().signOut(); // Use auth().signOut() directly
//       router.replace('/');
//     } catch (error) {
//       console.error('Error signing out:', error);
//     }
//   };

//   const renderFieldItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.drawerSubItem}
//       onPress={() => {
//         navigation.navigate('fieldInfo', { id: item.id });
//       }}
//     >
//       <Text style={{ marginLeft: 37 }}>{item.FieldName || 'Untitled Field'}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={{ flex: 1, paddingVertical: 40, paddingHorizontal: 20 }}>
//       <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Field Manual</Text>

//       <TouchableOpacity
//         style={styles.drawerItem}
//         onPress={() => navigation.navigate('home')}
//       >
//         <Ionicons name="home-outline" size={22} color="black" style={{ marginRight: 15 }} />
//         <Text>Your Fields</Text>
//       </TouchableOpacity>

//       <View style={{ marginTop: 10 }}>
//         <Text style={{ marginLeft: 10, marginBottom: 5, fontWeight: 'bold', color: 'gray' }}>Your Fields</Text>
//         <FlatList
//           data={fields}
//           keyExtractor={(item) => item.id}
//           renderItem={renderFieldItem}
//         />
//       </View>

//       <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 20 }}>
//         <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
//           <Ionicons name="log-out-outline" size={22} color="red" style={{ marginRight: 15 }} />
//           <Text style={{ color: 'red' }}>Logout</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   drawerItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingLeft: 10,
//   },
//   drawerSubItem: {
//     paddingVertical: 8,
//     paddingLeft: 10,
//   },
//   logoutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 10,
//     paddingLeft: 10,
//   },
// });

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const [loaded] = useFonts({
//     SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
//   });

//   useEffect(() => {
//     if (loaded) {
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!loaded) {
//     return null;
//   }

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <StatusBar style="auto" />
//       <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
//         <Drawer.Screen name="home" options={{ headerShown: true, title: 'Your Fields' }} />
//         <Drawer.Screen name="fieldInfo/[id]" options={{ headerShown: true, title: 'Field Details', drawerItemStyle: { display: 'none' } }} />
//         <Drawer.Screen name="addField" options={{ headerShown: true, title: 'Add New Field' }} />
//       </Drawer>
//     </ThemeProvider>
//   );
// }

// New dev Code
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Slot } from 'expo-router';
import React from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  console.log("ColorScheme", colorScheme);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  console.log("FontsLoaded", loaded);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      console.log("SplashScreenHidden");
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Moved console.log outside of JSX
  console.log("StatusBarSet");

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Slot />
    </ThemeProvider>
  );
}

