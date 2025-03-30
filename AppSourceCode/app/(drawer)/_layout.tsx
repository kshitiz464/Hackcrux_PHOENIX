// app/(drawer)/_layout.tsx
// app/(drawer)/_layout.tsx
// import React from 'react';
// import { Drawer } from 'expo-router/drawer';
// import CustomDrawerContent from './_drawer'; // Assuming you create _drawer.tsx for your content

// export default function DrawerLayout() {
//   return (
//     <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
//       <Drawer.Screen name="home" options={{ headerShown: true, title: 'Your Fields' }} />
//       <Drawer.Screen name="addField" options={{ headerShown: true, title: 'Add New Field' }} />
//       <Drawer.Screen name="fieldInfo/[id]" options={{ headerShown: true, title: 'Field Details', drawerItemStyle: { display: 'none' } }} />
//     </Drawer.Navigator>
//   );
// }
  
// app/(drawer)/_layout.tsx



// import React from 'react';
// import { Drawer } from 'expo-router/drawer';
// import CustomDrawerContent from './_drawer'; // Assuming you created _drawer.tsx for your content

// export default function DrawerLayout() {
//   return (
//     <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
//       <Drawer.Screen
//         name="fieldInfo/[id]"
//         options={{
//           headerShown: true,
//           title: 'Field Details',
//           drawerItemStyle: { display: 'none' }, // Hide this screen from the drawer menu
//         }}
//       />
//       <Drawer.Screen
//         name="addField"
//         options={{
//           headerShown: true,
//           title: 'Add New Field',
//           drawerItemStyle: { display: 'none' }, // Hide this screen from the drawer menu
//         }}
//       />
//       <Drawer.Screen
//         name="home"
//         options={{
//           headerShown: true,
//           title: 'Your Fields',
//           drawerItemStyle: { display: 'none' }, // Hide this screen from the drawer menu
//         }}
//       />
//     </Drawer.Navigator>
//   );
// }



import React from 'react';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from './_drawer'; // Make sure the path to your _drawer.tsx is correct

export default function DrawerLayout() {
  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
      {/* Visible Screens (these will still be accessible via navigation) */}
      <Drawer.Screen
  name="home"
  options={{ 
    headerShown: true, 
    title: 'AgriFlow', 
    headerTitleAlign: 'left', 
    headerTitleStyle: { fontWeight: 'bold', fontSize: 28 }, 
    drawerItemStyle: { display: 'none' } 
  }}
/>


      <Drawer.Screen
        name="addField"
        options={{ headerShown: true, title: 'Add New Field', drawerItemStyle: { display: 'none' } }}
      />

      {/* Hidden Screens - Will not appear in the Drawer menu */}
      <Drawer.Screen
        name="fieldInfo/[id]"
        options={{ headerShown: true, title: 'Field Details', drawerItemStyle: { display: 'none' } }}
      />
    </Drawer>
  );
}