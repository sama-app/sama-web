import envVars from 'preact-cli-plugin-env-vars';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default function (config, env, helpers) {
  envVars(config, env, helpers);

  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [{
        from: '.well-known',
        to: '.well-known'
        // context: path.resolve(__dirname, 'src')
      }],
    }),
  );
}
