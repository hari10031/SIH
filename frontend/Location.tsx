import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export default function RealTimeLocation() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest, // forces GPS
            timeInterval: 3000,                 // update every 3s
            distanceInterval: 0,                // update on every move
          },
          (pos) => {
            setLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          }
        );
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    })();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
      {location ? (
        <>
          <Text style={styles.text}>Latitude: {location.latitude}</Text>
          <Text style={styles.text}>Longitude: {location.longitude}</Text>
          <Text style={styles.text}>Accuracy: {location.accuracy}m</Text>
        </>
      ) : (
        <Text style={styles.text}>Fetching location…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, marginVertical: 4 },
  error: { color: 'red', fontSize: 16, marginVertical: 4 },
});
