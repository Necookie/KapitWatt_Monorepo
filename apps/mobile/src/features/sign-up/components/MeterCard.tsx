import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';

const c = themes.light.color;

export function MeterCard(props: {
  icon: 'meterPhoto' | 'smartMeter';
  title: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={`${props.title} meter, ${props.detail}`}
      onPress={props.onPress}
      style={[styles.meterCard, props.selected ? styles.meterCardOn : styles.meterCardOff]}
    >
      <View style={[styles.meterPicture, props.selected && styles.meterPictureOn]}>
        <Icon name={props.icon} size="lg" color={props.selected ? 'onPrimary' : 'primary'} />
      </View>
      <Text
        variant="titleMedium"
        style={{ color: props.selected ? c.onPrimaryContainer : c.onSurface }}
      >
        {props.title}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: props.selected ? c.onPrimaryContainer : c.onSurfaceVariant }}
      >
        {props.detail}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  meterCard: { flex: 1, borderRadius: radius.md, padding: 14, gap: space[1] },
  meterPicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: space[1],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primaryContainer,
  },
  meterPictureOn: { backgroundColor: c.primary },
  meterCardOn: { borderWidth: 2, borderColor: c.primary, backgroundColor: c.primaryContainer },
  meterCardOff: {
    borderWidth: 1,
    borderColor: c.outline,
    backgroundColor: c.surfaceContainerLowest,
    margin: 1,
  },
});
