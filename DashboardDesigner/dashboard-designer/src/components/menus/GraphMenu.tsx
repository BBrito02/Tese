import { TypeField } from './sections';

export default function GraphMenu() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component type */}
      <TypeField value="Graph" />
    </div>
  );
}
