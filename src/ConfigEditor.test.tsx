import React from 'react';
import { shallow, configure } from 'enzyme';
import { Props, ConfigEditor } from './ConfigEditor';

// setup file
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });

// setting up the props verifying Rendering of config screen
const setup = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        url: 'localhost:verticaserver',
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props verifying Rendering the Config Screen with value in host field
const setupForHostname = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props for verifying Rendering the Config Screen with value in Database field
const setupForDatabasename = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        url: 'localhost:verticaserver',
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        database: 'Vertica DB',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props for verifying Rendering the Config Screen with value in User field
const setupForUsername = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        url: 'localhost:verticaserver',
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        user: 'Vertica Admin',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props for Verifying Rendering the Config Screen with value in Password field
const setupForPassword = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: 'Demo Password',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props verifying Rendering the Config Screen with value in SSL Mode
const setupForSSLMode = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
// setting up the props for veriifying Rendering the Config Screen with use unprepared statements on
// const setupForUseUnpreparedStatements = (propOverrides?: object) => {
//   const props: Props = {
//     options: {
//       id: 11,
//       orgId: 1,
//       name: 'vertica-grafana-plugin',
//       type: 'datasource',
//       typeName: 'vertica',
//       typeLogoUrl: '',
//       access: 'proxy',
//       url: '',
//       password: '',
//       user: '',
//       database: '',
//       basicAuth: false,
//       basicAuthUser: '',
//       basicAuthPassword: '',
//       withCredentials: false,
//       isDefault: false,
//       jsonData: {
//         url: 'localhost:verticaserver',
//         usePreparedStatements: true,
//         tlsmode: 'none',
//         useLoadBalancer: false,
//       },
//       secureJsonFields: {},
//       secureJsonData: {
//         password: '',
//       },
//       version: 3,
//       readOnly: false,
//     },
//     onOptionsChange: jest.fn(),
//   };
//   Object.assign(props, propOverrides);
//   return shallow(<ConfigEditor {...props} />);
// };
// setting up the props verifying Rendering the Config Screen with value in SSL Mode
const setupForVerticaConnections = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};

// setting up the props verifying Rendering the Config Screen with value in SSL Mode
const setUpBackUpServerNode = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};

// setting up the props verifying Rendering the Config Screen with value in SSL Mode
const setUpUseBackServer = (propOverrides?: object) => {
  const props: Props = {
    options: {
      id: 11,
      orgId: 1,
      name: 'vertica-grafana-plugin',
      type: 'datasource',
      typeName: 'vertica',
      typeLogoUrl: '',
      access: 'proxy',
      url: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      withCredentials: false,
      isDefault: false,
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backupServerNode: '',
        useOauth: false,
        OauthToken: ''
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
      uid: ''
    },
    onOptionsChange: jest.fn(),
  };
  Object.assign(props, propOverrides);
  return shallow(<ConfigEditor {...props} />);
};
describe('Render', () => {
  it('Render should render component with value in BackUp Server Nodes', () => {
    const wrapper = setUpBackUpServerNode();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in Use Backup Server field', () => {
    const wrapper = setUpUseBackServer();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in Host', () => {
    const wrapper = setupForHostname();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in Database', () => {
    const wrapper = setupForDatabasename();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in User', () => {
    const wrapper = setupForUsername();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in Password', () => {
    const wrapper = setupForPassword();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in SSL', () => {
    const wrapper = setupForSSLMode();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in setUp', () => {
    const wrapper = setup();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('Render should render component with value in Vertica Connection', () => {
    const wrapper = setupForVerticaConnections();
    expect(wrapper.debug()).toMatchSnapshot();
  });
  // it('should render component with value in Use Unprepared Statements switch on', () => {
  //   const wrapper = setupForUseUnpreparedStatements();
  //   expect(wrapper.debug()).toMatchSnapshot();
  // });
});
