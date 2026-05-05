import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { RecyclingPoint } from '@/constants/types';
import { getMarkerColor, getMarkerIcon } from '@/utils/mapHelpers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }]
  }
];

interface MapViewerProps {
  mapRef: React.RefObject<MapView | null>;
  location: Location.LocationObject | null;
  filteredPoints: RecyclingPoint[];
  isFocused: boolean;
  selectedPoint: RecyclingPoint | null;
  setSelectedPoint: (point: RecyclingPoint | null) => void;
  setIsUiVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isUiVisible: boolean;
  handleRegionChange: (region: Region) => void;
  isSelectingLocation: boolean;
}

export const MapViewer: React.FC<MapViewerProps> = React.memo(({
  mapRef,
  location,
  filteredPoints,
  isFocused,
  selectedPoint,
  setSelectedPoint,
  setIsUiVisible,
  isUiVisible,
  handleRegionChange,
  isSelectingLocation
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!isFocused) {
    return <View style={[styles.map, { backgroundColor: isDark ? '#1a1a1a' : '#E0E0E0' }]} />;
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      customMapStyle={isDark ? darkMapStyle : []}
      initialRegion={{
        latitude: location?.coords.latitude || 37.0585,
        longitude: location?.coords.longitude || 36.2240,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      onRegionChangeComplete={handleRegionChange}
      onPress={() => {
        if (selectedPoint) {
          setSelectedPoint(null);
          setIsUiVisible(true);
        } else {
          setIsUiVisible(!isUiVisible);
        }
      }}
    >
      {filteredPoints.map(point => (
        <RecyclingMarker
          key={point.id}
          point={point}
          onSelect={setSelectedPoint}
        />
      ))}
    </MapView>
  );
});

// Performanslı Marker Bileşeni
const RecyclingMarker = React.memo(({ point, onSelect }: { point: RecyclingPoint, onSelect: (point: RecyclingPoint) => void }) => {
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{ latitude: Number(point.latitude), longitude: Number(point.longitude) }}
      tracksViewChanges={tracksViewChanges}
      opacity={!point.verified ? 0.6 : 1.0}
      onPress={() => onSelect(point)}
      anchor={{ x: 0.5, y: 0.5 }}

    >
      <View style={styles.markerWrapper}>
        <View style={[
          styles.markerContainer,
          {
            backgroundColor: !point.verified ? '#9E9E9E' : getMarkerColor(point.type),
            borderColor: 'white'
          }
        ]}>
          <MaterialIcons name={getMarkerIcon(point.type) as any} size={20} color="white" />
        </View>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  map: {
    width: width,
    height: height,
  },
  markerWrapper: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
