// import { mx } from './utils'; // Removed to fix build error
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import LibraryView from './components/Library/LibraryView';
import DevelopView from './components/Develop/DevelopView';
import PrintView from './components/Print/PrintView';

function Main() {
  const { mode } = useWorkspace();

  if (mode === 'develop') {
    return <DevelopView />;
  }

  if (mode === 'print') {
    return <PrintView />;
  }

  // Default to Library
  return <LibraryView />;
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Main />
    </WorkspaceProvider>
  );
}
