import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';

interface AndroidWheelPickerProps {
  items: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  itemHeight?: number;
  width?: number;
}

export default function AndroidWheelPicker({
  items,
  selectedValue,
  onValueChange,
  itemHeight = 44,
  width = 65,
}: AndroidWheelPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isScrollingRef = useRef(false);

  // Sync scroll position with selectedValue from parent
  useEffect(() => {
    const idx = items.indexOf(selectedValue);
    if (idx !== -1 && idx !== selectedIndex) {
      setSelectedIndex(idx);
      // Wait for layout and scroll to current index
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: idx * itemHeight,
          animated: true,
        });
      }, 80);
    }
  }, [selectedValue, items]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (index >= 0 && index < items.length && index !== selectedIndex) {
      setSelectedIndex(index);
      onValueChange(items[index]);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    
    // Snap to the closest item
    scrollViewRef.current?.scrollTo({
      y: index * itemHeight,
      animated: true,
    });

    if (index >= 0 && index < items.length && index !== selectedIndex) {
      setSelectedIndex(index);
      onValueChange(items[index]);
    }
  };

  return (
    <View style={[styles.container, { height: itemHeight * 3, width }]}>
      {/* Android Selection highlight bands */}
      <View style={[styles.highlightBar, { top: itemHeight, height: itemHeight }]} />
      
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        scrollEventThrottle={32}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: itemHeight,
          paddingBottom: itemHeight,
        }}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  y: index * itemHeight,
                  animated: true,
                });
                setSelectedIndex(index);
                onValueChange(item);
              }}
              style={[styles.item, { height: itemHeight }]}
            >
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#ffedd5',
  },
  highlightBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    pointerEvents: 'none',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 17,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
  },
  itemTextSelected: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
});
