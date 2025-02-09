import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function App() {

  const [text, setText] = useState('');

  const data = async () => {
    try {
      const response = await fetch('http://192.168.1.19:3000/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await response.json();
      console.log(json)
      setText(json.message);
    } catch (error) {
      console.error('Error fetching data:', error);
      setText('Failed to fetch data');
    }
  };



  return (
    <View style={styles.container}>
      <Text>بَك</Text>
      <Button title="Get Data" onPress={data} />
      <Text>{text}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
