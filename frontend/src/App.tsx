import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { DataStudioPage } from './pages/DataStudioPage';
import { SchemaBuilderPage } from './pages/SchemaBuilderPage';
import { RelationshipDesignerPage } from './pages/RelationshipDesignerPage';
import { MockApiForgePage } from './pages/MockApiForgePage';
import { ApiExplorerPage } from './pages/ApiExplorerPage';
import { DataQualityLabPage } from './pages/DataQualityLabPage';
import { AiCopilotPage } from './pages/AiCopilotPage';
import { DatasetExplorerPage } from './pages/DatasetExplorerPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { GenerationHistoryPage } from './pages/GenerationHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="studio" element={<DataStudioPage />} />
          <Route path="schema-builder" element={<SchemaBuilderPage />} />
          <Route path="relationships" element={<RelationshipDesignerPage />} />
          <Route path="mockapi" element={<MockApiForgePage />} />
          <Route path="api-explorer" element={<ApiExplorerPage />} />
          <Route path="quality" element={<DataQualityLabPage />} />
          <Route path="ai-copilot" element={<AiCopilotPage />} />
          <Route path="datasets" element={<DatasetExplorerPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="history" element={<GenerationHistoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="docs" element={<DocumentationPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
