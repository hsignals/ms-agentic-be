// Holds real test resources until its owning test cancels the process.
import {
  runDocker,
  TestResources,
} from '../../../scripts/test/docker.ts';

const sourceImage = process.argv[2];
const ownedImage = process.argv[3];
if (!sourceImage || !ownedImage) {
  throw new Error('Source and owned image arguments are required');
}
const resources = new TestResources();
runDocker(['tag', sourceImage, ownedImage]);
resources.registerImage(ownedImage);
resources.start('cancelled', ['--label', `ms-agentic.cancellation=${ownedImage}`, ownedImage]);
console.log('ready');
await Bun.stdin.text();
