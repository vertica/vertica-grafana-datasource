import { ChangeEvent } from 'react';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@grafana/ui', () => ({
  InlineField: () => null,
  InfoBox: () => null,
  InlineLabel: () => null,
  Switch: () => null,
  Combobox: () => null,
  Field: ({ children }: { children?: unknown }) => children ?? null,
  Slider: () => null,
  Input: () => null,
  SecretInput: () => null,
}));

jest.mock('@grafana/runtime', () => ({
  config: {
    featureToggles: {},
    buildInfo: { version: '13.0.0' },
  },
}));

type Props = import('./ConfigEditor').Props;

const { ConfigEditor } = require('./ConfigEditor') as typeof import('./ConfigEditor');

const getProps = (): Props => ({
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
      url: 'localhost:5433',
      database: 'vertica',
      user: 'dbuser',
      tlsmode: 'none',
      usePreparedStatements: false,
      useLoadBalancer: false,
      maxOpenConnections: 0,
      maxIdealConnections: 0,
      maxConnectionIdealTime: 0,
      useBackupserver: false,
      backupServerNode: '',
      useOauth: false,
      enableSecureSocksProxy: false,
    },
    secureJsonFields: {},
    secureJsonData: {
      password: '',
      OauthToken: '',
    },
    version: 3,
    readOnly: false,
    uid: '',
  },
  onOptionsChange: jest.fn(),
});

describe('ConfigEditor', () => {
  it('updates host value in options and jsonData', () => {
    const props = getProps();
    const component = new ConfigEditor(props);

    component.onHostChange({ target: { value: 'db.internal:5433' } } as ChangeEvent<HTMLInputElement>);

    expect(props.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'db.internal:5433',
        jsonData: expect.objectContaining({
          url: 'db.internal:5433',
        }),
      })
    );
  });

  it('updates database value in jsonData', () => {
    const props = getProps();
    const component = new ConfigEditor(props);

    component.onDBnameChange({ target: { value: 'analytics' } } as ChangeEvent<HTMLInputElement>);

    expect(props.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({
          database: 'analytics',
        }),
      })
    );
  });

  it('updates user value in jsonData', () => {
    const props = getProps();
    const component = new ConfigEditor(props);

    component.onUserChange({ target: { value: 'readonly' } } as ChangeEvent<HTMLInputElement>);

    expect(props.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({
          user: 'readonly',
        }),
      })
    );
  });

  it('updates oauth token in secureJsonData', () => {
    const props = getProps();
    const component = new ConfigEditor(props);

    component.onOauthTokenChange({ target: { value: 'token-123' } } as ChangeEvent<HTMLInputElement>);

    expect(props.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        secureJsonData: expect.objectContaining({
          OauthToken: 'token-123',
        }),
      })
    );
  });

  it('sets load balancer toggle value', () => {
    const props = getProps();
    const component = new ConfigEditor(props);

    component.onUseLoadBalancerChange({ target: { checked: true } } as ChangeEvent<HTMLInputElement>);

    expect(props.onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({
          useLoadBalancer: true,
        }),
      })
    );
  });
});
