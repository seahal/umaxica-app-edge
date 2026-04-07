import { instrument } from '@microlabs/otel-cf-workers';
import { app } from './app';
import { otelConfig } from './otel';

export default instrument(app, otelConfig);
