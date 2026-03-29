import Editor from '@/components/Editor';
import EditorLayout from '@/components/EditorLayout';

export const metadata = {
  title: 'Editor - SlideForge',
  description: 'Edit and export your presentation to PowerPoint'
};

export default function EditorPage() {
  return (
    <EditorLayout>
      <Editor />
    </EditorLayout>
  );
}
