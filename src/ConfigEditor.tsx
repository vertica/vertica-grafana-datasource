import React, { ChangeEvent, PureComponent } from 'react';
import { InfoBox, InlineLabel, Switch, LegacyForms, Select } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData, FIELD_TYPES } from './types';
import { SSL_MODE_OPTIONS } from './constants';

const { SecretFormField, FormField } = LegacyForms;

export interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}
export class ConfigEditor extends PureComponent<Props, State> {
  onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData, url: event.target.value });
  };
  onDBnameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      database: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      user: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onModeChange = (option: SelectableValue<string>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      tlsmode: option.value,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onUsePreparedStatementsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      usePreparedStatements: (event.target as HTMLInputElement).checked,
    };
    onOptionsChange({ ...options, jsonData });
  };
  onUseLoadBalancerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      useLoadBalancer: (event.target as HTMLInputElement).checked,
    };
    onOptionsChange({ ...options, jsonData });
  };
  // Secure field (only sent to the backend)
  onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        password: event.target.value,
      },
    });
  };

  onResetPassword = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        password: '',
      },
    });
  };

  onBlurField = (fieldName: string) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
    };
    switch (fieldName) {
      case FIELD_TYPES.URL:
        jsonData.url = options.jsonData.url?.trim();
        onOptionsChange({ ...options, jsonData, url: options.jsonData.url?.trim() });
        break;
      case FIELD_TYPES.DATABASE:
        jsonData.database = options.jsonData.database?.trim();
        onOptionsChange({ ...options, jsonData });
        break;
      case FIELD_TYPES.USER:
        jsonData.user = options.jsonData.user?.trim();
        onOptionsChange({ ...options, jsonData });
        break;
      default:
        console.log('incorrect field type');
    }
  };

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const selectedTLSMode = jsonData.tlsmode
      ? SSL_MODE_OPTIONS.filter((mode) => mode.value === jsonData.tlsmode)[0]
      : SSL_MODE_OPTIONS[0];
    const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

    return (
      <>
        <h3 className="page-heading">Vertica Connection</h3>
        <div className="gf-form-group">
          <div className="gf-form max-width-30">
            <FormField
              required
              label="Host"
              labelWidth={7}
              inputWidth={21}
              onChange={this.onHostChange}
              value={options.url || jsonData.url || ''}
              placeholder="localhost:5433"
              onBlur={() => this.onBlurField(FIELD_TYPES.URL)}
            />
          </div>
          <div className="gf-form max-width-30">
            <FormField
              required
              label="Database"
              labelWidth={7}
              inputWidth={21}
              onChange={this.onDBnameChange}
              value={jsonData.database || ''}
              placeholder="database name"
              onBlur={() => this.onBlurField(FIELD_TYPES.DATABASE)}
            />
          </div>
          <div className="gf-form-inline">
            <div className="gf-form">
              <FormField
                label="User"
                labelWidth={7}
                inputWidth={6}
                onChange={this.onUserChange}
                value={jsonData.user || ''}
                placeholder="user"
                onBlur={() => this.onBlurField(FIELD_TYPES.USER)}
              />
            </div>
            <div className="gf-form">
              <SecretFormField
                isConfigured={(secureJsonFields && secureJsonFields.password) as boolean}
                value={secureJsonData.password || ''}
                label="Password"
                placeholder="password"
                labelWidth={7}
                inputWidth={6}
                onReset={this.onResetPassword}
                onChange={this.onPasswordChange}
              />
            </div>
          </div>
          <div className="gf-form">
            <InlineLabel
              width={14}
              tooltip="This option determines whether or with what priority a secure SSL TCP/IP connection will be negotiated with the server."
            >
              SSL Mode
            </InlineLabel>

            <Select
              width={42}
              defaultValue="none"
              isSearchable={false}
              options={SSL_MODE_OPTIONS}
              onChange={this.onModeChange}
              value={selectedTLSMode}
            />
          </div>
        </div>
        <div className="gf-form-group">
          <b>Environment</b>
          {/* <div className="gf-form">
            <InlineLabel
              width={30}
              tooltip="If not set, query arguments will be interpolated into the query on the client side. If set, query arguments will be bound on the server."
            >
              Use Prepared Statements
            </InlineLabel>
            <div className="gf-form-switch">
              <Switch
                value={jsonData.usePreparedStatements === undefined ? true : jsonData.usePreparedStatements}
                css=""
                onChange={this.onUsePreparedStatementsChange}
              />
            </div>
          </div> */}
          <div className="gf-form">
            <InlineLabel width={30} tooltip="If set, the query will be distributed to vertica nodes">
              Use Connection Load Balancing
            </InlineLabel>
            <div className="gf-form-switch">
              <Switch
                value={jsonData.useLoadBalancer === undefined ? false : jsonData.useLoadBalancer}
                css=""
                onChange={this.onUseLoadBalancerChange}
              />
            </div>
          </div>
        </div>
        <div className="gf-form-group">
          <InfoBox title="User Permission">
            <p>
              The database user should only be granted SELECT permissions on the specified database &amp; tables you
              want to query. Grafana does not validate that queries are safe so queries can contain any SQL statement.
              For example, statements like <code>DELETE FROM user;</code> and <code>DROP TABLE user;</code> would be
              executed. To protect against this we
              <strong> Highly</strong> recommmend you create a specific Vertica user with restricted permissions.
            </p>
          </InfoBox>
        </div>
      </>
    );
  }
}
