import { View } from 'react-native';
import { Button } from '@/components/ui/Button';

interface Props {
  editing: boolean;
  editable: boolean;
  saving: boolean;
  canSave: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/** The Barangays card's aside: Edit targets, or Cancel and Save while editing. */
export function TargetEditActions({
  editing,
  editable,
  saving,
  canSave,
  onEdit,
  onCancel,
  onSave,
}: Props) {
  if (editing) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button small label="Cancel" disabled={saving} onPress={onCancel} />
        <Button
          small
          kind="primary"
          label="Save targets"
          busy={saving}
          disabled={!canSave}
          onPress={onSave}
        />
      </View>
    );
  }
  return editable ? <Button small kind="ghost" label="Edit targets" onPress={onEdit} /> : null;
}
