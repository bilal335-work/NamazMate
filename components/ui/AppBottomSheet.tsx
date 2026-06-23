import React, { useMemo, forwardRef, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: string[];
  onClose?: () => void;
}

export const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(
  ({ title, children, snapPoints = ['25%', '50%'], onClose }, ref) => {
    const memoSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={memoSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
        onClose={onClose}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <Text style={styles.title}>
              {title}
            </Text>
          )}
          <View style={styles.childrenContainer}>
            {children}
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#f4f1ea',
    borderRadius: 32,
  },
  indicator: {
    backgroundColor: '#333333',
    width: 40,
    opacity: 0.2,
  },
  content: {
    padding: 32,
    paddingTop: 16,
  },
  title: {
    fontFamily: 'TitanOne_400Regular',
    fontSize: 20,
    color: '#333333',
    marginBottom: 24,
  },
  childrenContainer: {
    gap: 12,
  },
});

AppBottomSheet.displayName = 'AppBottomSheet';
