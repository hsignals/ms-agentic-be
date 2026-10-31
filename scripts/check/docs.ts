// Checks repository Markdown links and anchors, and the shared project skill links.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readlinkSync,
  statSync,
} from 'node:fs';
import {
  basename,
  dirname,
  join,
  relative,
  resolve,
} from 'node:path';
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url';

type MarkdownDocument = {
  links: string[];
  anchors: Set<string>;
};

const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const paths = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).split('\0').filter(path => path.length > 0 && !path.startsWith('docs/research/')).toSorted();
const documentsByPath = new Map<string, MarkdownDocument>();
const violations: string[] = [];

/** Uses native Markdown parsing, with GitHub's heading spelling instead of Bun's different slug rules. */
const readMarkdown = (path: string): MarkdownDocument => {
  const savedDocument = documentsByPath.get(path);
  if (savedDocument) {
    return savedDocument;
  }

  const document: MarkdownDocument = { links: [], anchors: new Set() };
  const text = readFileSync(path, 'utf8');
  Bun.markdown.render(text, {
    heading: children => {
      // https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#section-links
      const slug = children.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}_ -]/gu, '').replaceAll(' ', '-');
      let anchor = slug;
      for (let suffix = 1; document.anchors.has(anchor); suffix++) {
        anchor = `${slug}-${suffix}`;
      }
      document.anchors.add(anchor);

      return children;
    },
  });
  const html = Bun.markdown.html(text);
  new HTMLRewriter()
    .on('[id], a[name]', {
      element: element => {
        const id = element.getAttribute('id') ?? element.getAttribute('name');
        if (id !== null) {
          document.anchors.add(id);
        }
      },
    })
    .on('a[href], img[src]', {
      element: element => {
        const attribute = element.tagName === 'a'
          ? 'href'
          : 'src';
        const link = element.getAttribute(attribute);
        if (link !== null) {
          document.links.push(link);
        }
      },
    })
    .transform(html);
  documentsByPath.set(path, document);

  return document;
};

const markdownPaths = paths.filter(path => {
  return /\.(?:md|markdown)$/i.test(path) && existsSync(join(repositoryRoot, path));
});
for (const path of markdownPaths) {
  const absolutePath = join(repositoryRoot, path);
  const document = readMarkdown(absolutePath);
  for (const link of document.links) {
    if (/^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('//')) {
      continue;
    }

    let targetPath: string;
    let fragment: string;
    try {
      const targetUrl = link.startsWith('/')
        ? new URL(`.${link}`, pathToFileURL(`${repositoryRoot}/`))
        : new URL(link, pathToFileURL(absolutePath));
      targetPath = fileURLToPath(targetUrl);
      fragment = decodeURIComponent(targetUrl.hash.slice(1));
    } catch (cause) {
      violations.push(`${path}: ${link}: invalid local URL (${String(cause)})`);
      continue;
    }

    const targetRelativePath = relative(repositoryRoot, targetPath);
    if (targetRelativePath === '..' || targetRelativePath.startsWith('../')) {
      violations.push(`${path}: ${link}: target leaves the repository`);
    } else if (!existsSync(targetPath)) {
      violations.push(`${path}: ${link}: missing file ${targetRelativePath}`);
    } else if (fragment && /\.(?:md|markdown)$/i.test(targetPath) && !readMarkdown(targetPath).anchors.has(fragment)) {
      violations.push(`${path}: ${link}: missing anchor #${fragment} in ${targetRelativePath}`);
    }
  }
}

const skillPaths = [
  ...new Set([
    ...['review', 'sync-docs', 'create-pr', 'staging'].map(name => `.agents/skills/${name}`),
    ...paths.filter(path => path.startsWith('.agents/skills/')).map(path => path.split('/').slice(0, 3).join('/')),
  ]),
];
for (const path of skillPaths) {
  const absolutePath = join(repositoryRoot, path);
  if (!existsSync(absolutePath)) {
    violations.push(`${path}: broken skill link`);
  } else if (!lstatSync(absolutePath).isSymbolicLink()) {
    violations.push(`${path}: expected a skill symlink`);
  } else if (
    resolve(dirname(absolutePath), readlinkSync(absolutePath))
      !== join(repositoryRoot, '.claude/skills', basename(absolutePath))
  ) {
    violations.push(`${path}: skill link must target .claude/skills/${basename(absolutePath)}`);
  } else if (
    !statSync(absolutePath).isDirectory()
    || !statSync(join(absolutePath, 'SKILL.md'), { throwIfNoEntry: false })?.isFile()
  ) {
    violations.push(`${path}: skill link must resolve to a directory containing SKILL.md`);
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exitCode = 1;
} else {
  console.log(`documentation: ${markdownPaths.length} Markdown files and ${skillPaths.length} skill links checked`);
}
