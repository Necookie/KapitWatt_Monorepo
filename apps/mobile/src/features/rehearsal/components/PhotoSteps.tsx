import { StyleSheet, View } from 'react-native';
import { space } from '@/styles/theme';
import { PhotoStep } from './PhotoStep';

/** The two practice photos, marked done, now or later from how many are taken. */
export function PhotoSteps(props: { taken: number }) {
  const { taken } = props;
  return (
    <View style={styles.steps}>
      <PhotoStep
        number={1}
        title="First photo"
        detail={taken >= 1 ? 'Done' : 'Now'}
        state={taken >= 1 ? 'done' : 'now'}
      />
      <PhotoStep
        number={2}
        title="Second photo"
        detail={taken >= 1 ? 'Now' : 'Later, once some time has passed'}
        state={taken >= 1 ? 'now' : 'later'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  steps: { gap: space.md },
});
