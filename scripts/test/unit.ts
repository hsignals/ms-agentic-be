// Runs unit tests without loading developer environment files or provider credentials.
import { runTestProject } from './environment.ts';

process.exitCode = await runTestProject('unit');
