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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        url: 'localhost:verticaserver',
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
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
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
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
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'none',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: 'Demo Password',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 0,
        maxIdealConnections: 0,
        maxConnectionIdealTime: 0,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
    },
    onOptionsChange: jest.fn(),
  };

  Object.assign(props, propOverrides);

  return shallow(<ConfigEditor {...props} />);
};
// setting up the props verifying Rendering the Config Screen with value in useBackUpServer
const setupForuseBackupserver = (propOverrides?: object) => {
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
    },
    onOptionsChange: jest.fn(),
  };

  Object.assign(props, propOverrides);

  return shallow(<ConfigEditor {...props} />);
};
// setting up the props verifying Rendering the Config Screen with value in backUPServerNodes
const setupForBackupServerNode = (propOverrides?: object) => {
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
      password: '',
      user: '',
      database: '',
      basicAuth: false,
      basicAuthUser: '',
      basicAuthPassword: '',
      withCredentials: false,
      isDefault: false,
      backupServerNodes: '',
      jsonData: {
        usePreparedStatements: false,
        tlsmode: 'server',
        useLoadBalancer: false,
        url: 'localhost:verticaserver',
        maxOpenConnections: 3,
        maxIdealConnections: 2,
        maxConnectionIdealTime: 10,
        useBackupserver: false,
        backUpServerNodes: 'localhost:verticaserver1',
      },
      secureJsonFields: {},
      secureJsonData: {
        password: '',
      },
      version: 3,
      readOnly: false,
    },
    onOptionsChange: jest.fn(),
  };

  Object.assign(props, propOverrides);

  return shallow(<ConfigEditor {...props} />);
};
describe('Render', () => {
  it('should render component', () => {
    const wrapper = setup();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in Host field', () => {
    const wrapper = setupForHostname();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in Database field', () => {
    const wrapper = setupForDatabasename();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in User field', () => {
    const wrapper = setupForUsername();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in password field', () => {
    const wrapper = setupForPassword();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in SSL Mode field', () => {
    const wrapper = setupForSSLMode();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in Connection and Timeout fields', () => {
    const wrapper = setupForVerticaConnections();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in Use Backup Server field', () => {
    const wrapper = setupForuseBackupserver();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  it('should render component with value in BackUp Server Nodes', () => {
    const wrapper = setupForBackupServerNode();

    expect(wrapper.debug()).toMatchSnapshot();
  });
  // it('should render component with value in Use Unprepared Statements switch on', () => {
  //   const wrapper = setupForUseUnpreparedStatements();

  //   expect(wrapper.debug()).toMatchSnapshot();
  // });
});
