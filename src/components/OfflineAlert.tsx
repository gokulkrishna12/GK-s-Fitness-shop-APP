import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function OfflineAlert() {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected ?? true;
            setIsConnected(connected);

            if (!connected) {
                Alert.alert(
                    "No Internet Connection",
                    "Please turn on Mobile Data or Wi-Fi to continue using GK's Fitness.",
                    [{ text: "GOT IT" }]
                );
            }
        });
        return () => unsubscribe();
    }, []);

    if (isConnected) return null;

    return (
        <View style={styles.banner}>
            <WifiOff color="#fff" size={18} />
            <Text style={styles.text}>
                No Internet Connection. Please check your settings.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: { backgroundColor: '#E63946', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 20, gap: 8, zIndex: 999 },
    text: { color: '#fff', fontSize: 14, fontWeight: '700' }
});