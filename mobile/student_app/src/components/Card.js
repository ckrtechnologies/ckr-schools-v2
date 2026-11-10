import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

const Card = ({ children, style, variant = 'elevated' }) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && theme.shadows.card,
        variant === 'flat' && { backgroundColor: theme.colors.borderLight },
        variant === 'outlined' && { borderWidth: 1, borderColor: theme.colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});

export default Card;

