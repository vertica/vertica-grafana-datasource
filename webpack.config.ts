import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

type Env = Parameters<typeof grafanaConfig>[0];

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    externals: ['react/jsx-runtime', 'react/jsx-dev-runtime'],
    performance: {
      maxAssetSize: 600000,
      maxEntrypointSize: 600000,
    },
    optimization: {
      splitChunks: false,
    },
  });
};

export default config;