import React from 'react';
import { Layout } from 'antd';
import PendingZone from './components/PendingZone';
import ProcessingZone from './components/ProcessingZone';
import ResultZone from './components/ResultZone';

const { Header, Content } = Layout;

const App: React.FC = () => {
  return (
    <Layout className="app-container">
      <Header className="app-header">
        <h1>货运园区月台预约装卸平台</h1>
      </Header>
      <Content className="app-content">
        <PendingZone />
        <div style={{ height: 24 }} />
        <ProcessingZone />
        <div style={{ height: 24 }} />
        <ResultZone />
      </Content>
    </Layout>
  );
};

export default App;
